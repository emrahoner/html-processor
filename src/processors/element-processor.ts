import { HtmlElement } from '../dom/html-element';
import { HtmlProcessorTypes } from '../types';
import { HtmlProcessor } from '../types';
import Processor from '../decorators/processor';
import { HtmlNode } from '../dom/html-node';

type ElementProcessorActions = 'remove' | 'removeOthers'

interface ElementProcessorParameters {
    selectors: string[] | string
    action: ElementProcessorActions
    ifIn?: string[] | string
}

function getParents(from: HtmlElement, till: HtmlElement) {
    const result = []
    for(let current = from; current = current.parentElement; current && current !== till) {
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
        if(this._topParent && this._action === 'removeOthers') {
            if(this._dontDelete === element) {
                this._dontDelete = null
            } else {
                if(!this._dontDelete && !this._parents.find(parent => parent === element)) {
                    element.remove()
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