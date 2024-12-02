import { readFile } from 'node:fs/promises'

export async function readFileContents(filePath: string): Promise<string> {
  try {
    return await readFile(filePath, 'utf-8')
    /* v8 ignore next */
  } catch (err) {
    /* v8 ignore next 3 */
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`${filePath} does not exist.`)
    }

    /* v8 ignore next 2 */
    throw err
  }
}
