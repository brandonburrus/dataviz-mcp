import { UserError } from 'fastmcp'
import { isIsoDateString } from './data.js'
import {
  CATEGORICAL_SCHEMES,
  CHANNEL_RULES,
  type EncodingChannel,
  SEQUENTIAL_SCHEMES,
  type VizSpec,
} from './spec.js'

function availableFields(spec: VizSpec): string[] {
  const fields = new Set<string>()
  for (const record of spec.data) {
    for (const key of Object.keys(record)) fields.add(key)
  }
  return [...fields].sort()
}

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

  const fields = availableFields(spec)
  for (const channel of allowed) {
    const field = spec.encodings[channel]
    if (field !== undefined && !fields.includes(field)) {
      throw new UserError(
        `encodings.${channel} references field '${field}', but data records contain: ${fields.join(', ')}`,
      )
    }
  }

  for (const channel of rules.numeric) {
    // Required channels were checked above, so the field is always set here
    const field = spec.encodings[channel] as string
    for (const [index, record] of spec.data.entries()) {
      const value = record[field]
      if (typeof value !== 'number' || Number.isNaN(value)) {
        throw new UserError(
          `encodings.${channel} ('${field}') must be numeric in every record; ` +
            `row ${index} has ${JSON.stringify(value)}`,
        )
      }
    }
  }

  if (spec.type === 'pie') {
    const field = spec.encodings.value as string
    for (const [index, record] of spec.data.entries()) {
      const value = record[field] as number
      if (value < 0) {
        throw new UserError(
          `Pie slice values ('${field}') must be non-negative; row ${index} has ${value}`,
        )
      }
    }
  }

  if (spec.type === 'line' || spec.type === 'scatter') {
    const field = spec.encodings.x as string
    const values = spec.data.map(record => record[field])
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
