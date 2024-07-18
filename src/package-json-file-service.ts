import * as fsp from 'node:fs/promises'
import detectIndent from 'detect-indent'
import { readFileContents } from './fs-utils'
import { IPackageJSONService, IPackageFile } from './types'

export function createPackageJSONFileService(): IPackageJSONService {
  return {
    readPackageFile: async (filePath) => {
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
        indent /* istanbul ignore next */ || '  ',
      )
      await fsp.writeFile(filePath, data + (trailingNewline ? '\n' : ''))
    },
  }
}
