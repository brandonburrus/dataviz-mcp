export interface LegendOptions {
  keys: string[]
  color: (key: string) => string
  /** Called with the updated hidden-key set after every toggle */
  onToggle: (hidden: ReadonlySet<string>) => void
}

/**
 * HTML legend (not SVG: simpler layout, no text measurement needed) with
 * click-to-toggle keys. Toggled-off items render dimmed with a struck label.
 */
export function renderLegend(container: HTMLElement, options: LegendOptions): void {
  const hidden = new Set<string>()
  const legend = document.createElement('div')
  legend.className = 'viz-legend'

  for (const key of options.keys) {
    const item = document.createElement('button')
    item.type = 'button'
    item.className = 'viz-legend-item'
    item.dataset.key = key

    const swatch = document.createElement('span')
    swatch.className = 'viz-legend-swatch'
    swatch.style.backgroundColor = options.color(key)

    const label = document.createElement('span')
    label.className = 'viz-legend-label'
    label.textContent = key

    item.append(swatch, label)
    item.addEventListener('click', () => {
      if (hidden.has(key)) {
        hidden.delete(key)
        item.classList.remove('viz-legend-item-hidden')
      } else {
        hidden.add(key)
        item.classList.add('viz-legend-item-hidden')
      }
      options.onToggle(hidden)
    })
    legend.appendChild(item)
  }

  container.appendChild(legend)
}
