// Environment-neutral data helpers shared by server validation and the browser
// app. Only type imports from spec.js are allowed here: a value import would
// pull zod into the browser bundle.
import type { DataRecord, DataValue, VizSpec } from './spec.js'

/**
 * Joins the column names with each positional row into keyed records, the shape
 * validation and the renderers work with. Assumes rows are already length-checked
 * against columns (the server validates before this runs); any short row pads with
 * null so a renderer never reads undefined.
 */
export function toRecords(spec: Pick<VizSpec, 'columns' | 'rows'>): DataRecord[] {
  return spec.rows.map(row => {
    const record: DataRecord = {}
    spec.columns.forEach((column, index) => {
      record[column] = (row[index] ?? null) as DataValue
    })
    return record
  })
}

/** Matches ISO-style dates (2024-01, 2024-01-15, 2024-01-15T10:30:00Z) and avoids
 * Date.parse's permissive engine-specific parsing of arbitrary strings. */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}(-\d{2})?([T ].+)?$/

export function isIsoDateString(value: unknown): value is string {
  return (
    typeof value === 'string' && ISO_DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(value))
  )
}

/** Distinct stringified values of a field in first-appearance order (so e.g. weekday
 * ordering in the data survives instead of being alphabetized). */
export function distinctValues(data: DataRecord[], field: string): string[] {
  const seen = new Set<string>()
  for (const record of data) {
    seen.add(String(record[field]))
  }
  return [...seen]
}

export interface ParsedXValues {
  values: (number | Date)[]
  isTime: boolean
}

/** Interprets a validated line/scatter x field as either all numbers or all dates. */
export function parseXValues(data: DataRecord[], field: string): ParsedXValues {
  const raw = data.map(record => record[field])
  if (raw.every(value => typeof value === 'number')) {
    return { values: raw, isTime: false }
  }
  return { values: raw.map(value => new Date(String(value))), isTime: true }
}
