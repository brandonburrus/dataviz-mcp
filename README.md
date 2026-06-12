# Data Visualization MCP

A [Model Context Protocol](https://modelcontextprotocol.io) server that turns
tabular data into interactive [D3](https://d3js.org) visualizations. It exposes a
single `create_data_visualization` tool that returns an
[MCP App](https://modelcontextprotocol.io/extensions/apps/overview): an HTML page
the host renders inline in the conversation, inside a sandboxed iframe.

## Supported visualizations

| Type | Required encodings | Optional | Interactivity |
|---|---|---|---|
| `bar` | `x` (category), `y` (number) | `series` | tooltips, legend toggle |
| `stacked-bar` | `x` (category), `y` (number), `series` | | tooltips, legend toggle |
| `line` | `x` (number or ISO date), `y` (number) | `series` | tooltips, legend toggle, x zoom/pan |
| `scatter` | `x` (number or ISO date), `y` (number) | `series` | tooltips, legend toggle, x/y zoom/pan |
| `pie` | `category`, `value` (number) | | tooltips with percentage, legend toggle |
| `heatmap` | `x` (category), `y` (category), `value` (number) | | tooltips, gradient legend |

All types support an optional `title`, `xLabel`, `yLabel`, and `colorScheme`, and
re-render responsively when the container resizes.

## Tool input

`create_data_visualization` takes the data in columnar form (field names declared
once, then positional value rows) plus a map of field names to visual channels.
Declaring the columns once keeps the payload compact for large tables:

```json
{
  "type": "bar",
  "columns": ["month", "sales", "region"],
  "rows": [
    ["Jan", 100, "EU"],
    ["Jan", 80, "US"],
    ["Feb", 120, "EU"],
    ["Feb", 90, "US"]
  ],
  "encodings": { "x": "month", "y": "sales", "series": "region" },
  "title": "Quarterly Sales"
}
```

Each row holds one value per column, in column order. `colorScheme` accepts
`tableau10`, `category10`, or `dark2` for categorical types (bar, stacked-bar,
line, scatter, pie), and `viridis` or `plasma` for heatmaps. The server validates the spec before
rendering and returns a corrective message if, for example, a row length does not
match the columns or an encoding references a name absent from the columns.

## Setup and development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for requirements, build, running over
stdio or HTTP, configuring Claude Desktop, and the development workflow.

## License

MIT
