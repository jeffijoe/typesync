import { test } from 'vitest'
import { parseArguments } from '../cli-util'

test('parseArguments', ({ expect }) => {
  expect(parseArguments(['--dry', '--ignoredeps=dev,peer', 'haha']))
    .toMatchInlineSnapshot(`
    {
      "args": [
        "haha",
      ],
      "flags": {
        "dry": true,
        "ignoredeps": "dev,peer",
      },
    }
  `)
})
