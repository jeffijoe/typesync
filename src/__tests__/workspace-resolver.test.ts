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
    globPackageFiles: jest.fn(async (_root: string) => {
      return ['packages/package1', 'packages/package2']
    }),
  }

  describe('getWorkspaces', () => {
    describe('returns workspaces for all package managers', () => {
      const subject = createWorkspaceResolverService({
        readFileContents: jest.fn(async (_filePath: string) => {
          return JSON.stringify({
            packages: ['packages/*'],
          } satisfies PnpmWorkspacesConfig)
        }),
      })

      it.each([
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
      ])(`returns $pm workspaces`, async ({ pm, files }) => {
        const workspaces = await subject.getWorkspaces(
          files['package.json'],
          '/',
          globber,
        )

        expect(workspaces).toEqual(['packages/package1', 'packages/package2'])
      })

      it('returns an empty list if no workspaces are found', async () => {
        const subject = createWorkspaceResolverService({
          readFileContents: jest.fn(async (_filePath: string) => {
            throw new Error('Nothing here, move along.')
          }),
        })

        expect(await subject.getWorkspaces({}, '/', globber)).toEqual([])
      })
    })
  })
})
