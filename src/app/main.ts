import { App } from '@modelcontextprotocol/ext-apps'
import type { VizSpec } from '../viz/spec.js'
import { renderVisualization } from './render.js'

const RESIZE_DEBOUNCE_MS = 100

/** Package version inlined at build time by Vite from package.json (see vite.config.ts). */
declare const __PKG_VERSION__: `${number}.${number}.${number}`

const root = document.getElementById('root') as HTMLElement
const app = new App({ name: 'dataviz-mcp', version: __PKG_VERSION__ })

let currentSpec: VizSpec | undefined

app.addEventListener('toolresult', result => {
  // The server validated the spec and returned it as structuredContent
  currentSpec = result.structuredContent as VizSpec | undefined
  if (currentSpec !== undefined) {
    renderVisualization(root, currentSpec)
  }
})

let resizeTimer: ReturnType<typeof setTimeout> | undefined
new ResizeObserver(() => {
  if (currentSpec === undefined) return
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => {
    if (currentSpec !== undefined) renderVisualization(root, currentSpec)
  }, RESIZE_DEBOUNCE_MS)
}).observe(root)

await app.connect()
