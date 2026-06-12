import { axisBottom, axisLeft, extent, max, type ScaleLinear, scaleLinear, scaleSqrt } from 'd3'
import { distinctValues, parseXValues, toRecords } from '../../viz/data.js'
import type { DataRecord, VizSpec } from '../../viz/spec.js'
import { createChartFrame } from '../shared/chart.js'
import { categoricalColorScale } from '../shared/colors.js'
import { renderLegend } from '../shared/legend.js'
import { type Dimensions, measure } from '../shared/measure.js'
import { buildXScale, type XScale } from '../shared/scales.js'
import { createTooltip } from '../shared/tooltip.js'
import { attachZoom } from '../shared/zoom.js'

interface Dot {
  x: number | Date
  y: number
  size: number
  series: string
  record: DataRecord
}

let clipIdCounter = 0

export function renderBubbleChart(
  container: HTMLElement,
  spec: VizSpec,
  dims: Dimensions = measure(container),
): void {
  const xField = spec.encodings.x as string
  const yField = spec.encodings.y as string
  const sizeField = spec.encodings.size as string
  const seriesField = spec.encodings.series
  const data = toRecords(spec)
  const { values, isTime } = parseXValues(data, xField)

  const dots: Dot[] = data.map((record, index) => ({
    x: values[index] as number | Date,
    y: record[yField] as number,
    size: record[sizeField] as number,
    series: seriesField === undefined ? yField : String(record[seriesField]),
    record,
  }))
  const seriesKeys = seriesField === undefined ? [yField] : distinctValues(data, seriesField)
  const color = categoricalColorScale(seriesKeys, spec.colorScheme)
  // sqrt scale from 0 so the rendered area (not radius) is proportional to value
  const radius = scaleSqrt()
    .domain([0, max(dots, dot => dot.size) ?? 0])
    .range([3, 28])
  const hidden = new Set<string>()

  const tooltip = createTooltip(container)
  if (seriesField !== undefined) {
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
  const baseX = buildXScale(
    isTime,
    extent(dots, dot => dot.x as number) as [number, number],
    frame.width,
  )
  const baseY = scaleLinear()
    .domain(extent(dots, dot => dot.y) as [number, number])
    .nice()
    .range([frame.height, 0])
  let currentX: XScale = baseX
  let currentY = baseY

  clipIdCounter += 1
  const clipId = `viz-bubble-clip-${clipIdCounter}`
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
  const yAxisGroup = frame.plot.append('g').attr('class', 'viz-y-axis').call(axisLeft(baseY))
  const dotsGroup = frame.plot
    .append('g')
    .attr('class', 'viz-dots')
    .attr('clip-path', `url(#${clipId})`)

  function draw(): void {
    xAxisGroup.call(axisBottom(currentX))
    yAxisGroup.call(axisLeft(currentY))
    dotsGroup
      .selectAll<SVGCircleElement, Dot>('circle.viz-dot')
      .data(
        dots.filter(dot => !hidden.has(dot.series)),
        (dot, index) => `${dot.series}|${index}`,
      )
      .join('circle')
      .attr('class', 'viz-dot')
      .attr('r', dot => radius(dot.size))
      .attr('fill', dot => color(dot.series))
      .attr('fill-opacity', 0.7)
      .on('mouseenter', (event: MouseEvent, dot) => {
        const xText = dot.x instanceof Date ? dot.x.toISOString().slice(0, 10) : dot.x
        const seriesText = seriesField === undefined ? '' : `${dot.series}<br>`
        tooltip.show(
          `${seriesText}${xField}: ${xText}<br>${yField}: ${dot.y}<br>${sizeField}: ${dot.size}`,
          event.offsetX,
          event.offsetY,
        )
      })
      .on('mousemove', (event: MouseEvent) => tooltip.move(event.offsetX, event.offsetY))
      .on('mouseleave', () => tooltip.hide())
      .attr('cx', dot => currentX(dot.x as number))
      .attr('cy', dot => currentY(dot.y))
  }

  attachZoom(frame.svg.node() as SVGSVGElement, frame.width, frame.height, transform => {
    currentX = transform.rescaleX(baseX as ScaleLinear<number, number>)
    currentY = transform.rescaleY(baseY)
    draw()
  })

  draw()
}
