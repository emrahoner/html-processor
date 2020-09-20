import HtmlPipeline from "../html-pipeline"

describe('AttributeProcessor', () => {
    let html: string
    beforeEach(() => {
        html = `
        <html>
        <head>
            <script>
                var temp = 'Temp string'
                console.log(temp)
            </script>
        </head>
        <body>
            <div class="content" attr1></div>
            <span attr1></span>
            <a attr2></a>
            <span attr2></span>
        </body>
        </html>
        `
    })

    it('remove element with a selector', () => {
        const processor = new HtmlPipeline()
        processor.pipe({
            processor: 'element',
            params: {
                selectors: ['span'],
                action: 'remove'
            }
        })
        const result = processor.process(html)

        expect(result).toMatch(`<html>
        <head>
            <script>
                var temp = 'Temp string'
                console.log(temp)
            </script>
        </head>
        <body>
            <div class="content" attr1=""></div>
            
            <a attr2=""></a>
            
        </body>
        </html>`)
    })

    it('remove element with selectors', () => {
        const processor = new HtmlPipeline()
        processor.pipe({
            processor: 'element',
            params: {
                selectors: ['script', 'a'],
                action: 'remove'
            }
        })
        const result = processor.process(html)

        expect(result).toMatch(`<html>
        <head>
            
        </head>
        <body>
            <div class="content" attr1=""></div>
            <span attr1=""></span>
            
            <span attr2=""></span>
        </body>
        </html>`)
    })
})