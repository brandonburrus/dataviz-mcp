import { axisBottom, axisLeft, max, min, scaleBand, scaleLinear } from 'd3'
import { distinctValues, toRecords } from '../../viz/data.js'
import type { DataRecord, VizSpec } from '../../viz/spec.js'
import { createChartFrame } from '../shared/chart.js'
import { categoricalColorScale } from '../shared/colors.js'
import { renderLegend } from '../shared/legend.js'
import { type Dimensions, measure } from '../shared/measure.js'
import { createTooltip } from '../shared/tooltip.js'

export function renderBarChart(
  container: HTMLElement,
  spec: VizSpec,
  dims: Dimensions = measure(container),
): void {
  const xField = spec.encodings.x as string
  const yField = spec.encodings.y as string
  const seriesField = spec.encodings.series

  const data = toRecords(spec)
  const categories = distinctValues(data, xField)
  const seriesKeys = seriesField === undefined ? [] : distinctValues(data, seriesField)
  const color = categoricalColorScale(
    seriesKeys.length > 0 ? seriesKeys : [yField],
    spec.colorScheme,
  )

  const tooltip = createTooltip(container)
  if (seriesKeys.length > 0) {
    renderLegend(container, {
      keys: seriesKeys,
      color,
      onToggle: hidden => draw(hidden),
    })
  }

  const frame = createChartFrame(container, spec, dims)
  const yMin = Math.min(0, min(data, record => record[yField] as number) ?? 0)
  const yMax = Math.max(0, max(data, record => record[yField] as number) ?? 0)
  const x0 = scaleBand().domain(categories).range([0, frame.width]).padding(0.15)
  const y = scaleLinear().domain([yMin, yMax]).nice().range([frame.height, 0])

  frame.plot
    .append('g')
    .attr('class', 'viz-x-axis')
    .attr('transform', `translate(0,${frame.height})`)
    .call(axisBottom(x0))
  frame.plot.append('g').attr('class', 'viz-y-axis').call(axisLeft(y))
  const barsGroup = frame.plot.append('g').attr('class', 'viz-bars')

  const seriesOf = (record: DataRecord) =>
    seriesField === undefined ? yField : String(record[seriesField])

  function draw(hidden: ReadonlySet<string>): void {
    const visibleSeries = seriesKeys.filter(key => !hidden.has(key))
    const records = data.filter(
      record => seriesField === undefined || !hidden.has(seriesOf(record)),
    )
    // Inner band over the visible series so remaining bars widen on toggle
    const x1 = scaleBand()
      .domain(visibleSeries.length > 0 ? visibleSeries : [yField])
      .range([0, x0.bandwidth()])
      .padding(0.08)

    barsGroup
      .selectAll<SVGRectElement, DataRecord>('rect.viz-bar')
      .data(records, record => `${String(record[xField])}|${seriesOf(record)}`)
      .join('rect')
      .attr('class', 'viz-bar')
      .attr('fill', record => color(seriesOf(record)))
      .on('mouseenter', (event: MouseEvent, record) => {
        const label =
          seriesField === undefined
            ? String(record[xField])
            : `${String(record[xField])} / ${seriesOf(record)}`
        tooltip.show(`${label}: ${record[yField]}`, event.offsetX, event.offsetY)
      })
      .on('mousemove', (event: MouseEvent) => tooltip.move(event.offsetX, event.offsetY))
      .on('mouseleave', () => tooltip.hide())
      .transition()
      .duration(300)
      .attr('x', record => (x0(String(record[xField])) ?? 0) + (x1(seriesOf(record)) ?? 0))
      .attr('width', x1.bandwidth())
      .attr('y', record => y(Math.max(0, record[yField] as number)))
      .attr('height', record => Math.abs(y(record[yField] as number) - y(0)))
  }

  draw(new Set())
}
