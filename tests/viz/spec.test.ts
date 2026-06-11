import { describe, expect, it } from 'vitest'
import { vizSpecSchema } from '../../src/viz/spec.js'

const validBarSpec = {
  type: 'bar',
  data: [
    { month: 'Jan', sales: 100 },
    { month: 'Feb', sales: 120 },
  ],
  encodings: { x: 'month', y: 'sales' },
}

describe('vizSpecSchema', () => {
  it('accepts a minimal valid spec for each type', () => {
    const specs = [
      validBarSpec,
      {
        type: 'line',
        data: [{ day: 1, temp: 20 }],
        encodings: { x: 'day', y: 'temp' },
      },
      {
        type: 'scatter',
        data: [{ height: 170, weight: 70 }],
        encodings: { x: 'height', y: 'weight' },
      },
      {
        type: 'pie',
        data: [{ browser: 'Firefox', share: 10 }],
        encodings: { category: 'browser', value: 'share' },
      },
      {
        type: 'heatmap',
        data: [{ day: 'Mon', hour: '9am', visits: 42 }],
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

  it('rejects empty data', () => {
    expect(vizSpecSchema.safeParse({ ...validBarSpec, data: [] }).success).toBe(false)
  })

  it('rejects more than 10000 records', () => {
    const data = Array.from({ length: 10_001 }, (_, i) => ({ month: `m${i}`, sales: i }))
    expect(vizSpecSchema.safeParse({ ...validBarSpec, data }).success).toBe(false)
  })

  it('rejects nested objects in records', () => {
    const result = vizSpecSchema.safeParse({
      ...validBarSpec,
      data: [{ month: 'Jan', sales: { amount: 100 } }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects an unknown color scheme', () => {
    expect(vizSpecSchema.safeParse({ ...validBarSpec, colorScheme: 'rainbow' }).success).toBe(false)
  })
})
