import { HtmlElement } from './dom/html-element';
import { HtmlNode } from "./dom/html-node";

export enum HtmlProcessorTypes {
    Attribute = 'attribute',
    Element = 'element'
}

export interface HtmlPipelineOption<TParam> {
    processor: HtmlProcessorTypes | string,
    params: TParam
}

export interface HtmlProcessor<TParam> {
    elementStarted(element: HtmlElement)
    elementEnded(element: HtmlElement)
    textCreated(node: HtmlNode)
}