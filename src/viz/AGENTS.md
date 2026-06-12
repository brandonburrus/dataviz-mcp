# src/viz

## Purpose

The tool contract for `create_data_visualization`: the zod input schema,
cross-field semantic validation, the one-line result summary, and the tool
object itself. This module is shared between the node server and the browser
app, so most of it must stay environment-neutral.

## How it works

- `spec.ts`: `vizSpecSchema` (zod) defines the input in columnar form: `type`
  (bar | stacked-bar | histogram | line | area | stacked-area | scatter | bubble
  | pie | heatmap), `columns` (field names, declared once),
  `rows` (1 to 10k positional value arrays, one value per column), `encodings`
  (column-name-to-channel map), optional title/labels/colorScheme. Also exports
  `CHANNEL_RULES`, the per-type required/optional/numeric channel table that
  validation and docs share.
- `data.ts`: environment-neutral runtime helpers. `toRecords(spec)` zips
  `columns` with each `row` into keyed records, the shape both validation and the
  renderers actually work with; `isIsoDateString`, `distinctValues`,
  `parseXValues` operate on those records. **Only `import type` from spec.ts is
  allowed here**; a value import would pull zod into the browser bundle.
- `validate.ts`: `validateSpec` enforces what zod cannot: required channels per
  type, channels the type does not use, unique column names, every row length
  matching the columns, encodings referencing real columns, numeric channels
  numeric in every row (with row index in the error), line/scatter x all-numeric
  or all-ISO-date, non-negative pie and stacked-bar values, scheme-type
  compatibility. It runs
  the structural checks on `columns`/`rows` directly, then `toRecords` for the
  value checks. Throws fastmcp `UserError` with corrective messages naming the
  offending channel/row and listing the columns, so the calling LLM can fix its
  input. Server-only (imports fastmcp).
- `summary.ts`: `summarizeSpec` produces the text content block the model reads.
- `tool.ts`: the `Tool` object with `_meta.ui.resourceUri` (`APP_RESOURCE_URI`)
  and an execute that validates then returns `{ content: [summary],
  structuredContent: spec }`. The app renders exactly the `structuredContent`.

## Gotchas

- Channel semantics differ by type: bar/stacked-bar x is categorical;
  line/area/stacked-area/scatter/bubble x must be all-numeric or all-ISO-date
  (the `CONTINUOUS_X_TYPES` check; mixed is rejected); histogram x is strictly
  numeric (it is a `numeric` channel in CHANNEL_RULES and is binned, deriving its
  own y/count); heatmap x/y are categorical with numeric value; pie uses
  category+value, not x/y.
- stacked-bar and stacked-area require series (it names the stacked segments);
  bubble requires size (numeric radius); for bar/line/area/scatter/bubble series
  is optional. Non-negativity is enforced per type via the `NON_NEGATIVE_CHANNELS`
  map: pie value, stacked-bar y, stacked-area y, and bubble size must be >= 0 so
  marks do not diverge, invert, or take an imaginary radius.
- Sequential schemes (viridis, plasma) are heatmap-only; categorical schemes
  (tableau10, category10, dark2) are for every other type.
- The tool is exported as a plain object (not registered inline) because FastMCP
  has no public tools getter; tests call `execute` directly with a stub context.
