import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))

export default defineConfig({
  // Mirror the tsup/vite build define so code reading __PKG_VERSION__ runs under test
  define: { __PKG_VERSION__: JSON.stringify(version) },
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*'],
      exclude: ['src/index.ts', 'src/app/main.ts'],
    },
  },
})
