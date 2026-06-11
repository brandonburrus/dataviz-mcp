# src/viz

## Purpose

The tool contract for `create_data_visualization`: the zod input schema,
cross-field semantic validation, the one-line result summary, and the tool
object itself. This module is shared between the node server and the browser
app, so most of it must stay environment-neutral.

## How it works

- `spec.ts`: `vizSpecSchema` (zod) defines the input: `type` (bar | line |
  scatter | pie | heatmap), `data` (1 to 10k flat records), `encodings`
  (field-name-to-channel map), optional title/labels/colorScheme. Also exports
  `CHANNEL_RULES`, the per-type required/optional/numeric channel table that
  validation and docs share.
- `data.ts`: environment-neutral runtime helpers (`isIsoDateString`,
  `distinctValues`, `parseXValues`). **Only `import type` from spec.ts is
  allowed here**; a value import would pull zod into the browser bundle.
- `validate.ts`: `validateSpec` enforces what zod cannot: required channels per
  type, channels the type does not use, fields existing in the data, numeric
  channels numeric in every record (with row index in the error), line/scatter x
  all-numeric or all-ISO-date, non-negative pie values, scheme-type
  compatibility. Throws fastmcp `UserError` with corrective messages naming the
  offending channel/row and the available fields, so the calling LLM can fix its
  input. Server-only (imports fastmcp).
- `summary.ts`: `summarizeSpec` produces the text content block the model reads.
- `tool.ts`: the `Tool` object with `_meta.ui.resourceUri` (`APP_RESOURCE_URI`)
  and an execute that validates then returns `{ content: [summary],
  structuredContent: spec }`. The app renders exactly the `structuredContent`.

## Gotchas

- Channel semantics differ by type: bar x is categorical; line/scatter x must be
  all-numeric or all-ISO-date (mixed is rejected); heatmap x/y are categorical
  with numeric value; pie uses category+value, not x/y.
- Sequential schemes (viridis, plasma) are heatmap-only; categorical schemes
  (tableau10, category10, dark2) are for the other four types.
- The tool is exported as a plain object (not registered inline) because FastMCP
  has no public tools getter; tests call `execute` directly with a stub context.
