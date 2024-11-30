import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      provider: 'v8',
      include: [
        'src/**',
        '!src/cli-util.ts',
        '!src/index.ts',
        '!src/cli.ts',
        '!src/fakes.ts',
        '!src/types.ts',
      ],
    },
    sequence: {
      concurrent: true,
      shuffle: {
        files: false,
        tests: true,
      },
    },
  },
})
