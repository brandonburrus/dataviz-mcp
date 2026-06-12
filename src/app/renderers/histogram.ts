import { axisBottom, axisLeft, type Bin, bin, extent, max, scaleLinear } from 'd3'
import { toRecords } from '../../viz/data.js'
import type { VizSpec } from '../../viz/spec.js'
import { createChartFrame } from '../shared/chart.js'
import { categoricalColorScale } from '../shared/colors.js'
import { type Dimensions, measure } from '../shared/measure.js'
import { createTooltip } from '../shared/tooltip.js'

export function renderHistogram(
  container: HTMLElement,
  spec: VizSpec,
  dims: Dimensions = measure(container),
): void {
  const xField = spec.encodings.x as string
  const values = toRecords(spec).map(record => record[xField] as number)

  const frame = createChartFrame(container, spec, dims)
  const x = scaleLinear()
    .domain(extent(values) as [number, number])
    .nice()
    .range([0, frame.width])
  // Align bin edges to the axis ticks so bars sit under labeled boundaries
  const bins = bin<number, number>()
    .domain(x.domain() as [number, number])
    .thresholds(x.ticks(20))(values)
  const y = scaleLinear()
    .domain([0, max(bins, eachBin => eachBin.length) ?? 0])
    .nice()
    .range([frame.height, 0])

  frame.plot
    .append('g')
    .attr('class', 'viz-x-axis')
    .attr('transform', `translate(0,${frame.height})`)
    .call(axisBottom(x))
  frame.plot.append('g').attr('class', 'viz-y-axis').call(axisLeft(y))

  const fill = categoricalColorScale([xField], spec.colorScheme)(xField)
  const tooltip = createTooltip(container)

  frame.plot
    .append('g')
    .attr('class', 'viz-bars')
    .selectAll<SVGRectElement, Bin<number, number>>('rect.viz-bar')
    .data(bins)
    .join('rect')
    .attr('class', 'viz-bar')
    .attr('data-count', eachBin => eachBin.length)
    .attr('fill', fill)
    .attr('x', eachBin => x(eachBin.x0 as number) + 1)
    .attr('width', eachBin => Math.max(0, x(eachBin.x1 as number) - x(eachBin.x0 as number) - 1))
    .attr('y', eachBin => y(eachBin.length))
    .attr('height', eachBin => frame.height - y(eachBin.length))
    .on('mouseenter', (event: MouseEvent, eachBin) =>
      tooltip.show(
        `[${eachBin.x0}, ${eachBin.x1}): ${eachBin.length}`,
        event.offsetX,
        event.offsetY,
      ),
    )
    .on('mousemove', (event: MouseEvent) => tooltip.move(event.offsetX, event.offsetY))
    .on('mouseleave', () => tooltip.hide())
}
