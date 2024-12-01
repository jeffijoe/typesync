import * as path from 'node:path'
import yaml from 'js-yaml'
import type * as fsUtils from './fs-utils'
import type { IGlobber } from './globber'
import { ensureWorkspacesArray } from './util'
import type { IPackageFile } from './types'

/**
 * Service for fetching monorepo workspaces in a standardized format agnostic of the package manager used.
 * It is used to allow syncing all types in a workspace when run from the root of a monorepo.
 */
export interface IWorkspaceResolverService {
  /**
   * Reads, parses, and normalizes a workspaces configuration from the following files, in this order:
   * - `package.json` `workspaces` field, as an array of globs.
   * - `package.json` `workspaces` field, as an object with a `packages` field, which is an array of globs.
   * - `pnpm-workspace.yaml` `packages` field, as an array of globs.
   *
   * Path is relative to the current working directory.
   * Note that this returns a list of directories, not paths to the manifests themselves.
   */
  getWorkspaces(
    this: void,
    packageJson: IPackageFile,
    root: string,
    globber: IGlobber,
    ignored: IWorkspacesArray,
  ): Promise<IWorkspacesArray>
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
 * packages:
 * - 'packages/*'
 * ```
 */
export interface IWorkspacesObject {
  packages?: IWorkspacesArray
}

/**
 * @see {@link IWorkspacesArray}
 */
export type NpmWorkspacesConfig = IWorkspacesArray

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
export type YarnWorkspacesConfig =
  | IWorkspacesArray
  | (IWorkspacesObject & { nohoist?: Array<string> })

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
export type BunWorkspacesConfig = IWorkspacesArray

/**
 * Section in `package.json` representing workspaces.
 */
export type IWorkspacesSection =
  | NpmWorkspacesConfig
  | YarnWorkspacesConfig
  // eslint-disable-next-line @typescript-eslint/no-duplicate-type-constituents -- We want to explicitly enumerate each package manager's options.
  | BunWorkspacesConfig

export function createWorkspaceResolverService({
  readFileContents,
}: {
  readFileContents: typeof fsUtils.readFileContents
}): IWorkspaceResolverService {
  return {
    getWorkspaces: async (packageJson, root, globber, ignored) => {
      const [workspaces, ignoredWorkspaces] = await Promise.all([
        getWorkspaces(packageJson, root),
        globber.globDirs(root, ignored),
      ])

      return await globber.globDirs(
        root,
        ensureWorkspacesArray(workspaces),
        ignoredWorkspaces,
      )
    },
  }

  async function getWorkspaces(
    packageJson: IPackageFile,
    root: string,
  ): Promise<IWorkspacesSection | undefined> {
    const packageJsonWorkspaces = packageJson.workspaces
    if (packageJsonWorkspaces !== undefined) {
      return packageJsonWorkspaces
    }

    return await getPnpmWorkspaces(root)
  }

  async function getPnpmWorkspaces(
    root: string,
  ): Promise<IWorkspacesArray | undefined> {
    try {
      const filePath = path.relative(root, 'pnpm-workspace.yaml')
      const contents = await readFileContents(filePath)
      const pnpmWorkspaces = yaml.load(contents) as PnpmWorkspacesConfig

      return pnpmWorkspaces.packages
    } catch {
      return undefined
    }
  }
}
