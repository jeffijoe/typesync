import * as path from 'node:path'
import type { IConfigService } from './config-service'
import type { IGlobber } from './globber'
import type { IPackageJSONService } from './package-json-file-service'
import type { IPackageSource } from './package-source'
import {
  type ICLIArguments,
  type IDependenciesSection,
  IDependencySection,
  type IPackageFile,
  type IPackageTypingDescriptor,
  type IPackageVersion,
  type ISyncOptions,
  type ISyncResult,
  type ISyncedFile,
  type ITypeSyncer,
} from './types'
import {
  filterMap,
  memoizeAsync,
  mergeObjects,
  orderObject,
  typed,
  uniq,
} from './util'
import { getClosestMatchingVersion } from './versioning'
import type { IWorkspaceResolverService } from './workspace-resolver'

/**
 * Creates a type syncer.
 *
 * @param packageJSONservice
 * @param typeDefinitionSource
 */
export function createTypeSyncer(
  packageJSONService: IPackageJSONService,
  workspaceResolverService: IWorkspaceResolverService,
  packageSource: IPackageSource,
  configService: IConfigService,
  globber: IGlobber,
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
    flags: ICLIArguments['flags'],
  ): Promise<ISyncResult> {
    const dryRun = !!flags.dry
    const [{ file, subPackages }, syncOpts] = await Promise.all([
      getManifests(filePath, globber),
      configService.readConfig(filePath, flags),
    ])

    const syncedFiles: Array<ISyncedFile> = await Promise.all([
      syncFile(filePath, file, syncOpts, dryRun),
      ...subPackages.map((p) => syncFile(p, null, syncOpts, dryRun)),
    ])

    return {
      syncedFiles,
    }
  }

  /**
   * Get the `package.json` files and sub-packages.
   *
   * @param filePath
   * @param globber
   */
  async function getManifests(filePath: string, globber: IGlobber) {
    const file = await packageJSONService.readPackageFile(filePath)
    const subPackages = await workspaceResolverService.getWorkspaces(
      file,
      path.dirname(filePath),
      globber,
    )

    return {
      file,
      subPackages,
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
    opts: ISyncOptions,
    dryRun: boolean,
  ): Promise<ISyncedFile> {
    const { ignoreDeps, ignorePackages } = opts

    const packageFile =
      file ?? (await packageJSONService.readPackageFile(filePath))
    const allLocalPackages = Object.values(IDependencySection)
      .map((dep) => {
        const section = getDependenciesBySection(packageFile, dep)
        const ignoredSection = ignoreDeps?.includes(dep)
        return getPackagesFromSection(section, ignoredSection, ignorePackages)
      })
      .flat()
    const allPackageNames = uniq(allLocalPackages.map((p) => p.name))
    const potentiallyUntypedPackages =
      getPotentiallyUntypedPackages(allPackageNames)

    // This is pushed to in the inner `map`, because packages that have DT-typings
    // *as well* as internal typings should be excluded.
    const used: ReturnType<typeof getPotentiallyUntypedPackages> = []
    const devDepsToAdd = await Promise.all(
      potentiallyUntypedPackages.map(async (t) => {
        // Fetch the code package from the source.
        const typePackageInfoPromise = fetchPackageInfo(t.typesPackageName)
        const codePackageInfo = await fetchPackageInfo(t.codePackageName)

        // If the code package was not found, there's nothing else to do.
        if (!codePackageInfo) {
          return {}
        }

        const localCodePackage = allLocalPackages.find(
          (p) => p.name === t.codePackageName,
        )!

        // Find the closest matching code package version relative to what's in our package.json
        const closestMatchingCodeVersion = getClosestMatchingVersion(
          codePackageInfo.versions,
          localCodePackage.version,
        )

        // If the closest matching version contains internal typings, don't include it.
        if (closestMatchingCodeVersion.containsInternalTypings) {
          return {}
        }

        // Look for the closest matching typings package.
        const typePackageInfo = await typePackageInfoPromise

        // If the types package was not found, or if it was deprecated, there's nothing else to do.
        if (!typePackageInfo || typePackageInfo.deprecated) {
          return {}
        }

        // Gets the closest matching typings version, or the newest one.
        const closestMatchingTypingsVersion = getClosestMatchingVersion(
          typePackageInfo.versions,
          localCodePackage.version,
        )

        const version = closestMatchingTypingsVersion.version
        const semverRangeSpecifier = '~'
        used.push(t)
        return {
          [t.typesPackageName]: semverRangeSpecifier + version,
        }
      }),
    ).then(mergeObjects)
    const devDeps = packageFile.devDependencies
    if (!dryRun) {
      await packageJSONService.writePackageFile(filePath, {
        ...packageFile,
        devDependencies: orderObject({
          ...devDepsToAdd,
          ...devDeps,
        }),
      } as IPackageFile)
    }

    return {
      filePath,
      newTypings: used,
      package: packageFile,
    }
  }
}

/**
 * Returns an array of packages that do not have a `@types/` package.
 *
 * @param allPackageNames Used to filter the typings that are new.
 * @param allTypings All typings available
 */
function getPotentiallyUntypedPackages(
  allPackageNames: Array<string>,
): Array<IPackageTypingDescriptor> {
  const existingTypings = allPackageNames.filter((x) => x.startsWith('@types/'))
  return filterMap(allPackageNames, (p) => {
    // Ignore typings packages themselves.
    if (p.startsWith('@types/')) {
      return false
    }

    const typingsName = getTypingsName(p)
    const fullTypingsPackage = typed(p)
    const alreadyHasTyping = existingTypings.some(
      (t) => t === fullTypingsPackage,
    )
    if (alreadyHasTyping) {
      return false
    }

    return {
      typingsName: typingsName,
      typesPackageName: fullTypingsPackage,
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
  const EXPR = /^@([^/]+)\/(.*)$/i
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
 * @param ignoredSection
 * @param ignorePackages
 */
function getPackagesFromSection(
  section: IDependenciesSection,
  ignoredSection?: boolean,
  ignorePackages?: Array<string>,
): Array<IPackageVersion> {
  return filterMap(Object.keys(section), (name) => {
    const isTyping = name.startsWith('@types/')

    // Never ignore `@types` packages.
    if (!isTyping) {
      // If it's not a `@types` package, check whether the section or package is ignored.
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- We want to check for false as well.
      if (ignoredSection || ignorePackages?.includes(name)) {
        return false
      }
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
  section: IDependencySection,
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
