// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { renderStackedBarChart } from '../../../src/app/renderers/stacked-bar.js'
import type { VizSpec } from '../../../src/viz/spec.js'

const DIMS = { width: 800, height: 500 }

const stackedSpec: VizSpec = {
  type: 'stacked-bar',
  columns: ['month', 'sales', 'region'],
  rows: [
    ['Jan', 100, 'EU'],
    ['Jan', 80, 'US'],
    ['Feb', 120, 'EU'],
    ['Feb', 90, 'US'],
  ],
  encodings: { x: 'month', y: 'sales', series: 'region' },
  title: 'Sales',
  xLabel: 'Month',
  yLabel: 'Sales (USD)',
}

describe('renderStackedBarChart', () => {
  it('renders one segment per category-series pair with axes, title, and labels', () => {
    const container = document.createElement('div')
    renderStackedBarChart(container, stackedSpec, DIMS)

    // 2 categories x 2 series = 4 stacked segments
    expect(container.querySelectorAll('rect.viz-bar')).toHaveLength(4)
    expect(container.querySelectorAll('g.viz-layer')).toHaveLength(2)
    expect(container.querySelector('.viz-x-axis')).not.toBeNull()
    expect(container.querySelector('.viz-y-axis')).not.toBeNull()
    expect(container.querySelector('.viz-title')?.textContent).toBe('Sales')
    expect(container.querySelector('.viz-x-label')?.textContent).toBe('Month')
    expect(container.querySelector('.viz-y-label')?.textContent).toBe('Sales (USD)')
  })

  it('renders a legend with one item per series', () => {
    const container = document.createElement('div')
    renderStackedBarChart(container, stackedSpec, DIMS)
    expect(container.querySelectorAll('.viz-legend-item')).toHaveLength(2)
  })

  it('sums repeated category-series pairs into a single segment', () => {
    const container = document.createElement('div')
    renderStackedBarChart(
      container,
      {
        ...stackedSpec,
        rows: [
          ['Jan', 100, 'EU'],
          ['Jan', 50, 'EU'],
        ],
      },
      DIMS,
    )

    expect(container.querySelectorAll('rect.viz-bar')).toHaveLength(1)
    const bar = container.querySelector('rect.viz-bar') as SVGRectElement
    bar.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    const tooltip = container.querySelector<HTMLElement>('.viz-tooltip') as HTMLElement
    expect(tooltip.innerHTML).toContain('Jan / EU: 150')
  })

  it('hides a series when its legend item is toggled', () => {
    const container = document.createElement('div')
    renderStackedBarChart(container, stackedSpec, DIMS)

    container.querySelector<HTMLButtonElement>('[data-key="US"]')?.click()
    expect(container.querySelectorAll('rect.viz-bar')).toHaveLength(2)

    container.querySelector<HTMLButtonElement>('[data-key="US"]')?.click()
    expect(container.querySelectorAll('rect.viz-bar')).toHaveLength(4)
  })

  it('shows a segment tooltip on hover', () => {
    const container = document.createElement('div')
    renderStackedBarChart(container, stackedSpec, DIMS)

    const bar = container.querySelector('rect.viz-bar') as SVGRectElement
    bar.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    const tooltip = container.querySelector<HTMLElement>('.viz-tooltip') as HTMLElement
    expect(tooltip.style.opacity).toBe('1')
    expect(tooltip.innerHTML).toContain('Jan / EU: 100')

    bar.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    expect(tooltip.style.opacity).toBe('0')
  })
})
