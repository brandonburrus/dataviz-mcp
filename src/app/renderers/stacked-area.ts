import {
  area,
  axisBottom,
  axisLeft,
  extent,
  max,
  scaleLinear,
  type Series,
  type SeriesPoint,
  stack,
} from 'd3'
import { distinctValues, parseXValues, toRecords } from '../../viz/data.js'
import type { VizSpec } from '../../viz/spec.js'
import { createChartFrame } from '../shared/chart.js'
import { categoricalColorScale } from '../shared/colors.js'
import { renderLegend } from '../shared/legend.js'
import { type Dimensions, measure } from '../shared/measure.js'
import { buildXScale } from '../shared/scales.js'
import { createTooltip } from '../shared/tooltip.js'

/** One row per distinct x position, holding the summed value for each series key. */
interface PivotRow {
  x: number | Date
  values: Record<string, number>
}

export function renderStackedAreaChart(
  container: HTMLElement,
  spec: VizSpec,
  dims: Dimensions = measure(container),
): void {
  const xField = spec.encodings.x as string
  const yField = spec.encodings.y as string
  const seriesField = spec.encodings.series as string

  const data = toRecords(spec)
  const { values: xValues, isTime } = parseXValues(data, xField)
  const seriesKeys = distinctValues(data, seriesField)
  const color = categoricalColorScale(seriesKeys, spec.colorScheme)

  // Pivot to one row per distinct x, summing repeated (x, series) pairs so each
  // series contributes a single value at every position d3.stack stacks.
  const pivot = new Map<number, PivotRow>()
  data.forEach((record, index) => {
    const xValue = xValues[index] as number | Date
    const xKey = Number(xValue)
    let row = pivot.get(xKey)
    if (row === undefined) {
      row = { x: xValue, values: {} }
      pivot.set(xKey, row)
    }
    const key = String(record[seriesField])
    row.values[key] = (row.values[key] ?? 0) + (record[yField] as number)
  })
  const pivotRows = [...pivot.values()].sort((a, b) => Number(a.x) - Number(b.x))

  const tooltip = createTooltip(container)
  renderLegend(container, { keys: seriesKeys, color, onToggle: hidden => draw(hidden) })

  const frame = createChartFrame(container, spec, dims)
  const x = buildXScale(
    isTime,
    extent(pivotRows, row => Number(row.x)) as [number, number],
    frame.width,
  )
  const y = scaleLinear().range([frame.height, 0])

  frame.plot
    .append('g')
    .attr('class', 'viz-x-axis')
    .attr('transform', `translate(0,${frame.height})`)
    .call(axisBottom(x))
  const yAxis = frame.plot.append('g').attr('class', 'viz-y-axis')
  const areasGroup = frame.plot.append('g').attr('class', 'viz-areas')

  function draw(hidden: ReadonlySet<string>): void {
    const visibleKeys = seriesKeys.filter(key => !hidden.has(key))
    const series = stack<PivotRow, string>()
      .keys(visibleKeys)
      .value((row, key) => row.values[key] ?? 0)(pivotRows)
    // Rescale y to the tallest visible stack so hidden series reclaim the axis
    const yMax =
      max(pivotRows, row => visibleKeys.reduce((sum, key) => sum + (row.values[key] ?? 0), 0)) ?? 0
    y.domain([0, yMax]).nice()
    yAxis.call(axisLeft(y))

    const areaGenerator = area<SeriesPoint<PivotRow>>()
      .x(point => x(Number(point.data.x)))
      .y0(point => y(point[0]))
      .y1(point => y(point[1]))

    areasGroup
      .selectAll<SVGPathElement, Series<PivotRow, string>>('path.viz-area')
      .data(series, layer => layer.key)
      .join('path')
      .attr('class', 'viz-area')
      .attr('fill', layer => color(layer.key))
      .attr('fill-opacity', 0.85)
      .attr('stroke', layer => color(layer.key))
      .attr('stroke-width', 1)
      .on('mouseenter', (event: MouseEvent, layer) =>
        tooltip.show(layer.key, event.offsetX, event.offsetY),
      )
      .on('mousemove', (event: MouseEvent) => tooltip.move(event.offsetX, event.offsetY))
      .on('mouseleave', () => tooltip.hide())
      .attr('d', layer => areaGenerator(layer))
  }

  draw(new Set())
}
