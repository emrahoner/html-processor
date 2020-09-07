import { HtmlPipelineOption, HtmlProcessor } from "./types";
import lookup from './buildin-processor-lookup'
import { JSDOM } from "jsdom";

class HtmlPipeline {
    private processors: HtmlProcessor<any>[]

    constructor() {
        this.processors = []
    }

    pipe<TParam>(option: HtmlPipelineOption<TParam>) {
        var processor = lookup.get(option.process)
        this.processors.push(new processor(option.params))
    }

    process(html: string): string {
        var dom = new JSDOM(html)
        for(const processor of this.processors) {
            processor.process(dom.window.document)
        }
        return dom.window.document.documentElement.outerHTML
    }
}

export default HtmlPipeline