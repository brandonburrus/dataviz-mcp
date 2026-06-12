import { z } from 'zod'

export const vizTypeSchema = z.enum(['bar', 'line', 'scatter', 'pie', 'heatmap'])

const dataValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])

export const encodingsSchema = z.object({
  x: z
    .string()
    .optional()
    .describe('Field for the x axis. bar/heatmap: category; line/scatter: number or ISO date'),
  y: z
    .string()
    .optional()
    .describe('Field for the y axis. bar/line/scatter: numeric value; heatmap: category'),
  series: z
    .string()
    .optional()
    .describe('Field that splits bar/line/scatter data into colored, legend-toggleable series'),
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
    .describe('tableau10/category10/dark2 for bar, line, scatter, pie; viridis/plasma for heatmap')
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
  line: { required: ['x', 'y'], optional: ['series'], numeric: ['y'] },
  scatter: { required: ['x', 'y'], optional: ['series'], numeric: ['y'] },
  pie: { required: ['category', 'value'], optional: [], numeric: ['value'] },
  heatmap: { required: ['x', 'y', 'value'], optional: [], numeric: ['value'] },
}

export const CATEGORICAL_SCHEMES: ColorScheme[] = ['tableau10', 'category10', 'dark2']
export const SEQUENTIAL_SCHEMES: ColorScheme[] = ['viridis', 'plasma']

export const DEFAULT_CATEGORICAL_SCHEME: ColorScheme = 'tableau10'
export const DEFAULT_SEQUENTIAL_SCHEME: ColorScheme = 'viridis'
