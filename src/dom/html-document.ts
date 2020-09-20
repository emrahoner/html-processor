import { HtmlElement } from './html-element';
import { HtmlNode } from './html-node';
import { NodeTypes } from './node-types';

export class HtmlDocument extends HtmlNode {

    constructor() {
        super('#document')
        this._nodeType = NodeTypes.DOCUMENT_NODE
    }

    get documentElement(): HtmlElement {
        return this.children[0] 
    }
}