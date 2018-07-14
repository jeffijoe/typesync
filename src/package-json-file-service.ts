import { IPackageJSONService, IPackageFile } from './types'
import * as fs from 'fs'
import { promisify } from './util'
import detectIndent from 'detect-indent'

const statAsync = promisify(fs.stat)
const readFileAsync = promisify(fs.readFile)
const writeFileAsync = promisify(fs.writeFile)

export function createPackageJSONFileService(): IPackageJSONService {
  return {
    readPackageFile: async filePath => {
      const contents = await readFileContents(filePath)
      return JSON.parse(contents) as IPackageFile
    },
    writePackageFile: async (filePath, fileContent) => {
      const contents = await readFileContents(filePath)
      const { indent } = detectIndent(contents)
      const trailingNewline = contents.length
        ? contents[contents.length - 1] === '\n'
        : false
      const data = JSON.stringify(
        fileContent,
        null,
        indent /* istanbul ignore next */ || '  '
      )
      await writeFileAsync(filePath, data + (trailingNewline ? '\n' : ''))
    }
  }
}

async function readFileContents(filePath: string) {
  await assertFile(filePath)
  return readFileAsync(filePath, 'utf-8').then((x: Buffer) => x.toString())
}

async function assertFile(filePath: string) {
  if (!(await existsAsync(filePath))) {
    throw new Error(`${filePath} does not exist.`)
  }
}

async function existsAsync(filePath: string): Promise<boolean> {
  return statAsync(filePath)
    .then(() => true)
    .catch(err => {
      /* istanbul ignore else */
      if (err.code === 'ENOENT') {
        return false
      }
      /* istanbul ignore next */
      throw err
    })
}
