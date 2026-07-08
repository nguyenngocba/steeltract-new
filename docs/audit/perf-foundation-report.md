# PERF Foundation Report

Date: 2026-07-07

Scope: Sprint PERF.1, PERF.2, and PERF.3 foundation work.

## PERF.1 Audit Result

Dashboard API endpoints were audited in `docs/audit/dashboard-api-performance-audit.md`.

Inventory was the highest-priority dashboard read-model candidate because Dashboard endpoints repeatedly read:

* `inventory_items`
* `inventory_location_stocks`
* `inventory_transactions`
* `inventory_transaction_items`

## PERF.2 Inventory Read Model

Implemented an internal Inventory dashboard read model service:

* `DashboardInventoryReadModelService`
* Location stock by material.
* Inventory item stock/low-stock snapshot.
* Recent 90-day movement lines for trend and forecast calculations.
* Bounded recent transaction lookup for activity views.
* 30-second in-memory TTL to avoid recomputing the same dashboard Inventory snapshot within rapid dashboard refreshes.

Compatibility:

* Existing Dashboard routes are unchanged.
* Existing frontend DTO shapes are preserved.
* No UI changes were required.
* No schema or migration was added.

Refactored consumers:

* `/dashboard/cockpit`
* `/dashboard/stats`
* `/dashboard/recent-transactions`
* `/dashboard/low-stock`
* `/dashboard/procurement`
* `/dashboard/anomalies`
* Dashboard metrics material forecast.
* Dashboard production stop risk stock lookup.
* Dashboard inventory notifications.
* Dashboard inventory health insights.
* Dashboard inventory recent activities.

## PERF.3 Lazy Detail Loading

Added tab-scoped/lazy detail boundaries without changing routes or workflows.

Projects:

* Added `GET /projects/:id/detail/:tab`.
* Frontend `ProjectDetailWorkspace` now caches tab payloads using React Query key `['project-detail-tab', projectId, tab]`.
* Existing `GET /projects/runtime` remains compatible and still drives the list/dashboard views.

Inventory Material Detail:

* Material attachments now load only for tabs that display overview/images/documents.
* Transaction attachments now load only for tabs that need transaction/project/supplier/log document context.
* Existing Material Detail data contract remains unchanged.

Logistics:

* Added frontend detail query for `GET /logistics/dispatch-orders/:id`.
* Dispatch detail drawer now refreshes and caches selected order detail with React Query key `['logistics-dispatch-detail', orderId]`.

## Remaining Performance Debt

* `DashboardInventoryReadModelService` is an internal cached read model, not a persisted database snapshot.
* The read model still scans bounded recent Inventory transaction data; large installations should move this to persisted dashboard snapshots or a scheduled aggregation table.
* `GET /projects/:id/detail/:tab` currently slices `runtimeDashboard()` results internally. It creates a frontend/cache boundary first, but the backend still needs native tab-specific queries later.
* Inventory Material Detail lazy loading currently covers attachment-heavy tab data. A future sprint should split the full material detail endpoint into tab-specific APIs if detail payload size becomes a real bottleneck.
* Dashboard Production, Yard, QC, Projects, and Costing still need read-model passes after Inventory.

## Verification

* `pnpm -C apps/backend-api build` passed.
* `pnpm -C apps/frontend build` passed.
* `git diff --check` passed.
