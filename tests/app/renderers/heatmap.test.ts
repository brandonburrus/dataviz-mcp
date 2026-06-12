// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { renderHeatmap } from '../../../src/app/renderers/heatmap.js'
import type { VizSpec } from '../../../src/viz/spec.js'

const DIMS = { width: 800, height: 500 }

const spec: VizSpec = {
  type: 'heatmap',
  columns: ['day', 'hour', 'visits'],
  rows: [
    ['Mon', '9am', 10],
    ['Mon', '10am', 20],
    ['Tue', '9am', 30],
    ['Tue', '10am', 40],
  ],
  encodings: { x: 'day', y: 'hour', value: 'visits' },
}

describe('renderHeatmap', () => {
  it('renders one cell per record with band axes', () => {
    const container = document.createElement('div')
    renderHeatmap(container, spec, DIMS)

    expect(container.querySelectorAll('rect.viz-cell')).toHaveLength(4)
    expect(container.querySelector('.viz-x-axis')).not.toBeNull()
    expect(container.querySelector('.viz-y-axis')).not.toBeNull()
  })

  it('colors min and max cells differently', () => {
    const container = document.createElement('div')
    renderHeatmap(container, spec, DIMS)

    const cells = [...container.querySelectorAll<SVGRectElement>('rect.viz-cell')]
    const fills = new Set(cells.map(cell => cell.getAttribute('fill')))
    expect(fills.size).toBe(4)
  })

  it('renders a gradient legend with min and max labels', () => {
    const container = document.createElement('div')
    renderHeatmap(container, spec, DIMS)

    expect(container.querySelector('linearGradient')).not.toBeNull()
    expect(container.querySelector('.viz-gradient-max')?.textContent).toBe('40')
    expect(container.querySelector('.viz-gradient-min')?.textContent).toBe('10')
  })

  it('shows a cell tooltip on hover', () => {
    const container = document.createElement('div')
    renderHeatmap(container, spec, DIMS)

    const cell = container.querySelector('rect.viz-cell') as SVGRectElement
    cell.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    const tooltip = container.querySelector<HTMLElement>('.viz-tooltip') as HTMLElement
    expect(tooltip.innerHTML).toBe('Mon, 9am: 10')
  })
})
