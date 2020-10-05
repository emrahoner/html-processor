import { HtmlElement } from "./html-element"
import { NodeTypes } from "./node-types"

export class HtmlNode {
    protected _parentNode: HtmlNode
    protected _childNodes: HtmlNode[]
    protected _nodeType: NodeTypes

    constructor(protected _nodeName: string) {
        this._childNodes = []
    }

    textContent: string

    get parent(): HtmlNode {
        return this._parentNode
    }

    get childNodes(): HtmlNode[] {
        return this._childNodes
    }

    get firstChild(): HtmlNode {
        return this._childNodes.length ? this._childNodes[0] : null
    }

    get lastChild(): HtmlNode {
        return this._childNodes.length ? this._childNodes[this._childNodes.length - 1] : null
    }

    get nodeType(): NodeTypes {
        return this._nodeType
    }

    get nodeName(): string {
        return this._nodeName
    }

    get parentElement(): HtmlElement {
        return this._parentNode.nodeType === NodeTypes.ELEMENT_NODE ? this._parentNode as HtmlElement : null
    }

    get children(): HtmlElement[] {
        return this._childNodes.filter(node => node.nodeType === NodeTypes.ELEMENT_NODE).map(node => node as HtmlElement)
    }

    appendChild(node: HtmlNode): HtmlNode {
        let current: HtmlNode = this
        if(node.nodeType === NodeTypes.ELEMENT_NODE) {
            if(current.nodeType === NodeTypes.DOCUMENT_NODE) {
                if(current.children.length > 0) {
                    throw new Error('Document can only have one child element')
                }
                if(node.nodeName !== 'HTML') {
                    current = current.appendChild(new HtmlElement('HTML'))
                }
            }
            if(current.nodeName === 'HTML') {
                if(node.nodeName !== 'BODY' && node.nodeName !== 'HEAD') {
                    current = current.appendChild(new HtmlElement('BODY'))
                }
            }
        }
        node._parentNode = current
        current._childNodes.push(node)
        return node
    }

    insertBefore(newNode: HtmlNode, child: HtmlNode): HtmlNode {
        const index = this._childNodes.findIndex(x => x === child)
        if(index < 0) throw new Error('Child couldn\'t be found')

        newNode._parentNode = this
        this._childNodes.splice(index, 0, newNode)
        return newNode
    }

    remove() {
        if(!this._parentNode) return
        const index = this._parentNode.childNodes.indexOf(this)
        if(index >= 0) {
            this._parentNode.childNodes.splice(index, 1)
        }
        // this._parentNode = null
    }
}