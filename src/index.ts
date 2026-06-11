import { createServer } from './server.js'

const server = createServer()

const transport = process.env.MCP_TRANSPORT ?? 'stdio'

if (transport === 'httpStream') {
  const port = Number(process.env.MCP_PORT ?? 8080)
  await server.start({ transportType: 'httpStream', httpStream: { port } })
} else {
  await server.start({ transportType: 'stdio' })
}
