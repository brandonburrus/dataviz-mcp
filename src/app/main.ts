import { App } from '@modelcontextprotocol/ext-apps'
import type { VizSpec } from '../viz/spec.js'
import { renderVisualization } from './render.js'

const RESIZE_DEBOUNCE_MS = 100

const root = document.getElementById('root') as HTMLElement
const app = new App({ name: 'dataviz-mcp', version: '0.2.0' })

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
