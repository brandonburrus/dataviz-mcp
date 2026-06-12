import {
  axisBottom,
  axisLeft,
  max,
  scaleBand,
  scaleLinear,
  type Series,
  type SeriesPoint,
  stack,
} from 'd3'
import { distinctValues, toRecords } from '../../viz/data.js'
import type { VizSpec } from '../../viz/spec.js'
import { createChartFrame } from '../shared/chart.js'
import { categoricalColorScale } from '../shared/colors.js'
import { renderLegend } from '../shared/legend.js'
import { type Dimensions, measure } from '../shared/measure.js'
import { createTooltip } from '../shared/tooltip.js'

/** One row per x category holding the summed value for each series key. */
type PivotRow = Record<string, number>

interface Segment {
  point: SeriesPoint<PivotRow>
  category: string
  key: string
}

export function renderStackedBarChart(
  container: HTMLElement,
  spec: VizSpec,
  dims: Dimensions = measure(container),
): void {
  const xField = spec.encodings.x as string
  const yField = spec.encodings.y as string
  const seriesField = spec.encodings.series as string

  const data = toRecords(spec)
  const categories = distinctValues(data, xField)
  const seriesKeys = distinctValues(data, seriesField)
  const color = categoricalColorScale(seriesKeys, spec.colorScheme)

  // Pivot to one row per category, summing the value of each series so repeated
  // (category, series) pairs collapse into a single stacked segment.
  const pivot = new Map<string, PivotRow>(categories.map(category => [category, {}]))
  for (const record of data) {
    const row = pivot.get(String(record[xField]))
    if (row === undefined) continue
    const key = String(record[seriesField])
    row[key] = (row[key] ?? 0) + (record[yField] as number)
  }
  const pivotRows = categories.map(category => pivot.get(category) as PivotRow)

  const tooltip = createTooltip(container)
  renderLegend(container, { keys: seriesKeys, color, onToggle: hidden => draw(hidden) })

  const frame = createChartFrame(container, spec, dims)
  const x = scaleBand().domain(categories).range([0, frame.width]).padding(0.15)
  const y = scaleLinear().range([frame.height, 0])

  frame.plot
    .append('g')
    .attr('class', 'viz-x-axis')
    .attr('transform', `translate(0,${frame.height})`)
    .call(axisBottom(x))
  const yAxis = frame.plot.append('g').attr('class', 'viz-y-axis')
  const barsGroup = frame.plot.append('g').attr('class', 'viz-bars')

  function draw(hidden: ReadonlySet<string>): void {
    const visibleKeys = seriesKeys.filter(key => !hidden.has(key))
    const series = stack<PivotRow, string>().keys(visibleKeys)(pivotRows)
    // Rescale y to the tallest visible stack so hidden series reclaim the axis.
    const yMax =
      max(pivotRows, row => visibleKeys.reduce((sum, key) => sum + (row[key] ?? 0), 0)) ?? 0
    y.domain([0, yMax]).nice()
    // Redraw the axis without a transition: a transitioned axis tweens each
    // tick's transform attribute, which happy-dom cannot interpolate.
    yAxis.call(axisLeft(y))

    barsGroup
      .selectAll<SVGGElement, Series<PivotRow, string>>('g.viz-layer')
      .data(series, layer => layer.key)
      .join('g')
      .attr('class', 'viz-layer')
      .attr('fill', layer => color(layer.key))
      .selectAll<SVGRectElement, Segment>('rect.viz-bar')
      .data(
        layer =>
          layer.map((point, index) => ({
            point,
            category: categories[index] as string,
            key: layer.key,
          })),
        segment => segment.category,
      )
      .join('rect')
      .attr('class', 'viz-bar')
      .attr('x', segment => x(segment.category) ?? 0)
      .attr('width', x.bandwidth())
      .on('mouseenter', (event: MouseEvent, segment) => {
        const value = segment.point[1] - segment.point[0]
        tooltip.show(`${segment.category} / ${segment.key}: ${value}`, event.offsetX, event.offsetY)
      })
      .on('mousemove', (event: MouseEvent) => tooltip.move(event.offsetX, event.offsetY))
      .on('mouseleave', () => tooltip.hide())
      .transition()
      .duration(300)
      .attr('y', segment => y(segment.point[1]))
      .attr('height', segment => Math.max(0, y(segment.point[0]) - y(segment.point[1])))
  }

  draw(new Set())
}
