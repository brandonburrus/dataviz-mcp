// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { renderBarChart } from '../../../src/app/renderers/bar.js'
import type { VizSpec } from '../../../src/viz/spec.js'

const DIMS = { width: 800, height: 500 }

const groupedSpec: VizSpec = {
  type: 'bar',
  data: [
    { month: 'Jan', sales: 100, region: 'EU' },
    { month: 'Jan', sales: 80, region: 'US' },
    { month: 'Feb', sales: 120, region: 'EU' },
    { month: 'Feb', sales: 90, region: 'US' },
  ],
  encodings: { x: 'month', y: 'sales', series: 'region' },
  title: 'Sales',
  xLabel: 'Month',
  yLabel: 'Sales (USD)',
}

describe('renderBarChart', () => {
  it('renders one bar per record with axes, title, and labels', () => {
    const container = document.createElement('div')
    renderBarChart(container, groupedSpec, DIMS)

    expect(container.querySelectorAll('rect.viz-bar')).toHaveLength(4)
    expect(container.querySelector('.viz-x-axis')).not.toBeNull()
    expect(container.querySelector('.viz-y-axis')).not.toBeNull()
    expect(container.querySelector('.viz-title')?.textContent).toBe('Sales')
    expect(container.querySelector('.viz-x-label')?.textContent).toBe('Month')
    expect(container.querySelector('.viz-y-label')?.textContent).toBe('Sales (USD)')
  })

  it('renders a legend only when a series encoding is present', () => {
    const container = document.createElement('div')
    renderBarChart(container, groupedSpec, DIMS)
    expect(container.querySelectorAll('.viz-legend-item')).toHaveLength(2)

    const single = document.createElement('div')
    renderBarChart(single, { ...groupedSpec, encodings: { x: 'month', y: 'sales' } }, DIMS)
    expect(single.querySelector('.viz-legend')).toBeNull()
    expect(single.querySelectorAll('rect.viz-bar')).toHaveLength(4)
  })

  it('hides a series when its legend item is toggled', () => {
    const container = document.createElement('div')
    renderBarChart(container, groupedSpec, DIMS)

    container.querySelector<HTMLButtonElement>('[data-key="US"]')?.click()
    expect(container.querySelectorAll('rect.viz-bar')).toHaveLength(2)

    container.querySelector<HTMLButtonElement>('[data-key="US"]')?.click()
    expect(container.querySelectorAll('rect.viz-bar')).toHaveLength(4)
  })

  it('shows a tooltip on bar hover', () => {
    const container = document.createElement('div')
    renderBarChart(container, groupedSpec, DIMS)

    const bar = container.querySelector('rect.viz-bar') as SVGRectElement
    bar.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    const tooltip = container.querySelector<HTMLElement>('.viz-tooltip') as HTMLElement
    expect(tooltip.style.opacity).toBe('1')
    expect(tooltip.innerHTML).toContain('Jan / EU: 100')

    bar.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
    expect(tooltip.style.opacity).toBe('0')
  })
})
