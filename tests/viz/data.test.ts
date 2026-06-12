import { describe, expect, it } from 'vitest'
import { toRecords } from '../../src/viz/data.js'

describe('toRecords', () => {
  it('zips columns with each positional row into keyed records', () => {
    const records = toRecords({
      columns: ['month', 'sales', 'region'],
      rows: [
        ['Jan', 100, 'EU'],
        ['Feb', 120, 'US'],
      ],
    })
    expect(records).toEqual([
      { month: 'Jan', sales: 100, region: 'EU' },
      { month: 'Feb', sales: 120, region: 'US' },
    ])
  })

  it('pads a short row with null so missing values never read as undefined', () => {
    const records = toRecords({ columns: ['a', 'b'], rows: [['x']] })
    expect(records).toEqual([{ a: 'x', b: null }])
  })
})
