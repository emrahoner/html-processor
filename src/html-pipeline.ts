import { HtmlElement } from './dom/html-element';
import { HtmlPipelineOption, HtmlProcessor } from "./types";
import lookup from './buildin-processor-lookup'
import { HtmlParser } from "./html-parser/html-parser";
import { HtmlNode } from "./dom/html-node";

class HtmlPipeline {
    private _processors: HtmlProcessor<any>[]
    private _parser: HtmlParser

    constructor() {
        this._processors = []
        this._parser = new HtmlParser()
        this._parser.on('elementStarted', this._elementStarted.bind(this))
        this._parser.on('elementEnded', this._elementEnded.bind(this))
        this._parser.on('textCreated', this._textCreated.bind(this))
    }

    _elementStarted(node: HtmlNode) {
        this._processors.forEach(processor => {
            processor.elementStarted(node as HtmlElement)
        })
    }

    _elementEnded(node: HtmlNode) {
        this._processors.forEach(processor => {
            processor.elementEnded(node as HtmlElement)
        })
    }

    _textCreated(node: HtmlNode) {
        this._processors.forEach(processor => {
            processor.textCreated(node)
        })
    }

    pipe<TParam>(option: HtmlPipelineOption<TParam>) {
        var processor = lookup.get(option.processor)
        this._processors.push(new processor(option.params))
    }

    process(html: string): string {
        const document = this._parser.parse(html)
        return document.documentElement.outerHtml
    }
}

export default HtmlPipeline