import {
  ITypeDefinitionSource,
  IPackageJSONService,
  ITypeDefinition,
  IPackageFile,
  IPackageSource,
  IPackageInfo
} from '../types'
import { createTypeSyncer } from '../type-syncer'
import { IGlobber } from '../globber'
import { typed } from '../util'

const typedefs: ITypeDefinition[] = [
  {
    typingsName: 'package1'
  },
  {
    typingsName: 'package2'
  },
  {
    typingsName: 'package3'
  },
  {
    typingsName: 'packageWithInternalTypings'
  },
  {
    typingsName: 'package4'
  },
  {
    typingsName: 'package5'
  },
  // None for package6
  {
    typingsName: 'myorg__package7'
  },
  {
    typingsName: 'package8'
  },
  {
    typingsName: 'package9'
  },
  {
    typingsName: 'packageWithOldTypings'
  }
]

function buildSyncer() {
  const rootPackageFile: IPackageFile = {
    name: 'consumer',
    dependencies: {
      package1: '^1.0.0',
      package3: '^1.0.0',
      packageWithInternalTypings: '^1.0.0',
      packageWithOldTypings: '^1.0.0'
    },
    devDependencies: {
      '@types/package4': '^1.0.0',
      package4: '^1.0.0',
      package5: '^1.0.0'
    },
    optionalDependencies: {
      package6: '^1.0.0'
    },
    peerDependencies: {
      '@myorg/package7': '^1.0.0',
      package8: '~1.0.0',
      package9: '1.0.0'
    },
    packages: ['packages/*'],
    workspaces: ['packages/*']
  }

  const package1File: IPackageFile = {
    name: 'package-1',
    dependencies: {
      package1: '^1.0.0'
    }
  }

  const package2File: IPackageFile = {
    name: 'package-1',
    dependencies: {
      package3: '^1.0.0'
    }
  }

  const typedefSource: ITypeDefinitionSource = {
    fetch: jest.fn(() => Promise.resolve(typedefs))
  }
  const packageService: IPackageJSONService = {
    readPackageFile: jest.fn(async (filepath: string) => {
      switch (filepath) {
        case 'package.json':
          return rootPackageFile
        case 'packages/package-1/package.json':
          return package1File
        case 'packages/package-2/package.json':
          return package2File
        default:
          throw new Error('What?!')
      }
    }),
    writePackageFile: jest.fn(() => Promise.resolve())
  }

  const globber: IGlobber = {
    globPackageFiles: jest.fn(async pattern => {
      switch (pattern) {
        case 'packages/*':
          return [
            'packages/package-1/package.json',
            'packages/package-2/package.json'
          ]
        default:
          return []
      }
    })
  }

  const packageSource: IPackageSource = {
    fetch: jest.fn(async name => {
      return {
        name,
        latestVersion: '2.0.0',
        versions: [
          {
            version: '2.0.0',
            containsInternalTypings: false
          },
          {
            version:
              name === '@types/packageWithOldTypings' ? '0.0.1' : '1.0.0',
            containsInternalTypings: name === 'packageWithInternalTypings'
          }
        ]
      } as IPackageInfo
    })
  }

  return {
    typedefSource,
    packageService,
    rootPackageFile,
    packageSource,
    syncer: createTypeSyncer(
      packageService,
      typedefSource,
      packageSource,
      globber
    )
  }
}

describe('type syncer', () => {
  it('adds new packages to the package.json', async () => {
    const { syncer, packageService } = buildSyncer()
    const result = await syncer.sync('package.json')
    const writtenPackage = (packageService.writePackageFile as jest.Mock<
      any
    >).mock.calls.find(c => c[0] === 'package.json')![1] as IPackageFile
    expect(writtenPackage.devDependencies).toEqual({
      '@types/package1': '^1.0.0',
      '@types/package3': '^1.0.0',
      '@types/package4': '^1.0.0',
      '@types/package5': '^1.0.0',
      '@types/myorg__package7': '^1.0.0',
      '@types/package8': '~1.0.0',
      '@types/package9': '1.0.0',
      '@types/packageWithOldTypings': '^2.0.0',
      package4: '^1.0.0',
      package5: '^1.0.0'
    })
    expect(result.syncedFiles).toHaveLength(3)

    expect(result.syncedFiles[0].filePath).toEqual('package.json')
    expect(
      result.syncedFiles[0].newTypings.map(x => x.typingsName).sort()
    ).toEqual([
      'myorg__package7',
      'package1',
      'package3',
      'package5',
      'package8',
      'package9',
      'packageWithOldTypings'
    ])

    expect(result.syncedFiles[1].filePath).toEqual(
      'packages/package-1/package.json'
    )
    expect(
      result.syncedFiles[1].newTypings.map(x => x.typingsName).sort()
    ).toEqual(['package1'])

    expect(result.syncedFiles[2].filePath).toEqual(
      'packages/package-2/package.json'
    )
    expect(
      result.syncedFiles[2].newTypings.map(x => x.typingsName).sort()
    ).toEqual(['package3'])
  })

  it('does not write packages if options.dry is specified', async () => {
    const { syncer, packageService } = buildSyncer()
    await syncer.sync('package.json', { dry: true })
    expect(packageService.writePackageFile as jest.Mock<any>).not.toBeCalled()
  })
})
