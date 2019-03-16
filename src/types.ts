/**
 * The guts of the program.
 */
export interface ITypeSyncer {
  sync(filePath: string, opts?: ISyncOptions): Promise<ISyncResult>
}

/**
 * Sync options.
 */
export interface ISyncOptions {
  /**
   * If set, will not write to package.json.
   */
  dry?: boolean
}

/**
 * Fetches available type definitions.
 */
export interface ITypeDefinitionSource {
  /**
   * Fetches available type definitions.
   */
  fetch(): Promise<Array<ITypeDefinition>>
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
  fetch(packageName: string): Promise<IPackageInfo>
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
  packages?: IWorkspacesSection
  workspaces?: IWorkspacesSection | IYarnWorkspacesConfig
  [key: string]: any
}

/**
 * Section in package.json representing dependencies.
 */
export interface IDependenciesSection {
  [packageName: string]: string
}

/**
 * Section in package.json representing workspaces (yarn/lerna).
 */
export type IWorkspacesSection = Array<string>

/**
 * Yarn is a special snowflake.
 */
export interface IYarnWorkspacesConfig {
  packages: IWorkspacesSection
}

/**
 * Package + version record, collected from the {"package": "^1.2.3"} sections.
 */
export interface IPackageVersion {
  name: string
  version: string
}

/**
 * Represents a type definition pulled from a source.
 */
export interface ITypeDefinition {
  typingsName: string
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
   * How many new typings were added.
   */
  newTypings: Array<ITypeDefinition & { codePackageName: string }>
}

/**
 * CLI arguments.
 */
export interface ICLIArguments {
  flags: { [key: string]: boolean | undefined }
  args: Array<string>
}
