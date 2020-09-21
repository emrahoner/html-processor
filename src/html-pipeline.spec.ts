import { HtmlProcessorTypes } from './types';
import HtmlPipeline from "./html-pipeline"
import { AttributeParameters } from "./processors/attribute-processor"
import { ElementProcessorParameters } from './processors/element-processor';

describe('HtmlPipeline', () => {
    let html
    beforeEach(() => {
        html = `
        <html>
        <body>
            <div class="content" attr1></div>
            <span attr1></span>
            <a attr2></a>
            <span attr2></span>
        </body>
        </html>
        `
    })

    it('runs processors synchronously', () => {
        const pipeline = new HtmlPipeline()
        pipeline.pipe<AttributeParameters>({
            processor: HtmlProcessorTypes.Attribute,
            params: {
                selectors: ['span'],
                action: 'add',
                attribute: 'my-attr'
            }
        })
        pipeline.pipe<ElementProcessorParameters>({
            processor: HtmlProcessorTypes.Element,
            params: {
                selectors: 'div',
                action: 'remove'
            }
        })
        expect(pipeline.process(html)).toEqual(`<html>
        <body>
            
            <span attr1="" my-attr=""></span>
            <a attr2=""></a>
            <span attr2="" my-attr=""></span>
        </body>
        </html>`)
    })
})