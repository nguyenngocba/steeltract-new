# COMPONENT DOMAIN.5D - ComponentInstanceExecution Schema Foundation

Status: **IMPLEMENTED - MIGRATION/TEST/BUILD/RUNTIME PASS**

Date: 2026-07-28

## Schema Model

Added the additive physical production traceability foundation:

```text
ComponentInstanceExecution
```

Purpose:

One row proves one physical `ComponentInstance` participated in one
`ProductionExecution` batch/run for one `WorkOrder` operation.

Authority after DOMAIN.5D:

```text
ProductionOrder = manufacturing authorization
WorkOrder = operation requirement / instruction
ProductionExecution = actual batch/run header
ComponentInstanceExecution = physical instance participation and operation evidence
ComponentInstance = physical object lifecycle
QcInspection = quality decision
```

No `ProductionOrder` redesign, no WorkOrder replacement and no
ProductionExecution replacement was performed.

## Execution Status Model

Added enum:

```text
ComponentInstanceExecutionStatus
  ASSIGNED
  RUNNING
  COMPLETED
  CANCELLED
```

These statuses are operation participation statuses, not QC statuses and not
global `ComponentInstanceState`.

Not added:

- `PASSED`
- `FAILED`
- `REWORK`
- `SCRAP`

Those remain QC / physical lifecycle concepts.

## Relations

Added:

```text
ComponentInstance 1 -> many ComponentInstanceExecution
WorkOrder 1 -> many ComponentInstanceExecution
ProductionExecution 1 -> many ComponentInstanceExecution
```

`productionOrderId` was intentionally not duplicated on
`ComponentInstanceExecution`. It remains derivable through:

- `ProductionExecution.productionOrderId`
- `WorkOrder.productionOrderId`
- `ComponentInstance.productionOrderId`

The service validates that all three lineages match before assignment.

## Cardinality

Supported:

- one `ProductionExecution` may contain many ComponentInstances
- one `ComponentInstance` may participate in many WorkOrders
- one `ComponentInstance` may participate in many ProductionExecutions
- one instance can have later rework execution evidence in a different run

Example:

```text
Instance #001
  Cutting RUN-10
  Welding RUN-31
  Painting RUN-52
```

## Uniqueness Rule

Implemented:

```text
UNIQUE(componentInstanceId, productionExecutionId)
```

Rationale:

- one physical instance must not be accidentally assigned twice to the same
  execution run
- rework remains possible because it uses a later `ProductionExecution`
- cancelled participation preserves history; reassignment to the same run is
  not allowed in V1, create a new run instead

## Lineage Validation

`ProductionInstanceExecutionService.assignInstancesToExecution` validates:

- `ProductionExecution` exists
- `ProductionExecution.workOrderId` matches loaded WorkOrder
- `WorkOrder.productionOrderId` matches `ProductionExecution.productionOrderId`
- every selected `ComponentInstance.productionOrderId` matches the run's
  Production Order
- duplicate IDs in the same request are rejected
- existing same instance/run assignment is rejected

Invalid cross-order assignment is blocked before evidence rows are created.

## Rework Support

Rework is supported by allowing the same `ComponentInstance` to appear in a
later `ProductionExecution`.

The model does not enforce uniqueness on:

```text
componentInstanceId + workOrderId
```

because a physical instance may legitimately revisit the same operation in a
new run after QC failure / NCR / rework.

Previous execution history is preserved.

## Aggregate Quantity Compatibility

Existing aggregate fields remain compatible:

- `ProductionOrder.quantity`
- `WorkOrder.quantity`
- `ProductionCompletion.completedQty`
- `ProductionCompletion.rejectedQty`
- `ProductionCompletion.scrapQty`
- `ProductionCompletion.remainingQty`

DOMAIN.5D does not replace those calculations.

New canonical physical truth for instance-aware production is:

```text
COUNT(ComponentInstanceExecution where status = ...)
```

Future DOMAIN.5E will use this evidence to drive physical lifecycle
transitions.

## Material Traceability Future Path

DOMAIN.5D does not modify material models.

Current material models remain Production Order centric:

- `ProductionMaterialReservation`
- `ProductionMaterialReservationLine`
- `ProductionMaterialIssue`
- `ProductionMaterialLedger`
- `ProductionMaterialConsumption`

Future traceability path remains available:

```text
Material Lot / Heat
  -> Material Issue / Consumption
  -> ProductionExecution
  -> ComponentInstanceExecution
  -> ComponentInstance
```

Remaining P1: current consumption records do not yet bind directly to
`ProductionExecution` or `ComponentInstanceExecution`.

## Indexes & Scale

Implemented minimum indexes:

- `@@unique([componentInstanceId, productionExecutionId])`
- `@@index([componentInstanceId, status])`
- `@@index([workOrderId, status])`
- `@@index([productionExecutionId, status])`
- `@@index([status])`

Hot query support:

- all execution history for one instance
- instances in one ProductionExecution
- instance completion status for one WorkOrder
- unfinished physical executions by status

No broad JSON/GIN or timestamp indexes were added. Those should wait for real
query evidence.

## Migration

Migration:

`20260728103000_component_domain5d_instance_execution_foundation`

SQL operations:

- `CREATE TYPE "ComponentInstanceExecutionStatus"`
- `CREATE TABLE "component_instance_executions"`
- indexes
- foreign keys

No:

- `DROP`
- `TRUNCATE`
- `DELETE`
- backfill
- legacy execution history fabrication

## Backup

Backup created before migration:

`/tmp/steeltrack-domain5d-before-20260728.dump`

Backup size: `821K`

`pg_restore --list` completed successfully.

Pre-migration row counts:

```json
{
  "componentInstances": 16,
  "productionOrders": 6,
  "workOrders": 2,
  "productionExecutions": 0
}
```

Post-migration row counts:

```json
{
  "componentInstances": 16,
  "productionOrders": 6,
  "workOrders": 2,
  "productionExecutions": 0,
  "componentInstanceExecutions": 0
}
```

## Repository Foundation

Updated `ProductionOrderRepository` with methods for:

- loading `ProductionExecution` + WorkOrder lineage
- loading selected `ComponentInstance` rows
- finding duplicate instance/run assignments
- creating `ComponentInstanceExecution` rows
- updating one execution evidence row
- reading instance execution history

Repository remains the database boundary.

## Service Foundation

Added `ProductionInstanceExecutionService`.

Supported operations:

- `assignInstancesToExecution`
- `startInstanceExecution`
- `completeInstanceExecution`
- `cancelInstanceExecution`
- `getInstanceExecutionHistory`

Service intentionally does **not** mutate:

- `ComponentInstance.state`
- Inventory
- QC
- Yard
- Finished Goods classification

## API / Command Foundation

Added authenticated endpoints under existing command boundary:

```text
POST /production/commands/instance-executions/assign
POST /production/commands/instance-executions/:id/start
POST /production/commands/instance-executions/:id/complete
POST /production/commands/instance-executions/:id/cancel
GET  /production/commands/component-instances/:componentInstanceId/executions
```

This is minimal backend foundation only. No Production frontend was changed.

## Runtime Fixture

Runtime smoke used existing controlled DOMAIN4 order:

```text
DOMAIN4-1785146027125-PO-A
```

Temporary run:

```text
ProductionExecution 18c8b903-4847-4494-98a7-2fa1da7f5a7d
```

Actions:

1. Assigned instances 001, 002, 003.
2. Started instances 001 and 002.
3. Completed instances 001 and 002.
4. Left instance 003 as `ASSIGNED`.
5. Verified instances 004 and 005 had no execution evidence.
6. Deleted temporary `ProductionExecution`, cascading temporary evidence rows.

Observed evidence before cleanup:

```json
[
  { "serialSequence": 1, "status": "COMPLETED" },
  { "serialSequence": 2, "status": "COMPLETED" },
  { "serialSequence": 3, "status": "ASSIGNED" }
]
```

Side-effect deltas during smoke:

```json
{
  "inventoryTransactionsDelta": 0,
  "qcInspectionsDelta": 0,
  "yardPlacementsDelta": 0,
  "componentInstancesDelta": 0
}
```

After cleanup:

```json
{
  "productionExecutions": 0,
  "componentInstanceExecutions": 0,
  "componentInstances": 16,
  "inventoryTransactions": 107,
  "qcInspections": 2,
  "yardPlacements": 0
}
```

## Legacy Compatibility

Existing ProductionOrders and WorkOrders remain readable.

No historical `ProductionExecution` rows were fabricated into
`ComponentInstanceExecution`.

Canonical physical execution evidence applies only when new commands create it.

## Regression Results

Targeted Production/QC tests:

- 5 suites passed
- 31 tests passed

Full backend tests:

- 79 suites passed
- 244 tests passed

## Backend Tests

Passed.

## Backend Build

Passed.

## Frontend Build

Passed with existing Vite chunk-size warning.

## Migration Status

`prisma migrate status` reports the database schema is up to date.

## Remaining P0

- DOMAIN.5E must implement physical lifecycle transitions from
  `ComponentInstanceExecution` evidence:
  `PLANNED -> IN_PRODUCTION -> PRODUCED_WAITING_QC`.
- DOMAIN.5E must connect QC handoff to exact `componentInstanceId`.

## Remaining P1

- Material consumption does not yet bind to `ProductionExecution` /
  `ComponentInstanceExecution`.
- Operator UI for selecting/scanning instances is not implemented.
- Raw SQL partial indexes may be considered later for active assignment
  uniqueness/worker queues after real query evidence.

## Recommendation

Proceed to **DOMAIN.5E - Physical Lifecycle Transition & QC Handoff**.

Use `ComponentInstanceExecution` as the only canonical production evidence for
moving physical instances into production, completing operations and becoming
waiting-for-QC.
