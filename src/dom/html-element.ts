import { HtmlNode } from "./html-node";
import { DOMTokenList } from "./dom-token-list";
import { NamedNodeMap } from "./named-node-map";
import { NodeTypes } from "./node-types";
import { is } from './selector-comparer'

export const SelfClosingTags = [
    'AREA',
    'BASE',
    'BR',
    'COL',
    'EMBED',
    'HR',
    'IMG',
    'INPUT',
    'LINK',
    'META',
    'PARAM',
    'SOURCE',
    'TRACK',
    'WBR'
]

export class HtmlElement extends HtmlNode {
    private _attributes: NamedNodeMap
    
    constructor(tagName: string){
        super(tagName.toUpperCase())
        this._nodeType = NodeTypes.ELEMENT_NODE
        this._attributes = new NamedNodeMap()
    }

    get id(): string {
        return this._attributes['id']
    }

    get tagName(): string {
        return this._nodeName
    }

    get attributes(): NamedNodeMap {
        return this._attributes;
    }

    get classList(): DOMTokenList {
        var classAttr = this._attributes['class']
        return classAttr ? new DOMTokenList(classAttr) : null
    }

    get innerHtml(): string {
        return this._childNodes.reduce((prev, curr) => {
            return prev + (curr.nodeType === NodeTypes.ELEMENT_NODE ? (curr as HtmlElement).outerHtml : curr.textContent)
        }, '')
    }

    get outerHtml(): string {
        return `<${this._nodeName.toLowerCase()}${this._attributeString}>` + (SelfClosingTags.includes(this.tagName) ? '' : `${this.innerHtml}</${this._nodeName.toLowerCase()}>`)
    }

    matches(selector: string): boolean {
        return is(this, selector)
    }

    private get _attributeString(): string {
        let result = ''
        for(let i = 0; i < this._attributes.length; i++) {
            const attr = this._attributes.item(i)
            result += ` ${attr.name}="${attr.value}"`
        }
        return result
    }
}