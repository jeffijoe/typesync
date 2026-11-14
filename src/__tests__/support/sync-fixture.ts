import * as path from 'node:path'
import picomatch from 'picomatch'
import { rcompare } from 'semver'
import type { IGlobber } from '../../globber'
import type { IPackageJSONService } from '../../package-json-file-service'
import type { IPackageInfo, IPackageSource } from '../../package-source'
import { createTypeSyncer } from '../../type-syncer'
import type {
  ICLIArguments,
  IPackageFile,
  ISyncOptions,
  ISyncResult,
} from '../../types'
import type { IPackageVersionInfo } from '../../versioning'
import { createWorkspaceResolverService } from '../../workspace-resolver'

/**
 * Describes a registry package in the fixture.
 */
interface RegistryPackageFixture {
  latestVersion?: string
  versions: Array<
    Pick<IPackageVersionInfo, 'version'> &
      Partial<Omit<IPackageVersionInfo, 'version'>>
  >
}

/**
 * A captured package write.
 */
interface PackageWrite {
  path: string
  contents: IPackageFile
}

/**
 * Fixture for a type syncer.
 */
interface SyncFixture {
  /**
   * Files that have been written.
   */
  files: { writes: Array<PackageWrite> }
  /**
   * The registry tracker.
   */
  registry: { requests: Array<string> }
  /**
   * Calls the syncer in the fixture.
   */
  sync(flags?: ICLIArguments['flags'], filePath?: string): Promise<ISyncResult>
}

/**
 * Fixture builder for the syncer.
 */
class SyncFixtureBuilder {
  private manifests = new Map<string, IPackageFile>()
  private packages = new Map<string, IPackageInfo>()
  private options: ISyncOptions = {}

  /**
   * Adds a manifest to the fixture that the in-memory package.json service can find.
   */
  manifest(filePath: string, contents: IPackageFile): this {
    this.manifests.set(path.normalize(filePath), structuredClone(contents))
    return this
  }

  /**
   * Adds a package to the registry for the in-memory package source to load.
   */
  registryPackage(name: string, fixture: RegistryPackageFixture): this {
    const versions = fixture.versions
      .map((version) => ({
        deprecated: false,
        containsInternalTypings: false,
        ...version,
      }))
      .sort((a, b) => rcompare(a.version, b.version))
    if (!versions.length) throw new Error(`No versions declared for ${name}`)
    this.packages.set(name, {
      name,
      latestVersion: fixture.latestVersion ?? versions[0].version,
      versions,
    })
    return this
  }

  /**
   * Sets the type syncer's configuration.
   */
  config(options: ISyncOptions): this {
    this.options = structuredClone(options)
    return this
  }

  /**
   * Builds the fixture.
   */
  build(): SyncFixture {
    const manifests = structuredClone(this.manifests)
    const packages = structuredClone(this.packages)
    const options = structuredClone(this.options)
    const writes: Array<PackageWrite> = []
    const requests: Array<string> = []

    const files: IPackageJSONService = {
      readPackageFile: async (filePath) => {
        const contents = manifests.get(path.normalize(filePath))
        if (!contents) {
          throw new Error(`Manifest not declared: ${filePath}`)
        }

        return structuredClone(contents)
      },
      writePackageFile: async (filePath, contents) => {
        writes.push({ path: filePath, contents: structuredClone(contents) })
        manifests.set(path.normalize(filePath), structuredClone(contents))
      },
    }

    const registry: IPackageSource = {
      fetch: async (name) => {
        requests.push(name)
        return structuredClone(packages.get(name) ?? null)
      },
    }

    const globber: IGlobber = {
      globDirs: async (root, patterns, ignore = []) => {
        const matches = picomatch(patterns, { ignore })

        // Match workspaces against the manifests added to the fixture.
        return [...manifests.keys()]
          .map((filePath) =>
            path
              .relative(root, path.dirname(filePath))
              .split(path.sep)
              .join('/'),
          )
          .filter((dir) => dir && matches(dir))
      },
    }

    const workspaceResolver = createWorkspaceResolverService({
      readFileContents: async (filePath) => {
        throw new Error(`File not declared: ${filePath}`)
      },
    })

    const syncer = createTypeSyncer(
      files,
      workspaceResolver,
      registry,
      {
        readConfig: async () => structuredClone(options),
      },
      globber,
    )
    return {
      files: { writes },
      registry: { requests },
      sync: async (flags = {}, filePath = 'package.json') =>
        await syncer.sync(filePath, flags),
    }
  }
}

export function syncFixture(): SyncFixtureBuilder {
  return new SyncFixtureBuilder()
}
