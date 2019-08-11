import { parseArguments } from '../cli-util'

test('parseArguments', () => {
  expect(parseArguments(['--dry', '--ignoredeps=dev,peer', 'haha']))
    .toMatchInlineSnapshot(`
    Object {
      "args": Array [
        "haha",
      ],
      "flags": Object {
        "dry": true,
        "ignoredeps": "dev,peer",
      },
    }
  `)
})
