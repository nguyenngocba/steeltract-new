# Performance Baseline

Date: 2026-07-07

Scope: EPIC 102 / Sprint RT.1.

This baseline defines what SteelTrack can now measure. It does not claim production averages yet because no controlled load test was run during this sprint.

## Budget Classes

| Class | Budget | Applies To |
| --- | ---: | --- |
| Dashboard | 150 ms | Dashboard, cockpit, runtime overview |
| Detail | 120 ms | Material Detail, Project Detail, Dispatch Detail |
| Lookup | 80 ms | dropdowns, suggestions, master lookups |
| Search | 300 ms | searchable lists |
| Report | 1000 ms | audit/history/integrity/report endpoints |

## Baseline Matrix

| Area | Current Average | Current Peak | Query Count | Risk |
| --- | --- | --- | --- | --- |
| Inventory | Runtime-measured after traffic | Runtime-measured after traffic | Runtime-measured per request | Medium: transaction history and material detail can grow large |
| Projects | Runtime-measured after traffic | Runtime-measured after traffic | Runtime-measured per request | High: project runtime and WBS/task health aggregate broad sources |
| Logistics | Runtime-measured after traffic | Runtime-measured after traffic | Runtime-measured per request | Medium: dispatch receive can loop by line count |
| Dashboard | Runtime-measured after traffic | Runtime-measured after traffic | Runtime-measured per request | High: executive dashboard still depends on live module aggregation outside Inventory read model |
| Material Detail | Runtime-measured after traffic | Runtime-measured after traffic | Runtime-measured per request | Medium: core analytics/history still need future tab-specific split |
| Project Detail | Runtime-measured after traffic | Runtime-measured after traffic | Runtime-measured per request | Medium: tab boundary exists, but runtime/source compatibility remains |
| Dispatch Detail | Runtime-measured after traffic | Runtime-measured after traffic | Runtime-measured per request | Low/Medium: detail by id is bounded; events can grow |

## How to Capture Baseline Numbers

1. Start backend normally.
2. Exercise the target screen/API.
3. Fetch:

```bash
curl http://localhost:3000/performance/metrics
```

4. Inspect:

* `requests.recent`
* `queries.budgetWarnings`
* `queries.slowQueries`
* `queries.nPlusOneWarnings`
* `readModels.hits`
* `cache.hits`

## Interpretation

Budget exceeded:

* endpoint is slower than its configured class target.
* does not fail the request.
* should trigger review against `docs/audit/enterprise-performance-gate.md`.

Slow query:

* a single Prisma query exceeded 200 ms.
* logged in memory and appended to `docs/runtime/slow-query.log`.

Duplicate query warning:

* many repeated same table/action queries happened in one request.
* treat as potential N+1 or command-loop candidate.

## Next Baseline Step

Run a controlled smoke workload against:

* `/dashboard/cockpit`
* `/dashboard/executive-cockpit`
* `/inventory/materials`
* material detail endpoint
* `/projects/runtime`
* `/projects/:id/detail/:tab`
* `/logistics/dispatch-orders`
* `/logistics/dispatch-orders/:id`

Then update this report with measured averages and peaks.

