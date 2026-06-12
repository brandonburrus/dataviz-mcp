// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { renderAreaChart } from '../../../src/app/renderers/area.js'
import type { VizSpec } from '../../../src/viz/spec.js'

const DIMS = { width: 800, height: 500 }

const multiSeriesSpec: VizSpec = {
  type: 'area',
  columns: ['day', 'temp', 'city'],
  rows: [
    ['2024-01-01', 5, 'Oslo'],
    ['2024-01-02', 7, 'Oslo'],
    ['2024-01-01', 12, 'Rome'],
    ['2024-01-02', 14, 'Rome'],
  ],
  encodings: { x: 'day', y: 'temp', series: 'city' },
}

describe('renderAreaChart', () => {
  it('renders one filled area per series with axes and a clip path', () => {
    const container = document.createElement('div')
    renderAreaChart(container, multiSeriesSpec, DIMS)

    const areas = container.querySelectorAll('path.viz-area')
    expect(areas).toHaveLength(2)
    // distinguishes area from line: the path is filled, not stroke-only
    expect(areas[0]?.getAttribute('fill')).not.toBe('none')
    expect(container.querySelector('.viz-x-axis')).not.toBeNull()
    expect(container.querySelector('.viz-y-axis')).not.toBeNull()
    expect(container.querySelector('clipPath')).not.toBeNull()
  })

  it('renders a single unnamed series without a legend', () => {
    const container = document.createElement('div')
    renderAreaChart(
      container,
      {
        type: 'area',
        columns: ['day', 'temp'],
        rows: [
          [1, 5],
          [2, 7],
        ],
        encodings: { x: 'day', y: 'temp' },
      },
      DIMS,
    )
    expect(container.querySelectorAll('path.viz-area')).toHaveLength(1)
    expect(container.querySelector('.viz-legend')).toBeNull()
  })

  it('hides a series when its legend item is toggled', () => {
    const container = document.createElement('div')
    renderAreaChart(container, multiSeriesSpec, DIMS)

    container.querySelector<HTMLButtonElement>('[data-key="Oslo"]')?.click()
    expect(container.querySelectorAll('path.viz-area')).toHaveLength(1)
  })
})
