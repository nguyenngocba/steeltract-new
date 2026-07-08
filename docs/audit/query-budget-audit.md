# Query Budget Audit

Date: 2026-07-07

Scope: Inventory, Projects, Logistics.

## Budgets

Recommended initial budgets:

* List endpoints: 1 primary query + bounded includes, `take <= 200`.
* Detail endpoints: query only data required by active tab.
* Dashboard endpoints: use read model/cache or persisted snapshots.
* No endpoint should load an unbounded transaction table for cockpit rendering.

## Current Findings

### Inventory

Within budget:

* Dashboard Inventory snapshot source is bounded to 5,000 recent transaction rows and cached for 30 seconds.
* Recent Dashboard Inventory transactions are bounded by caller `take`.
* Material Detail query now reads detail sources through repository.

Risks:

* `InventoryService` still contains command-path direct Prisma queries and some historical/analytics groupings.
* Return workflow contains multiple direct Prisma calls and should become an `InventoryReturnRepository`.

Index recommendations for future migration sprint:

* `inventory_transactions(projectId, transactionDate)`
* `inventory_transactions(type, transactionDate)`
* `inventory_transaction_items(inventoryItemId, transactionId)`
* `inventory_location_stocks(inventoryItemId, warehouseId, zoneId, slotId, level)`

### Projects

Within budget:

* Project Detail tabs now use tab-scoped source queries instead of full runtime slicing.
* Runtime Dashboard source queries are centralized in `ProjectsRepository.findRuntimeSources`.

Risks:

* `GET /projects/runtime` still loads broad project/component/material/task/document/log source sets by design.
* Project template and ProjectTask command paths still use direct Prisma and should be repository-wrapped later.

Index recommendations for future migration sprint:

* `project_tasks(projectId, parentTaskId, sortOrder)`
* `project_task_material_allocations(projectTaskId, inventoryItemId)`
* `project_task_component_allocations(projectTaskId, componentId)`
* `return_requests(projectId, status, createdAt)`
* `activity_logs(module, createdAt)`

### Logistics

Within budget:

* Dispatch list is bounded to 200 rows.
* Dispatch detail uses one aggregate lookup by id.
* Dispatch suggestion queries at most 5 open tasks unless a task id is provided.

Risks:

* Dispatch dashboard currently computes status/trend/vehicle utilization from the bounded order list. That is acceptable for MVP, but should become a snapshot if dispatch volume grows.

Existing indexes:

* Dispatch domain migration already indexes `projectId`, `projectTaskId`, `status`, `plannedAt`, dispatch item material/component ids, and dispatch event fields.

## N+1 Notes

Potential N+1 avoided:

* Logistics dispatch order detail includes items/components/materials/events in one aggregate query.
* Projects detail tab source queries include task allocations/components/materials in grouped queries.

Remaining watchlist:

* Logistics receive reconciliation loops over dispatch items and performs allocation upserts per item. This is command workflow and acceptable for current volume, but should be batched later for large dispatches.
* Project runtime still performs in-memory aggregation over broad source arrays; persisted snapshots are the long-term solution.

