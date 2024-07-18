import * as path from 'node:path'
import { glob } from 'glob'
import { uniq } from './util'

/**
 * Globber interface.
 */
export interface IGlobber {
  /**
   * Globs for `package.json` files.
   *
   * @param root
   */
  globPackageFiles(root: string): Promise<Array<string>>
}

/**
 * Creates a globber.
 */
export function createGlobber() {
  return {
    async globPackageFiles(
      root: string,
      file = 'package.json',
    ): Promise<Array<string>> {
      const source = await glob(path.join(root, file), {
        ignore: '**/node_modules/**',
      })

      return uniq(source)
    },
  }
}
