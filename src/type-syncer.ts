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
  IPackageInfo,
  ISyncedTypeDefinition,
  IConfigService,
  IDependencySection,
  ICLIArguments,
} from './types'
import {
  filterMap,
  mergeObjects,
  typed,
  orderObject,
  uniq,
  flatten,
  memoizeAsync,
  ensureWorkspacesArray,
  untyped,
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
  configService: IConfigService,
  globber: IGlobber
): ITypeSyncer {
  const fetchPackageInfo = memoizeAsync(packageSource.fetch)

  return {
    sync,
  }

  /**
   * Syncs typings in the specified package.json.
   */
  async function sync(
    filePath: string,
    flags: ICLIArguments['flags']
  ): Promise<ISyncResult> {
    const dryRun = !!flags.dry
    const [file, allTypings, syncOpts] = await Promise.all([
      packageJSONService.readPackageFile(filePath),
      typeDefinitionSource.fetch(),
      configService.readConfig(filePath, flags),
    ])

    const subPackages = await Promise.all(
      [
        ...ensureWorkspacesArray(file.packages),
        ...ensureWorkspacesArray(file.workspaces),
      ].map(globber.globPackageFiles)
    )
      .then(flatten)
      .then(uniq)

    const syncedFiles: Array<ISyncedFile> = await Promise.all([
      syncFile(filePath, file, allTypings, syncOpts, dryRun),
      ...subPackages.map((p) =>
        syncFile(p, null, allTypings, syncOpts, dryRun)
      ),
    ])

    return {
      syncedFiles,
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
    opts: ISyncOptions,
    dryRun: boolean
  ): Promise<ISyncedFile> {
    const { ignoreDeps, ignorePackages } = opts

    const packageFile =
      file || (await packageJSONService.readPackageFile(filePath))
    const allPackages = flatten(
      filterMap(Object.values(IDependencySection), (dep) => {
        if (ignoreDeps?.includes(dep)) {
          return false
        }
        const section = getDependenciesBySection(packageFile, dep)
        return getPackagesFromSection(section, ignorePackages)
      })
    )
    const allPackageNames = uniq(allPackages.map((p) => p.name))

    const newTypings = filterNewTypings(allPackageNames, allTypings)
    // This is pushed to in the inner `map`, because packages that have DT-typings
    // *as well* as internal typings should be exclused.
    const used: Array<ReturnType<typeof filterNewTypings>[0]> = []
    const devDepsToAdd = await Promise.all(
      newTypings.map(async (t) => {
        // Fetch the code package from the source.
        const typePackageInfoPromise = fetchPackageInfo(typed(t.typingsName))
        const codePackageInfo = await fetchPackageInfo(t.codePackageName)
        const codePackage = allPackages.find(
          (p) => p.name === t.codePackageName
        )!

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
          [typed(t.typingsName)]: semverRangeSpecifier + version,
        }
      })
    ).then(mergeObjects)
    const devDeps = packageFile.devDependencies || /* istanbul ignore next */ {}
    const unused = getUnusedTypings(allPackageNames, devDeps, allTypings)
    if (!dryRun) {
      await packageJSONService.writePackageFile(filePath, {
        ...packageFile,
        devDependencies: orderObject({
          ...devDepsToAdd,
          ...removeUnusedTypings(devDeps, unused),
        }),
      } as IPackageFile)
    }

    return {
      filePath,
      newTypings: used,
      removedTypings: unused,
      package: packageFile,
    }
  }
}

/**
 * Removes unused typings from the devDependencies section.
 *
 * @param allPackageNames
 * @param devDependencies
 */
function removeUnusedTypings(
  devDependencies: IDependenciesSection,
  unusedTypings: Array<ISyncedTypeDefinition & { typingsPackageName: string }>
): IDependenciesSection {
  const result: IDependenciesSection = {}
  for (let packageName in devDependencies) {
    const version = devDependencies[packageName]
    if (unusedTypings.some((t) => t.typingsPackageName === packageName)) {
      continue
    }
    result[packageName] = version
  }
  return result
}

/**
 * Removes unused typings from the devDependencies section.
 *
 * @param allPackageNames
 * @param devDependencies
 */
function getUnusedTypings(
  allPackageNames: string[],
  devDependencies: IDependenciesSection,
  allTypings: Array<ITypeDefinition>
) {
  const result: Array<
    ISyncedTypeDefinition & { typingsPackageName: string }
  > = []
  for (let packageName in devDependencies) {
    if (packageName.startsWith('@types/')) {
      const codePackageName = untyped(packageName)
      // Make sure the corresponding code package is in `allPackages`.
      const hasCodePackageForTyping = allPackageNames.some(
        (p) => p === codePackageName
      )
      if (!hasCodePackageForTyping) {
        const typingsNameForCodePackage = getTypingsName(codePackageName)
        const typeDef = allTypings.find(
          (t) => t.typingsName === typingsNameForCodePackage
        )

        if (typeDef && !typeDef.isGlobal) {
          result.push({
            codePackageName,
            typingsPackageName: packageName,
            ...typeDef,
          })
        }
      }
    }
  }
  return result
}

/**
 * Gets the closest matching package version info.
 *
 * @param packageInfo
 * @param version
 */
function getClosestMatchingVersion(packageInfo: IPackageInfo, version: string) {
  return (
    packageInfo.versions.find((v) => satisfies(v.version, version)) ||
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
  const existingTypings = allPackageNames.filter((x) => x.startsWith('@types/'))
  return filterMap(allPackageNames, (p) => {
    let typingsName = getTypingsName(p)

    const typingsForPackage = allTypings.find(
      (x) => x.typingsName === typingsName
    )
    if (!typingsForPackage) {
      // No typings available.
      return false
    }

    const fullTypingsPackage = typed(typingsForPackage.typingsName)
    const alreadyHasTyping = existingTypings.some(
      (t) => t === fullTypingsPackage
    )
    if (alreadyHasTyping) {
      return false
    }

    return {
      ...typingsForPackage,
      codePackageName: p,
    }
  })
}

/**
 * Gets the typings name for the specified package name.
 * For example, `koa` would be `koa`, but `@koa/router` would be `koa__router`.
 *
 * @param packageName the package name to generate the typings name for
 */
function getTypingsName(packageName: string) {
  const scopeInfo = getPackageScope(packageName)
  let typingsName = packageName
  if (scopeInfo && scopeInfo[0] !== 'types') {
    typingsName = `${scopeInfo[0]}__${scopeInfo[1]}`
  }
  return typingsName
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
 * Get packages from a dependency section
 *
 * @param section
 * @param ignorePackages
 */
function getPackagesFromSection(
  section: IDependenciesSection,
  ignorePackages?: string[]
): IPackageVersion[] {
  return filterMap(Object.keys(section), (name) => {
    if (ignorePackages?.includes(name)) {
      return false
    }

    return { name, version: section[name] }
  })
}

/**
 * Get dependencies from a package section
 *
 * @param file Package file
 * @param section Package section, eg: dev, peer
 */
function getDependenciesBySection(
  file: IPackageFile,
  section: IDependencySection
): IDependenciesSection {
  const dependenciesSection = (() => {
    switch (section) {
      case IDependencySection.deps:
        return file.dependencies
      case IDependencySection.dev:
        return file.devDependencies
      case IDependencySection.optional:
        return file.optionalDependencies
      case IDependencySection.peer:
        return file.peerDependencies
    }
  })()
  return dependenciesSection ?? {}
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
