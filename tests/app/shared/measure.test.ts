// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { DEFAULT_DIMENSIONS, measure } from '../../../src/app/shared/measure.js'

describe('measure', () => {
  it('falls back to the default dimensions when layout reports zero', () => {
    const container = document.createElement('div')
    expect(measure(container)).toEqual(DEFAULT_DIMENSIONS)
  })

  it('uses the measured rect when available', () => {
    const container = document.createElement('div')
    container.getBoundingClientRect = () => ({ width: 640, height: 360 }) as DOMRect
    expect(measure(container)).toEqual({ width: 640, height: 360 })
  })
})
