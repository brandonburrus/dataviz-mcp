import { FastMCP } from 'fastmcp'
import { z } from 'zod'

/**
 * Builds the data visualization MCP server with its tool contract registered.
 *
 * The server is constructed but not started here so it can be imported and
 * exercised in tests without binding a transport. The `add` tool is a
 * placeholder; the real visualization tools and schemas are designed separately.
 */
export function createServer(): FastMCP {
  const server = new FastMCP({
    name: 'dataviz-mcp',
    version: '0.1.0',
  })

  server.addTool({
    name: 'add',
    description: 'Add two numbers',
    parameters: z.object({ a: z.number(), b: z.number() }),
    execute: async args => String(args.a + args.b),
  })

  return server
}
