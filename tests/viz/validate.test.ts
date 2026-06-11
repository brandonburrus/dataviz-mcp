import { UserError } from 'fastmcp'
import { describe, expect, it } from 'vitest'
import { isIsoDateString } from '../../src/viz/data.js'
import type { VizSpec } from '../../src/viz/spec.js'
import { validateSpec } from '../../src/viz/validate.js'

function barSpec(overrides: Partial<VizSpec> = {}): VizSpec {
  return {
    type: 'bar',
    data: [
      { month: 'Jan', sales: 100, region: 'EU' },
      { month: 'Feb', sales: 120, region: 'US' },
    ],
    encodings: { x: 'month', y: 'sales' },
    ...overrides,
  }
}

describe('validateSpec', () => {
  it('accepts a valid spec per type', () => {
    const specs: VizSpec[] = [
      barSpec(),
      barSpec({ encodings: { x: 'month', y: 'sales', series: 'region' } }),
      {
        type: 'line',
        data: [
          { day: '2024-01-01', temp: 5 },
          { day: '2024-01-02', temp: 7 },
        ],
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
        colorScheme: 'plasma',
      },
    ]
    for (const spec of specs) {
      expect(() => validateSpec(spec)).not.toThrow()
    }
  })

  it.each([
    ['bar', { series: 'region' }, 'x, y'],
    ['line', { x: 'month' }, 'x, y'],
    ['scatter', { y: 'sales' }, 'x, y'],
    ['pie', { category: 'month' }, 'category, value'],
    ['heatmap', { x: 'month', y: 'region' }, 'x, y, value'],
  ] as const)('reports missing required channels for %s', (type, encodings, required) => {
    const spec = barSpec({ type, encodings })
    expect(() => validateSpec(spec)).toThrow(UserError)
    expect(() => validateSpec(spec)).toThrow(`requires encodings: ${required}`)
  })

  it('rejects channels the type does not use', () => {
    const spec = barSpec({ encodings: { x: 'month', y: 'sales', category: 'region' } })
    expect(() => validateSpec(spec)).toThrow('does not use encodings: category')
  })

  it('lists available fields when an encoding references an unknown field', () => {
    const spec = barSpec({ encodings: { x: 'month', y: 'revenue' } })
    expect(() => validateSpec(spec)).toThrow(
      "encodings.y references field 'revenue', but data records contain: month, region, sales",
    )
  })

  it('reports the row index for non-numeric values in numeric channels', () => {
    const spec = barSpec({
      data: [
        { month: 'Jan', sales: 100 },
        { month: 'Feb', sales: 'n/a' },
      ],
    })
    expect(() => validateSpec(spec)).toThrow('row 1 has "n/a"')
  })

  it('rejects mixed numeric and date x values for line charts', () => {
    const spec: VizSpec = {
      type: 'line',
      data: [
        { day: '2024-01-01', temp: 5 },
        { day: 17, temp: 7 },
      ],
      encodings: { x: 'day', y: 'temp' },
    }
    expect(() => validateSpec(spec)).toThrow('all-numeric or all-ISO-date')
  })

  it('rejects categorical x values for scatter charts', () => {
    const spec: VizSpec = {
      type: 'scatter',
      data: [{ name: 'alpha', score: 1 }],
      encodings: { x: 'name', y: 'score' },
    }
    expect(() => validateSpec(spec)).toThrow('bar chart instead')
  })

  it('rejects negative pie values', () => {
    const spec: VizSpec = {
      type: 'pie',
      data: [
        { browser: 'Firefox', share: 10 },
        { browser: 'Chrome', share: -3 },
      ],
      encodings: { category: 'browser', value: 'share' },
    }
    expect(() => validateSpec(spec)).toThrow('row 1 has -3')
  })

  it('rejects sequential schemes for categorical types', () => {
    const spec = barSpec({ colorScheme: 'viridis' })
    expect(() => validateSpec(spec)).toThrow('use one of: tableau10, category10, dark2')
  })

  it('rejects categorical schemes for heatmaps', () => {
    const spec: VizSpec = {
      type: 'heatmap',
      data: [{ day: 'Mon', hour: '9am', visits: 42 }],
      encodings: { x: 'day', y: 'hour', value: 'visits' },
      colorScheme: 'tableau10',
    }
    expect(() => validateSpec(spec)).toThrow('use one of: viridis, plasma')
  })
})

describe('isIsoDateString', () => {
  it.each([
    '2024-01-15',
    '2024-01',
    '2024-01-15T10:30:00Z',
    '2024-01-15 10:30',
  ])('accepts %s', value => {
    expect(isIsoDateString(value)).toBe(true)
  })

  it.each(['Jan', 'tomorrow', '15/01/2024', 17, null, '2024-99-99'])('rejects %s', value => {
    expect(isIsoDateString(value)).toBe(false)
  })
})
