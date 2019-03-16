import { createTypeDefinitionSource } from '../type-definition-source'

describe('type definition source', () => {
  const subject = createTypeDefinitionSource()

  describe('fetch', () => {
    it('fetches type defs', async () => {
      const typedefs = await subject.fetch()
      expect(typedefs.length).not.toBe(0)
    })
  })
})
