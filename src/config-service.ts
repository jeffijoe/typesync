import * as path from 'node:path'
import { cosmiconfig } from 'cosmiconfig'
import {
  type ICLIArguments,
  IDependencySection,
  type ISyncOptions,
} from './types'
import { shrinkObject } from './util'

/**
 * Config Service.
 */
export interface IConfigService {
  /**
   * Get typesync config.
   */
  readConfig(
    filePath: string,
    flags: ICLIArguments['flags'],
  ): Promise<ISyncOptions>
}

const explorer = cosmiconfig('typesync')

export function createConfigService(): IConfigService {
  return {
    readConfig: async (filePath: string, flags: ICLIArguments['flags']) => {
      const fileConfig: ISyncOptions = await explorer
        .search(path.dirname(filePath))
        .then(/* istanbul ignore next */ (result) => result?.config ?? {})

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
