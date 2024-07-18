import path from 'node:path'
import yaml from 'js-yaml'
import { readFileContents } from './fs-utils'
import type {
  IPackageFile,
  IWorkspaceResolverService,
  IWorkspacesArray,
  IWorkspacesSection,
  PnpmWorkspacesConfig,
} from './types'
import { ensureWorkspacesArray, uniq } from './util'

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
