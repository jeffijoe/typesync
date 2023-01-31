import { parseArguments } from '../cli-util'

test('parseArguments', () => {
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
