# Components Workspace Cutover

Date: 2026-07-12

## Cutover Matrix

| Workspace | Before | After | Result |
| --- | --- | --- | --- |
| Overview | full Components + Production + Yard arrays; React joins/filters/KPIs | paginated Overview read model with server summary/facets/analytics | PASS |
| List | full Components plus Production/BOM/Issue arrays; React filtering/KPI/pagination | paginated List read model with server readiness/KPI/analytics | PASS |
| History | hardcoded rows/KPIs and client pagination | real ComponentTimeline read model with server search/pagination/summary | PASS |
| Detail | live component endpoint | unchanged | PASS |
| Costing | live costing repository | unchanged | PASS |

## Frontend Scope

Only Components contracts, API adapters, query keys/hooks, and data bindings were
changed. Existing JSX structure, Tailwind classes, cards, tables, drawers,
routes, permissions and workflows were preserved.

Normal Overview and List reads are bounded by `page`/`limit`. Production/BOM and
legacy component lookup queries in List are now lazy and run only when the
existing detail/creation drawers need them. They are not part of the normal
workspace table read.

## Backward Compatibility

- `GET /components` was not removed or redefined.
- Existing mutation endpoints and responses are unchanged.
- `GET /components/:id/timeline` keeps array output when pagination is omitted.
- New response contracts are isolated under `/components/read-model/*`.

