import {
  uniq,
  filterMap,
  mergeObjects,
  orderObject,
  promisify,
  memoizeAsync,
  ensureWorkspacesArray,
  untyped
} from '../util'

describe('util', () => {
  describe('uniq', () => {
    it('returns unique items', () => {
      expect(uniq([1, 2, 2, 1, 3, 4, 3, 2, 5])).toEqual([1, 2, 3, 4, 5])
    })
  })

  describe('filterMap', () => {
    it('filters out false values', () => {
      expect(
        filterMap([1, 2, 3, 4], item => (item % 2 === 0 ? false : item + 1))
      ).toEqual([2, 4])
    })
  })

  describe('mergeObjects', () => {
    it('merges an array of objects', () => {
      expect(mergeObjects([{ a: 1 }, { b: 2 }, { a: 3 }, { c: 4 }])).toEqual({
        a: 3,
        b: 2,
        c: 4
      })
    })
  })

  describe('orderObject', () => {
    it('orders the object', () => {
      const source = { b: true, a: true, d: true, c: true }
      const result = orderObject(source)
      const resultKeys = Object.keys(result)
      expect(resultKeys).toEqual(['a', 'b', 'c', 'd'])
    })
  })

  describe('promisify', () => {
    it('resolves when the callback is successful', async () => {
      const original = (arg1: any, arg2: any, cb: Function) =>
        cb(null, arg1 + arg2)
      const promisified = promisify(original)
      const result = await promisified(2, 2)
      expect(result).toBe(4)
    })

    it('resolves when the callback is invoked with a single bool argument', async () => {
      const original = (arg1: any, cb: Function) => cb(arg1)
      const promisified = promisify(original)
      const result = await promisified(true)
      expect(result).toBe(true)
    })

    it('rejects when the callback is not successful', async () => {
      const original = (arg1: any, arg2: any, cb: Function) =>
        cb(new Error('oh shit'), null)
      const promisified = promisify(original)
      const err = await promisified(2, 2).catch(err => err)
      expect(err.message).toBe('oh shit')
    })

    it('rejects when the callback is not successful even if only passed 1 param', async () => {
      const original = (arg1: any, arg2: any, cb: Function) =>
        cb(new Error('oh shit'))
      const promisified = promisify(original)
      const err = await promisified(2, 2).catch(err => err)
      expect(err.message).toBe('oh shit')
    })
  })

  describe('memoizeAsync', () => {
    it('memoizes promises', async () => {
      let i = 0

      const m = memoizeAsync((k: string) =>
        Promise.resolve(k + (++i).toString())
      )
      expect([await m('hello'), await m('hello')]).toEqual(['hello1', 'hello1'])
      expect([await m('goodbye'), await m('goodbye')]).toEqual([
        'goodbye2',
        'goodbye2'
      ])
    })

    it('removes entry on fail', async () => {
      let i = 0

      const m = memoizeAsync((k: string) =>
        Promise.reject(new Error(k + (++i).toString()))
      )
      expect([
        await m('hello').catch(err => err.message),
        await m('hello').catch(err => err.message)
      ]).toEqual(['hello1', 'hello2'])
    })
  })

  describe('ensureWorkspacesArray', () => {
    it('handles bad cases', () => {
      expect(ensureWorkspacesArray(null as any)).toEqual([])
      expect(ensureWorkspacesArray({} as any)).toEqual([])
      expect(ensureWorkspacesArray({ packages: {} } as any)).toEqual([])
      expect(ensureWorkspacesArray({ packages: [1, 2, '3'] } as any)).toEqual(
        []
      )
      expect(ensureWorkspacesArray({ packages: ['lol'] } as any)).toEqual([
        'lol'
      ])
    })
  })

  describe('untyped', () => {
    it('correctly converts a type package name to a code package name', () => {
      expect(untyped('lol')).toBe('lol')
      expect(untyped('@types/lol')).toBe('lol')
      expect(untyped('@types/rofl__lol')).toBe('@rofl/lol')
    })
  })
})
