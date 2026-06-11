// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { categoricalColorScale, sequentialColorScale } from '../../../src/app/shared/colors.js'

describe('categoricalColorScale', () => {
  it('assigns distinct stable colors per key', () => {
    const color = categoricalColorScale(['a', 'b', 'c'])
    expect(color('a')).not.toBe(color('b'))
    expect(color('a')).toBe(color('a'))
  })

  it('uses the requested scheme', () => {
    const tableau = categoricalColorScale(['a'], 'tableau10')
    const dark = categoricalColorScale(['a'], 'dark2')
    expect(tableau('a')).not.toBe(dark('a'))
  })
})

describe('sequentialColorScale', () => {
  it('maps the domain ends to different colors', () => {
    const color = sequentialColorScale([0, 100])
    expect(color(0)).not.toBe(color(100))
  })

  it('differs between viridis and plasma', () => {
    expect(sequentialColorScale([0, 1], 'viridis')(0.5)).not.toBe(
      sequentialColorScale([0, 1], 'plasma')(0.5),
    )
  })
})
