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
