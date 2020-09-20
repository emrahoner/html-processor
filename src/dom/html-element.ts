import { HtmlNode } from "./html-node";
import { DOMTokenList } from "./dom-token-list";
import { NamedNodeMap } from "./named-node-map";
import { NodeTypes } from "./node-types";

interface Selector {
    tag?: string;
    classes?: string[];
    id?: string;
    attributes?: { name: string, value: string }[];
    isChild?: boolean;
}

function isSelectorSeperator(selector: string, index: number) {
    return ['.', '#', ' ', '>'].includes(selector[index])
}
  
function getBasicSelector(selector: string, index: number): string {
    let result = ''
    for (let i = index; i < selector.length; i++) {
        if (isSelectorSeperator(selector, i)) break
        result += selector[i]
    }
    return result
}

function parseSelector(selectorString: string): Selector[] {
    if (!selectorString) return []
    let selector: Selector = null
    const selectors: Selector[] = []
    let isChild = false
    for (let index = 0; index < selectorString.length; index++) {
      const char = selectorString[index]
      if (char === '.') {
        if (!selector) {
          selector = { tag: '', isChild }
        }
        if (!selector.classes) {
          selector.classes = []
        }
        const className = getBasicSelector(selectorString, index + 1)
        selector.classes.push(className)
        index += className.length
      } else if (char === '#') {
        if (!selector) {
          selector = { tag: '', isChild }
        }
        const id = getBasicSelector(selectorString, index + 1)
        selector.id = id
        index += id.length
      } else if (char === ' ') {
        if (selector) {
          selectors.push(selector)
          isChild = false
          selector = null
        }
      } else if (char === '>') {
        if (selector) {
          selectors.push(selector)
          selector = null
        }
        isChild = true
      } else {
        const tag = getBasicSelector(selectorString, index)
        selector = { tag: tag.toUpperCase(), isChild }
        index += tag.length - 1
      }
    }
    if (selector) {
      selectors.push(selector)
    }
    return selectors
}

function compareClassList(refClassList: DOMTokenList, selectorClassList: string[]) {
    return (selectorClassList || []).reduce((prev, curr) => {
      return prev && (refClassList?.contains(curr) ?? false)
    }, true);
  }
  
  function isEqual(nodeRef: HtmlElement, selector: Selector) {
    return (
      (!selector.id || (selector.id && nodeRef.id === selector.id)) &&
      (!selector.tag || (selector.tag && nodeRef.tagName === selector.tag)) &&
      (!selector.classes ||
        (selector.classes &&
          compareClassList(nodeRef.classList, selector.classes)))
    );
  }

export class HtmlElement extends HtmlNode {
    private _attributes: NamedNodeMap
    
    constructor(tagName: string){
        super(tagName.toUpperCase())
        this._nodeType = NodeTypes.ELEMENT_NODE
        this._attributes = new NamedNodeMap()
    }

    get id(): string {
        return this._attributes['id']
    }

    get tagName(): string {
        return this._nodeName
    }

    get attributes(): NamedNodeMap {
        return this._attributes;
    }

    get classList(): DOMTokenList {
        var classAttr = this._attributes['class']
        return classAttr ? new DOMTokenList(classAttr) : null
    }

    get innerHtml(): string {
        return this._childNodes.reduce((prev, curr) => {
            return prev + (curr.nodeType === NodeTypes.ELEMENT_NODE ? (curr as HtmlElement).outerHtml : curr.textContent)
        }, '')
    }

    get outerHtml(): string {
        return `<${this._nodeName.toLowerCase()}${this._attributeString}>${this.innerHtml}</${this._nodeName.toLowerCase()}>`
    }

    matches(selector: string): boolean {
        let current: HtmlElement = this
        let selectors = parseSelector(selector)
        let selectorIndex = selectors.length - 1
        let isImmediateChild = true

        while (current && selectorIndex >= 0) {
            const selector = selectors[selectorIndex];
            if (isEqual(current, selector)) {
                selectorIndex--;
            } else if (isImmediateChild) {
                return false
            }
            isImmediateChild = selector.isChild
            current = current.parentElement;
        }

        return selectorIndex < 0
    }

    remove() {
        const index = this._parentNode.childNodes.indexOf(this)
        if(index >= 0) {
            this._parentNode.childNodes.splice(index, 1)
        }
    }

    private get _attributeString(): string {
        let result = ''
        for(let i = 0; i < this._attributes.length; i++) {
            const attr = this._attributes.item(i)
            result += ` ${attr.name}="${attr.value}"`
        }
        return result
    }
}