import * as path from 'node:path'
import { defaultLoaders, lilconfig } from 'lilconfig'
import {
  type ICLIArguments,
  IDependencySection,
  type ISyncOptions,
} from './types'
import { shrinkObject } from './util'
import * as yaml from 'yaml'

/**
 * Config Service.
 */
export interface IConfigService {
  /**
   * Get typesync config.
   */
  readConfig(
    this: void,
    filePath: string,
    flags: ICLIArguments['flags'],
  ): Promise<ISyncOptions>
}

async function loadYaml(_filepath: string, content: string): Promise<unknown> {
  return await yaml.parse(content)
}

// Based on Cosmiconfig readme.
function searchPlaces(moduleName: string) {
  const rcs = [
    `.${moduleName}rc`,
    `.${moduleName}rc.json`,
    `.${moduleName}rc.yaml`,
    `.${moduleName}rc.yml`,
    `.${moduleName}rc.js`,
    `.${moduleName}rc.mjs`,
    `.${moduleName}rc.cjs`,
  ]

  return [
    'package.json',
    ...rcs,
    ...rcs.map((rc) => `.config/${rc}`),
    `${moduleName}.config.js`,
    `${moduleName}.config.mjs`,
    `${moduleName}.config.cjs`,
  ]
}

const explorer = lilconfig('typesync', {
  searchPlaces: searchPlaces('typesync'),
  loaders: {
    ...defaultLoaders,
    '.yml': loadYaml,
    '.yaml': loadYaml,
    noExt: loadYaml,
  },
})

export function createConfigService(): IConfigService {
  return {
    readConfig: async (filePath: string, flags: ICLIArguments['flags']) => {
      const fileConfig: ISyncOptions = await explorer
        .search(path.dirname(filePath))
        .then((result) => /* v8 ignore next */ result?.config ?? {})

      const cliConfig = readCliConfig(flags)

      return { ...shrinkObject(fileConfig), ...shrinkObject(cliConfig) }
    },
  }
}

function readCliConfig(flags: ICLIArguments['flags']): ISyncOptions {
  const readValues = <T extends string>(
    key: string,
    validator?: (value: string) => boolean,
  ): Array<T> | undefined => {
    const values = flags[key]
    return typeof values === 'string'
      ? values
          .split(',')
          .filter((value): value is T => (validator ? validator(value) : true))
      : undefined
  }

  return {
    ignoreDeps: readValues('ignoredeps', isIgnoreDepConfigValue),
    ignorePackages: readValues('ignorepackages'),
    ignoreProjects: readValues('ignoreprojects'),
  }
}

function isIgnoreDepConfigValue(value: string): value is IDependencySection {
  return Object.keys(IDependencySection).includes(value)
}
