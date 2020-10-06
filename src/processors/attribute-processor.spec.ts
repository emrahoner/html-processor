import HtmlPipeline from "../html-pipeline"
import { AttributeProcessorParameters } from "./attribute-processor"

describe('AttributeProcessor', () => {
    let html: string
    beforeEach(() => {
        html = `<html>
        <body>
            <div class="content" attr1></div>
            <span attr1></span>
            <a attr2><img src="../src/sample.jpeg "></a>
            <span attr2></span>
        </body>
        </html>`
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
            <a attr2=""><img src="../src/sample.jpeg "></a>
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
            <a attr2=""><img src="../src/sample.jpeg "></a>
            <span attr2="" my-attr=""></span>`)
    })

    it('removes attribute from elements with a selector', () => {
        const processor = new HtmlPipeline()
        processor.pipe({
            processor: 'attribute',
            params: {
                selectors: 'span',
                action: 'delete',
                attribute: 'attr1'
            }
        })
        const result = processor.process(html)

        expect(result).toContain(`
            <div class="content" attr1=""></div>
            <span></span>
            <a attr2=""><img src="../src/sample.jpeg "></a>
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
            <a attr2=""><img src="../src/sample.jpeg "></a>
            <span attr2=""></span>`)
    })


    it('adds attribute from element till top parent', () => {
        const processor = new HtmlPipeline()
        processor.pipe<AttributeProcessorParameters>({
            processor: 'attribute',
            params: {
                selectors: 'img',
                action: 'addToParents',
                attribute: 'new-attr',
                ifIn: 'body'
            }
        })
        const result = processor.process(html)

        expect(result).toBe(`<html>
        <body new-attr="">
            <div class="content" attr1=""></div>
            <span attr1=""></span>
            <a attr2="" new-attr=""><img src="../src/sample.jpeg "></a>
            <span attr2=""></span>
        </body>
        </html>`)
    })

    it('append given value to attribute', () => {
        const processor = new HtmlPipeline()
        processor.pipe<AttributeProcessorParameters>({
            processor: 'attribute',
            params: {
                selectors: ['div.content', 'span[attr1]'],
                action: 'append',
                attribute: {
                    name: 'class',
                    value: 'new-class'
                },
                ifIn: 'body'
            }
        })
        const result = processor.process(html)

        expect(result).toBe(`<html>
        <body>
            <div class="content new-class" attr1=""></div>
            <span attr1="" class="new-class"></span>
            <a attr2=""><img src="../src/sample.jpeg "></a>
            <span attr2=""></span>
        </body>
        </html>`)
    })

    it('transforms attributes', () => {
        html = `
        <html>
        <body>
            <div class="content" attr1></div>
            <span attr1></span>
            <a attr2><img src="../src/sample.jpeg "></a>
            <span attr2></span>
            <img src="sample2.jpeg ">
            <img src="/sample3.jpeg ">
        </body>
        </html>
        `

        const processor = new HtmlPipeline()
        processor.pipe({
            processor: 'attribute',
            params: {
                selectors: 'img',
                action: 'transform',
                attribute: 'src',
                transformations: [
                    {
                        action: 'trim'
                    },
                    {
                        action: 'joinUrl',
                        params: [
                            'https://www.myweb.com/web/index.html'
                        ]
                    },
                    {
                        action: 'encodeUrl'
                    },
                    {
                        action: 'format',
                        params: [
                            'https://www.proxy.net/get?url={0}'
                        ]
                    }
                ]
            }
        })
        const result = processor.process(html)

        expect(result).toEqual(`<html>
        <body>
            <div class="content" attr1=""></div>
            <span attr1=""></span>
            <a attr2=""><img src="https://www.proxy.net/get?url=https%3A%2F%2Fwww.myweb.com%2Fsrc%2Fsample.jpeg"></a>
            <span attr2=""></span>
            <img src="https://www.proxy.net/get?url=https%3A%2F%2Fwww.myweb.com%2Fweb%2Fsample2.jpeg">
            <img src="https://www.proxy.net/get?url=https%3A%2F%2Fwww.myweb.com%2Fsample3.jpeg">
        </body>
        </html>`)
    })
})