import { IPackageSource, IPackageVersionInfo } from './types'
import fetch from 'npm-registry-fetch'
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
      const response = await fetch(encodeURI(name)).catch((err: any) => {
        if (err.statusCode === 404) {
          return null
        }

        /* istanbul ignore next */
        throw err
      })

      const data = await response?.json()

      if (!data?.versions) {
        return null
      }

      const versionIdentifiers = Object.keys(data.versions)
        .sort(compare)
        .reverse()
      const versions = versionIdentifiers.map<IPackageVersionInfo>((v) => {
        const item = data.versions[v]
        return {
          version: item.version,
          containsInternalTypings: !!item.types || !!item.typings,
        }
      })

      return {
        name: data.name,
        deprecated: Boolean(data.versions[versionIdentifiers[0]].deprecated),
        latestVersion: data['dist-tags'].latest,
        // Sort by version, highest version first.
        versions: versions,
      }
    },
  }
}
