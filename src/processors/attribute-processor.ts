import { HtmlProcessTypes } from '../types';
import { HtmlProcessor } from '../types';
import Processor from '../decorators/processor';
import { doc } from 'prettier';

interface AttributeParameters {
    selectors: string[]
    action: 'add' | 'delete'
    attribute: string | { name: string, value: string }
}

@Processor(HtmlProcessTypes.AddAttribute)
class AttributeProcessor implements HtmlProcessor<AttributeParameters> {
    params: AttributeParameters;

    constructor(params: AttributeParameters) {
        this.params = params
    }

    process(document: Document) {
        const params = this.params
        for(const selector of params.selectors) {
            var elements = document.querySelectorAll(selector)
            for(const element of elements) {
                if(params.action === 'add') {
                    typeof params.attribute === 'string' ? 
                        element.setAttributeNode(document.createAttribute(params.attribute)) :
                        element.setAttribute(params.attribute.name, params.attribute.value)
                } else if (params.action === 'delete') {
                    element.removeAttribute(typeof params.attribute === 'string' ? params.attribute : params.attribute.name)
                }
            }
        }
    }
}

export default AttributeProcessor
export {
    AttributeParameters
}