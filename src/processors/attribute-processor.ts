import { HtmlElement } from './../dom/html-element';
import { HtmlDocument } from 'src/dom/html-document';
import { HtmlProcessorTypes } from '../types';
import { HtmlProcessor } from '../types';
import Processor from '../decorators/processor';
import { HtmlNode } from 'src/dom/html-node';
import { NodeTypes } from 'src/dom/node-types';

interface AttributeParameters {
    selectors: string[]
    action: 'add' | 'delete'
    attribute: string | { name: string, value: string }
}

@Processor(HtmlProcessorTypes.Attribute)
class AttributeProcessor implements HtmlProcessor<AttributeParameters> {
    params: AttributeParameters;

    constructor(params: AttributeParameters) {
        this.params = params
    }
    elementStarted(element: HtmlElement) {
        const params = this.params
        if(params.selectors.reduce((prev, curr) => prev || element.matches(curr), false)) {
            if(params.action === 'add') {
                typeof params.attribute === 'string' ? 
                    element.attributes.setNamedItem({ name: params.attribute, value: '' }) :
                    element.attributes.setNamedItem({ name: params.attribute.name, value: params.attribute.value })
            } else if (params.action === 'delete') {
                element.attributes.removeNamedItem(typeof params.attribute === 'string' ? params.attribute : params.attribute.name)
            }
        }
    }
    elementEnded(element: HtmlElement) {
        
    }
    textCreated(node: HtmlNode) {
        
    }
}

export default AttributeProcessor
export {
    AttributeParameters
}