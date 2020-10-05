import { HtmlElement } from '../dom/html-element';
import { HtmlProcessorTypes } from '../types';
import { HtmlProcessor } from '../types';
import Processor from '../decorators/processor';
import { HtmlNode } from '../dom/html-node';

type ElementProcessorActions = 'remove' | 'removeOthers' | 'appendChild' | 'prependChild'

interface ElementNode {
    tagName: string
    attributes?: { name: string, value: string }[]
    children?: (ElementNode|TextNode)[]
}

interface TextNode {
    content: string
}

interface ElementProcessorParameters {
    selectors: string[] | string
    action: ElementProcessorActions
    ifIn?: string[] | string
    textNode?: TextNode
    element?: ElementNode
}

function createNode(nodeMeta: ElementNode | TextNode): HtmlNode {
    const tagName = (<ElementNode>nodeMeta).tagName || "#text"
    if(tagName === '#text') {
        const textNodeMeta = <TextNode>nodeMeta
        const node = new HtmlNode(tagName)
        node.textContent = textNodeMeta.content
        return node
    } else {
        const elementMeta = <ElementNode>nodeMeta
        const element = new HtmlElement(tagName)
        elementMeta.attributes && elementMeta.attributes.forEach(attribute => {
            element.attributes.setNamedItem({ ...attribute })
        })
        elementMeta.children && elementMeta.children.forEach(child => {
            element.appendChild(createNode(child))
        })
        return element
    }
}

function getParents(from: HtmlElement, till: HtmlElement) {
    const result = []
    for(let current = from; current && current !== till; current = current.parentElement) {
        result.push(current)
    }
    return result
}

@Processor(HtmlProcessorTypes.Element)
class ElementProcessor implements HtmlProcessor<ElementProcessorParameters> {
    private _selectors: string[]
    private _ifIn: string[]
    private _action: ElementProcessorActions
    private _dontDelete: HtmlElement
    private _parents: HtmlElement[]
    private _topParent: HtmlElement

    constructor(private _params: ElementProcessorParameters) {
        this._selectors = Array.isArray(this._params.selectors) ? this._params.selectors : [this._params.selectors]
        this._ifIn = Array.isArray(this._params.ifIn) ? this._params.ifIn : (this._params.ifIn ? [this._params.ifIn] : null)
        this._action = this._params.action
        this._topParent = null
        this._dontDelete = null
        this._parents = []
    }
    
    elementStarted(element: HtmlElement) {
        if(!this._topParent) {
            this._topParent = this._ifIn === null || this._ifIn.reduce((prev, curr) => prev || element.matches(curr), false) ? element : null
        }
        if(this._topParent && this._selectors.reduce((prev, curr) => prev || element.matches(curr), false)) {
            if(this._action === 'remove') {
                element.remove()
            } else if(this._action === 'removeOthers' && this._dontDelete === null) {
                this._dontDelete = element
                this._parents = getParents(element.parentElement, this._topParent)
            }
        }
    }

    elementEnded(element: HtmlElement) {
        if(this._topParent === element) {
            this._topParent = null
        }
        if(this._topParent) {
            if(this._action === 'removeOthers') {
                if(this._dontDelete === element) {
                    this._dontDelete = null
                } else {
                    if(!this._dontDelete && !this._parents.find(parent => parent === element)) {
                        element.remove()
                    }
                }
            } else if(this._action === 'appendChild' || this._action === 'prependChild') {
                if(this._selectors.reduce((prev, curr) => prev || element.matches(curr), false)) {
                    const node = createNode(this._params.textNode || this._params.element)
                    if(this._action === 'appendChild') {
                        element.appendChild(node)
                    } else {
                        element.insertBefore(node, element.firstChild)
                    }
                }
            }
        }
    }
    textCreated(node: HtmlNode) {
        if(this._topParent && !this._dontDelete) {
            if(this._action === 'removeOthers') {
                node.remove()
            }
        }
    }
}

export default ElementProcessor
export {
    ElementProcessorParameters
}