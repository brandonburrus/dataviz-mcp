import type { VizSpec } from './spec.js'

/** One-line description of the created visualization for the model and conversation log. */
export function summarizeSpec(spec: VizSpec): string {
  const mappings = Object.entries(spec.encodings)
    .filter(([, field]) => field !== undefined)
    .map(([channel, field]) => `${channel}: ${field}`)
    .join(', ')
  const title = spec.title === undefined ? '' : ` "${spec.title}"`
  const records = spec.data.length === 1 ? '1 record' : `${spec.data.length} records`
  return `Created ${spec.type} visualization${title}: ${records}; ${mappings}`
}
