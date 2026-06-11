import type { VizSpec, VizType } from '../viz/spec.js'
import { renderBarChart } from './renderers/bar.js'
import { renderHeatmap } from './renderers/heatmap.js'
import { renderLineChart } from './renderers/line.js'
import { renderPieChart } from './renderers/pie.js'
import { renderScatterChart } from './renderers/scatter.js'
import type { Dimensions } from './shared/measure.js'

export type Renderer = (container: HTMLElement, spec: VizSpec, dims?: Dimensions) => void

const RENDERERS: Record<VizType, Renderer> = {
  bar: renderBarChart,
  line: renderLineChart,
  scatter: renderScatterChart,
  pie: renderPieChart,
  heatmap: renderHeatmap,
}

/** Clears the container and renders the spec with the renderer for its type. */
export function renderVisualization(
  container: HTMLElement,
  spec: VizSpec,
  dims?: Dimensions,
): void {
  container.innerHTML = ''
  RENDERERS[spec.type](container, spec, dims)
}
