# typesync

Install missing TypeScript typings for dependencies in your `package.json`.

[![npm](https://img.shields.io/npm/v/typesync.svg?maxAge=1000)](https://www.npmjs.com/package/typesync)
[![dependency Status](https://img.shields.io/david/jeffijoe/typesync.svg?maxAge=1000)](https://david-dm.org/jeffijoe/typesync)
[![devDependency Status](https://img.shields.io/david/dev/jeffijoe/typesync.svg?maxAge=1000)](https://david-dm.org/jeffijoe/typesync)
[![Build Status](https://img.shields.io/travis/jeffijoe/typesync.svg?maxAge=1000)](https://travis-ci.org/jeffijoe/typesync)
[![Coveralls](https://img.shields.io/coveralls/jeffijoe/typesync.svg?maxAge=1000)](https://coveralls.io/github/jeffijoe/typesync)
[![npm](https://img.shields.io/npm/dt/typesync.svg?maxAge=1000)](https://www.npmjs.com/package/typesync)
[![npm](https://img.shields.io/npm/l/typesync.svg?maxAge=1000)](https://github.com/jeffijoe/typesync/blob/master/LICENSE.md)
[![node](https://img.shields.io/node/v/typesync.svg?maxAge=1000)](https://www.npmjs.com/package/typesync)

![TypeSync](/typesync.gif)

# Install

```
npm install -g typesync
```

You can also use it directly with `npx` which will install it for you:

```
npx typesync
```

# Usage

```
typesync [path/to/package.json] [--dry]
```

Path is relative to the current working directory. If omitted, defaults to `package.json`.

**Note**: `typesync` only modifies your `package.json` - you still need to run `npm install`, or — if drinking the k00laid — `yarn`.

## `--dry`

If `--dry` is specified, will not actually write to the file, it only prints added typings,

## `--ignoredeps`

To ignore certain sections, you can use the `--ignoredeps=` flag. For example, to ignore `devDependencies`, use `--ignoredeps=dev`. To ignore multiple, comma-separate them, like this: `--ignoredeps=deps,peer` (ignores `dependencies` and `peerDependencies`).

- `--ignoredeps=deps` — ignores `dependencies`
- `--ignoredeps=dev` — ignores `devDependencies`
- `--ignoredeps=peer` — ignores `peerDependencies`
- `--ignoredeps=optional` — ignores `optionalDependencies`

## `--ignorepackages`

To ignore certain packages, you can use the `--ignorepackages=` flag. For example, to ignore `nodemon`, use `--ignorepackages=nodemon`.
To ignore multiple, comma-separate them, like this: `--ignorepackages=nodemon,whatever` (ignores `nodemon` and `whatever`).

## Use config file

Alternatively, you can use a TypeSync config file: `.typesyncrc` or a `"typesync"` section in your `package.json`. TypeSync will **automatically** search for configuration files. See [cosmiconfig][cosmiconfig] for details.

```json
// .typesyncrc
{
  "ignoreDeps": ["dev"],
  "ignorePackages": ["nodemon"]
}
```

# Typings packages

TypeSync will add typings for packages that:

- have a `@types/package` available
- don't already provide typings internally (the `typings` and `types` field in `package.json`)

TypeSync will try to respect semver parity for the code and typings packages, and will fall back to the latest available typings package.

If you use a Semver `^` or `~` for a package, the same prefix will be used for the typings package. If you pin to an exact version (`"some-package": "1.2.3"`), no prefix will be written.

If a typings package in your `package.json` is not used (has no corresponding code package in your `package.json` and does not contribute to the global namespace), TypeSync will automatically remove it.

# Monorepos

TypeSync added support for monorepos in v0.4.0. It will look at `packages`/`workspaces` globs in `package.json` and sync every matching file in one fell swoop.

# Why?

Installing typings manually sucks. Flow has `flow-typed` which installs type definitions by looking at a `package.json`, which would be cool to have for TypeScript. Now we do!

# Changelog

See [CHANGELOG.md](/CHANGELOG.md)

# Author

Jeff Hansen - [@Jeffijoe](https://twitter.com/jeffijoe)

  [cosmiconfig]: https://github.com/davidtheclark/cosmiconfig
