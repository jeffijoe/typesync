import { createPackageJSONFileService } from '../package-json-file-service'
import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'
import { promisify } from '../util'

const writeFileAsync = promisify(fs.writeFile)

describe('package json file service', () => {
  const subject = createPackageJSONFileService()

  describe('readPackageFile', () => {
    it('reads the package JSON file from the cwd', async () => {
      const result = await subject.readPackageFile('package.json')
      expect(result.name).toBe('typesync')
    })

    it('throws when file does not exist', async () => {
      expect.assertions(1)
      await subject.readPackageFile('nonexistent.json')
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
          package1: '^1.0.0'
        }
      }
      await subject.writePackageFile(file, data)
      const after = await subject.readPackageFile(file)
      expect(after).toEqual(data)
    })
  })
})

function _writeFixture (): Promise<string> {
  const file = path.join(os.tmpdir(), `package-${Date.now()}.json`)
  return writeFileAsync(file, JSON.stringify({
    name: 'fony-package',
    dependencies: {
      package1: '^1.0.0'
    }
  }, null, 2)).then(() => file)
}
