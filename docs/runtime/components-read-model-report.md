# Components Read Model Report

Date: 2026-07-12

## Status

Components Workspace Live Read Model: **APPROVED for List, Overview, History,
Detail and Costing**.

EPIC142 adds three backward-compatible read endpoints:

- `GET /components/read-model/list`;
- `GET /components/read-model/overview`;
- `GET /components/read-model/history`.

The legacy `GET /components` behavior remains unchanged. Optional pagination was
also added to `GET /components/:id/timeline`; calls without `page` or `limit`
still return the legacy array.

## Data Path

```text
Components page query state
  -> Components React Query hook
  -> additive read-model endpoint
  -> ComponentsReadModelService
  -> ComponentsReadModelRepository
  -> PostgreSQL live tables
```

List and Overview hydrate only the requested page. Summary, facets, project
distribution, status counts, material readiness, weight and activity series are
computed by database count/group/top-N/aggregate queries. The server does not
fetch every Component row merely to aggregate in Node.

Component Detail and Costing retain the EPIC141 live repository paths. No
snapshot, cache, runtime framework or schema was introduced.

## Real-Data Evidence

A read-only Prisma smoke test against the configured database returned:

- List: 1 row, total 1, completed 1, weight 1110;
- Overview: 1 row, total 1, QC pass 1;
- History: 1 row, total 1, completed/passed 1.

This validates SQL syntax and response shape on current real data. It is not a
large-dataset benchmark.

