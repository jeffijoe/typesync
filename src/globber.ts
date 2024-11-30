import { glob } from 'glob'
import { uniq } from './util'

/**
 * Globber interface.
 */
export interface IGlobber {
  /**
   * Globs for a filename.
   *
   * @param root
   */
  glob(this: void, root: string, filename: string): Promise<Array<string>>
}

/**
 * Creates a globber.
 */
export function createGlobber(): IGlobber {
  return {
    async glob(root: string, filename): Promise<Array<string>> {
      const source = await glob(filename, {
        root,
        ignore: '**/node_modules/**',
      })

      return uniq(source)
    },
  }
}
