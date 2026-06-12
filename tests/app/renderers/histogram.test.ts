// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { renderHistogram } from '../../../src/app/renderers/histogram.js'
import type { VizSpec } from '../../../src/viz/spec.js'

const DIMS = { width: 800, height: 500 }

const spec: VizSpec = {
  type: 'histogram',
  columns: ['score'],
  rows: [[1], [2], [2], [3], [3], [3], [4], [5], [7], [9]],
  encodings: { x: 'score' },
  title: 'Scores',
}

describe('renderHistogram', () => {
  it('renders binned bars with axes and a title and no legend', () => {
    const container = document.createElement('div')
    renderHistogram(container, spec, DIMS)

    expect(container.querySelectorAll('rect.viz-bar').length).toBeGreaterThan(1)
    expect(container.querySelector('.viz-x-axis')).not.toBeNull()
    expect(container.querySelector('.viz-y-axis')).not.toBeNull()
    expect(container.querySelector('.viz-title')?.textContent).toBe('Scores')
    expect(container.querySelector('.viz-legend')).toBeNull()
  })

  it('covers every data point across the bins', () => {
    const container = document.createElement('div')
    renderHistogram(container, spec, DIMS)

    const counts = [...container.querySelectorAll('rect.viz-bar')].map(bar =>
      Number(bar.getAttribute('data-count')),
    )
    expect(counts.reduce((sum, count) => sum + count, 0)).toBe(spec.rows.length)
  })

  it('shows a tooltip with the bin range and count on hover', () => {
    const container = document.createElement('div')
    renderHistogram(container, spec, DIMS)

    const bar = container.querySelector('rect.viz-bar') as SVGRectElement
    bar.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
    const tooltip = container.querySelector<HTMLElement>('.viz-tooltip') as HTMLElement
    expect(tooltip.style.opacity).toBe('1')
    expect(tooltip.innerHTML).toMatch(/\[.*\): \d+/)
  })
})
