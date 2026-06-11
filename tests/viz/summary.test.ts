import { describe, expect, it } from 'vitest'
import type { VizSpec } from '../../src/viz/spec.js'
import { summarizeSpec } from '../../src/viz/summary.js'

describe('summarizeSpec', () => {
  it('includes type, title, record count, and channel mappings', () => {
    const spec: VizSpec = {
      type: 'bar',
      data: [
        { month: 'Jan', sales: 100, region: 'EU' },
        { month: 'Feb', sales: 120, region: 'US' },
      ],
      encodings: { x: 'month', y: 'sales', series: 'region' },
      title: 'Q1 Sales',
    }
    expect(summarizeSpec(spec)).toBe(
      'Created bar visualization "Q1 Sales": 2 records; x: month, y: sales, series: region',
    )
  })

  it('omits the title segment and uses singular record when applicable', () => {
    const spec: VizSpec = {
      type: 'pie',
      data: [{ browser: 'Firefox', share: 10 }],
      encodings: { category: 'browser', value: 'share' },
    }
    expect(summarizeSpec(spec)).toBe(
      'Created pie visualization: 1 record; category: browser, value: share',
    )
  })
})
