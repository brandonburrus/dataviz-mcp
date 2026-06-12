import { UserError } from 'fastmcp'
import { describe, expect, it } from 'vitest'
import { isIsoDateString } from '../../src/viz/data.js'
import type { VizSpec } from '../../src/viz/spec.js'
import { validateSpec } from '../../src/viz/validate.js'

function barSpec(overrides: Partial<VizSpec> = {}): VizSpec {
  return {
    type: 'bar',
    columns: ['month', 'sales', 'region'],
    rows: [
      ['Jan', 100, 'EU'],
      ['Feb', 120, 'US'],
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
      barSpec({ type: 'stacked-bar', encodings: { x: 'month', y: 'sales', series: 'region' } }),
      {
        type: 'line',
        columns: ['day', 'temp'],
        rows: [
          ['2024-01-01', 5],
          ['2024-01-02', 7],
        ],
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
        colorScheme: 'plasma',
      },
    ]
    for (const spec of specs) {
      expect(() => validateSpec(spec)).not.toThrow()
    }
  })

  it.each([
    ['bar', { series: 'region' }, 'x, y'],
    ['stacked-bar', { x: 'month', y: 'sales' }, 'x, y, series'],
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

  it('rejects duplicate column names', () => {
    const spec = barSpec({ columns: ['month', 'sales', 'sales'] })
    expect(() => validateSpec(spec)).toThrow('columns must be unique; duplicated: sales')
  })

  it('rejects rows whose length does not match the columns', () => {
    const spec = barSpec({
      columns: ['month', 'sales'],
      rows: [
        ['Jan', 100],
        ['Feb', 120, 'extra'],
      ],
      encodings: { x: 'month', y: 'sales' },
    })
    expect(() => validateSpec(spec)).toThrow('row 1 has 3')
  })

  it('lists the columns when an encoding references an unknown field', () => {
    const spec = barSpec({ encodings: { x: 'month', y: 'revenue' } })
    expect(() => validateSpec(spec)).toThrow(
      "encodings.y references field 'revenue', but columns are: month, sales, region",
    )
  })

  it('reports the row index for non-numeric values in numeric channels', () => {
    const spec = barSpec({
      columns: ['month', 'sales'],
      rows: [
        ['Jan', 100],
        ['Feb', 'n/a'],
      ],
      encodings: { x: 'month', y: 'sales' },
    })
    expect(() => validateSpec(spec)).toThrow('row 1 has "n/a"')
  })

  it('rejects mixed numeric and date x values for line charts', () => {
    const spec: VizSpec = {
      type: 'line',
      columns: ['day', 'temp'],
      rows: [
        ['2024-01-01', 5],
        [17, 7],
      ],
      encodings: { x: 'day', y: 'temp' },
    }
    expect(() => validateSpec(spec)).toThrow('all-numeric or all-ISO-date')
  })

  it('rejects categorical x values for scatter charts', () => {
    const spec: VizSpec = {
      type: 'scatter',
      columns: ['name', 'score'],
      rows: [['alpha', 1]],
      encodings: { x: 'name', y: 'score' },
    }
    expect(() => validateSpec(spec)).toThrow('bar chart instead')
  })

  it('rejects negative pie values', () => {
    const spec: VizSpec = {
      type: 'pie',
      columns: ['browser', 'share'],
      rows: [
        ['Firefox', 10],
        ['Chrome', -3],
      ],
      encodings: { category: 'browser', value: 'share' },
    }
    expect(() => validateSpec(spec)).toThrow('row 1 has -3')
  })

  it('rejects negative stacked bar values', () => {
    const spec = barSpec({
      type: 'stacked-bar',
      rows: [
        ['Jan', 100, 'EU'],
        ['Feb', -5, 'US'],
      ],
      encodings: { x: 'month', y: 'sales', series: 'region' },
    })
    expect(() => validateSpec(spec)).toThrow('Stacked bar values')
    expect(() => validateSpec(spec)).toThrow('row 1 has -5')
  })

  it('rejects sequential schemes for categorical types', () => {
    const spec = barSpec({ colorScheme: 'viridis' })
    expect(() => validateSpec(spec)).toThrow('use one of: tableau10, category10, dark2')
  })

  it('rejects categorical schemes for heatmaps', () => {
    const spec: VizSpec = {
      type: 'heatmap',
      columns: ['day', 'hour', 'visits'],
      rows: [['Mon', '9am', 42]],
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
