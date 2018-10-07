import { createGlobber } from '../globber'

test('returns the current directory as a match', async () => {
  const result = await createGlobber().globPackageFiles(process.cwd())
  expect(result).toHaveLength(1)
  expect(result[0]).toBe(process.cwd() + '/package.json')
})
