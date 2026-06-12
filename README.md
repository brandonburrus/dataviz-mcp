# dataviz-mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server that turns
tabular data into interactive [D3](https://d3js.org) visualizations. It exposes a
single `create_data_visualization` tool that returns an
[MCP App](https://modelcontextprotocol.io/extensions/apps/overview): an HTML page
the host renders inline in the conversation, inside a sandboxed iframe.

## Supported visualizations

| Type | Required encodings | Optional | Interactivity |
|---|---|---|---|
| `bar` | `x` (category), `y` (number) | `series` | tooltips, legend toggle |
| `line` | `x` (number or ISO date), `y` (number) | `series` | tooltips, legend toggle, x zoom/pan |
| `scatter` | `x` (number or ISO date), `y` (number) | `series` | tooltips, legend toggle, x/y zoom/pan |
| `pie` | `category`, `value` (number) | | tooltips with percentage, legend toggle |
| `heatmap` | `x` (category), `y` (category), `value` (number) | | tooltips, gradient legend |

All types support an optional `title`, `xLabel`, `yLabel`, and `colorScheme`, and
re-render responsively when the container resizes.

## Requirements

- Node.js >= 20
- [pnpm](https://pnpm.io)

## Install and build

```sh
pnpm install
pnpm build
```

`pnpm build` produces two artifacts: the server bundle at `dist/index.js` and the
self-contained visualization app (D3 inlined) at `dist/app/index.html`. The server
serves that HTML as the `ui://dataviz-mcp/app.html` resource the tool points at.

## Running

The transport is chosen from environment variables:

```sh
# stdio (default)
node dist/index.js

# streamable HTTP on MCP_PORT (default 8080), endpoint /mcp
MCP_TRANSPORT=httpStream MCP_PORT=8080 node dist/index.js
```

## Use with Claude Desktop (stdio)

Add the server to `claude_desktop_config.json`
(`~/Library/Application Support/Claude/` on macOS), then fully quit and reopen the
app:

```json
{
  "mcpServers": {
    "dataviz-mcp": {
      "command": "/opt/homebrew/bin/node",
      "args": ["/absolute/path/to/dataviz-mcp/dist/index.js"]
    }
  }
}
```

Use an absolute path to the `node` binary, not just `"node"`. Claude Desktop
launches MCP servers with a minimal `PATH` that often does not include
version-manager (nvm) or Homebrew node, so a bare command fails to start. The
config points at the built `dist/index.js`, so rebuild and restart Claude Desktop
after changing the source.

## Tool input

`create_data_visualization` takes records plus a map of field names to visual
channels. The data is an array of flat objects sharing the encoded field names:

```json
{
  "type": "bar",
  "data": [
    { "month": "Jan", "sales": 100, "region": "EU" },
    { "month": "Jan", "sales": 80, "region": "US" },
    { "month": "Feb", "sales": 120, "region": "EU" },
    { "month": "Feb", "sales": 90, "region": "US" }
  ],
  "encodings": { "x": "month", "y": "sales", "series": "region" },
  "title": "Quarterly Sales"
}
```

`colorScheme` accepts `tableau10`, `category10`, or `dark2` for categorical types
(bar, line, scatter, pie), and `viridis` or `plasma` for heatmaps. The server
validates the spec before rendering and returns a corrective message if, for
example, an encoding references a field absent from the data.

## Development

```sh
pnpm test          # vitest
pnpm typecheck     # tsc for the node server and the DOM app
pnpm check         # biome lint + format (auto-fix)
pnpm dev           # build the app, then run the server over stdio
```

To preview the rendered app in a real host during development, run the server
over HTTP and connect the `basic-host` example from the
[ext-apps](https://github.com/modelcontextprotocol/ext-apps) repository:

```sh
MCP_TRANSPORT=httpStream MCP_PORT=8080 node dist/index.js
# in a clone of modelcontextprotocol/ext-apps:
SERVERS='["http://localhost:8080/mcp"]' npm start --prefix examples/basic-host
```

## License

MIT
