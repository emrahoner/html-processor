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
            <a attr2><img href="url"></a>
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
            
            <a attr2=""><img href="url"></a>
            
        </body>
        </html>`)
    })

    it('remove element with selectors', () => {
        const processor = new HtmlPipeline()
        processor.pipe({
            processor: 'element',
            params: {
                selectors: ['script', 'a[attr2]'],
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

    it('remove element with selectors if in body element', () => {
        const processor = new HtmlPipeline()
        processor.pipe({
            processor: 'element',
            params: {
                selectors: ['script', 'a'],
                action: 'remove',
                ifIn: 'body'
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
            <span attr1=""></span>
            
            <span attr2=""></span>
        </body>
        </html>`)
    })


    it('remove other elements of selector if in body element', () => {
        const processor = new HtmlPipeline()
        processor.pipe({
            processor: 'element',
            params: {
                selectors: 'a',
                action: 'removeOthers',
                ifIn: 'body'
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
        <body><a attr2=""><img href="url"></a></body>
        </html>`)
    })


    it('removes other than nested element', () => {
        const processor = new HtmlPipeline()
        processor.pipe({
            processor: 'element',
            params: {
                selectors: '[webpub-article]',
                action: 'removeOthers',
                ifIn: 'body'
            }
        })
        const result = processor.process(`<html>
        <body>
            <div class="container">
                <div class="header">
                    <nav>
                        <ul>
                            <li>Menu 1</li>
                            <li>Menu 2</li>
                        </ul>
                    </nav>
                </div>
                <div class="content">
                    <div>
                        <span>Article is created at 10days ago.</span>
                    </div>
                    <div>
                        <article webpub-article>
                            <p>This is an <b>important</b> paragraph</p>
                            <div class="image">
                                <img src="important-image.jpeg" alt="Important Image">
                            </div>
                        </article>
                    </div>
                    <div class="share-link">
                        <a href="#facebook">Facebook</a>
                        <a href="#twitter">Twitter</a>
                    </div>
                </div>
                <div class="footer">
                    <span>Copyrights</span>
                </div>
            </div>
        </body>
        </html>`)

        expect(result).toMatch(`<html>
        <body><div class="container"><div class="content"><div><article webpub-article="">
                            <p>This is an <b>important</b> paragraph</p>
                            <div class="image">
                                <img src="important-image.jpeg" alt="Important Image">
                            </div>
                        </article></div></div></div></body>
        </html>`)
    })
})