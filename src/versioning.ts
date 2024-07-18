import { parse } from 'semver'
import type { IPackageVersionInfo } from './types'

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
  const parsedVersion = parseVersion(version)
  if (!parsedVersion) {
    return availableVersions[0]
  }

  const bestMatch = availableVersions.find((v) => {
    const parsedAvailableVersion = parseVersion(v.version)
    if (!parsedAvailableVersion) {
      return false
    }

    if (parsedVersion.major !== parsedAvailableVersion.major) {
      return false
    }

    if (parsedVersion.minor !== parsedAvailableVersion.minor) {
      return false
    }

    return true
  })

  return bestMatch || availableVersions[0]
}

/**
 * Parses the version if possible.
 *
 * @param version
 * @returns
 */
function parseVersion(version: string) {
  return parse(cleanVersion(version))
}

/**
 * Cleans the version of any semver range specifiers.
 * @param version
 * @returns
 */
function cleanVersion(version: string) {
  return version.replace(/^[\^~=\s]/, '')
}
