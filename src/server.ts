import { readFile } from 'node:fs/promises'
import { RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server'
import { FastMCP } from 'fastmcp'
import { APP_RESOURCE_URI, createDataVisualizationTool } from './viz/tool.js'

/**
 * Resolved relative to this module: src/server.ts (dev/tests) and the bundled
 * dist/index.js are both exactly one level below the package root, so the same
 * relative URL finds the Vite-built app in every execution mode.
 */
const APP_HTML_URL = new URL('../dist/app/index.html', import.meta.url)

/**
 * Builds the data visualization MCP server: the create_data_visualization tool
 * plus the ui:// resource serving the bundled D3 app it renders into.
 *
 * The server is constructed but not started here so it can be imported and
 * exercised in tests without binding a transport.
 */
export function createServer(): FastMCP {
  const server = new FastMCP({
    name: 'dataviz-mcp',
    version: '0.1.0',
  })

  server.addTool(createDataVisualizationTool)

  server.addResource({
    uri: APP_RESOURCE_URI,
    name: 'Data Visualization App',
    mimeType: RESOURCE_MIME_TYPE,
    // Read at load() time, not import time: the server starts without the app
    // built, and hosts always receive the freshest build during development.
    load: async () => {
      const text = await readFile(APP_HTML_URL, 'utf8').catch(() => {
        throw new Error('dist/app/index.html not found; run `pnpm build:app` first')
      })
      return { text, mimeType: RESOURCE_MIME_TYPE, uri: APP_RESOURCE_URI }
    },
  })

  return server
}
