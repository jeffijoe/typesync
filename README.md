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

# Usage

```
typesync [path/to/package.json] [--dry]
```

Path is relative to the current working directory. If omitted, defaults to `package.json`.

If `--dry` is specified, will not actually write to the file, it only prints added typings,

**Note**: `typesync` only modifies your `package.json` - you still need to run `npm install`, or — if drinking the k00laid — `yarn`.

## Typings package version

TypeSync will add the latest available typings package that are missing — this means TypeSync won't touch existing typings packages that are present in `package.json`.

If you use a Semver `^` or `~` for a package, the same prefix will be used for the typings package. If you pin to an exact version (`"some-package": "1.2.3"`), no prefix will be written.

## Monorepos

TypeSync added support for monorepos in v0.4.0. It will look at `packages`/`workspaces` globs in `package.json` and sync every matching file in one fell swoop.

# Why?

Installing typings manually sucks. Flow has `flow-typed` which installs type definitions by looking at a `package.json`, which would be cool to have for TypeScript. Now we do!

# Changelog

See [CHANGELOG.md](/CHANGELOG.md)

# Author

Jeff Hansen - [@Jeffijoe](https://twitter.com/jeffijoe)
