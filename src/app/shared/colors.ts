import {
  interpolatePlasma,
  interpolateViridis,
  scaleOrdinal,
  scaleSequential,
  schemeCategory10,
  schemeDark2,
  schemeTableau10,
} from 'd3'
import type { ColorScheme } from '../../viz/spec.js'

// Literal defaults rather than the constants from viz/spec.js: that module
// imports zod, and a value import would pull zod into the browser bundle.
const CATEGORICAL_PALETTES: Partial<Record<ColorScheme, readonly string[]>> = {
  tableau10: schemeTableau10,
  category10: schemeCategory10,
  dark2: schemeDark2,
}

const SEQUENTIAL_INTERPOLATORS: Partial<Record<ColorScheme, (t: number) => string>> = {
  viridis: interpolateViridis,
  plasma: interpolatePlasma,
}

export function categoricalColorScale(
  domain: string[],
  scheme?: ColorScheme,
): (key: string) => string {
  const palette = CATEGORICAL_PALETTES[scheme ?? 'tableau10'] ?? schemeTableau10
  const scale = scaleOrdinal<string, string>(palette).domain(domain)
  return key => scale(key)
}

export function sequentialColorScale(
  domain: [number, number],
  scheme?: ColorScheme,
): (value: number) => string {
  const interpolator = SEQUENTIAL_INTERPOLATORS[scheme ?? 'viridis'] ?? interpolateViridis
  const scale = scaleSequential(interpolator).domain(domain)
  return value => scale(value)
}
