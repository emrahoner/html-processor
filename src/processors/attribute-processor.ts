import { HtmlElement } from './../dom/html-element';
import { HtmlProcessorTypes } from '../types';
import { HtmlProcessor } from '../types';
import Processor from '../decorators/processor';
import { HtmlNode } from '../dom/html-node';

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

type Attribute = { name: string, value?: string }

type TransformActionTypes = 'format' | 'trim' | 'joinUrl' | 'encodeUrl'

type AttributeProcessorActions = 'add' | 'delete' | 'transform' | 'addToParents' | 'append'

export interface AttributeProcessorParameters {
    selectors: string[] | string
    action: AttributeProcessorActions
    attribute: string | Attribute
    transformations?: { action: TransformActionTypes, params?: any[] }[]
    ifIn?: string[] | string
}

function addAttribute(element: HtmlElement, attribute: string | Attribute) {
    typeof attribute === 'string' ? 
        element.attributes.setNamedItem({ name: attribute, value: '' }) :
        element.attributes.setNamedItem({ name: attribute.name, value: attribute.value })
}

function removeAttribute(element: HtmlElement, attribute: string | Attribute) {
    element.attributes.removeNamedItem(typeof attribute === 'string' ? attribute : attribute.name)
}

@Processor(HtmlProcessorTypes.Attribute)
class AttributeProcessor implements HtmlProcessor<AttributeProcessorParameters> {
    private _selectors: string[]
    private _ifIn: string[]
    private _topParent: HtmlElement

    constructor(private _params: AttributeProcessorParameters) {
        this._selectors = Array.isArray(_params.selectors) ? _params.selectors : [_params.selectors]
        this._ifIn = Array.isArray(this._params.ifIn) ? this._params.ifIn : (this._params.ifIn ? [this._params.ifIn] : null)
        this._topParent = null
    }
    elementStarted(element: HtmlElement) {
        const params = this._params
        if(!this._topParent) {
            this._topParent = this._ifIn === null || this._ifIn.reduce((prev, curr) => prev || element.matches(curr), false) ? element : null
        }

        if(this._topParent && this._selectors.reduce((prev, curr) => prev || element.matches(curr), false)) {
            if(params.action === 'add') {
                addAttribute(element, params.attribute)
            } else if (params.action === 'delete') {
                removeAttribute(element, params.attribute)
            } else if (params.action === 'transform') {
                const attr = element.attributes.getNamedItem(typeof params.attribute === 'string' ? params.attribute : params.attribute.name)
                for(const tranform of params.transformations) {
                    attr.value = transformActions[tranform.action].apply(null, [attr.value, ...(tranform.params || [])])
                }
            } else if (params.action === 'addToParents') {
                for(let current = element.parentElement; current; current = current.parentElement) {
                    addAttribute(current, params.attribute)
                    if(current === this._topParent) break
                }
            } else if (params.action === 'append') {
                if(typeof params.attribute === 'string' || !params.attribute.value) throw new Error('Given attribute parameter doesnt have value.')
                const attr = element.attributes.getNamedItem(params.attribute.name)
                if(attr) {
                    attr.value += ` ${params.attribute.value}`
                    element.attributes.setNamedItem(attr)
                } else {
                    element.attributes.setNamedItem({ name: params.attribute.name, value: params.attribute.value })
                }
            }
        }
    }
    elementEnded(element: HtmlElement) {
        if(this._topParent === element) {
            this._topParent = null
        }
    }
    textCreated(node: HtmlNode) {
        
    }
}

export default AttributeProcessor
export {
    AttributeProcessorParameters as AttributeParameters
}