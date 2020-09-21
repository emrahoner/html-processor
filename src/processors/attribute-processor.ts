import { HtmlElement } from './../dom/html-element';
import { HtmlProcessorTypes } from '../types';
import { HtmlProcessor } from '../types';
import Processor from '../decorators/processor';
import { HtmlNode } from 'src/dom/html-node';

const transformActions = {
    format: (text:string, format: string): string => {
        let regexp = new RegExp('\\{0\\}', 'gi')
        return format.replace(regexp, text);
    },
    trim: (text: string) => {
        return text.trim()
    },
    joinUrl: (href: string, url: string) => {
        let matches = /^((https?:\/\/)?[^\/]+)\/?/gi.exec(url)
        if(matches && matches[1]) {
            let baseUrl = matches[1]
            let route = url.substring(baseUrl.length + 1)
            let routePath = route ? route.split('/') : []
            if(href.startsWith('/')) {
                return baseUrl + href
            } else {
                let i = 0
                let hrefPath = href.split('/')
                routePath.pop()
                for(; i < hrefPath.length; i++) {
                    if(hrefPath[i] === '..') {
                        routePath.pop()
                    } else if(hrefPath[i] !== '.') {
                        routePath.push(hrefPath[i])
                    }
                }
                return [baseUrl, ...routePath].join('/')
            }
        }
    },
    encodeUrl: (text: string) => {
        return encodeURIComponent(text)
    }
}

type Attribute = { name: string, value: string }

type TransformActionTypes = 'format' | 'trim' | 'joinUrl' | 'encodeUrl'

type AttributeProcessorActions = 'add' | 'delete' | 'transform'

interface AttributeProcessorParameters {
    selectors: string[] | string
    action: AttributeProcessorActions
    attribute: string | Attribute
    transformations?: { action: TransformActionTypes, params?: any[] }[]
}

@Processor(HtmlProcessorTypes.Attribute)
class AttributeProcessor implements HtmlProcessor<AttributeProcessorParameters> {
    private _selectors: string[]

    constructor(private _params: AttributeProcessorParameters) {
        this._selectors = Array.isArray(_params.selectors) ? _params.selectors : [_params.selectors]
    }
    elementStarted(element: HtmlElement) {
        const params = this._params
        if(this._selectors.reduce((prev, curr) => prev || element.matches(curr), false)) {
            if(params.action === 'add') {
                typeof params.attribute === 'string' ? 
                    element.attributes.setNamedItem({ name: params.attribute, value: '' }) :
                    element.attributes.setNamedItem({ name: params.attribute.name, value: params.attribute.value })
            } else if (params.action === 'delete') {
                element.attributes.removeNamedItem(typeof params.attribute === 'string' ? params.attribute : params.attribute.name)
            } else if (params.action === 'transform') {
                const attr = element.attributes.getNamedItem(typeof params.attribute === 'string' ? params.attribute : params.attribute.name)
                for(const tranform of params.transformations) {
                    attr.value = transformActions[tranform.action].apply(null, [attr.value, ...(tranform.params || [])])
                }
            }
        }
    }
    elementEnded(element: HtmlElement) {
        
    }
    textCreated(node: HtmlNode) {
        
    }
}

export default AttributeProcessor
export {
    AttributeProcessorParameters as AttributeParameters
}