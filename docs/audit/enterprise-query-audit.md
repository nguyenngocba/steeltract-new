# Enterprise Query Audit

Date: 2026-07-07

Scope: EPIC 101 / Sprint ARCH.2.

This audit reviewed backend query patterns for N+1 risk, over-fetching, duplicate query work, query-in-loop patterns, and deep Prisma includes. Findings are recommendations only; no business logic was changed.

## Method

Discovery used Semble first, then exact scans for Prisma query calls, loop patterns, and schema indexes.

Reviewed areas:

* Dashboard and runtime endpoints.
* Inventory services/repository and return workflow.
* Projects service/repository and ProjectTask domain paths.
* Logistics repository/service.
* Production/costing paths where they influence dashboard/runtime scale.

## Findings by Category

### N+1 / Query in Loop

Severity: P1

Observed:

* `LogisticsService` receive/reconciliation path loops dispatch items and reads or mutates project task allocations and components per item.
* `ReturnWorkflowService.applyProjectReturnReceived()` loops return request items, then loops matching allocations and updates each allocation.
* Project template import and WBS generation paths write tasks/resources/material suggestions in loops.
* Costing and production readiness calculations iterate loaded child collections in memory after broad includes.

Assessment:

* Most loop queries are command paths, not cockpit reads, so they are acceptable at current volume.
* They become risky for bulk operations, large dispatches, large WBS template generation, or high-volume returns.

Recommendation:

* Keep command behavior unchanged now.
* Add repository batch helpers before allowing large bulk dispatch/return/template imports.
* Use `createMany`, `updateMany`, batched `findMany({ where: { id: { in: [...] } } })`, and transaction-scoped maps where possible.

### Over-Fetching

Severity: P0 for runtime/dashboard paths, P1 for details.

Observed:

* `GET /projects/runtime` collects projects, components, inventory transactions, production orders, component tasks, ProjectTasks, return requests, documents, and activity logs.
* Dashboard executive services aggregate real operational tables directly in multiple service paths.
* Inventory Material Detail still uses a broad material detail payload for core analytics/history.
* Production/costing services include BOM/material issue/consumption/component/project relations for cost derivation.

Assessment:

* The broad runtime endpoints are useful during rapid product development but are not enterprise-safe at 100M+ operational records.
* The first boundary already exists for Project Detail tab queries and Inventory dashboard read models.

Recommendation:

* Move runtime/cockpit endpoints to persisted read models.
* Split Inventory Material Detail into tab-native APIs before material transaction history grows materially.
* Keep compatibility DTOs while replacing data sources behind services.

### Duplicate Query Work

Severity: P1

Observed:

* Dashboard inventory sources were previously duplicated; this is partially resolved through `DashboardInventoryReadModelService`.
* Project runtime-derived data still overlaps with Project Detail and Project cockpit needs.
* Inventory return workflow and Project material allocation calculations both derive pending/returned/available return quantities.

Recommendation:

* Continue centralizing read-source ownership in repositories.
* Promote project runtime and return-allocation calculations into read-model builders.
* Avoid re-deriving the same aggregate separately in Project, Inventory, and Dashboard services.

### Deep Includes

Severity: P1

Observed:

* ProjectTask include trees load dependencies, material allocations, component allocations, resources, inspections, costs, and nested material/component relations.
* Dispatch order detail includes project, project task, items, materials, components, and events.
* Inventory transaction detail includes items, material, unit, warehouse, zone, and related location fields.
* Costing includes production orders with BOM items, issues, consumptions, components, and projects.

Assessment:

* Deep includes are acceptable for id-based detail reads when bounded.
* They are not acceptable for dashboard/list endpoints over large row counts.

Recommendation:

* Keep deep includes restricted to detail-by-id endpoints.
* For list/cockpit pages, use explicit DTO projections or read-model tables.

### Unbounded or Broad Reads

Severity: P0

Watchlist:

* `runtime` and `runtime-integrity` controllers.
* Dashboard executive/control tower services.
* Project runtime source queries.
* Inventory transaction/item history queries.
* ActivityLog reads when not module/date bounded.

Recommendation:

* Treat runtime/integrity as diagnostic/admin-only.
* Require date windows and `take` on log/history endpoints.
* Prefer snapshots for executive dashboard and Project command-center metrics.

## Module Notes

### Inventory

Strengths:

* Inventory dashboard sources have a repository/read-model boundary.
* Location stock and transaction item indexes exist for important base lookups.

Risks:

* Return workflow still contains direct Prisma command logic.
* Material detail history can become heavy without per-tab APIs.
* Transaction tables need composite indexes for common type/date/project/material reads.

### Projects

Strengths:

* ProjectTask domain is normalized.
* Project Detail has tab-scoped API boundaries.
* Project runtime sources are centralized in `ProjectsRepository`.

Risks:

* `GET /projects/runtime` is still broad by design.
* WBS/template command operations contain loop writes.
* Project health/cost/scheduling should become persisted snapshots for enterprise-scale dashboards.

### Logistics

Strengths:

* Dispatch aggregate reads are repository-owned.
* Dispatch domain has status/date/project/task indexes.

Risks:

* Receive reconciliation loops per dispatch item.
* Dispatch dashboard uses bounded recent orders today; long-term it needs `LogisticsDispatchSnapshot`.

### Dashboard

Strengths:

* Inventory-heavy dashboard paths use a cached read model.
* Executive services are split by concern.

Risks:

* Production, Yard, QC, Projects, Suppliers, and Logistics dashboard inputs still depend on live operational queries.
* Executive recommendations should read snapshots rather than recomputing live once data grows.

## Priority Recommendations

P0:

* Enforce the performance gate for every new Dashboard/Runtime endpoint.
* Replace executive dashboard live aggregation with persisted snapshots in a future schema sprint.
* Add composite indexes for high-volume transaction/log/task access patterns.

P1:

* Batch command-path loops in Logistics receive, Inventory return receipt, Project template/WBS generation.
* Split Inventory Material Detail into tab-native APIs.
* Add ProjectRuntimeSnapshot and ProjectTaskHealthSnapshot builders.

P2:

* Add query instrumentation and endpoint timing logs.
* Convert remaining command services to repositories after regression tests exist.
* Add payload-size budget checks to cockpit endpoints.

