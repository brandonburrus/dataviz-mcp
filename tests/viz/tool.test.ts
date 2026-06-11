import { UserError } from 'fastmcp'
import { describe, expect, it } from 'vitest'
import type { VizSpec } from '../../src/viz/spec.js'
import { APP_RESOURCE_URI, createDataVisualizationTool } from '../../src/viz/tool.js'

const validSpec: VizSpec = {
  type: 'bar',
  data: [
    { month: 'Jan', sales: 100 },
    { month: 'Feb', sales: 120 },
  ],
  encodings: { x: 'month', y: 'sales' },
}

// The tool only reads validated args; context is unused by execute
const stubContext = {} as Parameters<typeof createDataVisualizationTool.execute>[1]

describe('createDataVisualizationTool', () => {
  it('is named create_data_visualization', () => {
    expect(createDataVisualizationTool.name).toBe('create_data_visualization')
  })

  it('declares the MCP App resource in _meta', () => {
    expect(createDataVisualizationTool._meta?.ui?.resourceUri).toBe(APP_RESOURCE_URI)
    expect(APP_RESOURCE_URI).toBe('ui://dataviz-mcp/app.html')
  })

  it('returns a text summary and the spec as structuredContent', async () => {
    const result = await createDataVisualizationTool.execute(validSpec, stubContext)
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'Created bar visualization: 2 records; x: month, y: sales',
        },
      ],
      structuredContent: validSpec,
    })
  })

  it('throws UserError for invalid encodings', async () => {
    const invalid: VizSpec = { ...validSpec, encodings: { x: 'month', y: 'revenue' } }
    await expect(createDataVisualizationTool.execute(invalid, stubContext)).rejects.toThrow(
      UserError,
    )
  })
})
