import {
  getClosestMatchingVersion,
  type IPackageVersionInfo,
} from '../versioning'

describe('getClosestMatchingVersion', () => {
  it('returns the closest matching version', () => {
    const inputVersions: IPackageVersionInfo[] = [
      {
        containsInternalTypings: false,
        version: '1.16.0',
      },
      {
        containsInternalTypings: false,
        version: '1.15.2',
      },
      {
        containsInternalTypings: false,
        version: '1.15.1',
      },
      {
        containsInternalTypings: false,
        version: '1.15.0',
      },
      {
        containsInternalTypings: false,
        version: '1.14.2',
      },
      {
        containsInternalTypings: false,
        version: '1.14.1',
      },
      {
        containsInternalTypings: false,
        version: '1.14.0',
      },
      {
        containsInternalTypings: false,
        version: '1.13.0',
      },
    ]

    expect(getClosestMatchingVersion(inputVersions, '^1.17.0').version).toBe(
      '1.16.0',
    )
    expect(getClosestMatchingVersion(inputVersions, '^1.16.1').version).toBe(
      '1.16.0',
    )
    expect(getClosestMatchingVersion(inputVersions, '^1.16.0').version).toBe(
      '1.16.0',
    )
    expect(getClosestMatchingVersion(inputVersions, '^1.15.4').version).toBe(
      '1.15.2',
    )
    expect(getClosestMatchingVersion(inputVersions, '^1.15.3').version).toBe(
      '1.15.2',
    )
    expect(getClosestMatchingVersion(inputVersions, '^1.15.2').version).toBe(
      '1.15.2',
    )
    expect(getClosestMatchingVersion(inputVersions, '^1.15.1').version).toBe(
      '1.15.2',
    )
    expect(getClosestMatchingVersion(inputVersions, '^1.14.0').version).toBe(
      '1.14.2',
    )
  })

  it('returns the latest version when unable to parse version', () => {
    const notVersions = [
      {
        containsInternalTypings: false,
        version: 'not a version',
      },
      {
        containsInternalTypings: false,
        version: 'same',
      },
    ]
    expect(
      getClosestMatchingVersion(notVersions, 'also not a version').version,
    ).toBe('not a version')
    expect(getClosestMatchingVersion(notVersions, '1.0.0').version).toBe(
      'not a version',
    )
  })
})
