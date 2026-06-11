import { type Selection, select } from 'd3'
import type { VizSpec } from '../../viz/spec.js'
import type { Dimensions } from './measure.js'

export interface Margin {
  top: number
  right: number
  bottom: number
  left: number
}

export const DEFAULT_MARGIN: Margin = { top: 48, right: 24, bottom: 56, left: 64 }

export interface ChartFrame {
  svg: Selection<SVGSVGElement, unknown, null, undefined>
  plot: Selection<SVGGElement, unknown, null, undefined>
  /** Inner plot-area size (margin convention) */
  width: number
  height: number
}

/**
 * Margin-convention chart scaffold shared by all renderers: the svg, the
 * translated plot group, and title/axis labels at fixed positions (no text
 * measurement, so it stays happy-dom safe).
 */
export function createChartFrame(
  container: HTMLElement,
  spec: VizSpec,
  dims: Dimensions,
  marginOverrides: Partial<Margin> = {},
): ChartFrame {
  const margin = { ...DEFAULT_MARGIN, ...marginOverrides }
  const width = Math.max(dims.width - margin.left - margin.right, 50)
  const height = Math.max(dims.height - margin.top - margin.bottom, 50)

  const svg = select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${dims.width} ${dims.height}`)
    .attr('width', dims.width)
    .attr('height', dims.height)

  if (spec.title !== undefined) {
    svg
      .append('text')
      .attr('class', 'viz-title')
      .attr('x', dims.width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .text(spec.title)
  }
  if (spec.xLabel !== undefined) {
    svg
      .append('text')
      .attr('class', 'viz-x-label')
      .attr('x', margin.left + width / 2)
      .attr('y', dims.height - 8)
      .attr('text-anchor', 'middle')
      .text(spec.xLabel)
  }
  if (spec.yLabel !== undefined) {
    svg
      .append('text')
      .attr('class', 'viz-y-label')
      .attr('transform', `translate(14, ${margin.top + height / 2}) rotate(-90)`)
      .attr('text-anchor', 'middle')
      .text(spec.yLabel)
  }

  const plot = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

  return { svg, plot, width, height }
}
