// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { renderStackedAreaChart } from '../../../src/app/renderers/stacked-area.js'
import type { VizSpec } from '../../../src/viz/spec.js'

const DIMS = { width: 800, height: 500 }

const spec: VizSpec = {
  type: 'stacked-area',
  columns: ['day', 'temp', 'city'],
  rows: [
    ['2024-01-01', 5, 'Oslo'],
    ['2024-01-02', 7, 'Oslo'],
    ['2024-01-01', 12, 'Rome'],
    ['2024-01-02', 14, 'Rome'],
  ],
  encodings: { x: 'day', y: 'temp', series: 'city' },
}

describe('renderStackedAreaChart', () => {
  it('renders one stacked area per series with axes', () => {
    const container = document.createElement('div')
    renderStackedAreaChart(container, spec, DIMS)

    expect(container.querySelectorAll('path.viz-area')).toHaveLength(2)
    expect(container.querySelector('.viz-x-axis')).not.toBeNull()
    expect(container.querySelector('.viz-y-axis')).not.toBeNull()
  })

  it('renders a legend with one item per series', () => {
    const container = document.createElement('div')
    renderStackedAreaChart(container, spec, DIMS)
    expect(container.querySelectorAll('.viz-legend-item')).toHaveLength(2)
  })

  it('hides a series when its legend item is toggled', () => {
    const container = document.createElement('div')
    renderStackedAreaChart(container, spec, DIMS)

    container.querySelector<HTMLButtonElement>('[data-key="Rome"]')?.click()
    expect(container.querySelectorAll('path.viz-area')).toHaveLength(1)
  })

  it('sums repeated x-series pairs into a single layer value', () => {
    const container = document.createElement('div')
    renderStackedAreaChart(
      container,
      {
        ...spec,
        rows: [
          ['2024-01-01', 5, 'Oslo'],
          ['2024-01-01', 4, 'Oslo'],
          ['2024-01-02', 7, 'Oslo'],
        ],
      },
      DIMS,
    )
    // One series, two distinct x positions -> a single area path
    expect(container.querySelectorAll('path.viz-area')).toHaveLength(1)
  })
})
