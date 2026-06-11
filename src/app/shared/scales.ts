import { type ScaleLinear, type ScaleTime, scaleLinear, scaleTime } from 'd3'

export type XScale = ScaleLinear<number, number> | ScaleTime<number, number>

/** Continuous x scale for line/scatter: time scale for ISO-date data, linear otherwise. */
export function buildXScale(
  isTime: boolean,
  domain: [number | Date, number | Date],
  width: number,
): XScale {
  if (isTime) {
    return scaleTime()
      .domain(domain as [Date, Date])
      .range([0, width])
  }
  return scaleLinear()
    .domain(domain as [number, number])
    .range([0, width])
}
