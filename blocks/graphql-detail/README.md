# GraphQL Detail

Renders a single-record detail view from an AEM GraphQL persisted query: a
nav row (Back / Print), an optional heading callout, and a table of the
record's child rows. The detail-page counterpart to
[GraphQL Results](../graphql-results/README.md); both share the rendering
engine in `scripts/graphql-table.js`.

## Authoring

The block is a 5-row table:

| Row | Cell 1 (label) | Cell 2 (value) |
| --- | --- | --- |
| 1 | `query-url:` | link to the persisted query, e.g. `/graphql/execute.json/ndbf/get-security` |
| 2 | `back-url:` | link to the results page the "Back to Results" button falls back to |
| 3 | `heading:` | heading template, substituted against the first result (leave empty for no callout) |
| 4 | _(column header titles — one cell per column)_ | |
| 5 | _(cell templates — one cell per column)_ | |

Rows 4 and 5 must have the **same number of cells**. The detail query is
typically a `get-*` query that returns one record, with child rows surfaced
via `<each:NAME>` (see the Results block README for the placeholder grammar
— it is identical here).

### Example

```
| GraphQL Detail                                                           |
| query-url: | /graphql/execute.json/ndbf/get-security                    |
| back-url:  | /searches/securities                                        |
| heading:   | <strong>Issuer:</strong> <issuerName>                       |
|            | <strong>Filing #:</strong> <filingNumber>                   |
| Filing Date            | Effective Date          | Status               |
| <each:licenseDetails><date:filingDate> | <date:effectiveDate> | <status> |
```

## Heading callout

Cell 2 of the `heading:` row is a free-form template substituted against the
**first result**. Authors typically use `<strong>Label:</strong> <field>`
pairs on separate lines; the block merges them into a single styled callout
(`.graphql-heading`). If the cell is empty, or every placeholder resolves to
nothing, no callout is rendered.

## Nav row

A header strip sits above the content:

- **🔍 Back to Results** — uses `history.back()` when the user arrived from a
  same-origin page (preserving the results page's filter state and scroll).
  Otherwise (bookmark, external link, fresh tab) it navigates to the
  configured `back-url:`. The link's `href` reflects whichever destination
  applies, so hover / right-click / middle-click all behave correctly.
- **🖨 Print** — calls `window.print()`.

The nav row is hidden in print output (`@media print`).

## Behavior

Same shared engine as GraphQL Results:

- **Loading** — spinner shows immediately; fetch runs in the background.
- **Fetch failure** — renders an `alert` (error).
- **Search-specific class** — the block gets a class from the query URL's
  last two path segments, e.g.
  `/graphql/execute.json/ndbf/get-security` → `.ndbf-get-security`.
- **Scrollable table** — when a cell uses `<each:NAME>`, the inner table is
  rendered with the `scrollable` variant (the stacked-mobile layout can't
  represent `rowspan`'d cells).

Pagination is not used here — a detail query returns a single record.

## Files

- `graphql-detail.js` — parses the authoring rows, builds the nav row, calls
  `renderTable` against an inner body container
- `graphql-detail.scss` / `.css` — block styling (nav row, heading callout,
  scrollable table overrides; imports the shared spinner partial)
- `../../scripts/graphql-table.js` — shared fetch/render engine
