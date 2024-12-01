import { createPackageJSONFileService } from '../package-json-file-service'
import * as os from 'node:os'
import * as path from 'node:path'
import * as fsp from 'node:fs/promises'
import { describe, it } from 'vitest'

describe('package json file service', () => {
  const subject = createPackageJSONFileService()

  describe('readPackageFile', () => {
    it('reads the package JSON file from the cwd', async ({ expect }) => {
      const result = await subject.readPackageFile('package.json')
      expect(result.name).toBe('typesync')
    })

    it('throws when file does not exist', async ({ expect }) => {
      expect.assertions(1)
      await subject.readPackageFile('nonexistent.json').catch((err) => {
        expect(err.message).toMatch(/exist/i)
      })
    })
  })

  describe('writePackageFile', () => {
    it('writes the file to JSON', async ({ expect }) => {
      const file = await writeFixture()
      const data = {
        name: 'fony-package',
        dependencies: {
          '@types/package1': '^1.0.0',
          package1: '^1.0.0',
        },
      }
      await subject.writePackageFile(file, data)
      const after = await subject.readPackageFile(file)
      expect(after).toEqual(data)
      await cleanup(file)
    })

    it('preserves trailing newline when writing', async ({ expect }) => {
      const [noNewline, withNewline] = await Promise.all([
        writeFixture(false),
        writeFixture(true),
      ])
      const data = {
        name: 'fony-package',
        dependencies: {
          '@types/package1': '^1.0.0',
          package1: '^1.0.0',
        },
      }

      const [noNewlineContent, withNewlineContent] = await Promise.all([
        (async () => {
          await subject.writePackageFile(noNewline, data)
          const x = await fsp.readFile(noNewline)
          return x.toString()
        })(),
        (async () => {
          await subject.writePackageFile(withNewline, data)
          const x = await fsp.readFile(withNewline)
          return x.toString()
        })(),
      ])

      expect(noNewlineContent[noNewlineContent.length - 1]).not.toBe('\n')
      expect(withNewlineContent[withNewlineContent.length - 1]).toBe('\n')
      await cleanup(noNewline, withNewline)
    })

    it('does not fail when writing to an empty file', async ({ expect }) => {
      const file = path.join(os.tmpdir(), `package-${Math.random()}.json`)
      await fsp.writeFile(file, '')
      await expect(
        subject.writePackageFile(file, { name: 'test' }),
      ).resolves.toBe(undefined)
    })
  })
})

async function writeFixture(withTrailingNewline = false): Promise<string> {
  const file = path.join(os.tmpdir(), `package-${Math.random()}.json`)
  await fsp.writeFile(
    file,
    JSON.stringify(
      {
        name: 'fony-package',
        dependencies: {
          package1: '^1.0.0',
        },
      },
      null,
      2,
    ) + (withTrailingNewline ? '\n' : ''),
  )

  return file
}

async function cleanup(...files: Array<string>): Promise<void> {
  await Promise.all(
    files.map(async (f) => {
      await fsp.unlink(f)
    }),
  )
}
