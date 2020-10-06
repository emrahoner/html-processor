import { HtmlElement } from '../dom/html-element';
import { HtmlDocument } from '../dom/html-document';
import { HtmlParser } from "./html-parser"

describe('HtmlParser', () => {
    let parser: HtmlParser

    beforeEach(() => {
        parser = new HtmlParser()
    })

    it('fails for not existing transition', () => {
        const html = `<tag->`
        
        try {
            parser.parse(html)
        } catch(error) {
            expect(error.message).toBe('State machine is failed at the index 4.')
            expect(error.html).toBe('<tag->')
            expect(error.error.stack).toContain('state-machine.ts')
        }
    })

    it('parses html', () => {
        const html = `<html>
        <body>
            <div class='container'>
                <h1>This is the title</h1>
                <p>
                    First paragraph
                </p>
                <img href='http://imageUrl/'>
            </div>
        </body></html>`

        let document: HtmlDocument,
            element: HtmlElement
        
        document = parser.parse(html)
        expect(document.nodeName).toEqual('#document')
        expect(document.children.length).toEqual(1)

        element = document.documentElement
        expect(element.tagName).toEqual('HTML')
        expect(element.parent.nodeName).toEqual('#document')
        expect(element.attributes.length).toEqual(0)
        expect(element.children.length).toEqual(1)

        element = element.children[0]
        expect(element.tagName).toEqual('BODY')
        expect(element.parent.nodeName).toEqual('HTML')
        expect(element.attributes.length).toEqual(0)
        expect(element.children.length).toEqual(1)

        element = element.children[0]
        expect(element.tagName).toBe('DIV')
        expect(element.parent.nodeName).toEqual('BODY')
        expect(element.attributes.length).toEqual(1)
        expect(element.attributes.item(0)).toEqual({ name: 'class', value: 'container' })
        expect(element.children.length).toEqual(3)

        element = element.children[0]
        expect(element.tagName).toBe('H1')
        expect(element.parent.nodeName).toEqual('DIV')
        expect(element.attributes.length).toEqual(0)
        expect(element.children.length).toEqual(0)
        expect(element.childNodes.length).toEqual(1)
        expect(element.childNodes[0].textContent).toEqual("This is the title")

        element = element.parent.children[1]
        expect(element.tagName).toBe('P')
        expect(element.parent.nodeName).toEqual('DIV')
        expect(element.attributes.length).toEqual(0)
        expect(element.children.length).toEqual(0)
        expect(element.childNodes.length).toEqual(1)
        expect(element.childNodes[0].textContent).toContain("First paragraph")

        element = element.parent.children[2]
        expect(element.tagName).toBe('IMG')
        expect(element.parent.nodeName).toEqual('DIV')
        expect(element.attributes.length).toEqual(1)
        expect(element.attributes.item(0)).toEqual({ name: 'href', value: 'http://imageUrl/' })
        expect(element.children.length).toEqual(0)
        expect(element.childNodes.length).toEqual(0)
    })

    it('parses script and styles', () => {
        const html = `<html>
        <head>
            <script>
                var temp = 'TempString'
                console.log(temp)
            </script>
            <style type="css">
                .container {
                    margin: 0;
                }
            </style>
        </head></html>`

        let document: HtmlDocument,
            element: HtmlElement
        
        document = parser.parse(html)
        expect(document.nodeName).toEqual('#document')
        expect(document.children.length).toEqual(1)

        element = document.documentElement
        expect(element.tagName).toEqual('HTML')
        expect(element.parent.nodeName).toEqual('#document')
        expect(element.attributes.length).toEqual(0)
        expect(element.children.length).toEqual(1)

        element = element.children[0]
        expect(element.tagName).toEqual('HEAD')
        expect(element.parent.nodeName).toEqual('HTML')
        expect(element.attributes.length).toEqual(0)
        expect(element.children.length).toEqual(2)

        element = element.children[0]
        expect(element.tagName).toBe('SCRIPT')
        expect(element.parent.nodeName).toEqual('HEAD')
        expect(element.attributes.length).toEqual(0)
        expect(element.children.length).toEqual(0)
        expect(element.childNodes.length).toEqual(1)
        expect(element.childNodes[0].textContent).toMatch(`
                var temp = 'TempString'
                console.log(temp)
            `)

        element = element.parentElement.children[1]
        expect(element.tagName).toBe('STYLE')
        expect(element.parent.nodeName).toEqual('HEAD')
        expect(element.attributes.length).toEqual(1)
        expect(element.attributes.item(0)).toEqual({ name: 'type', value: 'css' })
        expect(element.children.length).toEqual(0)
        expect(element.childNodes.length).toEqual(1)
        expect(element.childNodes[0].textContent).toMatch(`
                .container {
                    margin: 0;
                }
            `)
    })
})