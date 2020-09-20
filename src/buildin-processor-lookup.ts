import AttributeProcessor from "./processors/attribute-processor";
import { HtmlProcessor } from './types';
import ElementProcessor from "./processors/element-processor";

function register(processor: { new(...args: any[]): HtmlProcessor<any> }) {
    lookup[processor.prototype.processor] = processor
}

const lookup = {}
register(AttributeProcessor)
register(ElementProcessor)

export default {
    get(name: string): { new(...args: any[]): HtmlProcessor<any> } {
        return lookup[name]
    }
}