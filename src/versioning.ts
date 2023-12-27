import { IPackageVersionInfo } from './types'
import { parse } from 'semver'

/**
 * Gets the closest matching package version info.
 *
 * @param availableVersions
 * @param version
 */
export function getClosestMatchingVersion(
  availableVersions: IPackageVersionInfo[],
  version: string,
) {
  const parsedVersion = parseOrThrow(version)

  return (
    availableVersions.find((v) => {
      const parsedAvailableVersion = parseOrThrow(v.version)
      if (parsedVersion.major !== parsedAvailableVersion.major) {
        return false
      }

      if (parsedVersion.minor !== parsedAvailableVersion.minor) {
        return false
      }

      return true
    }) || availableVersions[0]
  )
}

/**
 * Parses the version or throws an error.
 *
 * @param version
 * @returns
 */
function parseOrThrow(version: string) {
  const parsed = parse(cleanVersion(version))
  if (!parsed) {
    throw new Error(`Could not parse version '${version}'`)
  }

  return parsed
}

/**
 * Cleans the version of any semver range specifiers.
 * @param version
 * @returns
 */
function cleanVersion(version: string) {
  return version.replace(/^[\^~=\s]/, '')
}
