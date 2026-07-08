# Persisted Read Model Foundation

Date: 2026-07-07

Scope: Sprint PERF.3 foundation planning for Inventory, Projects, and Logistics.

No schema changes were made in this sprint.

## Current State

Inventory:

* Uses `DashboardInventoryReadModelService` with process-local TTL cache.
* Source data comes from `InventoryRepository.findDashboardSnapshotSources`.
* Covers item stock, location stock, recent movements, low-stock, procurement, anomaly, and forecast inputs.

Projects:

* `GET /projects/runtime` remains a runtime aggregation endpoint.
* `GET /projects/:id/detail/:tab` now has tab-scoped source queries.
* Read model state is not persisted yet.

Logistics:

* Dispatch dashboard is computed from recent `DispatchOrder` aggregates.
* Dispatch order detail uses direct aggregate detail lookup through `LogisticsRepository`.

## Target Persisted Read Models

### InventoryDashboardSnapshot

Recommended fields:

* snapshotDate
* generatedAt
* totalItems
* totalStockQty
* totalStockValue
* lowStockCount
* outOfStockCount
* inbound30Qty
* outbound30Qty
* outbound90Qty
* categoryDistribution
* warehouseDistribution
* topLowStockItems
* topProcurementSuggestions

Refresh strategy:

* On inventory transaction created.
* On material master minimum stock update.
* Nightly full rebuild.

### ProjectRuntimeSnapshot

Recommended fields:

* projectId
* generatedAt
* progress
* contractValue
* actualValue
* materialCost
* componentCost
* componentStatusCounts
* taskStatusCounts
* healthStatus
* warnings
* suggestedActions

Refresh strategy:

* On ProjectTask create/update/delete.
* On Project material return lifecycle change.
* On component delivery/install/return.
* Nightly full rebuild.

### LogisticsDispatchSnapshot

Recommended fields:

* snapshotDate
* generatedAt
* waiting
* inTransit
* delivered
* completed
* movementsToday
* statusCounts
* vehicleUtilization
* recentDispatchOrders

Refresh strategy:

* On dispatch order created.
* On dispatch status change.
* Nightly full rebuild.

## Migration Path

Phase 1:

* Keep current cached read models.
* Route all dashboard/runtime aggregation through repositories.
* Add query budget reports and capture slow endpoints.

Phase 2:

* Add persisted snapshot tables in a dedicated migration sprint.
* Add rebuild services with idempotent full rebuild methods.
* Keep old endpoints returning the same DTO shape.

Phase 3:

* Switch read endpoints from live aggregation to persisted snapshots.
* Keep live fallback when snapshot rows are missing.
* Add admin-only rebuild command/API if needed.

Phase 4:

* Add outbox/background job refresh once Workflow/Realtime foundation is ready.

## Compatibility Rule

Persisted read models must not change existing frontend response contracts. They should replace data sources behind existing services first, then expose new snapshot admin tooling only after operators validate parity.

