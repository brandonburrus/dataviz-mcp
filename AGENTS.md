# AGENTS.md

## What this is

`dataviz-mcp` is a Model Context Protocol (MCP) server exposing a single
`create_data_visualization` tool that turns tabular data into an interactive D3
visualization, delivered as an MCP App (an HTML page the host renders in a
sandboxed iframe). Built on the FastMCP TypeScript framework; runs over stdio
(default) or streamable HTTP.

## Running

The server selects its transport from environment variables:

- Default (no env): stdio. `pnpm dev` or the built `dataviz-mcp` bin.
- `MCP_TRANSPORT=httpStream`: streamable HTTP on `MCP_PORT` (default `8080`),
  endpoint path `/mcp`.

## Critical constraints

- **fastmcp here is the npm package (punkpeye), not the PyPI `fastmcp` (jlowin).**
  They are unrelated projects with different APIs.
- **ESM-only.** The package is `type: module` and tsup emits ESM only. The entry
  point uses top-level `await`, which CommonJS cannot represent, so do not add a
  `cjs` format back to `tsup.config.ts`.
- **No shebang in `src/index.ts`.** The tsup banner injects `#!/usr/bin/env node`;
  a shebang in the source produces a duplicate on line 2 of `dist/index.js`,
  which is a syntax error at runtime.
- **Build order: server before app.** tsup has `clean: true` and wipes all of
  `dist/`, including `dist/app`. `pnpm build` encodes the right order; running
  `pnpm build:server` alone leaves the app resource missing (load() throws a
  descriptive error).
- **Path invariant for the app resource.** `src/server.ts` resolves the built app
  via `new URL('../dist/app/index.html', import.meta.url)`. This works because
  `src/server.ts` and the bundled `dist/index.js` are both exactly one level
  below the package root. Do not move either file deeper without updating it.
- **NodeNext module resolution.** Relative imports must carry the `.js`
  extension (e.g. `import { createServer } from './server.js'`), even though the
  source file is `.ts`.
- **Dual tsconfig.** Root `tsconfig.json` is node-only and excludes `src/app`;
  `src/app/tsconfig.json` is DOM-only (Bundler resolution). `pnpm typecheck`
  runs both. App code must never value-import zod or fastmcp (bundle size /
  node-only); import from `src/viz/spec.ts` with `import type` only, and use
  `src/viz/data.ts` for shared runtime helpers.
- Node `>=20`. pnpm only (`packageManager` is pinned); do not use npm or yarn.

## Conventions

- Lint/format: biome (`quoteStyle: single`, `semicolons: asNeeded`). Run
  `pnpm check` to auto-fix.
- Tests: vitest, in `tests/**/*.test.ts`, mirroring `src/` structure. DOM tests
  opt in per file with a `// @vitest-environment happy-dom` docblock (vitest 4
  removed environmentMatchGlobs). `src/index.ts` and `src/app/main.ts` (thin
  bootstraps) are excluded from coverage; keep testable logic out of them.
- Commits: conventional commits, enforced by commitlint via the husky
  `commit-msg` hook. The `pre-commit` hook runs `pnpm test`.

## Structure

- `src/viz/`: environment-neutral tool contract shared by server and app.
  See `src/viz/AGENTS.md`.
- `src/app/`: the DOM-only iframe app with the D3 renderers. Built by Vite into
  a single self-contained `dist/app/index.html`. See `src/app/AGENTS.md`.
- `src/server.ts`: builds the `FastMCP` instance, registers the tool and the
  `ui://dataviz-mcp/app.html` resource (reads the built HTML at load() time).
  Does not start a transport, so it is importable in tests.
- `src/index.ts`: executable entry; constructs the server and starts the
  selected transport. Keep it thin.
- `.github/workflows/ci.yml`: biome ci, typecheck, `build:app` (the server
  resource test reads `dist/app/index.html`), tests, then `build:server`.

## Key Decisions

- 2026-06-11: Tool input is records + encodings (data: flat objects, encodings
  map field names to channels). Why: one uniform shape the calling LLM can fill
  from any tabular source.
- 2026-06-11: MCP App wiring uses FastMCP's native `_meta`/addResource directly,
  not the ext-apps server helpers. Why: the helpers target the raw SDK McpServer
  and FastMCP v4 supports everything needed.
- 2026-06-11: The app is one Vite single-file bundle with D3 inlined (no CDN).
  Why: avoids MCP Apps CSP configuration entirely.
- 2026-06-11: D3 renderers are original code guided by the unlicensed
  chrisvoncsefalvay/claude-d3js-skill patterns. Why: no license means its asset
  files cannot be copied verbatim.

## Verification

`pnpm typecheck && pnpm test && pnpm build`, then stdio smoke:
`tools/list` must show `_meta.ui.resourceUri` on the tool and `resources/read`
of `ui://dataviz-mcp/app.html` must return HTML with mimeType
`text/html;profile=mcp-app`. For a visual check, run with
`MCP_TRANSPORT=httpStream` and connect the basic-host example from the
modelcontextprotocol/ext-apps repo (`SERVERS='["http://localhost:8080/mcp"]'`).
