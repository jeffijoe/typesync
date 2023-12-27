import path from 'path'
import { cosmiconfig } from 'cosmiconfig'
import {
  IConfigService,
  ISyncOptions,
  IDependencySection,
  ICLIArguments,
} from './types'
import { shrinkObject } from './util'

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
  ): T[] | undefined => {
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
  }
}

function isIgnoreDepConfigValue(value: string): value is IDependencySection {
  return Object.keys(IDependencySection).includes(value)
}
