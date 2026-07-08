# SNAP.1 Snapshot Writer Report

Date: 2026-07-07

## Writer Components

Implemented:

- `SnapshotWriterService`
- `InventorySnapshotRepository`
- `ProjectSnapshotRepository`
- `DispatchSnapshotRepository`

## Write Strategy

All writes go through repositories and are wrapped in a Prisma transaction.

```text
SnapshotWriterService
  -> prisma.$transaction
  -> repository.upsert(...)
```

## Inventory Calculation

Sources:

- `master_warehouses`
- `inventory_location_stocks`
- `inventory_transaction_items`
- `inventory_transactions`
- `production_material_reservation_lines`

Metrics:

- total materials by distinct inventory items per warehouse
- total stock by location-stock quantity
- reserved stock by open/partial/shortage reservation balance
- available stock as total minus reserved
- low stock count by warehouse bucket vs material minimum stock
- today/month movement from inventory transaction items
- inventory value from latest available unit price per material

## Project Calculation

Sources:

- `projects`
- `project_tasks`
- `project_task_material_allocations`
- `project_task_component_allocations`
- `project_task_costs`
- `dispatch_orders`

Metrics:

- progress average
- delayed/completed/active task counts
- material progress
- component progress
- logistics progress
- cost progress
- health score

## Dispatch Calculation

Sources:

- `dispatch_orders`

Metrics:

- loading
- in transit
- arrived/received
- completed
- delayed

## Atomicity

The writer uses `upsert`, not delete/insert, so readers do not see a missing snapshot during rebuild.

## Verification

Background job smoke test created persisted Inventory and Project snapshot rows through the writer path.

