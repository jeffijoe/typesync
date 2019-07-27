import glob from 'glob'
import * as path from 'path'
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
      return new Promise<Array<string>>((resolve, reject) =>
        glob(path.join(pattern, 'package.json'), (err, matches) =>
          err
            ? /* istanbul ignore next: errors are for people who don't know what they are doing */
              reject(err)
            : resolve(uniq(matches))
        )
      )
    }
  }
}
