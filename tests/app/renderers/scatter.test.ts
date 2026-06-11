// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { renderScatterChart } from '../../../src/app/renderers/scatter.js'
import type { VizSpec } from '../../../src/viz/spec.js'

const DIMS = { width: 800, height: 500 }

const spec: VizSpec = {
  type: 'scatter',
  data: [
    { height: 160, weight: 60, team: 'A' },
    { height: 170, weight: 70, team: 'A' },
    { height: 180, weight: 80, team: 'B' },
  ],
  encodings: { x: 'height', y: 'weight', series: 'team' },
}

describe('renderScatterChart', () => {
  it('renders one circle per record with axes and a clip path', () => {
    const container = document.createElement('div')
    renderScatterChart(container, spec, DIMS)

    expect(container.querySelectorAll('circle.viz-dot')).toHaveLength(3)
    expect(container.querySelector('.viz-x-axis')).not.toBeNull()
    expect(container.querySelector('.viz-y-axis')).not.toBeNull()
    expect(container.querySelector('clipPath')).not.toBeNull()
  })

  it('hides a series when its legend item is toggled', () => {
    const container = document.createElement('div')
    renderScatterChart(container, spec, DIMS)

    container.querySelector<HTMLButtonElement>('[data-key="A"]')?.click()
    expect(container.querySelectorAll('circle.viz-dot')).toHaveLength(1)
  })

  it('shows a per-point tooltip on hover', () => {
    const container = document.createElement('div')
    renderScatterChart(container, spec, DIMS)

    const dot = container.querySelector('circle.viz-dot') as SVGCircleElement
    dot.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    const tooltip = container.querySelector<HTMLElement>('.viz-tooltip') as HTMLElement
    expect(tooltip.style.opacity).toBe('1')
    expect(tooltip.innerHTML).toContain('height: 160')
    expect(tooltip.innerHTML).toContain('weight: 60')
  })
})
