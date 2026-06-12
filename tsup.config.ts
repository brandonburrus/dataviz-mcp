import { readFileSync } from 'node:fs'
import { defineConfig } from 'tsup'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  banner: { js: '#!/usr/bin/env node' },
  // Inline the package version so the server advertises it without reading
  // package.json at runtime; package.json is the single source of truth.
  define: { __PKG_VERSION__: JSON.stringify(version) },
})
