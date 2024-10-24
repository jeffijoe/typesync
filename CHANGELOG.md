# v0.13.2

- [#127](https://github.com/jeffijoe/typesync/pull/127): Show dependencies on `--dry` failure, [@Benjamin-Frost](https://github.com/Benjamin-Frost)

# v0.13.1

- [#126](https://github.com/jeffijoe/typesync/pull/126): Allow ignoring workspace members, [@lishaduck](https://github.com/lishaduck)

# v0.13.0

- [#117](https://github.com/jeffijoe/typesync/pull/117): Fix issue with unpublished package names, [@lishaduck](https://github.com/lishaduck)
- [#119](https://github.com/jeffijoe/typesync/pull/119): Support `pnpm` monorepos, [@lishaduck](https://github.com/lishaduck)

# v0.12.2

- [#114](https://github.com/jeffijoe/typesync/issues/114): Fix check for deprecated packages.

# v0.12.1

- [#106](https://github.com/jeffijoe/typesync/issues/106): Don't throw an error when unable to parse versions; default to the latest available one instead.
- Upgrade packages.

# v0.12.0

- **[BREAKING CHANGE]** [#86](https://github.com/jeffijoe/typesync/issues/86): Use the DefinitelyTyped strategy for resolving typings versions. This also means we no longer use the existing semver range specifier used in `package.json`.
- **[BREAKING CHANGE]** Bump minimum supported Node version to 16.
- The success message after running `typesync` now indicates when `--dry` is used.
- Upgrade packages.

# v0.11.1

- [#79](https://github.com/jeffijoe/typesync/issues/79): Ignore deprecated `@typings/` packages.
- Upgrade packages.

# v0.11.0

- Use `npm-registry-fetch` instead of `axios` for fetching package info from npm.
- Microsoft removed their `search-index` resource, so will check npm directly.
- Remove the "remove unused typings" feature as it relied on the information in the Microsoft index and isn't easily available elsewhere for the time being.
- Update packages.

# v0.10.0

- Update packages
- [#94](https://github.com/jeffijoe/typesync/issues/94): Fix diffing, [@oreshinya](https://github.com/oreshinya)

# v0.9.2

- Update packages
- [#90](https://github.com/jeffijoe/typesync/issues/90): add `index.ts`

# v0.9.1

- `--dry-fail` should fail when either adding or removing typings ([#87](https://github.com/jeffijoe/typesync/pull/87), [@chelkyl](https://github.com/chelkyl))
- Update packages

# v0.9.0

- **BREAKING**: Bump Node version to 12.
- Update packages
- [#72](https://github.com/jeffijoe/typesync/issues/72): Add `--dry-fail` support ([#83](https://github.com/jeffijoe/typesync/pull/83), [@chelkyl](https://github.com/chelkyl))

# v0.8.0

- Update packages
- Add `.typesyncrc` support ([#58](https://github.com/jeffijoe/typesync/pull/58), [Hopsken](https://github.com/Hopsken))
- Add `--ignorepackages` support ([#58](https://github.com/jeffijoe/typesync/pull/58), [Hopsken](https://github.com/Hopsken))
- Read registry URL from npm config ([#57](https://github.com/jeffijoe/typesync/pull/57), [Hopsken](https://github.com/Hopsken))

# v0.7.0

- Update packages
- Bump engine version to `10.0`
- Ignore `node_modules` when globbing ([#52](https://github.com/jeffijoe/typesync/pull/52), [tanmen](https://github.com/tanmen))

# v0.6.1

- Fix issue with unzipping, simply by _not unzipping at all_ ([#37](https://github.com/jeffijoe/typesync/issues/37))

# v0.6.0

- Automatically removes unused typings ([#35](https://github.com/jeffijoe/typesync/issues/35))
- `--ignoredeps=<deps,dev,optional,peer>` flag ([#30](https://github.com/jeffijoe/typesync/issues/30))

# v0.5.2

- Updated packages ([#31](https://github.com/jeffijoe/typesync/issues/31))

# v0.5.1

- Fix issue where TypeSync wouldn't start

# v0.5.0

- Don't install typings for packages that provide typings ([#24](https://github.com/jeffijoe/typesync/issues/24))
- Best-effort at respecting semver, falls back to latest ([#25](https://github.com/jeffijoe/typesync/issues/25))
- Add note about `npx` to README ([#21](https://github.com/jeffijoe/typesync/issues/21))

# v0.4.1

- Support object variant of Yarn workspaces config.

# v0.4.0

- Support monorepos by reading `packages`/`workspaces` and syncing matching `package.json` files ([#11](https://github.com/jeffijoe/typesync/issues/11))
- Save typings with the same semver range specifier as the code package ([#12](https://github.com/jeffijoe/typesync/issues/12))
- Updated CLI output to accomodate syncing a monorepo

# v0.3.1

- Exclude test files from package

# v0.3.0

- Update packages

# v0.2.5

- Scoped package support

# v0.2.4

- Add note about running `npm install` or `yarn`

# v0.2.3

- Add `engines` field to `package.json`

# v0.2.2

- Fix typo in package name

# v0.2.0

- Preserve trailing newline when writing `package.json` to disk

# v0.1.1

- `util.promisify` polyfill for Node 6 support

# v0.1.0

- Initial release
