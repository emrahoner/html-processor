import { is } from './selector-comparer'
import { NamedNodeMap } from './named-node-map'

describe('Selector Comparer', () => {

  describe('compares mixed selectors', () => {
    it('finds equal when tag name and attribute matches', () => {
      const attributes = new NamedNodeMap([
        {
          name: 'attr1',
          value: 'value1'
        },
        {
          name: 'attr2',
          value: 'value2'
        }
      ])
      
      const result = is({ attributes, tagName: 'A' } as any, 'a[attr2]')
      expect(result).toBe(true)
    })
  })

  describe('compares attributes', () => {
    it('finds equal without any attribute value in selector', () => {
      const attributes = new NamedNodeMap([
        {
          name: 'attr1',
          value: 'value1'
        },
        {
          name: 'attr2',
          value: 'value2'
        }
      ])
      
      const result = is({ attributes } as any, '[attr2]')
      expect(result).toBe(true)
    })

    it('finds equal when value match without quotation marks', () => {
      const attributes = new NamedNodeMap([
        {
          name: 'attr1',
          value: 'value1'
        },
        {
          name: 'attr2',
          value: 'value2'
        }
      ])
      
      const result = is({ attributes } as any, '[attr2=value2]')
      expect(result).toBe(true)
    })

    it('finds equal when value match with quotation marks', () => {
      const attributes = new NamedNodeMap([
        {
          name: 'attr1',
          value: 'value1'
        },
        {
          name: 'attr2',
          value: 'value2'
        }
      ])
      
      const result = is({ attributes } as any, '[attr2="value2"]')
      expect(result).toBe(true)
    })

    it('finds not equal even when value match but with one quotation marks', () => {
      const attributes = new NamedNodeMap([
        {
          name: 'attr1',
          value: 'value1'
        },
        {
          name: 'attr2',
          value: 'value2'
        }
      ])
      
      const result = is({ attributes } as any, '[attr2="value2]')
      expect(result).toBe(false)
    })
  })
})