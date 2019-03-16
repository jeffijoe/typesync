import {
  ITypeSyncer,
  IPackageJSONService,
  ITypeDefinitionSource,
  ITypeDefinition,
  IPackageFile,
  ISyncOptions,
  IDependenciesSection,
  IPackageVersion,
  ISyncResult,
  ISyncedFile,
  IPackageSource,
  IPackageInfo
} from './types'
import {
  filterMap,
  mergeObjects,
  typed,
  orderObject,
  uniq,
  flatten,
  memoizeAsync,
  ensureWorkspacesArray
} from './util'
import { IGlobber } from './globber'
import { satisfies } from 'semver'

/**
 * Creates a type syncer.
 *
 * @param packageJSONservice
 * @param typeDefinitionSource
 */
export function createTypeSyncer(
  packageJSONService: IPackageJSONService,
  typeDefinitionSource: ITypeDefinitionSource,
  packageSource: IPackageSource,
  globber: IGlobber
): ITypeSyncer {
  const fetchPackageInfo = memoizeAsync(packageSource.fetch)

  return {
    sync
  }

  /**
   * Syncs typings in the specified package.json.
   */
  async function sync(
    filePath: string,
    opts: ISyncOptions = { dry: false }
  ): Promise<ISyncResult> {
    const [file, allTypings] = await Promise.all([
      packageJSONService.readPackageFile(filePath),
      typeDefinitionSource.fetch()
    ])

    const subPackages = await Promise.all(
      [
        ...ensureWorkspacesArray(file.packages),
        ...ensureWorkspacesArray(file.workspaces)
      ].map(globber.globPackageFiles)
    )
      .then(flatten)
      .then(uniq)

    const syncedFiles: Array<ISyncedFile> = await Promise.all([
      syncFile(filePath, file, allTypings, opts),
      ...subPackages.map(p => syncFile(p, null, allTypings, opts))
    ])

    return {
      syncedFiles
    }
  }

  /**
   * Syncs a single file.
   *
   * @param filePath
   * @param file
   * @param allTypings
   * @param opts
   */
  async function syncFile(
    filePath: string,
    file: IPackageFile | null,
    allTypings: Array<ITypeDefinition>,
    opts: ISyncOptions
  ): Promise<ISyncedFile> {
    file = file || (await packageJSONService.readPackageFile(filePath))
    const allPackages = [
      ...getPackagesFromSection(file.dependencies),
      ...getPackagesFromSection(file.devDependencies),
      ...getPackagesFromSection(file.optionalDependencies),
      ...getPackagesFromSection(file.peerDependencies)
    ]
    const allPackageNames = uniq(allPackages.map(p => p.name))

    const newTypings = filterNewTypings(allPackageNames, allTypings)
    // This is pushed to in the inner `map`, because packages that have DT-typings
    // *as well* as internal typings should be exclused.
    const used: Array<ReturnType<typeof filterNewTypings>[0]> = []
    const devDepsToAdd = await Promise.all(
      newTypings.map(async t => {
        // Fetch the code package from the source.
        const typePackageInfoPromise = fetchPackageInfo(typed(t.typingsName))
        const codePackageInfo = await fetchPackageInfo(t.codePackageName)
        const codePackage = allPackages.find(p => p.name === t.codePackageName)!

        // Find the closest matching code package version relative to what's in our package.json
        const closestMatchingCodeVersion = getClosestMatchingVersion(
          codePackageInfo,
          codePackage.version
        )

        // If the closest matching version contains internal typings, don't include it.
        if (closestMatchingCodeVersion.containsInternalTypings) {
          return {}
        }

        // Look for the closest matching typings package.
        const typePackageInfo = await typePackageInfoPromise
        // Gets the closest matching typings version, or the newest one.
        const closestMatchingTypingsVersion = getClosestMatchingVersion(
          typePackageInfo,
          codePackage.version
        )

        const version = closestMatchingTypingsVersion.version
        const semverRangeSpecifier = getSemverRangeSpecifier(
          codePackage.version
        )

        used.push(t)
        return {
          [typed(t.typingsName)]: semverRangeSpecifier + version
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
      filePath,
      newTypings: used,
      package: file
    }
  }
}

/**
 * Gets the closest matching package version info.
 *
 * @param packageInfo
 * @param version
 */
function getClosestMatchingVersion(packageInfo: IPackageInfo, version: string) {
  return (
    packageInfo.versions.find(v => satisfies(v.version, version)) ||
    packageInfo.versions[0]
  )
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
    let typingsName = p
    if (scopeInfo && scopeInfo[0] !== 'types') {
      typingsName = `${scopeInfo[0]}__${scopeInfo[1]}`
    }

    const typingsForPackage = allTypings.find(
      x => x.typingsName === typingsName
    )
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
