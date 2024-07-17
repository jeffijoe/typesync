import { glob } from 'glob'
import * as path from 'node:path'
import { uniq } from './util'

/**
 * Globber interface.
 */
export interface IGlobber {
  /**
   * Globs for package.json files.
   *
   * @param pattern
   */
  globPackageFiles(pattern: string): Promise<Array<string>>
}

/**
 * Creates a globber.
 */
export function createGlobber() {
  return {
    globPackageFiles(pattern: string) {
      return glob(path.join(pattern, 'package.json'), {
        ignore: '**/node_modules/**',
      }).then(uniq)
    },
  }
}
