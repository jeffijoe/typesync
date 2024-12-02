import type { IWorkspacesArray, IWorkspacesSection } from './workspace-resolver'

/**
 * The guts of the program.
 */
export interface ITypeSyncer {
  sync(
    this: void,
    filePath: string,
    flags: ICLIArguments['flags'],
  ): Promise<ISyncResult>
}

/**
 * Sync options.
 */
export interface ISyncOptions {
  /**
   * Ignore certain deps.
   */
  ignoreDeps?: Array<IDependencySection>

  /**
   * Ignore certain packages.
   */
  ignorePackages?: Array<string>

  /**
   * Skip resolution of certain projects in the workspace.
   */
  ignoreProjects?: IWorkspacesArray
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
export type IDependenciesSection = Record<string, string>

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
  flags: Record<string, boolean | string | undefined>
  args: Array<string>
}
