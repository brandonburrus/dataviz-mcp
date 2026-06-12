# Contributing

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

The build order matters: the app build must run after the server build, because
the server build cleans `dist/`. The `pnpm build` script already sequences them
correctly.

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

## Development workflow

```sh
pnpm test          # vitest
pnpm typecheck     # tsc for the node server and the DOM app
pnpm check         # biome lint + format (auto-fix)
pnpm dev           # build the app, then run the server over stdio
```

Commits follow [Conventional Commits](https://www.conventionalcommits.org); a
husky `commit-msg` hook enforces the format and the `pre-commit` hook runs the
test suite.

To preview the rendered app in a real host during development, run the server
over HTTP and connect the `basic-host` example from the
[ext-apps](https://github.com/modelcontextprotocol/ext-apps) repository:

```sh
MCP_TRANSPORT=httpStream MCP_PORT=8080 node dist/index.js
# in a clone of modelcontextprotocol/ext-apps:
SERVERS='["http://localhost:8080/mcp"]' npm start --prefix examples/basic-host
```

## Project layout

The repository carries `AGENTS.md` files (root, `src/viz`, `src/app`) documenting
the architecture, invariants, and gotchas for anyone (human or agent) working in
the code. Start there for orientation.
