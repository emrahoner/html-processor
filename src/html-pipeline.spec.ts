import { HtmlProcessTypes } from './types';
import HtmlPipeline from "./html-pipeline"
import { AttributeParameters } from "./processors/attribute-processor"

describe.skip('HtmlPipeline', () => {
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

    it('runs Attribute Processor', () => {
        const pipeline = new HtmlPipeline()
        pipeline.pipe<AttributeParameters>({
            process: HtmlProcessTypes.AddAttribute,
            params: {
                selectors: ['span'],
                action: 'add',
                attribute: 'my-attr'
            }
        })
        expect(pipeline.process(html)).toContain(`
            <div class="content" attr1=""></div>
            <span attr1="" my-attr=""></span>
            <a attr2=""></a>
            <span attr2="" my-attr=""></span>`)
    })
})