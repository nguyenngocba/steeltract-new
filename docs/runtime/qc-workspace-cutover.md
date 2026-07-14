# QC Workspace Cutover

## Before

```text
QcPage -> /qc/cockpit
       -> first 200/100 rows plus all Components/Projects
       -> React search/filter/KPI/trend
```

## After

```text
QcPage query state
  -> TanStack Query key(page, limit, search, status, sort)
  -> /qc/read-model/workspace
  -> QcReadModelRepository
  -> bounded live database reads
```

The active page keeps its current JSX layout, Tailwind classes, tables, cards,
dialogs and actions. Only the API adapter, query hook and data binding changed.
Mutations invalidate the QC workspace query family.

Search is deferred before entering the query key. TanStack Query handles stale
responses by key and preserves previous-page data during parameter changes.
No client-side inspection filtering or KPI aggregation remains in `QcPage`.

The current UI has no pagination controls; it requests page 1 with a limit of
100 to preserve presentation. The API is server-paginated and ready for a later
approved presentation-only pagination control.

