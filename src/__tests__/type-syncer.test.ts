import type { IGlobber } from '../globber'
import { createTypeSyncer } from '../type-syncer'
import {
  type IConfigService,
  IDependencySection,
  type IPackageFile,
  type IPackageInfo,
  type IPackageJSONService,
  type IPackageSource,
  type IPackageTypingDescriptor,
} from '../types'

const descriptors: IPackageTypingDescriptor[] = [
  {
    typingsName: 'package1',
    codePackageName: 'package1',
    typesPackageName: '@types/package1',
  },
  {
    typingsName: 'package2',
    codePackageName: 'package2',
    typesPackageName: '@types/package2',
  },
  {
    typingsName: 'package3',
    codePackageName: 'package3',
    typesPackageName: '@types/package3',
  },
  {
    typingsName: 'packageWithInternalTypings',
    codePackageName: 'packageWithInternalTypings',
    typesPackageName: '@types/packageWithInternalTypings',
  },
  {
    typingsName: 'packageWithDeprecatedTypings',
    codePackageName: 'packageWithDeprecatedTypings',
    typesPackageName: '@types/packageWithDeprecatedTypings',
  },
  {
    typingsName: 'package4',
    codePackageName: 'package4',
    typesPackageName: '@types/package4',
  },
  {
    typingsName: 'package5',
    codePackageName: 'package5',
    typesPackageName: '@types/package5',
  },
  // None for package6
  {
    typingsName: 'myorg__package7',
    codePackageName: '@myorg/package7',
    typesPackageName: '@types/myorg__package7',
  },
  {
    typingsName: 'package8',
    codePackageName: 'package8',
    typesPackageName: '@types/package8',
  },
  {
    typingsName: 'package9',
    codePackageName: 'package9',
    typesPackageName: '@types/package9',
  },
  {
    typingsName: 'packageWithOldTypings',
    codePackageName: 'packageWithOldTypings',
    typesPackageName: '@types/packageWithOldTypings',
  },
]

function buildSyncer() {
  const rootPackageFile: IPackageFile = {
    name: 'consumer',
    dependencies: {
      package1: '^1.0.0',
      package3: '^1.0.0',
      packageWithInternalTypings: '^1.0.0',
      packageWithOldTypings: '^1.0.0',
      packageWithDeprecatedTypings: '^2.0.0',
    },
    devDependencies: {
      '@types/package4': '^1.0.0',
      package4: '^1.0.0',
      package5: '^1.0.0',
    },
    optionalDependencies: {
      package6: '^1.0.0',
    },
    peerDependencies: {
      '@myorg/package7': '^1.0.0',
      package8: '~1.0.0',
      package9: '1.0.0',
    },
    packages: ['packages/*'],
    workspaces: ['packages/*'],
  }

  // synced package file with ignoreDeps: dev
  const syncedPackageFile: IPackageFile = {
    ...rootPackageFile,
    devDependencies: {
      '@types/package1': '^1.0.0',
      '@types/package3': '^1.0.0',
      '@types/myorg__package7': '^1.0.0',
      '@types/package8': '~1.0.0',
      '@types/package9': '1.0.0',
      '@types/packageWithOldTypings': '^2.0.0',
      package4: '^1.0.0',
      package5: '^1.0.0',
    },
  }

  const package1File: IPackageFile = {
    name: 'package-1',
    dependencies: {
      package1: '^1.0.0',
    },
  }

  const package2File: IPackageFile = {
    name: 'package-1',
    dependencies: {
      package3: '^1.0.0',
    },
  }

  const packageService: IPackageJSONService = {
    readPackageFile: jest.fn(async (filepath: string) => {
      switch (filepath) {
        case 'package.json':
        case 'package-ignore-dev.json':
        case 'package-ignore-package1.json':
          return rootPackageFile
        case 'package-ignore-dev-synced.json':
          return syncedPackageFile
        case 'packages/package-1/package.json':
          return package1File
        case 'packages/package-2/package.json':
          return package2File
        default:
          throw new Error('What?!')
      }
    }),
    writePackageFile: jest.fn(() => Promise.resolve()),
    readPnpmWorkspaceFile: jest.fn(
      async () =>
        ({
          hasWorkspacesConfig: false,
        }) as const,
    ),
  }

  const globber: IGlobber = {
    globPackageFiles: jest.fn(async (pattern) => {
      switch (pattern) {
        case 'packages/*':
          return [
            'packages/package-1/package.json',
            'packages/package-2/package.json',
          ]
        default:
          return []
      }
    }),
  }

  const packageSource: IPackageSource = {
    fetch: jest.fn(async (name) => {
      const found = descriptors.find(
        (t) => t.codePackageName === name || t.typesPackageName === name,
      )
      if (!found) {
        return null
      }

      const info: IPackageInfo = {
        name,
        latestVersion: '2.0.0',
        deprecated: name === '@types/packageWithDeprecatedTypings',
        versions: [
          {
            version: '2.0.0',
            containsInternalTypings: false,
          },
          {
            version:
              name === '@types/packageWithOldTypings' ? '0.0.1' : '1.0.0',
            containsInternalTypings: name === 'packageWithInternalTypings',
          },
        ],
      }
      return info
    }),
  }

  const configService: IConfigService = {
    readConfig: jest.fn(async (filePath: string) => {
      switch (filePath) {
        case 'package.json':
          return {}
        case 'package-ignore-dev.json':
        case 'package-ignore-dev-synced.json':
          return { ignoreDeps: [IDependencySection.dev] }
        case 'package-ignore-package1.json':
          return { ignorePackages: ['package1'] }
        default:
          return {}
      }
    }),
  }

  return {
    packageService,
    rootPackageFile,
    packageSource,
    configService,
    syncer: createTypeSyncer(
      packageService,
      packageSource,
      configService,
      globber,
    ),
  }
}

describe('type syncer', () => {
  it('adds new packages to package.json', async () => {
    const { syncer, packageService } = buildSyncer()
    const result = await syncer.sync('package.json', {})
    const writtenPackage = (
      packageService.writePackageFile as jest.Mock<any>
    ).mock.calls.find((c) => c[0] === 'package.json')[1] as IPackageFile
    expect(writtenPackage.devDependencies).toEqual({
      '@types/package1': '~1.0.0',
      '@types/package3': '~1.0.0',
      '@types/package4': '^1.0.0',
      '@types/package5': '~1.0.0',
      '@types/myorg__package7': '~1.0.0',
      '@types/package8': '~1.0.0',
      '@types/package9': '~1.0.0',
      '@types/packageWithOldTypings': '~2.0.0',
      package4: '^1.0.0',
      package5: '^1.0.0',
    })
    expect(result.syncedFiles).toHaveLength(3)

    expect(result.syncedFiles[0].filePath).toEqual('package.json')
    expect(
      result.syncedFiles[0].newTypings.map((x) => x.typingsName).sort(),
    ).toEqual([
      'myorg__package7',
      'package1',
      'package3',
      'package5',
      'package8',
      'package9',
      'packageWithOldTypings',
    ])

    expect(result.syncedFiles[1].filePath).toEqual(
      'packages/package-1/package.json',
    )
    expect(
      result.syncedFiles[1].newTypings.map((x) => x.typingsName).sort(),
    ).toEqual(['package1'])

    expect(result.syncedFiles[2].filePath).toEqual(
      'packages/package-2/package.json',
    )
    expect(
      result.syncedFiles[2].newTypings.map((x) => x.typingsName).sort(),
    ).toEqual(['package3'])
  })

  it('ignores deps when asked to', async () => {
    const { syncer, packageService } = buildSyncer()
    await syncer.sync('package-ignore-dev.json', {})
    const writtenPackage = (
      packageService.writePackageFile as jest.Mock<any>
    ).mock.calls.find(
      (c) => c[0] === 'package-ignore-dev.json',
    )[1] as IPackageFile
    expect(writtenPackage.devDependencies).toEqual({
      '@types/package1': '~1.0.0',
      '@types/package3': '~1.0.0',
      // Package 4's typings were already in the root package's `devDependencies`,
      // but package 5's were not, that's why we still write package4's typings but not
      // package 5's.
      '@types/package4': '^1.0.0',
      '@types/myorg__package7': '~1.0.0',
      '@types/package8': '~1.0.0',
      '@types/package9': '~1.0.0',
      '@types/packageWithOldTypings': '~2.0.0',
      package4: '^1.0.0',
      package5: '^1.0.0',
    })
  })

  it('ignores packages when asked to', async () => {
    const { syncer, packageService } = buildSyncer()
    await syncer.sync('package-ignore-package1.json', {})
    const writtenPackage = (
      packageService.writePackageFile as jest.Mock<any>
    ).mock.calls.find(
      (c) => c[0] === 'package-ignore-package1.json',
    )[1] as IPackageFile
    expect(writtenPackage.devDependencies).toEqual({
      '@types/package3': '~1.0.0',
      '@types/package4': '^1.0.0',
      '@types/package5': '~1.0.0',
      '@types/myorg__package7': '~1.0.0',
      '@types/package8': '~1.0.0',
      '@types/package9': '~1.0.0',
      '@types/packageWithOldTypings': '~2.0.0',
      package4: '^1.0.0',
      package5: '^1.0.0',
    })
  })

  it('does not write packages if options.dry is specified', async () => {
    const { syncer, packageService } = buildSyncer()
    await syncer.sync('package.json', { dry: true })
    expect(
      packageService.writePackageFile as jest.Mock<any>,
    ).not.toHaveBeenCalled()
  })

  it('does not detect diff when already synced', async () => {
    const { syncer } = buildSyncer()
    const { syncedFiles } = await syncer.sync(
      'package-ignore-dev-synced.json',
      {},
    )
    const root = syncedFiles[0]
    expect(root.newTypings).toEqual([])
  })
})
