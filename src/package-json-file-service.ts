import {
  IPackageJSONService,
  IPackageFile,
  type IYarnPnpmWorkspacesConfig,
} from './types'
import * as fs from 'node:fs'
import { promisify } from './util'
import detectIndent from 'detect-indent'
import yaml from 'js-yaml'

const statAsync = promisify(fs.stat)
const readFileAsync = promisify(fs.readFile)
const writeFileAsync = promisify(fs.writeFile)

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
      await writeFileAsync(filePath, data + (trailingNewline ? '\n' : ''))
    },
    readPnpmWorkspaceFile: async (filePath) => {
      try {
        const contents = await readFileContents(filePath)

        return {
          hasWorkspacesConfig: true,
          contents: yaml.load(contents) as IYarnPnpmWorkspacesConfig,
        }
      } catch (err) {
        return { hasWorkspacesConfig: false }
      }
    },
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
    .catch((err) => {
      /* istanbul ignore else */
      if (err.code === 'ENOENT') {
        return false
      }
      /* istanbul ignore next */
      throw err
    })
}
