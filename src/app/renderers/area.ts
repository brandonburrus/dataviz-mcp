import {
  area,
  axisBottom,
  axisLeft,
  bisector,
  extent,
  pointer,
  type ScaleLinear,
  scaleLinear,
} from 'd3'
import { distinctValues, parseXValues, toRecords } from '../../viz/data.js'
import type { VizSpec } from '../../viz/spec.js'
import { createChartFrame } from '../shared/chart.js'
import { categoricalColorScale } from '../shared/colors.js'
import { renderLegend } from '../shared/legend.js'
import { type Dimensions, measure } from '../shared/measure.js'
import { buildXScale, type XScale } from '../shared/scales.js'
import { createTooltip } from '../shared/tooltip.js'
import { attachZoom } from '../shared/zoom.js'

interface Point {
  x: number | Date
  y: number
}

interface Series {
  key: string
  points: Point[]
}

let clipIdCounter = 0

function buildSeries(spec: VizSpec): Series[] {
  const xField = spec.encodings.x as string
  const yField = spec.encodings.y as string
  const seriesField = spec.encodings.series
  const data = toRecords(spec)
  const { values } = parseXValues(data, xField)

  const keys = seriesField === undefined ? [''] : distinctValues(data, seriesField)
  return keys.map(key => {
    const points = data
      .map((record, index) => ({ record, x: values[index] as number | Date }))
      .filter(({ record }) => seriesField === undefined || String(record[seriesField]) === key)
      .map(({ record, x }) => ({ x, y: record[yField] as number }))
      .sort((a, b) => Number(a.x) - Number(b.x))
    return { key: key === '' ? yField : key, points }
  })
}

export function renderAreaChart(
  container: HTMLElement,
  spec: VizSpec,
  dims: Dimensions = measure(container),
): void {
  const { isTime } = parseXValues(toRecords(spec), spec.encodings.x as string)
  const allSeries = buildSeries(spec)
  const seriesKeys = allSeries.map(series => series.key)
  const color = categoricalColorScale(seriesKeys, spec.colorScheme)
  const hidden = new Set<string>()

  const tooltip = createTooltip(container)
  if (spec.encodings.series !== undefined) {
    renderLegend(container, {
      keys: seriesKeys,
      color,
      onToggle: hiddenKeys => {
        hidden.clear()
        for (const key of hiddenKeys) hidden.add(key)
        draw()
      },
    })
  }

  const frame = createChartFrame(container, spec, dims)
  const allPoints = allSeries.flatMap(series => series.points)
  const xDomain = extent(allPoints, point => point.x as number) as [number, number]
  const yExtent = extent(allPoints, point => point.y) as [number, number]
  // Area charts read against a baseline, so the y domain must include 0
  const yDomain: [number, number] = [Math.min(0, yExtent[0]), Math.max(0, yExtent[1])]
  const baseX = buildXScale(isTime, xDomain, frame.width)
  const y = scaleLinear().domain(yDomain).nice().range([frame.height, 0])
  let currentX: XScale = baseX

  clipIdCounter += 1
  const clipId = `viz-area-clip-${clipIdCounter}`
  frame.svg
    .append('defs')
    .append('clipPath')
    .attr('id', clipId)
    .append('rect')
    .attr('width', frame.width)
    .attr('height', frame.height)

  const xAxisGroup = frame.plot
    .append('g')
    .attr('class', 'viz-x-axis')
    .attr('transform', `translate(0,${frame.height})`)
    .call(axisBottom(baseX))
  frame.plot.append('g').attr('class', 'viz-y-axis').call(axisLeft(y))
  const areasGroup = frame.plot
    .append('g')
    .attr('class', 'viz-areas')
    .attr('clip-path', `url(#${clipId})`)

  function draw(): void {
    const visible = allSeries.filter(series => !hidden.has(series.key))
    const areaGenerator = area<Point>()
      .x(point => currentX(point.x as number))
      .y0(y(0))
      .y1(point => y(point.y))

    xAxisGroup.call(axisBottom(currentX))
    areasGroup
      .selectAll<SVGPathElement, Series>('path.viz-area')
      .data(visible, series => series.key)
      .join('path')
      .attr('class', 'viz-area')
      // Translucent so overlapping series stay readable without a stacking step
      .attr('fill', series => color(series.key))
      .attr('fill-opacity', 0.5)
      .attr('stroke', series => color(series.key))
      .attr('stroke-width', 1.5)
      .attr('d', series => areaGenerator(series.points))
  }

  // Transparent overlay for bisect-based nearest-point tooltips across visible series
  const bisectX = bisector<Point, number>(point => Number(point.x)).center
  frame.plot
    .append('rect')
    .attr('class', 'viz-overlay')
    .attr('width', frame.width)
    .attr('height', frame.height)
    .attr('fill', 'transparent')
    .on('mousemove', (event: MouseEvent) => {
      const [pointerX] = pointer(event, frame.plot.node())
      const xValue = Number(currentX.invert(pointerX))
      const rows = allSeries
        .filter(series => !hidden.has(series.key) && series.points.length > 0)
        .map(series => {
          const point = series.points[bisectX(series.points, xValue)] as Point
          return `${series.key}: ${point.y}`
        })
      tooltip.show(rows.join('<br>'), event.offsetX, event.offsetY)
    })
    .on('mouseleave', () => tooltip.hide())

  attachZoom(frame.svg.node() as SVGSVGElement, frame.width, frame.height, transform => {
    currentX = transform.rescaleX(baseX as ScaleLinear<number, number>)
    draw()
  })

  draw()
}
