# Enterprise Index Audit

Date: 2026-07-07

Scope: EPIC 101 / Sprint ARCH.3.

This audit documents existing index coverage and proposes future composite/covering indexes for enterprise-scale SteelTrack data. No Prisma schema or migration was changed.

## Existing Strengths

Inventory:

* `inventory_items` has indexes on code, name, unit, material type, usage type, slot, level, and deleted state.
* `inventory_transactions` has unique `code` and `transactionNo`, plus indexes on type, transaction type, direction, warehouse, zone, project, and transaction date.
* `inventory_location_stocks` has indexes on `inventoryItemId` and `(zoneId, slotId, level)`.
* `return_requests` has indexes on flow type, status, project, and warehouse.
* `return_request_items` has indexes on return request, inventory item, and disposition.

Projects:

* `project_tasks` has indexes on project, parent task, and `(projectId, sortOrder)`.
* task dependencies have unique `(projectTaskId, dependsOnTaskId, type)` and indexes on both sides.
* task material/component allocations are indexed by task and material/component.
* task resources and inspections are indexed by task/status.

Logistics:

* `dispatch_orders` are indexed by project, project task, status, and planned date.
* `dispatch_items` are indexed by dispatch order, inventory item, and component.
* `dispatch_events` are indexed by dispatch order, type, and created date.

Attachments/events/jobs:

* Attachments have indexes on module/entity/category/checksum/deleted state.
* Outbox and background job models have status/run-time indexes.

Production/QC/Yard:

* Production order, stage, log, reservation, issue, consumption, and ledger tables have relevant status/date/entity indexes.
* QC inspections/NCRs/issues have status/severity/entity indexes.
* Yard slots, placements, and movements have slot/item/date indexes.

## Composite Index Recommendations

### Inventory

Future migration candidates:

* `inventory_transactions(type, transactionDate DESC)`
* `inventory_transactions(projectId, transactionDate DESC)`
* `inventory_transactions(supplierId, transactionDate DESC)`
* `inventory_transactions(warehouseId, transactionDate DESC)`
* `inventory_transactions(direction, transactionDate DESC)`
* `inventory_transaction_items(inventoryItemId, transactionId)`
* `inventory_transaction_items(transactionId, inventoryItemId)`
* `inventory_transaction_items(inventoryItemId, createdAt DESC)`
* `inventory_location_stocks(inventoryItemId, warehouseId, zoneId, slotId, level)`
* `return_requests(projectId, status, createdAt DESC)`
* `return_requests(flowType, status, createdAt DESC)`

Rationale:

* Dashboard, Material Detail, Project material history, and Inventory Return workspaces commonly filter by type/status/entity and sort by date.
* Existing single-column indexes are useful, but composite indexes are needed to avoid bitmap/index merge overhead at large scale.

### Projects

Future migration candidates:

* `project_tasks(projectId, parentTaskId, sortOrder)`
* `project_tasks(projectId, status, scheduledFinishAt)`
* `project_tasks(projectId, forecastFinishAt)`
* `project_tasks(projectId, baselineVarianceDays)`
* `project_task_material_allocations(projectTaskId, inventoryItemId)`
* `project_task_component_allocations(projectTaskId, componentId)`
* `project_task_dependencies(dependsOnTaskId, projectTaskId)`
* `activity_logs(module, entityId, createdAt DESC)` if entity ids are formalized.

Rationale:

* WBS tree rendering, delay/cascade warnings, cost traceability, and task resource views depend on project-scoped task traversal.
* Reverse dependency lookups need direct predecessor/successor indexes.

### Logistics

Future migration candidates:

* `dispatch_orders(status, plannedAt DESC)`
* `dispatch_orders(projectId, status, plannedAt DESC)`
* `dispatch_events(dispatchOrderId, createdAt DESC)`
* `dispatch_items(dispatchOrderId, type)`

Rationale:

* Dispatch boards filter by status/date and drill into events by dispatch id.

### Dashboard / Analytics

Recommended direction:

* Prefer persisted snapshots over adding many raw-table dashboard indexes.
* Add source-table indexes only where the same predicate is also required by operational screens.

Snapshot candidates:

* `InventoryDashboardSnapshot`
* `MaterialDailyMovementSnapshot`
* `ProjectRuntimeSnapshot`
* `ProjectTaskHealthSnapshot`
* `LogisticsDispatchSnapshot`
* `DashboardExecutiveSnapshot`

## Full Scan Risk Tables

High risk:

* `inventory_transactions`
* `inventory_transaction_items`
* `activity_logs`
* `attachments`
* `project_tasks`
* `return_requests`
* `production_material_ledgers`
* `yard_movements`
* `dispatch_events`

Medium risk:

* `components`
* `production_orders`
* `qc_inspections`
* `purchase_orders`
* `notifications`

Low risk:

* master data tables, units, categories, roles, permissions, warehouses, and static configuration tables.

## Index Governance Rule

Before adding a new index:

* Identify the exact endpoint/query class it protects.
* Confirm the predicate and sort order.
* Estimate write overhead.
* Prefer one composite index that matches real user paths over multiple single-column indexes.
* Do not add dashboard-only indexes if a persisted snapshot would solve the problem more cleanly.

## Recommended Next Migration Sprint

When schema changes are allowed, prioritize:

1. Inventory transaction/date/material composite indexes.
2. Project task schedule/status hierarchy indexes.
3. Return request status/date composite indexes.
4. ActivityLog module/date/entity indexes or formal entity fields.
5. Snapshot table indexes after persisted read models are introduced.

