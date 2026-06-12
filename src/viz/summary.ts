import type { VizSpec } from './spec.js'

/** One-line description of the created visualization for the model and conversation log. */
export function summarizeSpec(spec: VizSpec): string {
  const mappings = Object.entries(spec.encodings)
    .filter(([, field]) => field !== undefined)
    .map(([channel, field]) => `${channel}: ${field}`)
    .join(', ')
  const title = spec.title === undefined ? '' : ` "${spec.title}"`
  const records = spec.rows.length === 1 ? '1 row' : `${spec.rows.length} rows`
  return `Created ${spec.type} visualization${title}: ${records}; ${mappings}`
}
