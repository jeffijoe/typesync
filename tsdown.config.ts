import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/{index,cli}.ts'],
  format: 'esm',
  target: 'node18',
  platform: 'node',
  clean: true,
  sourcemap: true,
  skipNodeModulesBundle: true,
  dts: { sourceMap: true },
  publint: { strict: true },
  unused: { level: 'error' },
})
