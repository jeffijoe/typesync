import { createTypeDefinitionSource } from '../type-definition-source'

describe('type definition source', () => {
  const subject = createTypeDefinitionSource()

  describe('fetch', () => {
    it('fetches type defs', async () => {
      const typedefs = await subject.fetch()
      expect(typedefs.length).not.toBe(0)
    })
  })

  describe('getLatestTypingsVersion', () => {
    it('fetches a version number', async () => {
      const version = await subject.getLatestTypingsVersion('async')
      expect(typeof version).toBe('string')
    })
  })
})
