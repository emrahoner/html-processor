import HtmlPipeline from "../html-pipeline"

describe('AttributeProcessor', () => {
    let html: string
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

    it('add attribute to elements with a selector', () => {
        const processor = new HtmlPipeline()
        processor.pipe({
            processor: 'attribute',
            params: {
                selectors: ['span'],
                action: 'add',
                attribute: 'my-attr'
            }
        })
        const result = processor.process(html)

        expect(result).toContain(`
            <div class="content" attr1=""></div>
            <span attr1="" my-attr=""></span>
            <a attr2=""></a>
            <span attr2="" my-attr=""></span>`)
    })

    it('add attribute to elements with selectors', () => {
        const processor = new HtmlPipeline()
        processor.pipe({
            processor: 'attribute',
            params: {
                selectors: ['span', '.content'],
                action: 'add',
                attribute: 'my-attr'
            }
        })
        const result = processor.process(html)

        expect(result).toContain(`
            <div class="content" attr1="" my-attr=""></div>
            <span attr1="" my-attr=""></span>
            <a attr2=""></a>
            <span attr2="" my-attr=""></span>`)
    })

    it('removes attribute from elements with a selector', () => {
        const processor = new HtmlPipeline()
        processor.pipe({
            processor: 'attribute',
            params: {
                selectors: ['span'],
                action: 'delete',
                attribute: 'attr1'
            }
        })
        const result = processor.process(html)

        expect(result).toContain(`
            <div class="content" attr1=""></div>
            <span></span>
            <a attr2=""></a>
            <span attr2=""></span>`)
    })

    it('remove attribute from elements with selectors', () => {
        const processor = new HtmlPipeline()
        processor.pipe({
            processor: 'attribute',
            params: {
                selectors: ['span', '.content'],
                action: 'delete',
                attribute: 'attr1'
            }
        })
        const result = processor.process(html)

        expect(result).toContain(`
            <div class="content"></div>
            <span></span>
            <a attr2=""></a>
            <span attr2=""></span>`)
    })
})