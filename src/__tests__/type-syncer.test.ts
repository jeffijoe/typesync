import {
  ITypeDefinitionSource,
  IPackageJSONService,
  ITypeDefinition,
  IPackageFile,
  IPackageSource,
  IPackageInfo,
  IConfigService,
  ISyncOptions,
} from '../types'
import { createTypeSyncer } from '../type-syncer'
import { IGlobber } from '../globber'

const typedefs: ITypeDefinition[] = [
  {
    typingsName: 'package1',
    isGlobal: false,
  },
  {
    typingsName: 'package2',
    isGlobal: false,
  },
  {
    typingsName: 'package3',
    isGlobal: false,
  },
  {
    typingsName: 'packageWithInternalTypings',
    isGlobal: false,
  },
  {
    typingsName: 'package4',
    isGlobal: false,
  },
  {
    typingsName: 'package5',
    isGlobal: false,
  },
  // None for package6
  {
    typingsName: 'myorg__package7',
    isGlobal: false,
  },
  {
    typingsName: 'package8',
    isGlobal: false,
  },
  {
    typingsName: 'package9',
    isGlobal: false,
  },
  {
    typingsName: 'packageWithOldTypings',
    isGlobal: false,
  },
  {
    typingsName: 'scoped__unused',
    isGlobal: false,
  },
  {
    typingsName: 'unused',
    isGlobal: false,
  },
  {
    typingsName: 'unused-global',
    isGlobal: true,
  },
  {
    typingsName: 'scoped__unused-global',
    isGlobal: true,
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
    },
    devDependencies: {
      '@types/package4': '^1.0.0',
      '@types/unused': '^1.0.0',
      '@types/scoped__unused': '^1.0.0',
      '@types/unused-global': '^1.0.0',
      '@types/scoped__unused-global': '^1.0.0',
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

  const typedefSource: ITypeDefinitionSource = {
    fetch: jest.fn(() => Promise.resolve(typedefs)),
  }
  const packageService: IPackageJSONService = {
    readPackageFile: jest.fn(async (filepath: string) => {
      switch (filepath) {
        case 'package.json':
        case 'package-ignore-dev.json':
        case 'package-ignore-package1.json':
          return rootPackageFile
        case 'packages/package-1/package.json':
          return package1File
        case 'packages/package-2/package.json':
          return package2File
        default:
          throw new Error('What?!')
      }
    }),
    writePackageFile: jest.fn(() => Promise.resolve()),
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
      return {
        name,
        latestVersion: '2.0.0',
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
      } as IPackageInfo
    }),
  }

  const configService: IConfigService = {
    readConfig: jest.fn(async (filePath: string) => {
      switch (filePath) {
        case 'package.json':
          return {}
        case 'package-ignore-dev.json':
          return { ignoreDeps: ['dev'] } as ISyncOptions
        case 'package-ignore-package1.json':
          return { ignorePackages: ['package1'] }
        default:
          return {}
      }
    }),
  }

  return {
    typedefSource,
    packageService,
    rootPackageFile,
    packageSource,
    configService,
    syncer: createTypeSyncer(
      packageService,
      typedefSource,
      packageSource,
      configService,
      globber
    ),
  }
}

describe('type syncer', () => {
  it('adds new packages to package.json and removes unused typings that are not global', async () => {
    const { syncer, packageService } = buildSyncer()
    const result = await syncer.sync('package.json', {})
    const writtenPackage = (
      packageService.writePackageFile as jest.Mock<any>
    ).mock.calls.find((c) => c[0] === 'package.json')[1] as IPackageFile
    expect(writtenPackage.devDependencies).toEqual({
      '@types/package1': '^1.0.0',
      '@types/package3': '^1.0.0',
      '@types/package4': '^1.0.0',
      '@types/package5': '^1.0.0',
      '@types/myorg__package7': '^1.0.0',
      '@types/package8': '~1.0.0',
      '@types/package9': '1.0.0',
      '@types/packageWithOldTypings': '^2.0.0',
      '@types/unused-global': '^1.0.0',
      '@types/scoped__unused-global': '^1.0.0',
      package4: '^1.0.0',
      package5: '^1.0.0',
    })
    expect(result.syncedFiles).toHaveLength(3)

    expect(result.syncedFiles[0].filePath).toEqual('package.json')
    expect(
      result.syncedFiles[0].newTypings.map((x) => x.typingsName).sort()
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
      'packages/package-1/package.json'
    )
    expect(
      result.syncedFiles[1].newTypings.map((x) => x.typingsName).sort()
    ).toEqual(['package1'])

    expect(result.syncedFiles[2].filePath).toEqual(
      'packages/package-2/package.json'
    )
    expect(
      result.syncedFiles[2].newTypings.map((x) => x.typingsName).sort()
    ).toEqual(['package3'])
  })

  it('ignores deps when asked to', async () => {
    const { syncer, packageService } = buildSyncer()
    await syncer.sync('package-ignore-dev.json', {})
    const writtenPackage = (
      packageService.writePackageFile as jest.Mock<any>
    ).mock.calls.find(
      (c) => c[0] === 'package-ignore-dev.json'
    )[1] as IPackageFile
    expect(writtenPackage.devDependencies).toEqual({
      '@types/package1': '^1.0.0',
      '@types/package3': '^1.0.0',
      '@types/myorg__package7': '^1.0.0',
      '@types/package8': '~1.0.0',
      '@types/package9': '1.0.0',
      '@types/packageWithOldTypings': '^2.0.0',
      '@types/unused-global': '^1.0.0',
      '@types/scoped__unused-global': '^1.0.0',
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
      (c) => c[0] === 'package-ignore-package1.json'
    )[1] as IPackageFile
    expect(writtenPackage.devDependencies).toEqual({
      '@types/package3': '^1.0.0',
      '@types/package4': '^1.0.0',
      '@types/package5': '^1.0.0',
      '@types/myorg__package7': '^1.0.0',
      '@types/package8': '~1.0.0',
      '@types/package9': '1.0.0',
      '@types/packageWithOldTypings': '^2.0.0',
      '@types/unused-global': '^1.0.0',
      '@types/scoped__unused-global': '^1.0.0',
      package4: '^1.0.0',
      package5: '^1.0.0',
    })
  })

  it('does not write packages if options.dry is specified', async () => {
    const { syncer, packageService } = buildSyncer()
    await syncer.sync('package.json', { dry: true })
    expect(packageService.writePackageFile as jest.Mock<any>).not.toBeCalled()
  })
})
