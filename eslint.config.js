// @ts-check
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import pluginJs from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const extensions = '{js,mjs,cjs,ts}'

export default tseslint.config(
  {
    files: [`src/*.${extensions}`, `bin/*`, `*.${extensions}`],
  },
  {
    ignores: [`dist/`, 'coverage/'],
  },
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: {
          allowDefaultProject: [`*.config.${extensions}`],
        },
        tsconfigRootDir: dirname,
      },
    },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    rules: {
      // Only disabling these because this code is very old but also battle-tested,
      // and coming up with clever typings may break for consumers.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      // We use `require` for loading the `package.json` file.
      '@typescript-eslint/no-require-imports': [
        'error',
        { allow: ['/package\\.json$'] },
      ],
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
    files: [`src/__tests__/**/*.${extensions}`],
    rules: {
      // In tests, sometimes we need to make things asynchronous.
      '@typescript-eslint/require-await': 'off',
    },
  },
)
