import * as fsp from 'node:fs/promises'
import detectIndent from 'detect-indent'
import { readFileContents } from './fs-utils'
import { IPackageFile } from './types'

/**
 * File service.
 */
export interface IPackageJSONService {
  /**
   * Reads and parses JSON from the specified file. Path is relative to the current working directory.
   */
  readPackageFile(filePath: string): Promise<IPackageFile>
  /**
   * Writes the JSON to the specified file.
   */
  writePackageFile(filePath: string, fileContents: IPackageFile): Promise<void>
}

export function createPackageJSONFileService(): IPackageJSONService {
  return {
    readPackageFile: async (filePath) => {
      const contents = await readFileContents(filePath)
      return JSON.parse(contents) as IPackageFile
    },
    writePackageFile: async (filePath, fileContent) => {
      const contents = await readFileContents(filePath)
      const { indent } = detectIndent(contents)
      const trailingNewline = contents.length ? contents.endsWith('\n') : false
      const data = JSON.stringify(
        fileContent,
        null,
        indent /* istanbul ignore next */ || '  ',
      )
      await fsp.writeFile(filePath, data + (trailingNewline ? '\n' : ''))
    },
  }
}
