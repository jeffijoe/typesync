import { readFile, stat } from 'node:fs/promises'

export async function readFileContents(filePath: string) {
  await assertFile(filePath)
  return readFile(filePath, 'utf-8')
}

async function assertFile(filePath: string) {
  if (!(await existsAsync(filePath))) {
    throw new Error(`${filePath} does not exist.`)
  }
}

async function existsAsync(filePath: string): Promise<boolean> {
  try {
    await stat(filePath)
    return true
  } catch (err) {
    /* istanbul ignore else */
    if ((err as { code: string }).code === 'ENOENT') {
      return false
    }
    /* istanbul ignore next */
    throw err
  }
}
