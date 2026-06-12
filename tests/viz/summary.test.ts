import { describe, expect, it } from 'vitest'
import type { VizSpec } from '../../src/viz/spec.js'
import { summarizeSpec } from '../../src/viz/summary.js'

describe('summarizeSpec', () => {
  it('includes type, title, row count, and channel mappings', () => {
    const spec: VizSpec = {
      type: 'bar',
      columns: ['month', 'sales', 'region'],
      rows: [
        ['Jan', 100, 'EU'],
        ['Feb', 120, 'US'],
      ],
      encodings: { x: 'month', y: 'sales', series: 'region' },
      title: 'Q1 Sales',
    }
    expect(summarizeSpec(spec)).toBe(
      'Created bar visualization "Q1 Sales": 2 rows; x: month, y: sales, series: region',
    )
  })

  it('omits the title segment and uses singular row when applicable', () => {
    const spec: VizSpec = {
      type: 'pie',
      columns: ['browser', 'share'],
      rows: [['Firefox', 10]],
      encodings: { category: 'browser', value: 'share' },
    }
    expect(summarizeSpec(spec)).toBe(
      'Created pie visualization: 1 row; category: browser, value: share',
    )
  })
})
