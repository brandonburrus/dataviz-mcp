// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { createTooltip } from '../../../src/app/shared/tooltip.js'

describe('createTooltip', () => {
  it('appends a hidden tooltip element to the container', () => {
    const container = document.createElement('div')
    createTooltip(container)
    const element = container.querySelector<HTMLElement>('.viz-tooltip')
    expect(element).not.toBeNull()
    expect(element?.style.opacity).toBe('0')
    expect(container.style.position).toBe('relative')
  })

  it('shows content at an offset position and hides again', () => {
    const container = document.createElement('div')
    const tooltip = createTooltip(container)
    const element = container.querySelector<HTMLElement>('.viz-tooltip') as HTMLElement

    tooltip.show('<b>42</b>', 100, 200)
    expect(element.innerHTML).toBe('<b>42</b>')
    expect(element.style.opacity).toBe('1')
    expect(element.style.left).toBe('112px')
    expect(element.style.top).toBe('188px')

    tooltip.move(10, 20)
    expect(element.style.left).toBe('22px')

    tooltip.hide()
    expect(element.style.opacity).toBe('0')
  })
})
