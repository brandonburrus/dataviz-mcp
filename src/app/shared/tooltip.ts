export interface Tooltip {
  show(html: string, x: number, y: number): void
  move(x: number, y: number): void
  hide(): void
}

/**
 * Absolutely-positioned tooltip div appended to the chart container.
 * Coordinates are container-relative; the container gets position: relative
 * so the tooltip anchors correctly.
 */
export function createTooltip(container: HTMLElement): Tooltip {
  container.style.position = 'relative'
  const element = document.createElement('div')
  element.className = 'viz-tooltip'
  element.style.position = 'absolute'
  element.style.pointerEvents = 'none'
  element.style.opacity = '0'
  container.appendChild(element)

  const position = (x: number, y: number) => {
    element.style.left = `${x + 12}px`
    element.style.top = `${y - 12}px`
  }

  return {
    show(html, x, y) {
      element.innerHTML = html
      element.style.opacity = '1'
      position(x, y)
    },
    move(x, y) {
      position(x, y)
    },
    hide() {
      element.style.opacity = '0'
    },
  }
}
