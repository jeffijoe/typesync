// @ts-check
/// <reference types="node" />

import { defineConfig, globalIgnores } from 'eslint/config'
import pluginJs from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig(
  globalIgnores(['dist/', 'coverage/']),
  {
    files: ['**/*.{js,mjs,cjs,ts}', 'bin/*'],
    extends: [pluginJs.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
  },
  {
    files: ['**/*.ts'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.config.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Only disabling these because this code is very old but also battle-tested,
      // and coming up with clever typings may break for consumers.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',

      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'inline-type-imports' },
      ],

      '@typescript-eslint/return-await': ['error', 'always'],
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/no-confusing-void-expression': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // We prefer generic arrays.
      '@typescript-eslint/array-type': ['error', { default: 'generic' }],
      // We should ignore unused vars with underscores.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/prefer-nullish-coalescing': [
        'error',
        { ignoreConditionalTests: false },
      ],
    },
  },
  {
    files: ['src/__tests__/**/*.ts'],
    rules: {
      // In tests, sometimes we need to make things asynchronous.
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
)
