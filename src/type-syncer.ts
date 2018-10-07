import {
  ITypeSyncer,
  IPackageJSONService,
  ITypeDefinitionSource,
  ITypeDefinition,
  IPackageFile,
  ISyncOptions,
  IDependenciesSection,
  IPackageVersion
} from './types'
import { filterMap, mergeObjects, typed, orderObject, uniq } from './util'

/**
 * Creates a type syncer.
 *
 * @param packageJSONservice
 * @param typeDefinitionSource
 */
export function createTypeSyncer(
  packageJSONService: IPackageJSONService,
  typeDefinitionSource: ITypeDefinitionSource
): ITypeSyncer {
  return {
    /**
     * Syncs typings in the specified package.json.
     */
    sync: async (filePath, opts: ISyncOptions = { dry: false }) => {
      const [file, allTypings] = await Promise.all([
        packageJSONService.readPackageFile(filePath),
        typeDefinitionSource.fetch()
      ])

      const allPackages = [
        ...getPackagesFromSection(file.dependencies),
        ...getPackagesFromSection(file.devDependencies),
        ...getPackagesFromSection(file.optionalDependencies),
        ...getPackagesFromSection(file.peerDependencies)
      ]
      const allPackageNames = uniq(allPackages.map(p => p.name))

      const newTypings = filterNewTypings(allPackageNames, allTypings)
      const devDepsToAdd = await Promise.all(
        newTypings.map(async t => {
          const latestVersion = await typeDefinitionSource.getLatestTypingsVersion(
            t.typingsName
          )
          const codePackage = allPackages.find(
            p => p.name === t.codePackageName
          )
          const semverRangeSpecifier = codePackage
            ? getSemverRangeSpecifier(codePackage.version)
            : '^'
          return {
            [typed(t.typingsName)]: semverRangeSpecifier + latestVersion
          }
        })
      ).then(mergeObjects)

      if (!opts.dry) {
        await packageJSONService.writePackageFile(filePath, {
          ...file,
          devDependencies: orderObject({
            ...devDepsToAdd,
            ...file.devDependencies
          })
        } as IPackageFile)
      }

      return {
        newTypings
      }
    }
  }
}

/**
 * Returns an array of new typings as well as the code package name that was matched to it.
 *
 * @param allPackageNames Used to filter the typings that are new.
 * @param allTypings All typings available
 */
function filterNewTypings(
  allPackageNames: Array<string>,
  allTypings: Array<ITypeDefinition>
): Array<ITypeDefinition & { codePackageName: string }> {
  const existingTypings = allPackageNames.filter(x => x.startsWith('@types/'))
  return filterMap(allPackageNames, p => {
    const scopeInfo = getPackageScope(p)
    if (scopeInfo && scopeInfo[0] !== 'types') {
      p = `${scopeInfo[0]}__${scopeInfo[1]}`
    }

    const typingsForPackage = allTypings.find(x => x.typingsName === p)
    if (!typingsForPackage) {
      // No typings available.
      return false
    }

    const fullTypingsPackage = typed(typingsForPackage.typingsName)
    const alreadyHasTyping = existingTypings.some(t => t === fullTypingsPackage)
    if (alreadyHasTyping) {
      return false
    }

    return {
      ...typingsForPackage,
      codePackageName: p
    }
  })
}

/**
 * If a package is scoped, returns the scope + package as a tuple, otherwise null.
 *
 * @param packageName Package name to check scope for.
 */
function getPackageScope(packageName: string): [string, string] | null {
  const EXPR = /^\@([^\/]+)\/(.*)$/i
  const matches = EXPR.exec(packageName)
  if (!matches) {
    return null
  }

  return [matches[1], matches[2]]
}

/**
 * Gets packages from a dependencies section.
 *
 * @param section
 */
function getPackagesFromSection(
  section?: IDependenciesSection
): Array<IPackageVersion> {
  /* istanbul ignore next */
  if (!section) {
    return []
  }

  const result: Array<IPackageVersion> = []
  for (const name in section) {
    result.push({
      name,
      version: section[name]
    })
  }

  return result
}

const CARET = '^'.charCodeAt(0)
const TILDE = '~'.charCodeAt(0)

/**
 * Gets the semver range specifier (~, ^)
 * @param version
 */
function getSemverRangeSpecifier(version: string): string {
  if (version.charCodeAt(0) === CARET) {
    return '^'
  }

  if (version.charCodeAt(0) === TILDE) {
    return '~'
  }

  return ''
}
