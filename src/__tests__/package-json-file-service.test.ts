import { createPackageJSONFileService } from '../package-json-file-service'
import * as os from 'node:os'
import * as path from 'node:path'
import * as fsp from 'node:fs/promises'

describe('package json file service', () => {
  const subject = createPackageJSONFileService()

  describe('readPackageFile', () => {
    it('reads the package JSON file from the cwd', async () => {
      const result = await subject.readPackageFile('package.json')
      expect(result.name).toBe('typesync')
    })

    it('throws when file does not exist', async () => {
      expect.assertions(1)
      await subject
        .readPackageFile('nonexistent.json')
        .catch((err) => expect(err.message).toMatch(/exist/i))
    })
  })

  describe('writePackageFile', () => {
    it('writes the file to JSON', async () => {
      const file = await _writeFixture()
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

    it('preserves trailing newline when writing', async () => {
      const [noNewline, withNewline] = await Promise.all([
        _writeFixture(false),
        _writeFixture(true),
      ])
      const data = {
        name: 'fony-package',
        dependencies: {
          '@types/package1': '^1.0.0',
          package1: '^1.0.0',
        },
      }

      await Promise.all([
        subject.writePackageFile(noNewline, data),
        subject.writePackageFile(withNewline, data),
      ])

      const [noNewlineContent, withNewlineContent] = await Promise.all([
        fsp.readFile(noNewline).then((x) => x.toString()),
        fsp.readFile(withNewline).then((x) => x.toString()),
      ])

      expect(noNewlineContent[noNewlineContent.length - 1]).not.toBe('\n')
      expect(withNewlineContent[withNewlineContent.length - 1]).toBe('\n')
      await cleanup(noNewline, withNewline)
    })

    it('does not fail when writing to an empty file', async () => {
      const file = path.join(os.tmpdir(), `package-${Math.random()}.json`)
      await fsp.writeFile(file, '')
      await subject.writePackageFile(file, { name: 'test' })
    })
  })
})

async function _writeFixture(withTrailingNewline = false): Promise<string> {
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

function cleanup(...files: string[]): Promise<any> {
  return Promise.all(files.map((f) => fsp.unlink(f)))
}
