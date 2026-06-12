// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { renderBubbleChart } from '../../../src/app/renderers/bubble.js'
import type { VizSpec } from '../../../src/viz/spec.js'

const DIMS = { width: 800, height: 500 }

const spec: VizSpec = {
  type: 'bubble',
  columns: ['gdp', 'life', 'pop', 'region'],
  rows: [
    [1000, 60, 5, 'Asia'],
    [2000, 70, 10, 'Asia'],
    [3000, 80, 20, 'Europe'],
  ],
  encodings: { x: 'gdp', y: 'life', size: 'pop', series: 'region' },
}

describe('renderBubbleChart', () => {
  it('renders one circle per record with axes and a clip path', () => {
    const container = document.createElement('div')
    renderBubbleChart(container, spec, DIMS)

    expect(container.querySelectorAll('circle.viz-dot')).toHaveLength(3)
    expect(container.querySelector('.viz-x-axis')).not.toBeNull()
    expect(container.querySelector('.viz-y-axis')).not.toBeNull()
    expect(container.querySelector('clipPath')).not.toBeNull()
  })

  it('sizes points by the size channel', () => {
    const container = document.createElement('div')
    renderBubbleChart(container, spec, DIMS)

    const radii = [...container.querySelectorAll('circle.viz-dot')].map(circle =>
      Number(circle.getAttribute('r')),
    )
    expect(new Set(radii).size).toBeGreaterThan(1)
  })

  it('hides a series when its legend item is toggled', () => {
    const container = document.createElement('div')
    renderBubbleChart(container, spec, DIMS)

    container.querySelector<HTMLButtonElement>('[data-key="Europe"]')?.click()
    expect(container.querySelectorAll('circle.viz-dot')).toHaveLength(2)
  })

  it('shows a per-point tooltip including the size value', () => {
    const container = document.createElement('div')
    renderBubbleChart(container, spec, DIMS)

    const dot = container.querySelector('circle.viz-dot') as SVGCircleElement
    dot.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    const tooltip = container.querySelector<HTMLElement>('.viz-tooltip') as HTMLElement
    expect(tooltip.style.opacity).toBe('1')
    expect(tooltip.innerHTML).toContain('gdp: 1000')
    expect(tooltip.innerHTML).toContain('pop: 5')
  })
})
