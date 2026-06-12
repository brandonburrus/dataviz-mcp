import type { FastMCPSessionAuth, Tool } from 'fastmcp'
import { vizSpecSchema } from './spec.js'
import { summarizeSpec } from './summary.js'
import { validateSpec } from './validate.js'

export const APP_RESOURCE_URI = 'ui://dataviz-mcp/app.html'

export const createDataVisualizationTool: Tool<FastMCPSessionAuth, typeof vizSpecSchema> = {
  name: 'create_data_visualization',
  description:
    'Create an interactive D3 visualization (bar, stacked bar, line, scatter, pie, or heatmap) ' +
    'from tabular data. Provide the data in columnar form: a columns array naming the fields ' +
    'once, and a rows array where each row holds one value per column in column order. Map column ' +
    'names to visual channels via encodings (a stacked bar requires a series channel naming the ' +
    'segments stacked in each bar). The result renders as an interactive app with tooltips, ' +
    'legend toggling, and zoom where applicable.',
  parameters: vizSpecSchema,
  annotations: {
    readOnlyHint: true,
    openWorldHint: false,
  },
  _meta: { ui: { resourceUri: APP_RESOURCE_URI } },
  execute: async spec => {
    validateSpec(spec)
    return {
      content: [{ type: 'text', text: summarizeSpec(spec) }],
      structuredContent: spec,
    }
  },
}
