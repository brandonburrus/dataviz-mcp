import { axisBottom, axisLeft, extent, range, scaleBand } from 'd3'
import { distinctValues, toRecords } from '../../viz/data.js'
import type { DataRecord, VizSpec } from '../../viz/spec.js'
import { createChartFrame } from '../shared/chart.js'
import { sequentialColorScale } from '../shared/colors.js'
import { type Dimensions, measure } from '../shared/measure.js'
import { createTooltip } from '../shared/tooltip.js'

const GRADIENT_LEGEND_WIDTH = 16
const GRADIENT_STOPS = 10

let gradientIdCounter = 0

export function renderHeatmap(
  container: HTMLElement,
  spec: VizSpec,
  dims: Dimensions = measure(container),
): void {
  const xField = spec.encodings.x as string
  const yField = spec.encodings.y as string
  const valueField = spec.encodings.value as string

  const data = toRecords(spec)
  const xCategories = distinctValues(data, xField)
  const yCategories = distinctValues(data, yField)
  const [minValue, maxValue] = extent(data, record => record[valueField] as number) as [
    number,
    number,
  ]
  const color = sequentialColorScale([minValue, maxValue], spec.colorScheme)

  const tooltip = createTooltip(container)
  // Extra right margin hosts the gradient legend
  const frame = createChartFrame(container, spec, dims, { right: 88 })

  const x = scaleBand().domain(xCategories).range([0, frame.width]).padding(0.05)
  const y = scaleBand().domain(yCategories).range([0, frame.height]).padding(0.05)

  frame.plot
    .append('g')
    .attr('class', 'viz-x-axis')
    .attr('transform', `translate(0,${frame.height})`)
    .call(axisBottom(x))
  frame.plot.append('g').attr('class', 'viz-y-axis').call(axisLeft(y))

  frame.plot
    .append('g')
    .attr('class', 'viz-cells')
    .selectAll<SVGRectElement, DataRecord>('rect.viz-cell')
    .data(data)
    .join('rect')
    .attr('class', 'viz-cell')
    .attr('x', record => x(String(record[xField])) ?? 0)
    .attr('y', record => y(String(record[yField])) ?? 0)
    .attr('width', x.bandwidth())
    .attr('height', y.bandwidth())
    .attr('fill', record => color(record[valueField] as number))
    .on('mouseenter', (event: MouseEvent, record) => {
      tooltip.show(
        `${String(record[xField])}, ${String(record[yField])}: ${record[valueField]}`,
        event.offsetX,
        event.offsetY,
      )
    })
    .on('mousemove', (event: MouseEvent) => tooltip.move(event.offsetX, event.offsetY))
    .on('mouseleave', () => tooltip.hide())

  renderGradientLegend(frame, color, minValue, maxValue)
}

function renderGradientLegend(
  frame: ReturnType<typeof createChartFrame>,
  color: (value: number) => string,
  minValue: number,
  maxValue: number,
): void {
  gradientIdCounter += 1
  const gradientId = `viz-heatmap-gradient-${gradientIdCounter}`

  // Vertical gradient from max (top) to min (bottom), sampled from the color scale
  const gradient = frame.svg
    .append('defs')
    .append('linearGradient')
    .attr('id', gradientId)
    .attr('x1', '0')
    .attr('y1', '0')
    .attr('x2', '0')
    .attr('y2', '1')
  for (const step of range(GRADIENT_STOPS + 1)) {
    const t = step / GRADIENT_STOPS
    gradient
      .append('stop')
      .attr('offset', `${t * 100}%`)
      .attr('stop-color', color(maxValue - t * (maxValue - minValue)))
  }

  const legend = frame.plot
    .append('g')
    .attr('class', 'viz-gradient-legend')
    .attr('transform', `translate(${frame.width + 24},0)`)
  legend
    .append('rect')
    .attr('width', GRADIENT_LEGEND_WIDTH)
    .attr('height', frame.height)
    .attr('fill', `url(#${gradientId})`)
  legend
    .append('text')
    .attr('class', 'viz-gradient-max')
    .attr('x', GRADIENT_LEGEND_WIDTH + 6)
    .attr('y', 10)
    .text(String(maxValue))
  legend
    .append('text')
    .attr('class', 'viz-gradient-min')
    .attr('x', GRADIENT_LEGEND_WIDTH + 6)
    .attr('y', frame.height)
    .text(String(minValue))
}
