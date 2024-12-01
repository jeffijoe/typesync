import { describe, it } from 'vitest'
import type { IGlobber } from '../globber'
import {
  createWorkspaceResolverService,
  type BunWorkspacesConfig,
  type NpmWorkspacesConfig,
  type PnpmWorkspacesConfig,
  type YarnWorkspacesConfig,
} from '../workspace-resolver'

describe('workspace resolver', () => {
  const globber: IGlobber = {
    globDirs: async (_root, patterns, ignore = []) => {
      return patterns
        .flatMap((pattern) => {
          if (pattern === 'packages/*') {
            return [
              'packages/package1',
              'packages/package2',
              'packages/package3',
            ]
          }

          if (pattern === 'packages/package3') {
            return ['packages/package3']
          }

          return []
        })
        .filter((folder) => !ignore.includes(folder))
    },
  }

  describe('getWorkspaces', () => {
    describe('returns workspaces for all package managers', () => {
      const subject = createWorkspaceResolverService({
        readFileContents: async () => {
          return JSON.stringify({
            packages: ['packages/*'],
          } satisfies PnpmWorkspacesConfig)
        },
      })

      it.for([
        {
          pm: 'npm',
          files: {
            'package.json': {
              workspaces: ['packages/*'] satisfies NpmWorkspacesConfig,
            },
          },
        },
        {
          pm: 'yarn',
          files: {
            'package.json': {
              workspaces: {
                packages: ['packages/*'],
                nohoist: [],
              } satisfies YarnWorkspacesConfig,
            },
          },
        },
        {
          pm: 'pnpm',
          files: {
            'package.json': {},
          },
        },
        {
          pm: 'bun',
          files: {
            'package.json': {
              workspaces: ['packages/*'] satisfies BunWorkspacesConfig,
            },
          },
        },
      ])(`returns $pm workspaces`, async ({ files }, { expect }) => {
        const workspaces = await subject.getWorkspaces(
          files['package.json'],
          '/',
          globber,
          ['packages/package3'],
        )

        expect(workspaces).toEqual(['packages/package1', 'packages/package2'])
      })

      it('returns an empty list if no workspaces are found', async ({
        expect,
      }) => {
        const subject = createWorkspaceResolverService({
          readFileContents: async () => {
            throw new Error('Nothing here, move along.')
          },
        })

        expect(await subject.getWorkspaces({}, '/', globber, [])).toEqual([])
      })
    })
  })
})
