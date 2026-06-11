import type { FastMCPSessionAuth, Tool } from 'fastmcp'
import { vizSpecSchema } from './spec.js'
import { summarizeSpec } from './summary.js'
import { validateSpec } from './validate.js'

export const APP_RESOURCE_URI = 'ui://dataviz-mcp/app.html'

export const createDataVisualizationTool: Tool<FastMCPSessionAuth, typeof vizSpecSchema> = {
  name: 'create_data_visualization',
  description:
    'Create an interactive D3 visualization (bar, line, scatter, pie, or heatmap) from tabular ' +
    'records. Pass data as an array of flat objects and map field names to channels via ' +
    'encodings. The result renders as an interactive app with tooltips, legend toggling, and ' +
    'zoom where applicable.',
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
