import { HtmlElement } from '../dom/html-element';
import { HtmlProcessorTypes } from '../types';
import { HtmlProcessor } from '../types';
import Processor from '../decorators/processor';
import { HtmlNode } from 'src/dom/html-node';

interface ElementProcessorParameters {
    selectors: string[]
    action: 'remove'
}

@Processor(HtmlProcessorTypes.Element)
class ElementProcessor implements HtmlProcessor<ElementProcessorParameters> {

    constructor(private _params: ElementProcessorParameters) {
        
    }
    
    elementStarted(element: HtmlElement) {
        const params = this._params
        if(params.selectors.reduce((prev, curr) => prev || element.matches(curr), false)) {
            if(params.action === 'remove') {
                element.remove()
            }
        }
    }
    elementEnded(element: HtmlElement) {
        
    }
    textCreated(node: HtmlNode) {
        
    }
}

export default ElementProcessor
export {
    ElementProcessorParameters
}