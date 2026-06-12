import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig({
  root: 'src/app',
  plugins: [viteSingleFile()],
  // Inline the package version so the app handshake matches the published version
  define: { __PKG_VERSION__: JSON.stringify(version) },
  build: {
    // outDir lives outside the vite root, so clearing it requires explicit opt-in
    outDir: '../../dist/app',
    emptyOutDir: true,
    // main.ts uses top-level await
    target: 'es2022',
  },
})
