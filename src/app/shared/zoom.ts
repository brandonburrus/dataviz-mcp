import { select, zoom, type ZoomTransform } from 'd3'

/**
 * Wires d3.zoom on an svg with sensible bounds for chart pan/zoom.
 * The renderer receives the transform and rescales its own axes/marks
 * (e.g. transform.rescaleX(xScale)).
 */
export function attachZoom(
  svgElement: SVGSVGElement,
  plotWidth: number,
  plotHeight: number,
  onZoom: (transform: ZoomTransform) => void,
): void {
  const behavior = zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 20])
    .extent([
      [0, 0],
      [plotWidth, plotHeight],
    ])
    .translateExtent([
      [0, 0],
      [plotWidth, plotHeight],
    ])
    .on('zoom', event => onZoom(event.transform))

  select(svgElement).call(behavior)
}
