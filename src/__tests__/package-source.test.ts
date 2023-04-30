import { createPackageSource } from '../package-source'

test('package source', async () => {
  const source = createPackageSource()
  const result = (await source.fetch('awilix'))!

  expect(result).not.toBeNull()
  expect(result.name).toBe('awilix')
  expect(result.latestVersion).toBeDefined()

  // I wrote Awilix, and I know v2 didn't have typings while v3 did,
  // so it's a good test candidate.
  const v2 = result.versions.find((x) => x.version === '2.0.0')!
  expect(v2).toEqual({
    version: '2.0.0',
    containsInternalTypings: false,
  })

  const v3 = result.versions.find((x) => x.version === '3.0.0')!
  expect(v3).toEqual({
    version: '3.0.0',
    containsInternalTypings: true,
  })
})

test('not found', async () => {
  const source = createPackageSource()
  const result = await source.fetch(`some-nonexistent-package-${Date.now()}`)
  expect(result).toBeNull()
})
