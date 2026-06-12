import { describe, expect, it } from 'vitest'
import { vizSpecSchema } from '../../src/viz/spec.js'

const validBarSpec = {
  type: 'bar',
  columns: ['month', 'sales'],
  rows: [
    ['Jan', 100],
    ['Feb', 120],
  ],
  encodings: { x: 'month', y: 'sales' },
}

describe('vizSpecSchema', () => {
  it('accepts a minimal valid spec for each type', () => {
    const specs = [
      validBarSpec,
      {
        type: 'line',
        columns: ['day', 'temp'],
        rows: [[1, 20]],
        encodings: { x: 'day', y: 'temp' },
      },
      {
        type: 'scatter',
        columns: ['height', 'weight'],
        rows: [[170, 70]],
        encodings: { x: 'height', y: 'weight' },
      },
      {
        type: 'pie',
        columns: ['browser', 'share'],
        rows: [['Firefox', 10]],
        encodings: { category: 'browser', value: 'share' },
      },
      {
        type: 'heatmap',
        columns: ['day', 'hour', 'visits'],
        rows: [['Mon', '9am', 42]],
        encodings: { x: 'day', y: 'hour', value: 'visits' },
      },
    ]
    for (const spec of specs) {
      expect(vizSpecSchema.safeParse(spec).success).toBe(true)
    }
  })

  it('accepts optional title, labels, and color scheme', () => {
    const result = vizSpecSchema.safeParse({
      ...validBarSpec,
      title: 'Sales',
      xLabel: 'Month',
      yLabel: 'Sales (USD)',
      colorScheme: 'dark2',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an unknown visualization type', () => {
    expect(vizSpecSchema.safeParse({ ...validBarSpec, type: 'treemap' }).success).toBe(false)
  })

  it('rejects empty rows', () => {
    expect(vizSpecSchema.safeParse({ ...validBarSpec, rows: [] }).success).toBe(false)
  })

  it('rejects empty columns', () => {
    expect(vizSpecSchema.safeParse({ ...validBarSpec, columns: [] }).success).toBe(false)
  })

  it('rejects more than 10000 rows', () => {
    const rows = Array.from({ length: 10_001 }, (_, i) => [`m${i}`, i])
    expect(vizSpecSchema.safeParse({ ...validBarSpec, rows }).success).toBe(false)
  })

  it('rejects nested objects in row values', () => {
    const result = vizSpecSchema.safeParse({
      ...validBarSpec,
      rows: [['Jan', { amount: 100 }]],
    })
    expect(result.success).toBe(false)
  })

  it('rejects an unknown color scheme', () => {
    expect(vizSpecSchema.safeParse({ ...validBarSpec, colorScheme: 'rainbow' }).success).toBe(false)
  })
})
