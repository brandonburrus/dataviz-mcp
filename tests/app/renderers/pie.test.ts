// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { renderPieChart } from '../../../src/app/renderers/pie.js'
import type { VizSpec } from '../../../src/viz/spec.js'

const DIMS = { width: 800, height: 500 }

const spec: VizSpec = {
  type: 'pie',
  columns: ['browser', 'share'],
  rows: [
    ['Firefox', 30],
    ['Chrome', 60],
    ['Safari', 10],
  ],
  encodings: { category: 'browser', value: 'share' },
}

describe('renderPieChart', () => {
  it('renders one slice per category with a legend', () => {
    const container = document.createElement('div')
    renderPieChart(container, spec, DIMS)

    expect(container.querySelectorAll('path.viz-slice')).toHaveLength(3)
    expect(container.querySelectorAll('.viz-legend-item')).toHaveLength(3)
  })

  it('aggregates duplicate categories into a single slice', () => {
    const container = document.createElement('div')
    renderPieChart(
      container,
      {
        ...spec,
        rows: [
          ['Firefox', 20],
          ['Firefox', 10],
          ['Chrome', 70],
        ],
      },
      DIMS,
    )
    expect(container.querySelectorAll('path.viz-slice')).toHaveLength(2)
  })

  it('removes a slice when its legend item is toggled', () => {
    const container = document.createElement('div')
    renderPieChart(container, spec, DIMS)

    container.querySelector<HTMLButtonElement>('[data-key="Chrome"]')?.click()
    expect(container.querySelectorAll('path.viz-slice')).toHaveLength(2)
  })

  it('shows value and percentage in the tooltip', () => {
    const container = document.createElement('div')
    renderPieChart(container, spec, DIMS)

    const slice = container.querySelector('path.viz-slice') as SVGPathElement
    slice.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    const tooltip = container.querySelector<HTMLElement>('.viz-tooltip') as HTMLElement
    expect(tooltip.innerHTML).toContain('Firefox: 30 (30.0%)')
  })
})
