import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      provider: 'v8',
      include: ['src/**', '!src/cli-util.ts', '!src/index.ts', '!src/cli.ts'],
    },
    sequence: {
      concurrent: true,
      shuffle: {
        files: false,
        tests: true,
      },
    },
    expect: {
      requireAssertions: true,
    },
    mockReset: true,
  },
})
