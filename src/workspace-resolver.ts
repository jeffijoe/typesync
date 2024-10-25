import * as path from 'node:path'
import yaml from 'js-yaml'
import type * as fsUtils from './fs-utils'
import { IGlobber } from './globber'
import { ensureWorkspacesArray, uniq } from './util'
import type { IPackageFile } from './types'

/**
 * Service for fetching monorepo workspaces in a standardized format in package-manager-agnostic way.
 * It is used to allow syncing all types in a workspace when run from the root of a monorepo.
 */
export interface IWorkspaceResolverService {
  /**
   * Reads, parses, and normalizes a workspaces configuration from the following files, in this order:
   * - `package.json` `workspaces` field, as an array of globs.
   * - `package.json` `workspaces` field, as an object with a `projects` field, which is an array of globs.
   * - `pnpm-workspace.yaml` `packages` field, as an array of globs.
   *
   * Path is relative to the current working directory.
   * Note that this returns a list of directories, not paths to the manifests themselves.
   */
  getWorkspaces(
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
 * projects:
 * - 'packages/*'
 * ```
 */
export interface IWorkspacesObject {
  packages: IWorkspacesArray
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
  | BunWorkspacesConfig

export function createWorkspaceResolverService({
  readFileContents,
}: {
  readFileContents: typeof fsUtils.readFileContents
}): IWorkspaceResolverService {
  return {
    getWorkspaces: async (packageJson, root, globber, ignored) => {
      const [manifests, ignoredWorkspaces] = await Promise.all([
        (async () => {
          const workspaces = await getWorkspaces(packageJson, root)
          const workspacesArray = ensureWorkspacesArray(workspaces)
          const globbedArrays = await Promise.all(
            workspacesArray.map(
              async (workspace) => await globber.glob(root, workspace),
            ),
          )

          return uniq(globbedArrays.flat())
        })(),
        (async () => {
          const ignoredWorkspacesArrays = await Promise.all(
            ignored.map(
              async (ignoredWorkspace) =>
                await globber.glob(root, ignoredWorkspace),
            ),
          )

          return uniq(ignoredWorkspacesArrays.flat())
        })(),
      ])

      return manifests.filter(
        (manifest) => !ignoredWorkspaces.includes(manifest),
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
