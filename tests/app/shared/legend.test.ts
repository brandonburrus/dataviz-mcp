// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest'
import { renderLegend } from '../../../src/app/shared/legend.js'

function setup() {
  const container = document.createElement('div')
  const onToggle = vi.fn()
  renderLegend(container, {
    keys: ['EU', 'US'],
    color: () => 'rgb(1, 2, 3)',
    onToggle,
  })
  return { container, onToggle }
}

describe('renderLegend', () => {
  it('renders one toggleable item per key with its swatch color', () => {
    const { container } = setup()
    const items = container.querySelectorAll('.viz-legend-item')
    expect(items).toHaveLength(2)
    expect(items[0]?.textContent).toBe('EU')
    const swatch = items[0]?.querySelector<HTMLElement>('.viz-legend-swatch')
    expect(swatch?.style.backgroundColor).toBe('rgb(1, 2, 3)')
  })

  it('toggles keys in and out of the hidden set on click', () => {
    const { container, onToggle } = setup()
    const item = container.querySelector<HTMLButtonElement>('[data-key="EU"]') as HTMLButtonElement

    item.click()
    expect([...(onToggle.mock.lastCall?.[0] as Set<string>)]).toEqual(['EU'])
    expect(item.classList.contains('viz-legend-item-hidden')).toBe(true)

    item.click()
    expect([...(onToggle.mock.lastCall?.[0] as Set<string>)]).toEqual([])
    expect(item.classList.contains('viz-legend-item-hidden')).toBe(false)
  })
})
