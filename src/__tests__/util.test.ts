import { describe, it } from 'vitest'
import {
  memoizeAsync,
  mergeObjects,
  orderObject,
  shrinkObject,
  typed,
  uniq,
  untyped,
} from '../util'

describe('util', () => {
  describe('uniq', () => {
    it('returns unique items', ({ expect }) => {
      expect(uniq([1, 2, 2, 1, 3, 4, 3, 2, 5])).toEqual([1, 2, 3, 4, 5])
    })
  })

  describe('shrinkObject', () => {
    it('removes blank attributes in the object', ({ expect }) => {
      expect(shrinkObject({ a: 1, b: undefined, c: '2', d: null })).toEqual({
        a: 1,
        c: '2',
        d: null,
      })
    })
  })

  describe('mergeObjects', () => {
    it('merges an array of objects', ({ expect }) => {
      expect(mergeObjects([{ a: 1 }, { b: 2 }, { a: 3 }, { c: 4 }])).toEqual({
        a: 3,
        b: 2,
        c: 4,
      })
    })
  })

  describe('orderObject', () => {
    it('orders the object', ({ expect }) => {
      const source = { b: true, a: true, d: true, c: true }
      const result = orderObject(source)
      const resultKeys = Object.keys(result)
      expect(resultKeys).toEqual(['a', 'b', 'c', 'd'])
    })
  })

  describe('memoizeAsync', () => {
    it('memoizes promises', async ({ expect }) => {
      let i = 0

      const m = memoizeAsync((k: string) =>
        Promise.resolve(k + (++i).toString()),
      )
      expect([await m('hello'), await m('hello')]).toEqual(['hello1', 'hello1'])
      expect([await m('goodbye'), await m('goodbye')]).toEqual([
        'goodbye2',
        'goodbye2',
      ])
    })

    it('removes entry on fail', async ({ expect }) => {
      let i = 0

      const m = memoizeAsync((k: string) =>
        Promise.reject(new Error(k + (++i).toString())),
      )
      expect([
        await m('hello').catch((err) => err.message),
        await m('hello').catch((err) => err.message),
      ]).toEqual(['hello1', 'hello2'])
    })
  })

  describe('typed', () => {
    it('correctly returns the typings package name for a code package name', ({
      expect,
    }) => {
      expect(typed('jquery')).toBe('@types/jquery')
      expect(typed('@koa/router')).toBe('@types/koa__router')
    })
  })

  describe('untyped', () => {
    it('correctly converts a type package name to a code package name', ({
      expect,
    }) => {
      expect(untyped('lol')).toBe('lol')
      expect(untyped('@types/lol')).toBe('lol')
      expect(untyped('@types/rofl__lol')).toBe('@rofl/lol')
    })
  })
})
