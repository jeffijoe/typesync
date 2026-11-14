import { describe, it } from 'vitest'
import { IDependencySection } from '../types'
import { syncFixture } from './support/sync-fixture'

describe('type syncer', () => {
  it('adds missing typings for multiple packages', async ({ expect }) => {
    const fixture = syncFixture()
      .manifest('package.json', {
        dependencies: { awilix: '^4.0.0', koa: '^1.0.0' },
      })
      .registryPackage('awilix', { versions: [{ version: '4.0.0' }] })
      .registryPackage('@types/awilix', { versions: [{ version: '4.0.1' }] })
      .registryPackage('koa', { versions: [{ version: '1.0.0' }] })
      .registryPackage('@types/koa', { versions: [{ version: '1.0.1' }] })
      .build()

    const result = await fixture.sync()

    expect(fixture.files.writes).toEqual([
      {
        path: 'package.json',
        contents: {
          dependencies: { awilix: '^4.0.0', koa: '^1.0.0' },
          devDependencies: {
            '@types/awilix': '~4.0.1',
            '@types/koa': '~1.0.1',
          },
        },
      },
    ])
    expect(result.syncedFiles[0].newTypings).toEqual([
      {
        codePackageName: 'awilix',
        typingsName: 'awilix',
        typesPackageName: '@types/awilix',
      },
      {
        codePackageName: 'koa',
        typingsName: 'koa',
        typesPackageName: '@types/koa',
      },
    ])
  })

  it('syncs the root and workspace packages', async ({ expect }) => {
    const fixture = syncFixture()
      // Manifests
      .manifest('project/package.json', {
        workspaces: ['packages/*'],
        dependencies: { awilix: '^4.0.0' },
      })
      .manifest('project/packages/server/package.json', {
        dependencies: { '@myorg/logger': '^1.0.0' },
      })
      .manifest('project/packages/empty/package.json', {})
      // Registry packages
      .registryPackage('awilix', { versions: [{ version: '4.0.0' }] })
      .registryPackage('@types/awilix', { versions: [{ version: '4.0.1' }] })
      .registryPackage('@myorg/logger', { versions: [{ version: '1.0.0' }] })
      .registryPackage('@types/myorg__logger', {
        versions: [{ version: '1.0.1' }],
      })
      .build()

    const result = await fixture.sync({}, 'project/package.json')

    expect(result.syncedFiles.map((file) => file.filePath)).toEqual([
      'project/package.json',
      'project/packages/server/package.json',
      'project/packages/empty/package.json',
    ])
    expect(fixture.files.writes).toEqual([
      {
        path: 'project/package.json',
        contents: {
          workspaces: ['packages/*'],
          dependencies: { awilix: '^4.0.0' },
          devDependencies: { '@types/awilix': '~4.0.1' },
        },
      },
      {
        path: 'project/packages/server/package.json',
        contents: {
          dependencies: { '@myorg/logger': '^1.0.0' },
          devDependencies: { '@types/myorg__logger': '~1.0.1' },
        },
      },
    ])
  })

  it.for([
    { ignorePackages: ['awilix', '@myorg/logger'] },
    { ignorePackages: ['awilix*', '@myorg/*'] },
  ])(
    'ignores packages matching $ignorePackages',
    async (config, { expect }) => {
      const fixture = syncFixture()
        .manifest('package.json', {
          dependencies: { awilix: '^4.0.0' },
          workspaces: ['packages/*'],
        })
        .manifest('packages/server/package.json', {
          dependencies: { '@myorg/logger': '^1.0.0', koa: '^1.0.0' },
        })
        .registryPackage('koa', { versions: [{ version: '1.0.0' }] })
        .registryPackage('@types/koa', {
          versions: [{ version: '1.0.1' }],
        })
        .config(config)
        .build()

      await fixture.sync()

      expect(fixture.registry.requests.toSorted()).toEqual([
        '@types/koa',
        'koa',
      ])
      expect(fixture.files.writes).toEqual([
        {
          path: 'packages/server/package.json',
          contents: {
            dependencies: { '@myorg/logger': '^1.0.0', koa: '^1.0.0' },
            devDependencies: { '@types/koa': '~1.0.1' },
          },
        },
      ])
    },
  )

  it('skips code packages with no published typings package', async ({
    expect,
  }) => {
    const fixture = syncFixture()
      .manifest('package.json', { dependencies: { awilix: '^4.0.0' } })
      .registryPackage('awilix', { versions: [{ version: '4.0.0' }] })
      .build()

    const result = await fixture.sync()

    expect(result.syncedFiles[0].newTypings).toEqual([])
    expect(fixture.files.writes).toEqual([])
  })

  it('skips code packages missing from the registry', async ({ expect }) => {
    const fixture = syncFixture()
      .manifest('package.json', { dependencies: { unpublished: '^1.0.0' } })
      .build()

    const result = await fixture.sync()

    expect(result.syncedFiles[0].newTypings).toEqual([])
    expect(fixture.files.writes).toEqual([])
  })

  it.for([
    { version: '^2.0.0', expectedTypings: '~2.0.1' },
    { version: '^3.0.0', expectedTypings: undefined },
  ])(
    'uses external typings for versions that ship no internal typings ($version)',
    async ({ version, expectedTypings }, { expect }) => {
      const fixture = syncFixture()
        .manifest('package.json', { dependencies: { awilix: version } })
        .registryPackage('awilix', {
          versions: [
            { version: '2.0.0' },
            { version: '3.0.0', containsInternalTypings: true },
          ],
        })
        .registryPackage('@types/awilix', { versions: [{ version: '2.0.1' }] })
        .build()

      const result = await fixture.sync()

      expect(
        fixture.files.writes[0]?.contents.devDependencies?.['@types/awilix'],
      ).toBe(expectedTypings)
      expect(fixture.files.writes).toHaveLength(expectedTypings ? 1 : 0)
      expect(result.syncedFiles[0].newTypings).toHaveLength(
        expectedTypings ? 1 : 0,
      )
    },
  )

  it.for([
    { codeVersion: '^1.0.0', expectedTypings: '~1.0.0' },
    { codeVersion: '^2.0.0', expectedTypings: undefined },
    { codeVersion: '^3.0.0', expectedTypings: undefined },
  ])(
    'checks deprecation of the selected typings for $codeVersion',
    async ({ codeVersion, expectedTypings }, { expect }) => {
      const fixture = syncFixture()
        .manifest('package.json', { dependencies: { awilix: codeVersion } })
        // Leave out v3 so that case falls back to v2 and its deprecated typings.
        .registryPackage('awilix', {
          versions: [{ version: '1.0.0' }, { version: '2.0.0' }],
        })
        .registryPackage('@types/awilix', {
          versions: [
            { version: '1.0.0' },
            { version: '2.0.0', deprecated: true },
          ],
        })
        .build()

      const result = await fixture.sync()

      expect(
        fixture.files.writes[0]?.contents.devDependencies?.['@types/awilix'],
      ).toBe(expectedTypings)
      expect(result.syncedFiles[0].newTypings).toHaveLength(
        expectedTypings ? 1 : 0,
      )
    },
  )

  it('falls back to the latest typings when no version matches', async ({
    expect,
  }) => {
    const fixture = syncFixture()
      .manifest('package.json', { dependencies: { awilix: '^4.0.0' } })
      .registryPackage('awilix', { versions: [{ version: '4.0.0' }] })
      .registryPackage('@types/awilix', {
        versions: [{ version: '0.0.1' }, { version: '2.0.0' }],
      })
      .build()

    await fixture.sync()

    expect(fixture.files.writes[0].contents.devDependencies).toEqual({
      '@types/awilix': '~2.0.0',
    })
  })

  it('ignores dependency sections when asked to', async ({ expect }) => {
    const fixture = syncFixture()
      // Ignore `devDependencies`
      .config({ ignoreDeps: [IDependencySection.dev] })
      .manifest('package.json', {
        dependencies: { awilix: '^4.0.0' },
        // Awilix typings already installed.
        devDependencies: { nodemon: '^1.0.0', '@types/awilix': '^4.0.0' },
        optionalDependencies: { koa: '^1.0.0' },
        peerDependencies: { lodash: '^1.0.0' },
      })
      .registryPackage('koa', { versions: [{ version: '1.0.0' }] })
      .registryPackage('@types/koa', { versions: [{ version: '1.0.1' }] })
      .registryPackage('lodash', { versions: [{ version: '1.0.0' }] })
      .registryPackage('@types/lodash', { versions: [{ version: '1.0.1' }] })
      .build()

    await fixture.sync()

    // `devDependencies` were skipped, so `nodemon` was never requested.
    expect(fixture.registry.requests.toSorted()).toEqual([
      '@types/koa',
      '@types/lodash',
      'koa',
      'lodash',
    ])
    expect(fixture.files.writes[0].contents.devDependencies).toEqual({
      nodemon: '^1.0.0',
      '@types/awilix': '^4.0.0',
      '@types/lodash': '~1.0.1',
      '@types/koa': '~1.0.1',
    })
  })

  it('does not write packages during a dry run', async ({ expect }) => {
    const fixture = syncFixture()
      .manifest('package.json', { dependencies: { awilix: '^4.0.0' } })
      .registryPackage('awilix', { versions: [{ version: '4.0.0' }] })
      .registryPackage('@types/awilix', { versions: [{ version: '4.0.1' }] })
      .build()

    const result = await fixture.sync({ dry: true })

    expect(result.syncedFiles[0].newTypings).toHaveLength(1)
    expect(fixture.files.writes).toEqual([])
  })

  it('does not detect changes when already synced', async ({ expect }) => {
    const fixture = syncFixture()
      .manifest('package.json', {
        dependencies: { awilix: '^4.0.0' },
        devDependencies: { '@types/awilix': '^4.0.0' },
      })
      .build()

    const result = await fixture.sync()

    expect(result.syncedFiles[0].newTypings).toEqual([])
    expect(fixture.files.writes).toEqual([])
    expect(fixture.registry.requests).toEqual([])
  })
})
