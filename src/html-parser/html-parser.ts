import { HtmlElement, SelfClosingTags } from '../dom/html-element';
import HtmlStateMachine, { TextNode, ElementNode } from './html-state-machine' 
import { HtmlDocument } from '../dom/html-document'
import { HtmlNode } from '../dom/html-node'

enum EventTypes {
    textCreated = 'textCreated',
    elementStarted = 'elementStarted',
    elementEnded = 'elementEnded'
}

export class HtmlParser {
    private _stateMachine: HtmlStateMachine
    private _document: HtmlDocument
    private _current: HtmlNode
    private _eventHandlers

    constructor() {
        this._eventHandlers = {}
        this._stateMachine = new HtmlStateMachine()
        this._stateMachine.on('textCreated', this._textCreated.bind(this))
        this._stateMachine.on('elementStarted', this._elementStarted.bind(this))
        this._stateMachine.on('elementEnded', this._elementEnded.bind(this))
    }

    on(event: string, handler: (node: HtmlNode) => void) {
        if(!this._eventHandlers[event]) {
            this._eventHandlers[event] = []
        }
        this._eventHandlers[event].push(handler)
    }

    private _emit(event: EventTypes, node: HtmlNode) {
        if(this._eventHandlers[event]) {
            this._eventHandlers[event].forEach(event => {
                event(node)
            })
        }
    }
 
    private _textCreated(textNode: TextNode) {
        const node = new HtmlNode('#text')
        node.textContent = textNode.text
        this._current.appendChild(node)
        this._emit(EventTypes.textCreated, node)
    }

    private _elementStarted(elementNode: ElementNode) {
        const element = new HtmlElement(elementNode.tagName)
        elementNode.attributes?.forEach(attribute => {
            element.attributes.setNamedItem(attribute)
        })
        this._current.appendChild(element)
        this._emit(EventTypes.elementStarted, element)
        if(!SelfClosingTags.find(x => x === element.tagName)) {
            this._current = element
        } else {
            this._emit(EventTypes.elementEnded, element)
        }
    }

    private _elementEnded(elementNode: ElementNode) {
        const current = this._current
        const parents = []
        while(this._current && this._current.nodeName !== elementNode.tagName) {
            parents.push(this._current)
            this._current = this._current.parent
        }
        if(this._current) {
            parents.forEach(parent => {
                this._emit(EventTypes.elementEnded, parent)
            })
            this._emit(EventTypes.elementEnded, this._current)
            this._current = this._current?.parent
        } else {
            this._current = current
        }
    }

    parse(html: string): HtmlDocument {
        this._current = this._document = new HtmlDocument()
        this._stateMachine.reset()
        for(let i = 0; i < html.length; i++) {
            const char = html[i]
            try {
                this._stateMachine.dispatch(char)
            } catch (error) {
                throw { message: `State machine is failed at the index ${i}.`, html: html.substr(i - 20, 40), error }
            }
        }
        this._stateMachine.finish()
        return this._document
    }
}