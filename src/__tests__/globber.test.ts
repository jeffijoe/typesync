import * as path from 'node:path'
import { createGlobber } from '../globber'

test('returns the current directory as a match', async () => {
  const result = await createGlobber().glob(process.cwd(), 'package.json')
  expect(result).toHaveLength(1)
  expect(result[0]).toBe(path.join(process.cwd(), 'package.json'))
})
