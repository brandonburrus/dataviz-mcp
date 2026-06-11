import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server'
import { describe, expect, it } from 'vitest'
import { createServer } from '../src/server.js'
import { APP_RESOURCE_URI } from '../src/viz/tool.js'

const builtAppPath = fileURLToPath(new URL('../dist/app/index.html', import.meta.url))

describe('createServer', () => {
  it('builds a server without starting a transport', () => {
    expect(createServer()).toBeDefined()
  })

  // Requires the Vite app build; skipped locally pre-build, always built in CI
  it.skipIf(!existsSync(builtAppPath))(
    'serves the bundled app HTML at the ui:// resource',
    async () => {
      const server = createServer()
      const embedded = await server.embedded(APP_RESOURCE_URI)
      const resource = Array.isArray(embedded) ? embedded[0] : embedded
      expect(resource?.mimeType).toBe(RESOURCE_MIME_TYPE)
      expect(resource && 'text' in resource && resource.text).toContain('<!DOCTYPE html>')
    },
  )
})
