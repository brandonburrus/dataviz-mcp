import { z } from 'zod'

export const vizTypeSchema = z.enum([
  'bar',
  'stacked-bar',
  'histogram',
  'line',
  'area',
  'stacked-area',
  'scatter',
  'bubble',
  'pie',
  'heatmap',
])

const dataValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])

export const encodingsSchema = z.object({
  x: z
    .string()
    .optional()
    .describe(
      'Field for the x axis. bar/stacked-bar/heatmap: category; histogram: numeric (binned); ' +
        'line/area/stacked-area/scatter/bubble: number or ISO date',
    ),
  y: z
    .string()
    .optional()
    .describe(
      'Field for the y axis. Numeric value for bar/stacked-bar/line/area/stacked-area/scatter/' +
        'bubble; category for heatmap. Not used by histogram (count is derived) or pie',
    ),
  series: z
    .string()
    .optional()
    .describe(
      'Field that splits the data into colored, legend-toggleable series. Optional for ' +
        'bar/line/area/scatter/bubble; required for stacked-bar and stacked-area (it names the ' +
        'segments stacked at each position)',
    ),
  size: z
    .string()
    .optional()
    .describe('Numeric, non-negative field sizing each point; bubble charts only'),
  category: z.string().optional().describe('Field naming each pie slice'),
  value: z.string().optional().describe('Numeric field sizing each pie slice or heatmap cell'),
})

export const colorSchemeSchema = z.enum(['tableau10', 'category10', 'dark2', 'viridis', 'plasma'])

export const vizSpecSchema = z.object({
  type: vizTypeSchema.describe('The kind of visualization to create'),
  columns: z
    .array(z.string())
    .min(1)
    .describe('Field names, declared once, in the same order as each row of values'),
  rows: z
    .array(z.array(dataValueSchema))
    .min(1)
    .max(10_000)
    .describe(
      'Tabular data as positional value arrays; each row holds one value per column, in column order',
    ),
  encodings: encodingsSchema.describe('Maps column names to visual channels for the type'),
  title: z.string().optional().describe('Chart title'),
  xLabel: z.string().optional().describe('X axis label'),
  yLabel: z.string().optional().describe('Y axis label'),
  colorScheme: colorSchemeSchema
    .describe(
      'tableau10/category10/dark2 for the categorical types (bar, stacked-bar, histogram, line, ' +
        'area, stacked-area, scatter, bubble, pie); viridis/plasma for heatmap',
    )
    .optional(),
})

export type VizType = z.infer<typeof vizTypeSchema>
export type Encodings = z.infer<typeof encodingsSchema>
export type EncodingChannel = keyof Encodings
export type ColorScheme = z.infer<typeof colorSchemeSchema>
export type DataValue = z.infer<typeof dataValueSchema>
export type DataRecord = Record<string, DataValue>
export type VizSpec = z.infer<typeof vizSpecSchema>

export interface ChannelRules {
  required: EncodingChannel[]
  optional: EncodingChannel[]
  /** Channels whose value must be a number in every record */
  numeric: EncodingChannel[]
}

export const CHANNEL_RULES: Record<VizType, ChannelRules> = {
  bar: { required: ['x', 'y'], optional: ['series'], numeric: ['y'] },
  'stacked-bar': { required: ['x', 'y', 'series'], optional: [], numeric: ['y'] },
  // x is the only input; y (count) is derived by binning, so x must be numeric
  histogram: { required: ['x'], optional: [], numeric: ['x'] },
  line: { required: ['x', 'y'], optional: ['series'], numeric: ['y'] },
  area: { required: ['x', 'y'], optional: ['series'], numeric: ['y'] },
  'stacked-area': { required: ['x', 'y', 'series'], optional: [], numeric: ['y'] },
  scatter: { required: ['x', 'y'], optional: ['series'], numeric: ['y'] },
  // x is numeric-or-date (validated separately), so only y and size are strictly numeric
  bubble: { required: ['x', 'y', 'size'], optional: ['series'], numeric: ['y', 'size'] },
  pie: { required: ['category', 'value'], optional: [], numeric: ['value'] },
  heatmap: { required: ['x', 'y', 'value'], optional: [], numeric: ['value'] },
}

export const CATEGORICAL_SCHEMES: ColorScheme[] = ['tableau10', 'category10', 'dark2']
export const SEQUENTIAL_SCHEMES: ColorScheme[] = ['viridis', 'plasma']

export const DEFAULT_CATEGORICAL_SCHEME: ColorScheme = 'tableau10'
export const DEFAULT_SEQUENTIAL_SCHEME: ColorScheme = 'viridis'
