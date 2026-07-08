# EPIC 100 Repository Layer Audit

Date: 2026-07-07

Scope: Inventory, Projects, Logistics.

Constraint: no business workflow change, no schema change, no API contract change.

## Summary

SteelTrack already had repository foundations in Inventory and Projects. Logistics did not have a repository layer before this pass.

This sprint moved high-value aggregate/read paths behind repository methods and avoided broad command-path rewrites where stock/project/dispatch workflow behavior could be accidentally changed.

## Inventory

Existing repository:

* `apps/backend-api/src/modules/inventory/inventory.repository.ts`

Added repository methods:

* `findPositiveLocationStocksByItem`
* `findTransactionsByItem`
* `findSuppliersByIds`
* `findDashboardSnapshotSources`
* `findRecentDashboardTransactions`

Service changes:

* `InventoryService.getItemDetail()` now reads material detail stock/history/supplier inputs through `InventoryRepository`.
* `DashboardInventoryReadModelService` now reads Inventory snapshot and recent transaction sources through `InventoryRepository`.

Direct Prisma intentionally left:

* Inventory transaction mutation and stock mutation paths.
* Return workflow lifecycle paths.
* Category/unit/type controllers.

Reason:

These are command/workflow paths with stock side effects. They should be moved behind repositories in a dedicated workflow-hardening sprint with regression scenarios.

## Projects

Existing repository:

* `apps/backend-api/src/modules/projects/repositories/projects.repository.ts`

Added repository methods:

* `findRuntimeSources`
* `findProjectDetailSources`

Service changes:

* `ProjectsService.runtimeDashboard()` now obtains its aggregate source collections through `ProjectsRepository`.
* `ProjectsService.detailTab()` no longer calls `runtimeDashboard()` and slices arrays. It now asks the repository for tab-scoped project sources.

Direct Prisma intentionally left:

* Project template CRUD.
* ProjectTask command mutations.
* ProjectTask existence/circular-parent validation.

Reason:

These are write-heavy domain workflows. They should be moved behind repository methods incrementally after ProjectTask regression tests are formalized.

## Logistics

New repository:

* `apps/backend-api/src/modules/logistics/logistics.repository.ts`

Repository responsibilities:

* Dispatch order list/detail/create/update.
* Dispatch suggestion task source lookup.
* Active component dispatch guard.
* Project task material/component allocation reconciliation.
* Component delivery update.
* Logistics activity log write.

Service changes:

* `LogisticsService` now coordinates business workflow and uses `LogisticsRepository` for DispatchOrder and allocation aggregate persistence.
* `InventoryService` remains the owner of Inventory transaction creation during dispatch receive.

## Remaining Repository Debt

P0 later:

* Move Inventory return workflow queries into `InventoryRepository` or a dedicated `InventoryReturnRepository`.
* Move Project template CRUD into `ProjectsRepository`.
* Move ProjectTask command validation and mutation into repository methods.

P1 later:

* Add repository-level query options for pagination and field projection.
* Add query budget annotations on repository methods that can scan large tables.
* Add integration tests around Inventory transaction mutation before moving more command paths.

