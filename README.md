# typesync

Install missing TypeScript typings for dependencies in your `package.json`.

# Install

```
npm install -g typesync
```

# Usage

```
typesync [path/to/package.json]
```

Path is relative to the current working directory. If omitted, defaults to `package.json`.

# Why?

Installing typings manually sucks. Flow has `flow-typed` which installs type definitions by looking at a `package.json`, which would be cool to have for TypeScript.

# Author

Jeff Hansen - [@Jeffijoe](https://twitter.com/jeffijoe)
