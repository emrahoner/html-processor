import { HtmlElement } from './html-element'
import { DOMTokenList } from './dom-token-list'
import { NamedNodeMap } from './named-node-map'
import { Attr } from './attr'

enum AttributeSelectorOperator {
  equals,
  begins,
  contains,
  ends,
  hasToken,
  hyphenedEqual
}

interface AttributeSelector {
  name: string
  value: string
  operator: AttributeSelectorOperator
}

interface Selector {
  tag?: string
  classes?: string[]
  id?: string
  attributes?: AttributeSelector[]
  isChild?: boolean
}

const attributeSelectorOperatorMapping = {
  '^': AttributeSelectorOperator.begins,
  '*': AttributeSelectorOperator.contains,
  '$': AttributeSelectorOperator.ends,
  '~': AttributeSelectorOperator.hasToken,
  '|': AttributeSelectorOperator.hyphenedEqual
}

function isSelectorSeperator(selector: string, index: number) {
  return ['.', '#', ' ', '>', '['].includes(selector[index])
}

function getBasicSelector(selector: string, index: number): string {
  let result = ''
  for (let i = index; i < selector.length; i++) {
    if (isSelectorSeperator(selector, i)) break
    result += selector[i]
  }
  return result
}

function getAttributeSelector(selector: string, index: number): { attributeselector: AttributeSelector, cursorIndex: number } {
  let name = '', value = '', section = 0
  let operator = AttributeSelectorOperator.equals
  let quotation = ''
  let valueEnded = false

  for (let i = index; i < selector.length; i++) {
    const char = selector[i]

    if(valueEnded && char !== ']') throw new Error('Attribute selector is invalid.') 

    switch (char) {
      case '=':
        if(!name || (section !== 0 && section !== 1)) throw new Error('Attribute selector is invalid.')
        section = 2
        break
      case '^':
      case '*':
      case '$':
      case '~':
      case '|':
        if (!name || section !== 0) throw new Error('Attribute selector is invalid.')
        section = 1
        operator = attributeSelectorOperatorMapping[char]
        break
      case quotation:
        valueEnded = true
      case ']':
        if(!valueEnded) {
          value = quotation + value
        }
        valueEnded = true
        break
      case '"':
      case '\'':
        if (!name || section !== 2) throw new Error('Attribute selector is invalid.')
        section = 3
        quotation = char
        break
      default:
        if (section === 2) section = 3
        if (section !== 0 && section !== 3) throw new Error('Attribute selector is invalid.')
        if(section === 0) {
          name += selector[i]
        } else {
          value += selector[i]
        }
        break
    }
    if(char === ']') {
      index = i
      break
    }
  }

  return {
    attributeselector: {
      name,
      value,
      operator
    },
    cursorIndex: index
  }
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
        selector = {
          tag: '',
          isChild
        }
      }
      if (!selector.classes) {
        selector.classes = []
      }
      const className = getBasicSelector(selectorString, index + 1)
      selector.classes.push(className)
      index += className.length
    } else if (char === '#') {
      if (!selector) {
        selector = {
          tag: '',
          isChild
        }
      }
      const id = getBasicSelector(selectorString, index + 1)
      selector.id = id
      index += id.length
    } else if (char === '[') {
      if (!selector) {
        selector = {
          tag: '',
          isChild
        }
      }
      if (!selector.attributes) {
        selector.attributes = []
      }
      const selectorData = getAttributeSelector(selectorString, index + 1)
      selector.attributes.push(selectorData.attributeselector)
      index = selectorData.cursorIndex
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
      selector = {
        tag: tag.toUpperCase(),
        isChild
      }
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
  }, true)
}

function compareAttribute(refAttribute: Attr, selectorAttribute: AttributeSelector) {
  switch(selectorAttribute.operator) {
    case AttributeSelectorOperator.equals:
      return !selectorAttribute.value || refAttribute.value === selectorAttribute.value
    case AttributeSelectorOperator.begins:
      return refAttribute.value.startsWith(selectorAttribute.value)
    case AttributeSelectorOperator.ends:
      return refAttribute.value.endsWith(selectorAttribute.value)
    case AttributeSelectorOperator.contains:
      return refAttribute.value.includes(selectorAttribute.value)
    default:
      throw new Error(`The given attribute operation ${ selectorAttribute.operator } is not supported`)
  }
}

function compareAttributeList(refAttributes: NamedNodeMap, selectorAttributeList: AttributeSelector[]) {
  return (selectorAttributeList || []).reduce((prev, curr) => {
    const attr = refAttributes.getNamedItem(curr.name)
    return prev && attr && compareAttribute(attr, curr)
  }, true)
}

function isEqual(nodeRef: HtmlElement, selector: Selector) {
  return (
    (!selector.id || (selector.id && nodeRef.id === selector.id)) &&
    (!selector.tag || (selector.tag && nodeRef.tagName === selector.tag)) &&
    (!selector.classes || (selector.classes && compareClassList(nodeRef.classList, selector.classes))) &&
    (!selector.attributes || (selector.attributes && compareAttributeList(nodeRef.attributes, selector.attributes)))
  )
}

export function is(element: HtmlElement, selector: string): boolean {
  let selectors = parseSelector(selector)
  let selectorIndex = selectors.length - 1
  let isImmediateChild = true

  while (element && selectorIndex >= 0) {
    const selector = selectors[selectorIndex];
    if (isEqual(element, selector)) {
      selectorIndex--;
    } else if (isImmediateChild) {
      return false
    }
    isImmediateChild = selector.isChild
    element = element.parentElement;
  }

  return selectorIndex < 0
}