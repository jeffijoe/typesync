/* eslint-env node */
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  overrides: [
    // TypeScript
    {
      files: ['**/*.ts'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint'],
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
      rules: {
        // Only disabling this because this code is very old but also battle-tested,
        // and coming up with clever typings may break for consumers.
        '@typescript-eslint/no-explicit-any': 'off',
        // We use `require` for loading the `package.json` file.
        '@typescript-eslint/no-var-requires': [
          'error',
          { allow: ['/package\\.json$'] },
        ],
      },
    },
    // Tests
    {
      files: ['**/__tests__/*.test.ts'],
      rules: {
        // Unused vars are used for dependency resolution.
        '@typescript-eslint/no-unused-vars': 'off',

        // Some types are useful for testing.
        '@typescript-eslint/ban-types': 'off',
      },
    },
  ],
}
