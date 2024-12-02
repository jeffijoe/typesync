import { createGlobber } from '../globber'
import { test } from 'vitest'

test('returns the source directory as a match', async ({ expect }) => {
  const result = await createGlobber().globDirs(process.cwd(), ['src*/'])
  expect(result).toHaveLength(1)
  expect(result[0]).toBe('src/')
})
