import { readFile } from 'node:fs/promises'

export async function readFileContents(filePath: string): Promise<string> {
  try {
    return readFile(filePath, 'utf-8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`${filePath} does not exist.`)
    }

    throw err
  }
}
