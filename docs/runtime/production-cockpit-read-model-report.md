# EPIC172 Production Cockpit Read Model Report

Date: 2026-07-13

Status: **APPROVED**

## Scope

The active Production Overview, Orders and Planning workspaces now read
`GET /production/read-model/cockpit`. The endpoint is additive and the existing
`GET /production` contract remains available.

## Read Path

```text
ProductionCockpitPage
  -> useProductionCockpitReadModel
  -> GET /production/read-model/cockpit
  -> ProductionService (orchestration only)
  -> ProductionRepository.cockpitReadModel
  -> Prisma live data
```

The repository owns search, status/scope filtering, stable sorting, page/limit,
KPI totals, progress/readiness distributions, material readiness, delayed-order
ranking, queue totals and Work Center counts. Returned order rows include a
`cockpit` projection for progress, delayed state and material readiness. React
only formats and renders those values.

## Compatibility

- Existing routes and mutation APIs are unchanged.
- `GET /production` remains backward compatible.
- `GET /production/metrics` remains snapshot-first and was not modified.
- No Prisma schema, migration, workflow, event, runtime or Operations Center
  change was introduced.

## Query Behavior

- Order rows are bounded by `page` and `limit` (default 14, maximum 100).
- Search, status, Planning scope and sort parameters are part of the React Query
  key.
- Previous page data is retained while a new page is loading.
- Search uses React deferred input; stale HTTP responses cannot overwrite a
  different query key.
- Overview/Orders/Planning no longer activate the unbounded Production order,
  BOM, issue or reservation hooks for KPI composition.

## Validation

The focused repository test proves pagination metadata, Production weight,
status KPI and material readiness enrichment. Backend and frontend builds pass.

## Limitations

Repository summary composition currently reads a narrow live projection of all
matching orders. This removes browser-side aggregation and unbounded response
payloads, but a future measured optimization may replace the internal summary
projection with SQL aggregate/read-model tables when Production volume warrants
it. No scale claim is made without benchmark evidence.
