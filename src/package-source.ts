import { IPackageSource, IPackageVersionInfo } from './types'
import { npmClient } from './npm-client'
import { compare } from 'semver'

/**
 * Creates a package source.
 */
export function createPackageSource(): IPackageSource {
  return {
    /**
     * Fetches info about a package, or `null` if not found.
     */
    fetch: async (name) => {
      const data = await npmClient.getPackageManifest(encodeURIComponent(name))
      const versions = Object.keys(data.versions).map<IPackageVersionInfo>(
        (v) => {
          const item = data.versions[v]
          return {
            version: item.version,
            containsInternalTypings: !!item.types || !!item.typings,
          }
        }
      )

      return {
        name: data.name,
        latestVersion: data['dist-tags'].latest,
        // Sort by version, highest version first.
        versions: versions
          .sort((left, right) => compare(left.version, right.version))
          .reverse(),
      }
    },
  }
}
