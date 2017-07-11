import {
  ITypeSyncer,
  ISyncResult,
  IPackageJSONService,
  ITypeDefinitionSource,
  ITypeDefinition
} from './types'
import { uniq, filterMap, mergeObjects } from './util'

/**
 * Creates a type syncer.
 *
 * @param packageJSONservice
 * @param typeDefinitionSource
 */
export function createTypeSyncer (
  packageJSONservice: IPackageJSONService,
  typeDefinitionSource: ITypeDefinitionSource
): ITypeSyncer {
  return {
    /**
     * Syncs typings in the specified package.json.
     */
    sync: async (filePath) => {
      const [file, allTypings] = await Promise.all([
        packageJSONservice.readPackageFile(filePath),
        typeDefinitionSource.fetch()
      ])

      const allPackageNames = uniq([
        ...file.dependencies && Object.keys(file.dependencies) || [],
        ...file.devDependencies && Object.keys(file.devDependencies) || []
      ])

      const newTypings = filterNewTypings(allPackageNames, allTypings)

      const devDepsToAdd = await Promise.all(
        newTypings.map(async t => {
          const latestVersion = await typeDefinitionSource.getLatestTypingsVersion(t.typingsName)
          return { [typed(t.typingsName)]: `^${latestVersion}` }
        })
      )
        .then(mergeObjects)

      await packageJSONservice.writePackageFile(filePath, {
        ...file,
        devDependencies: {
          ...file.devDependencies,
          ...devDepsToAdd
        }
      })

      return {
        newTypings
      }
    }
  }
}

/**
 * Returns an array of new typings.
 *
 * @param allPackageNames Used to filter the typings that are new.
 * @param allTypings All typings available
 */
function filterNewTypings (
  allPackageNames: Array<string>,
  allTypings: Array<ITypeDefinition>
): Array<ITypeDefinition> {
  const existingTypings = allPackageNames.filter(x => x.startsWith('@types/'))
  return filterMap(allPackageNames, p => {
    const typingsForPackage = allTypings.find(x => x.packageName === p)
    if (!typingsForPackage) {
      // No typings available.
      return false
    }

    const fullTypingsPackage = typed(typingsForPackage.typingsName)
    const alreadyHasTyping = existingTypings.some(t => t === fullTypingsPackage)
    if (alreadyHasTyping) {
      return false
    }

    return typingsForPackage
  })
}

/**
 * Returns the assumed types package name.
 * @param name Package name
 */
function typed (name: string): string {
  return `@types/${name}`
}
