import type { VizSpec, VizType } from '../viz/spec.js'
import { renderAreaChart } from './renderers/area.js'
import { renderBarChart } from './renderers/bar.js'
import { renderBubbleChart } from './renderers/bubble.js'
import { renderHeatmap } from './renderers/heatmap.js'
import { renderHistogram } from './renderers/histogram.js'
import { renderLineChart } from './renderers/line.js'
import { renderPieChart } from './renderers/pie.js'
import { renderScatterChart } from './renderers/scatter.js'
import { renderStackedAreaChart } from './renderers/stacked-area.js'
import { renderStackedBarChart } from './renderers/stacked-bar.js'
import type { Dimensions } from './shared/measure.js'

export type Renderer = (container: HTMLElement, spec: VizSpec, dims?: Dimensions) => void

const RENDERERS: Record<VizType, Renderer> = {
  bar: renderBarChart,
  'stacked-bar': renderStackedBarChart,
  histogram: renderHistogram,
  line: renderLineChart,
  area: renderAreaChart,
  'stacked-area': renderStackedAreaChart,
  scatter: renderScatterChart,
  bubble: renderBubbleChart,
  pie: renderPieChart,
  // donut shares the pie renderer, which draws an inner radius for type 'donut'
  donut: renderPieChart,
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
