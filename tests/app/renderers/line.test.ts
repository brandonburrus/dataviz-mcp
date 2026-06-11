// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { renderLineChart } from '../../../src/app/renderers/line.js'
import type { VizSpec } from '../../../src/viz/spec.js'

const DIMS = { width: 800, height: 500 }

const multiSeriesSpec: VizSpec = {
  type: 'line',
  data: [
    { day: '2024-01-01', temp: 5, city: 'Oslo' },
    { day: '2024-01-02', temp: 7, city: 'Oslo' },
    { day: '2024-01-01', temp: 12, city: 'Rome' },
    { day: '2024-01-02', temp: 14, city: 'Rome' },
  ],
  encodings: { x: 'day', y: 'temp', series: 'city' },
}

describe('renderLineChart', () => {
  it('renders one path per series with axes and a clip path', () => {
    const container = document.createElement('div')
    renderLineChart(container, multiSeriesSpec, DIMS)

    expect(container.querySelectorAll('path.viz-line')).toHaveLength(2)
    expect(container.querySelector('.viz-x-axis')).not.toBeNull()
    expect(container.querySelector('.viz-y-axis')).not.toBeNull()
    expect(container.querySelector('clipPath')).not.toBeNull()
    expect(container.querySelector('.viz-overlay')).not.toBeNull()
  })

  it('renders a single unnamed series without a legend', () => {
    const container = document.createElement('div')
    renderLineChart(
      container,
      {
        type: 'line',
        data: [
          { day: 1, temp: 5 },
          { day: 2, temp: 7 },
        ],
        encodings: { x: 'day', y: 'temp' },
      },
      DIMS,
    )
    expect(container.querySelectorAll('path.viz-line')).toHaveLength(1)
    expect(container.querySelector('.viz-legend')).toBeNull()
  })

  it('hides a series when its legend item is toggled', () => {
    const container = document.createElement('div')
    renderLineChart(container, multiSeriesSpec, DIMS)

    container.querySelector<HTMLButtonElement>('[data-key="Oslo"]')?.click()
    expect(container.querySelectorAll('path.viz-line')).toHaveLength(1)
  })
})
