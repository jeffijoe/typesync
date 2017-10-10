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
  /**
   * Gets the latest version of the typings for the specified typings package.
   */
  getLatestTypingsVersion(typingsPackageName: string): Promise<string>
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
 * Package.json file.
 */
export interface IPackageFile {
  name: string
  dependencies?: IDependenciesSection
  devDependencies?: IDependenciesSection
  peerDependencies?: IDependenciesSection
  optionalDependencies?: IDependenciesSection
  [key: string]: any
}

/**
 * Section in package.json representing dependencies.
 */
export interface IDependenciesSection {
  [packageName: string]: string
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
   * How many new typings were added.
   */
  newTypings: Array<ITypeDefinition>
}

/**
 * CLI arguments.
 */
export interface ICLIArguments {
  flags: { [key: string]: boolean | undefined }
  args: Array<string>
}
