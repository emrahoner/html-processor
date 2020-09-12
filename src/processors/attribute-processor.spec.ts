import { JSDOM } from "jsdom"
import AttributeProcessor from "./attribute-processor"

describe.skip('AttributeProcessor', () => {
    let document: Document
    beforeEach(() => {
        const html = `
        <html>
        <body>
            <div class="content" attr1></div>
            <span attr1></span>
            <a attr2></a>
            <span attr2></span>
        </body>
        </html>
        `
        document = new JSDOM(html).window.document
    })

    it('add attribute to elements with a selector', () => {
        var processor = new AttributeProcessor({
            selectors: ['span'],
            action: 'add',
            attribute: 'my-attr'
        })

        const result = processor.process(document)

        expect(document.documentElement.outerHTML).toContain(`
            <div class="content" attr1=""></div>
            <span attr1="" my-attr=""></span>
            <a attr2=""></a>
            <span attr2="" my-attr=""></span>`)
    })

    it('add attribute to elements with selectors', () => {
        var processor = new AttributeProcessor({
            selectors: ['span', '.content'],
            action: 'add',
            attribute: 'my-attr'
        })

        const result = processor.process(document)

        expect(document.documentElement.outerHTML).toContain(`
            <div class="content" attr1="" my-attr=""></div>
            <span attr1="" my-attr=""></span>
            <a attr2=""></a>
            <span attr2="" my-attr=""></span>`)
    })

    it('removes attribute from elements with a selector', () => {
        var processor = new AttributeProcessor({
            selectors: ['span'],
            action: 'delete',
            attribute: 'attr1'
        })

        const result = processor.process(document)

        expect(document.documentElement.outerHTML).toContain(`
            <div class="content" attr1=""></div>
            <span></span>
            <a attr2=""></a>
            <span attr2=""></span>`)
    })

    it('remove attribute from elements with selectors', () => {
        var processor = new AttributeProcessor({
            selectors: ['span', '.content'],
            action: 'delete',
            attribute: 'attr1'
        })

        const result = processor.process(document)

        expect(document.documentElement.outerHTML).toContain(`
            <div class="content"></div>
            <span></span>
            <a attr2=""></a>
            <span attr2=""></span>`)
    })
})