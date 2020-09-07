import AttributeProcessor from "./processors/attribute-processor";
import { HtmlProcessor } from './types';

function register(processor: { new(...args: any[]): HtmlProcessor<any> }) {
    lookup[processor.prototype.processor] = processor
}

const lookup = {}
register(AttributeProcessor)

export default {
    get(name: string): { new(...args: any[]): HtmlProcessor<any> } {
        return lookup[name]
    }
}