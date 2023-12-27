# typesync

Install missing TypeScript typings for dependencies in your `package.json`.

[![npm](https://img.shields.io/npm/v/typesync.svg?maxAge=1000)](https://www.npmjs.com/package/typesync)
[![dependency Status](https://img.shields.io/david/jeffijoe/typesync.svg?maxAge=1000)](https://david-dm.org/jeffijoe/typesync)
[![devDependency Status](https://img.shields.io/david/dev/jeffijoe/typesync.svg?maxAge=1000)](https://david-dm.org/jeffijoe/typesync)
[![Build Status](https://img.shields.io/travis/jeffijoe/typesync.svg?maxAge=1000)](https://travis-ci.com/jeffijoe/typesync)
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

## `--dry[=fail]`

If `--dry` is specified, will not actually write to the file, it only prints added/removed typings.

The same is true for `--dry=fail`, with the additional effect of failing the command in case there are changes.
This is useful for CI scenarios.

## `--ignoredeps`

To ignore certain sections, you can use the `--ignoredeps=` flag. For example, to ignore `devDependencies`, use `--ignoredeps=dev`. To ignore multiple, comma-separate them, like this: `--ignoredeps=deps,peer` (ignores `dependencies` and `peerDependencies`).

- `--ignoredeps=deps` — ignores `dependencies`
- `--ignoredeps=dev` — ignores `devDependencies`
- `--ignoredeps=peer` — ignores `peerDependencies`
- `--ignoredeps=optional` — ignores `optionalDependencies`

## `--ignorepackages`

To ignore certain packages, you can use the `--ignorepackages=` flag. For example, to ignore `nodemon`, use `--ignorepackages=nodemon`.
To ignore multiple, comma-separate them, like this: `--ignorepackages=nodemon,whatever` (ignores `nodemon` and `whatever`).

## Using a config file

Alternatively, you can use a TypeSync config file: `.typesyncrc` or a `"typesync"` section in your `package.json`. TypeSync will **automatically** search for configuration files. See [cosmiconfig][cosmiconfig] for details.

```json
// .typesyncrc
{
  "ignoreDeps": ["dev"],
  "ignorePackages": ["nodemon"]
}
```

## Run TypeSync Automatically After Every Install

To run TypeSync and install packages automatically after every package install, create a file called `install-with-types.sh` with the following content:

```sh
npm install $1
npx typesync
npm install
```

If you use `yarn`, use this instead:

```sh
yarn add $1
yarn typesync
yarn
```

Run this command to make the file executable:

```sh
chmod +x install-with-types.sh
```

Add the following to `package.json`:

```json
{
  "scripts": {
    "i": "./install-with-types.sh"
  }
}
```

Then install packages like this:

```bash
npm run i <pkg name>

# Or, with yarn:
yarn i <pkg name>
```

# Typings packages

TypeSync will add typings for packages that:

- have a `@types/package` available
- don't already provide typings internally (the `typings` and `types` field in `package.json`)

TypeSync will try to respect semver parity for the code and typings packages, and will fall back to the latest available typings package.

When writing the typings package version to `package.json`, the `~` semver range is used. This is because typings published via [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped#how-do-definitely-typed-package-versions-relate-to-versions-of-the-corresponding-library) align typings versions with library versions using major and minor only.

For example, if you depend on `react@^16.14.0`, then TypeSync will only look for typings packages that match `16.14.*`.

# Monorepos

TypeSync added support for monorepos in v0.4.0. It will look at `packages`/`workspaces` globs in `package.json` and sync every matching file in one fell swoop.

# Why?

Installing typings manually sucks. Flow has `flow-typed` which installs type definitions by looking at a `package.json`, which would be cool to have for TypeScript. Now we do!

# Changelog

See [CHANGELOG.md](/CHANGELOG.md)

# Author

Jeff Hansen - [@Jeffijoe](https://twitter.com/jeffijoe)

[cosmiconfig]: https://github.com/davidtheclark/cosmiconfig
