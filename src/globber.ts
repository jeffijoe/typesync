import { glob } from 'tinyglobby'
import { uniq } from './util'

/**
 * Globber interface.
 */
export interface IGlobber {
  /**
   * Globs for directory names.
   *
   * @param root
   */
  globDirs(
    this: void,
    root: string,
    patterns: Array<string>,
    ignore?: Array<string>,
  ): Promise<Array<string>>
}

/**
 * Creates a globber.
 */
export function createGlobber(): IGlobber {
  return {
    async globDirs(root, patterns, ignore = []): Promise<Array<string>> {
      const source = await glob(patterns, {
        cwd: root,
        ignore: ['**/node_modules/**', ...ignore],
        onlyDirectories: true,
      })

      return uniq(source)
    },
  }
}
