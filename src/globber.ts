import { glob } from 'tinyglobby'
import { uniq } from './util'

/**
 * Globber interface.
 */
export interface IGlobber {
  /**
   * Globs for filenames.
   *
   * @param root
   */
  glob(
    this: void,
    root: string,
    filenames: Array<string>,
    ignore?: Array<string>,
  ): Promise<Array<string>>
}

/**
 * Creates a globber.
 */
export function createGlobber(): IGlobber {
  return {
    async glob(root, filenames, ignore = []): Promise<Array<string>> {
      const source = await glob(filenames, {
        cwd: root,
        ignore: ['**/node_modules/**', ...ignore],
        onlyDirectories: true,
      })

      return uniq(source)
    },
  }
}
