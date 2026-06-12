import { UserError } from 'fastmcp'
import { isIsoDateString, toRecords } from './data.js'
import {
  CATEGORICAL_SCHEMES,
  CHANNEL_RULES,
  type EncodingChannel,
  SEQUENTIAL_SCHEMES,
  type VizSpec,
  type VizType,
} from './spec.js'

/**
 * Types whose magnitude channel must be non-negative: negatives make pie slices
 * meaningless and make stacked/sized marks diverge or invert. Maps each type to
 * its magnitude channel and the user-facing noun for the error.
 */
const NON_NEGATIVE_CHANNELS: Partial<Record<VizType, { channel: EncodingChannel; noun: string }>> =
  {
    pie: { channel: 'value', noun: 'Pie slice values' },
    'stacked-bar': { channel: 'y', noun: 'Stacked bar values' },
    'stacked-area': { channel: 'y', noun: 'Stacked area values' },
    bubble: { channel: 'size', noun: 'Bubble sizes' },
  }

/** Types whose x axis is continuous: every x value must be all-numeric or all-ISO-date. */
const CONTINUOUS_X_TYPES: VizType[] = ['line', 'area', 'stacked-area', 'scatter', 'bubble']

/**
 * Cross-field semantic validation beyond what the zod schema can express.
 * Throws UserError with a corrective message so the calling LLM can fix its input.
 */
export function validateSpec(spec: VizSpec): void {
  const rules = CHANNEL_RULES[spec.type]
  const allowed = new Set<EncodingChannel>([...rules.required, ...rules.optional])

  const missing = rules.required.filter(channel => spec.encodings[channel] === undefined)
  if (missing.length > 0) {
    throw new UserError(
      `A '${spec.type}' visualization requires encodings: ${rules.required.join(', ')}; ` +
        `missing: ${missing.join(', ')}`,
    )
  }

  const irrelevant = (Object.keys(spec.encodings) as EncodingChannel[]).filter(
    channel => spec.encodings[channel] !== undefined && !allowed.has(channel),
  )
  if (irrelevant.length > 0) {
    throw new UserError(
      `A '${spec.type}' visualization does not use encodings: ${irrelevant.join(', ')}. ` +
        `Supported channels: ${[...allowed].join(', ')}`,
    )
  }

  const duplicates = spec.columns.filter((column, index) => spec.columns.indexOf(column) !== index)
  if (duplicates.length > 0) {
    throw new UserError(
      `columns must be unique; duplicated: ${[...new Set(duplicates)].join(', ')}`,
    )
  }

  for (const [index, row] of spec.rows.entries()) {
    if (row.length !== spec.columns.length) {
      throw new UserError(
        `Every row must have one value per column (${spec.columns.length}); ` +
          `row ${index} has ${row.length}`,
      )
    }
  }

  for (const channel of allowed) {
    const field = spec.encodings[channel]
    if (field !== undefined && !spec.columns.includes(field)) {
      throw new UserError(
        `encodings.${channel} references field '${field}', but columns are: ${spec.columns.join(', ')}`,
      )
    }
  }

  const records = toRecords(spec)

  for (const channel of rules.numeric) {
    // Required channels were checked above, so the field is always set here
    const field = spec.encodings[channel] as string
    for (const [index, record] of records.entries()) {
      const value = record[field]
      if (typeof value !== 'number' || Number.isNaN(value)) {
        throw new UserError(
          `encodings.${channel} ('${field}') must be numeric in every row; ` +
            `row ${index} has ${JSON.stringify(value)}`,
        )
      }
    }
  }

  const nonNegative = NON_NEGATIVE_CHANNELS[spec.type]
  if (nonNegative !== undefined) {
    const field = spec.encodings[nonNegative.channel] as string
    for (const [index, record] of records.entries()) {
      const value = record[field] as number
      if (value < 0) {
        throw new UserError(
          `${nonNegative.noun} ('${field}') must be non-negative; row ${index} has ${value}`,
        )
      }
    }
  }

  if (CONTINUOUS_X_TYPES.includes(spec.type)) {
    const field = spec.encodings.x as string
    const values = records.map(record => record[field])
    const allNumbers = values.every(value => typeof value === 'number' && !Number.isNaN(value))
    const allDates = values.every(isIsoDateString)
    if (!allNumbers && !allDates) {
      throw new UserError(
        `A '${spec.type}' x axis ('${field}') needs all-numeric or all-ISO-date values ` +
          `(e.g. 2024-01-15). For categorical x values use a bar chart instead.`,
      )
    }
  }

  if (spec.colorScheme !== undefined) {
    const valid = spec.type === 'heatmap' ? SEQUENTIAL_SCHEMES : CATEGORICAL_SCHEMES
    if (!valid.includes(spec.colorScheme)) {
      throw new UserError(
        `colorScheme '${spec.colorScheme}' is not valid for '${spec.type}'; ` +
          `use one of: ${valid.join(', ')}`,
      )
    }
  }
}
