# src/app

## Purpose

The MCP App: a DOM-only page, bundled by Vite + vite-plugin-singlefile into one
self-contained `dist/app/index.html` (D3 inlined), that the host renders in a
sandboxed iframe and feeds tool results to. It renders the validated `VizSpec`
it receives via the ext-apps `toolresult` event.

## How it works

- `index.html`: Vite entry; holds the root div and all base CSS (tooltip,
  legend, labels).
- `main.ts`: bootstrap. Creates the ext-apps `App`, listens with
  `app.addEventListener('toolresult', ...)` (the `ontoolresult` setter is
  deprecated), takes `result.structuredContent` as the spec, renders, and
  re-renders on a 100ms-debounced ResizeObserver. Excluded from coverage; keep
  logic out of it.
- `render.ts`: `renderVisualization` clears the container and dispatches on
  `spec.type` via a `Record<VizType, Renderer>` table.
- `renderers/`: one file per viz type. The contract is a pure function
  `(container, spec, dims?) => void`; dimensions are injectable so tests pass
  explicit sizes. Interactivity: tooltips everywhere; legend series toggling on
  bar/line/scatter/pie; zoom/pan on line (x) and scatter (x+y) with clip paths;
  gradient legend on heatmap.
- `shared/`: chart frame (margin convention + title/labels), tooltip div,
  HTML legend with hidden-set toggling, color scale factories, x-scale builder
  (time vs linear), d3.zoom wiring.

## Critical constraints

- **This module has its own tsconfig** (DOM lib, Bundler resolution); the root
  node tsconfig excludes it. New files are picked up automatically; new imports
  from `src/viz/` must be added to the tsconfig `include` array if they are new
  files.
- **Never value-import zod or fastmcp** (directly or transitively). From
  `../viz/spec.js` use `import type` only; runtime helpers live in
  `../viz/data.js`, which is bundle-safe.
- **happy-dom test discipline**: renderers must not call `getBBox()` or
  `getComputedTextLength()` (unimplemented there), must accept explicit
  dimensions (layout reports zero, `measure()` falls back to 800x500), and tests
  assert structure (element counts, classes, text), never animated attribute
  values (d3 transitions run on rAF timers).
- Use named d3 imports (`import { scaleLinear } from 'd3'`) so rollup
  tree-shakes the single-file bundle.
- `vite.config.ts` builds with `emptyOutDir: true` because the outDir lives
  outside the vite root; the build target is es2022 for top-level await. Vite
  stays at major 7: vite-plugin-singlefile hooks raw rollup output and vite 8
  is rolldown-based.
