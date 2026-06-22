# GraphQL Results

Renders a paginated table of records returned by an AEM GraphQL persisted
query. Used for search/listing pages (institutions, securities, agency
actions). Shares its rendering engine with the [GraphQL Detail](../graphql-detail/README.md)
block via `scripts/graphql-table.js`.

## Authoring

The block is a 4-row table:

| Row | Cell 1 (label) | Cell 2 (value) |
| --- | --- | --- |
| 1 | `query-url:` | link to the persisted query, e.g. `/graphql/execute.json/ndbf/search-securities` |
| 2 | `page-size:` | number of rows per page, e.g. `20` |
| 3 | _(column header titles — one cell per column)_ | |
| 4 | _(cell templates — one cell per column)_ | |

Rows 3 and 4 must have the **same number of cells** — one per table column.
Row 3 holds the column headings; row 4 holds the template for that column's
cell, repeated for every result.

### Example

```
| GraphQL Results                                                          |
| query-url: | /graphql/execute.json/ndbf/search-securities               |
| page-size: | 20                                                          |
| Issuer            | Filing Number | Status                              |
| <issuerName>      | <filingNumber> | <status>                           |
```

## Placeholder grammar

Cell templates (and the heading template in the detail block) use `<…>`
placeholders, resolved per result. Full grammar lives in
`scripts/graphql-table.js` (`resolvePlaceholder`).

| Syntax | Meaning |
| --- | --- |
| `<fieldName>` | value of `fieldName` (literal `<fieldName>` kept if it isn't a key) |
| `<a.b.c>` | dot-path into nested objects |
| `<a\|b\|c>` | OR — first truthy value wins |
| `<a&b&c>` | AND — all truthy → last value, otherwise empty |
| `<date:field>` | format a date, `MM/DD/YYYY` (default) |
| `<date-medium:field>` | `Jun 30, 2025` |
| `<date-long:field>` | `June 30, 2025` |
| `<br/>` | blank-line spacer inside a cell |
| `<each:NAME>` | repeat the cell once per item in the `NAME` array (see below) |

Operators can't be mixed in one placeholder; `&` wins if both appear. Any
chained key may itself be a dot-path or `date:` directive
(e.g. `<date:a.b|date:c.d>`).

### Links

Placeholders also resolve inside `href` attributes, so a "view details"
link can carry a field value with no extra configuration:

```
<a href="/searches/securities-detail?filingNumber=<filingNumber>">View</a>
```

(The docx editor percent-encodes the angle brackets; the block normalizes
them back before substituting.)

### Repeating child rows — `<each:NAME>`

If a result has a child array (e.g. an institution's `locations`), a cell
template containing `<each:NAME>` repeats that column once per array item.
Other columns in the same result are `rowspan`'d across the repeated rows.
Inside the loop, placeholders resolve against the child item first, then
fall back to the parent.

## Behavior

- **Loading** — a spinner shows immediately; the persisted-query fetch runs
  in the background so the rest of the page isn't blocked.
- **Empty results** — renders an `alert` (warning) reading
  _"There are no records that match your inquiry."_
- **Fetch failure** — renders an `alert` (error) reading
  _"Unable to load results. Please try again."_
- **Pagination** — two fetches run in parallel: a `page-size`-limited query
  (renders the first page fast, with minimal **prev/next** nav) and an
  unbounded query. When the full set lands, the nav upgrades to numbered
  jump-to-N pagination and further navigation is instant (client-side).
  Pre-full-set, the next pages are prefetched so forward navigation is
  usually instant too.
- **Search-specific class** — the block element gets a class derived from
  the query URL's last two path segments, e.g.
  `/graphql/execute.json/ndbf/search-securities` →
  `.ndbf-search-securities`. Use it to scope per-search styling.

## Filtering

URL query params are forwarded to the persisted query as filter variables,
so a search form that submits to this page (e.g.
`?issuerName=Apple&filingDateFrom=1/1/24`) filters the results. Values
shaped like `M/D/YY` are converted to ISO `YYYY-MM-DD` for AEM's `Calendar`
filters.

> The query variable names must match the URL param names. Verify against
> the persisted query definition.

## Files

- `graphql-results.js` — parses the authoring rows, calls `renderTable`
- `graphql-results.scss` / `.css` — block styling (imports the shared
  pagination + spinner partials)
- `../../scripts/graphql-table.js` — shared fetch/render/pagination engine