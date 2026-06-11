# AGENTS.md

## What this is

`dataviz-mcp` is a Model Context Protocol (MCP) server that exposes data
visualization capabilities to MCP clients. It is built on the FastMCP
TypeScript framework and runs over either stdio (default) or streamable HTTP.

## Running

The server selects its transport from environment variables:

- Default (no env): stdio. `pnpm dev` or the built `dataviz-mcp` bin.
- `MCP_TRANSPORT=httpStream`: streamable HTTP on `MCP_PORT` (default `8080`).

## Critical constraints

- **fastmcp here is the npm package (punkpeye), not the PyPI `fastmcp` (jlowin).**
  They are unrelated projects with different APIs.
- **ESM-only.** The package is `type: module` and tsup emits ESM only. The entry
  point uses top-level `await`, which CommonJS cannot represent, so do not add a
  `cjs` format back to `tsup.config.ts`.
- **NodeNext module resolution.** Relative imports must carry the `.js`
  extension (e.g. `import { createServer } from './server.js'`), even though the
  source file is `.ts`.
- Node `>=20`. pnpm only (`packageManager` is pinned); do not use npm or yarn.

## Conventions

- Lint/format: biome (`quoteStyle: single`, `semicolons: asNeeded`). Run
  `pnpm check` to auto-fix.
- Tests: vitest, in `tests/**/*.test.ts`. `src/index.ts` (the transport bootstrap)
  is excluded from coverage; keep testable logic out of it.
- Commits: conventional commits, enforced by commitlint via the husky
  `commit-msg` hook. The `pre-commit` hook runs `pnpm test`.

## Structure

- `src/server.ts` builds the `FastMCP` instance and registers tools. It does not
  start a transport, so it is importable in tests. Add new tools here.
- `src/index.ts` is the executable entry: it constructs the server and starts the
  selected transport. Keep it thin.
- `tests/` holds vitest suites.
- `.github/workflows/ci.yml` runs `biome ci`, typecheck, and tests on push/PR.

## Boundaries

The current `add` tool is a placeholder. Designing the real visualization tools,
their schemas, and the tool-vs-resource split is the job of the `design-mcp`
skill, not ad-hoc additions.
