import type { IGlobber } from './globber'

/**
 * The guts of the program.
 */
export interface ITypeSyncer {
  sync(filePath: string, flags: ICLIArguments['flags']): Promise<ISyncResult>
}

/**
 * Sync options.
 */
export interface ISyncOptions {
  /**
   * Ignore certain deps.
   */
  ignoreDeps?: IDependencySection[]
  /**
   * Ignore certain packages.
   */
  ignorePackages?: string[]
}

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

/**
 * Fetches info about a package.
 */
export interface IPackageSource {
  /**
   * Fetches package info from an external source.
   *
   * @param packageName
   */
  fetch(packageName: string): Promise<IPackageInfo | null>
}

/**
 * File service.
 */
export interface IPackageJSONService {
  /**
   * Reads and parses JSON from the specified file. Path is relative to the current working directory.
   */
  readPackageFile(filePath: string): Promise<IPackageFile>
  /**
   * Writes the JSON to the specified file.
   */
  writePackageFile(filePath: string, fileContents: IPackageFile): Promise<void>
}

/**
 * Interface for the Package Info structure.
 */
export interface IPackageInfo {
  name: string
  latestVersion: string
  deprecated: boolean
  versions: Array<IPackageVersionInfo>
}

/**
 * Version descriptor for versions returned in remote package info.
 */
export interface IPackageVersionInfo {
  version: string
  containsInternalTypings: boolean
}

/**
 * Package.json file.
 */
export interface IPackageFile {
  name?: string
  dependencies?: IDependenciesSection
  devDependencies?: IDependenciesSection
  peerDependencies?: IDependenciesSection
  optionalDependencies?: IDependenciesSection
  workspaces?: IWorkspacesSection
  [key: string]: unknown
}

/**
 * Section in package.json representing dependencies.
 */
export interface IDependenciesSection {
  [packageName: string]: string
}

/**
 * @example
 * ```json
 * "workspaces": [
 *  "packages/*",
 * ]
 * ```
 */
export type IWorkspacesArray = Array<string>

/**
 * @example
 * ```yaml
 * projects:
 * - 'packages/*'
 * ```
 */
export type IWorkspacesObject = {
  packages: IWorkspacesArray
}

/**
 * @see {@link IWorkspacesArray}
 */
type NpmWorkspacesConfig = IWorkspacesArray

/**
 * Yarn is a special snowflake.
 *
 * @example
 * ```json
 * "workspaces": {
 *   "packages": [
 *     "packages/*",
 *   ],
 *   "nohoist": []
 * }
 * ```
 */
type YarnWorkspacesConfig =
  | IWorkspacesArray
  | (IWorkspacesObject & { nohoist?: string[] })

/**
 * The contents of a `pnpm-workspace.yaml` file.
 *
 * @example
 * ```yaml
 * packages:
 * - 'packages/*'
 * ```
 */
export type PnpmWorkspacesConfig = IWorkspacesObject

/**
 * @see {@link IWorkspacesArray}
 */
type BunWorkspacesConfig = IWorkspacesArray

/**
 * Section in `package.json` representing workspaces.
 */
export type IWorkspacesSection =
  | NpmWorkspacesConfig
  | YarnWorkspacesConfig
  | BunWorkspacesConfig

/**
 * Files service.
 */
export interface IWorkspaceResolverService {
  /**
   * Reads, parses, and normalizes a workspaces configuration from the following files, in this order:
   * - `package.json` `workspaces` field, as an array of globs.
   * - `package.json` `workspaces` field, as an object with a `projects` field, which is an array of globs.
   * - `pnpm-workspace.yaml` `packages` field, as an array of globs.
   *
   * Path is relative to the current working directory.
   */
  getWorkspaces(root: string, globber: IGlobber): Promise<IWorkspacesArray>
}

/**
 * Package + version record, collected from the {"package": "^1.2.3"} sections.
 */
export interface IPackageVersion {
  name: string
  version: string
}

/**
 * Describes how a package may be typed.
 */
export interface IPackageTypingDescriptor {
  typingsName: string
  codePackageName: string
  typesPackageName: string
}

/**
 * A type definition with the corresponding code package name.
 */
export interface ISyncedTypeDefinition extends IPackageTypingDescriptor {
  codePackageName: string
}

/**
 * Sync result.
 */
export interface ISyncResult {
  /**
   * The files that were synced.
   */
  syncedFiles: Array<ISyncedFile>
}

/**
 * A file that was synced.
 */
export interface ISyncedFile {
  /**
   * The cwd-relative path to the synced file.
   */
  filePath: string
  /**
   * The package file that was synced.
   */
  package: IPackageFile
  /**
   * The new typings that were added.
   */
  newTypings: Array<ISyncedTypeDefinition>
}

/**
 * Dependency sections.
 */
export enum IDependencySection {
  dev = 'dev',
  deps = 'deps',
  optional = 'optional',
  peer = 'peer',
}

/**
 * CLI arguments.
 */
export interface ICLIArguments {
  flags: { [key: string]: boolean | string | undefined }
  args: Array<string>
}
