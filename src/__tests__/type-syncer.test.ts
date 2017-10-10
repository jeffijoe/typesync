import {
  ITypeDefinitionSource,
  IPackageJSONService,
  ITypeSyncer,
  ITypeDefinition,
  IPackageFile
} from '../types'
import { createTypeSyncer } from '../type-syncer'

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
    typingsName: 'package4'
  },
  {
    typingsName: 'package5'
  },
  // None for package6
  {
    typingsName: 'myorg__package7'
  }
]

function buildSyncer() {
  const typedefSource: ITypeDefinitionSource = {
    fetch: jest.fn(() => Promise.resolve(typedefs)),
    getLatestTypingsVersion: jest.fn(() => Promise.resolve('1.0.0'))
  }
  const packageService: IPackageJSONService = {
    readPackageFile: jest.fn(() => Promise.resolve(packageFile)),
    writePackageFile: jest.fn(() => Promise.resolve())
  }
  const packageFile: IPackageFile = {
    name: 'consumer',
    dependencies: {
      package1: '^1.0.0',
      package3: '^1.0.0'
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
      '@myorg/package7': '^1.0.0'
    }
  }

  return {
    typedefSource,
    packageService,
    packageFile,
    syncer: createTypeSyncer(packageService, typedefSource)
  }
}

describe('type syncer', () => {
  it('adds new packages to the package.json', async () => {
    const { syncer, packageService, typedefSource } = buildSyncer()
    const result = await syncer.sync('package.json')
    const writtenPackage = (packageService.writePackageFile as jest.Mock<any>)
      .mock.calls[0][1] as IPackageFile
    expect(writtenPackage.devDependencies).toEqual({
      '@types/package1': '^1.0.0',
      '@types/package3': '^1.0.0',
      '@types/package4': '^1.0.0',
      '@types/package5': '^1.0.0',
      '@types/myorg__package7': '^1.0.0',
      package4: '^1.0.0',
      package5: '^1.0.0'
    })
    expect(result.newTypings.map(x => x.typingsName).sort()).toEqual([
      'myorg__package7',
      'package1',
      'package3',
      'package5'
    ])
  })

  it('does not write packages if options.dry is specified', async () => {
    const { syncer, packageService, typedefSource } = buildSyncer()
    const result = await syncer.sync('package.json', { dry: true })
    expect(packageService.writePackageFile as jest.Mock<any>).not.toBeCalled()
  })
})
