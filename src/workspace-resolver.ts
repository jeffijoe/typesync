import path from 'node:path'
import yaml from 'js-yaml'
import { readFileContents } from './fs-utils'
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
   */
  getWorkspaces(root: string, globber: IGlobber): Promise<IWorkspacesArray>
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
type BunWorkspacesConfig = IWorkspacesArray

/**
 * Section in `package.json` representing workspaces.
 */
export type IWorkspacesSection =
  | NpmWorkspacesConfig
  | YarnWorkspacesConfig
  | BunWorkspacesConfig

export function createWorkspaceResolverService(): IWorkspaceResolverService {
  return {
    getWorkspaces: async (root, globber) => {
      const workspaces = await getWorkspaces(root)
      const workspacesArray = ensureWorkspacesArray(workspaces)

      const manifests = await Promise.all(
        workspacesArray.map(
          async (workspace) => await globber.globPackageFiles(workspace),
        ),
      )

      return uniq(manifests.flat())
    },
  }
}

async function getWorkspaces(
  root: string,
): Promise<IWorkspacesSection | undefined> {
  const packageJsonWorkspaces = await getPackageJsonWorkspaces(root)
  if (packageJsonWorkspaces !== undefined) {
    return packageJsonWorkspaces
  }

  return await getPnpmWorkspaces(root)
}

async function getPackageJsonWorkspaces(
  root: string,
): Promise<IWorkspacesSection | undefined> {
  try {
    const filePath = path.relative(root, 'package.json')
    const contents = await readFileContents(filePath) // TODO: Don't do this twice.
    const packageJson = JSON.parse(contents) as IPackageFile

    return packageJson.workspaces
  } catch {
    return undefined
  }
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
