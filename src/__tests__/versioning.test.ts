import { IPackageVersionInfo } from '../types'
import { getClosestMatchingVersion } from '../versioning'

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

  it('throws when unable to parse version', () => {
    expect(() =>
      getClosestMatchingVersion(
        [
          {
            containsInternalTypings: false,
            version: 'not a version',
          },
        ],
        'also not a version',
      ),
    ).toThrow()
  })
})
