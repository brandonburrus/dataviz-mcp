import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  root: 'src/app',
  plugins: [viteSingleFile()],
  build: {
    // outDir lives outside the vite root, so clearing it requires explicit opt-in
    outDir: '../../dist/app',
    emptyOutDir: true,
    // main.ts uses top-level await
    target: 'es2022',
  },
})
