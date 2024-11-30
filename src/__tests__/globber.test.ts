import * as path from 'node:path'
import { createGlobber } from '../globber'
import { test } from 'vitest'

test('returns the current directory as a match', async ({ expect }) => {
  const result = await createGlobber().glob(process.cwd(), 'package.json')
  expect(result).toHaveLength(1)
  expect(result[0]).toBe(path.join(process.cwd(), 'package.json'))
})
