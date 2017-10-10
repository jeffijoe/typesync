import {
  IPackageJSONService,
  ITypeDefinition,
  ITypeDefinitionSource,
  IPackageFile
} from './types'

const typedefs: ITypeDefinition[] = [
  {
    typingsName: 'package1'
  },
  {
    typingsName: 'package2'
  },
  {
    typingsName: 'packagethree'
  },
  {
    typingsName: 'package4'
  },
  {
    typingsName: 'package5'
  }
]

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
  }
}

function delay(ms: number): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

export function fakePackageService(): IPackageJSONService {
  return {
    readPackageFile: () => delay(10).then(() => packageFile),
    writePackageFile: () => delay(10)
  }
}

export function fakeTypeDefSource(): ITypeDefinitionSource {
  return {
    fetch: () => delay(4000).then(() => typedefs),
    getLatestTypingsVersion: () => delay(600).then(() => '1.0.0')
  }
}
