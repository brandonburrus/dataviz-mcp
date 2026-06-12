import { arc, pie, type PieArcDatum, rollup } from 'd3'
import { toRecords } from '../../viz/data.js'
import type { VizSpec } from '../../viz/spec.js'
import { createChartFrame } from '../shared/chart.js'
import { categoricalColorScale } from '../shared/colors.js'
import { renderLegend } from '../shared/legend.js'
import { type Dimensions, measure } from '../shared/measure.js'
import { createTooltip } from '../shared/tooltip.js'

interface Slice {
  category: string
  value: number
}

export function renderPieChart(
  container: HTMLElement,
  spec: VizSpec,
  dims: Dimensions = measure(container),
): void {
  const categoryField = spec.encodings.category as string
  const valueField = spec.encodings.value as string

  // Sum duplicate categories so each appears as a single slice
  const totals = rollup(
    toRecords(spec),
    records => records.reduce((sum, record) => sum + (record[valueField] as number), 0),
    record => String(record[categoryField]),
  )
  const slices: Slice[] = [...totals].map(([category, value]) => ({ category, value }))
  const categories = slices.map(slice => slice.category)
  const color = categoricalColorScale(categories, spec.colorScheme)

  const tooltip = createTooltip(container)
  renderLegend(container, {
    keys: categories,
    color,
    onToggle: hidden => draw(hidden),
  })

  const frame = createChartFrame(container, spec, dims)
  const radius = Math.min(frame.width, frame.height) / 2
  const center = frame.plot
    .append('g')
    .attr('class', 'viz-pie')
    .attr('transform', `translate(${frame.width / 2},${frame.height / 2})`)

  // Stable angles regardless of toggling: sort(null) keeps data order
  const pieGenerator = pie<Slice>()
    .value(slice => slice.value)
    .sort(null)
  const arcGenerator = arc<PieArcDatum<Slice>>().innerRadius(0).outerRadius(radius)

  function draw(hidden: ReadonlySet<string>): void {
    const visible = slices.filter(slice => !hidden.has(slice.category))
    const totalVisible = visible.reduce((sum, slice) => sum + slice.value, 0)

    center
      .selectAll<SVGPathElement, PieArcDatum<Slice>>('path.viz-slice')
      .data(pieGenerator(visible), datum => datum.data.category)
      .join('path')
      .attr('class', 'viz-slice')
      .attr('fill', datum => color(datum.data.category))
      .on('mouseenter', (event: MouseEvent, datum) => {
        const percent = totalVisible === 0 ? 0 : (datum.data.value / totalVisible) * 100
        tooltip.show(
          `${datum.data.category}: ${datum.data.value} (${percent.toFixed(1)}%)`,
          event.offsetX,
          event.offsetY,
        )
      })
      .on('mousemove', (event: MouseEvent) => tooltip.move(event.offsetX, event.offsetY))
      .on('mouseleave', () => tooltip.hide())
      .transition()
      .duration(300)
      .attr('d', datum => arcGenerator(datum))
  }

  draw(new Set())
}
