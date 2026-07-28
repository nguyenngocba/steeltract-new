# COMPONENT DOMAIN.5C - Production Instance Execution Granularity Audit & Design

Status: **AUDIT / ARCHITECTURE DESIGN ONLY - NO IMPLEMENTATION**

Date: 2026-07-28

## Executive Decision

SteelTrack currently cannot truthfully transition physical
`ComponentInstance` rows through:

```text
PLANNED -> IN_PRODUCTION -> PRODUCED_WAITING_QC
```

because current Production execution evidence is persisted at Production Order,
WorkOrder, Execution Run and aggregate completed-quantity level. It does not
persist which physical instances started or completed each operation.

Recommended canonical design:

**Option C - dedicated `ComponentInstanceExecution` entity.**

This entity should link:

```text
ComponentInstance
ProductionOrder
WorkOrder
ProductionExecution
routing operation / routing step
status
startedAt
completedAt
operator / machine / work center
```

This extends the existing Production execution architecture instead of
replacing it. `ProductionExecution` remains the batch/run container; the new
physical execution rows become the per-instance participation/completion
ledger inside that run.

No Prisma schema, migration, backend code, frontend code, stage or commit was
performed in DOMAIN.5C.

## Current Production Model

### ProductionOrder

Source: `apps/backend-api/prisma/schema.prisma`

Current cardinalities:

- `ProductionOrder -> WorkOrder[]`: one order may have many WorkOrders.
- `ProductionOrder -> ProductionExecution[]`: one order may have many
  execution runs.
- `ProductionOrder -> ProductionCompletion[]`: one order may have many
  completion records.
- `ProductionOrder -> ComponentInstance[]`: one requirement-bound order may
  have many physical instances created at release.
- `ProductionOrder -> Component?`: optional engineering definition /
  compatibility component link.
- `ProductionOrder -> ProjectComponentRequirement?`: optional canonical
  project demand lineage.
- `ProductionOrder -> BOM?`: optional materialized production BOM.
- `ProductionOrder -> ProductionStage[] / ProductionTask[]`: legacy/stage UI
  model still exists separately from WorkOrder/Execution.

Important fields:

- `quantity`
- `status`
- `currentStageCode`
- `startedAt`, `completedAt`
- `componentId`, `componentRequirementId`, `componentRevisionId`,
  `bomDefinitionId`, `bomId`

### WorkOrder

Current cardinalities:

- `WorkOrder -> ProductionOrder?`: optional parent order.
- `WorkOrder -> ProductionExecution[]`: one WorkOrder may have many execution
  runs.
- `WorkOrder -> ProductionCompletion[]`: completion can optionally reference a
  WorkOrder.
- `WorkOrder -> ProductionScrap[]`: scrap can optionally reference a WorkOrder.

Important fields:

- `quantity`
- `routingOperationId`
- `sequence`
- `lifecycleState`
- `startedAt`, `completedAt`, `pausedAt`

There is no persisted relation from `WorkOrder` to `ComponentInstance`.

### ProductionExecution

Current cardinalities:

- `ProductionExecution -> ProductionOrder`: required.
- `ProductionExecution -> WorkOrder`: required.

Important fields:

- `state`
- `workCenterId`
- `machineId`
- `startedAt`, `pausedAt`, `resumedAt`, `completedAt`, `abortedAt`
- `createdBy`

There is no persisted relation from `ProductionExecution` to
`ComponentInstance`.

### ProductionCompletion

Current cardinalities:

- `ProductionCompletion -> ProductionOrder`: required.
- `ProductionCompletion -> WorkOrder?`: optional.
- `ProductionCompletion -> ProductionExecution`: no Prisma relation exists;
  only `executionRunId String?` is stored.

Important fields:

- `quantity`
- `completedQty`
- `rejectedQty`
- `scrapQty`
- `remainingQty`
- `evidence Json?`
- `recordedAt`

There is no physical serial/instance relation.

### Routing / Stages

The system has two overlapping production routing concepts:

- `BOMRoutingStep`: materialized Engineering BOM operation basis with
  `bomId`, `stepNo`, `stepName`, `workshop`, `expectedHours`, `qcRequired`.
- `WorkOrder`: canonical command-side execution unit created during order
  release with `routingOperationId`, `sequence`, `quantity`.
- Legacy `ProductionStage` and `ProductionTask`: UI/shopfloor skeleton with
  stage/task status, work center, machine and timestamps.

For canonical DOMAIN.5 work, WorkOrder/ProductionExecution should remain the
execution boundary. `ProductionStage`/`ProductionTask` are not precise enough
to be the permanent physical identity bridge because they are legacy/UI-shaped
and do not currently bind to `ComponentInstance`.

## Production Start Granularity

Current command path:

- Controller command: `POST /production/commands/orders/:productionOrderId/start`
  using `startProductionOrderCommandSchema`.
- DTO accepts only:
  - `expectedVersion`
  - `volatileGatesPassed`
- Service path: `ProductionCommandService.startOrder`.

Actual persisted evidence:

1. Production Order transitions `READY -> IN_PROGRESS`.
2. The service finds the first `READY` WorkOrder.
3. That WorkOrder transitions `READY -> IN_PROGRESS`.
4. A `ProductionExecution` row is created for that WorkOrder.
5. Production Order `startedAt` is set.
6. Domain/outbox events are emitted for order/work-order/execution.

It does **not** accept or persist:

- `componentInstanceIds`
- serial sequence list
- serial range
- started physical quantity tied to identities

For `PO quantity = 20`, the current start command can say the order/work-order
started. It cannot prove:

```text
001, 002, 003, 004, 005 started
```

It can only imply an aggregate operation has started.

## Production Completion Granularity

Current command path:

- Controller command: `POST /production/commands/completions`.
- DTO accepts:
  - `productionOrderId`
  - optional `workOrderId`
  - optional `executionRunId`
  - `quantity`
  - `completedQty`
  - `rejectedQty`
  - `scrapQty`
  - `remainingQty`
  - `evidence`

Actual persisted evidence:

- Completion records aggregate quantity.
- Completion can reference WorkOrder and can store `executionRunId`, but it
  does not reference physical instances.
- `completeOrder` only checks:
  - all WorkOrders completed
  - no active execution run
  - total completed quantity >= order quantity
  - material reconciled

For `completedQty = 8`, the database does not know which eight
`ComponentInstance` rows completed.

Finding:

```text
Aggregate completion exists.
Physical completion identity does not exist.
```

## Partial Production Capability

Required scenario:

```text
Requirement = 20
PO = 20

001-005 = CUTTING
006-010 = WELDING
011-014 = PAINTING
015-017 = PRODUCED_WAITING_QC
018-020 = PLANNED
```

Current capability: **NO**.

Reason:

- `ComponentInstance` has only one high-level state and no per-operation
  execution ledger.
- `WorkOrder` has aggregate status only.
- `ProductionExecution` has aggregate run status only.
- `ProductionCompletion` has aggregate completed quantity only.
- There is no persisted assignment from WorkOrder/Execution to selected
  physical instances.

The system can approximate order or WorkOrder progress. It cannot truthfully
represent independent per-instance routing progress.

## Routing Model

Production completion of a physical component must mean:

```text
All mandatory routing/work operations for that released production basis are
completed for that ComponentInstance.
```

A single WorkOrder completion must not equal physical component completion
unless the released routing basis has exactly one mandatory operation.

Recommended V1 routing completion rule:

1. On Production Order release, WorkOrders are created from the released
   routing/BOM basis.
2. For each `ComponentInstance`, mandatory operation completion is measured by
   rows in `ComponentInstanceExecution`.
3. An instance may transition to `PRODUCED_WAITING_QC` only when every mandatory
   WorkOrder/routing operation has a completed physical execution row for that
   instance, with no unresolved failed/rework state for that operation.

## ExecutionRun Model

Current `ProductionExecution` is a good batch/run container:

- belongs to one Production Order
- belongs to one WorkOrder
- can store machine/work center
- has running/paused/completed/aborted state
- supports multiple runs per WorkOrder

It should not be overloaded to become one row per physical component. Steel
fabrication often runs batches. One execution run should be able to include
many `ComponentInstance` rows.

Recommended interpretation:

```text
ProductionExecution = batch/run header
ComponentInstanceExecution = physical instance participation/completion line
```

## Instance Assignment Options

### Option A - WorkOrder <-> ComponentInstance many-to-many

Pros:

- Simple assignment model.
- Easy to answer which instances are planned for a WorkOrder.

Cons:

- Does not capture run-level start/complete evidence.
- Poor for multiple runs, pause/resume, machine changes and rework.
- Cannot cleanly distinguish assigned versus started versus completed without
  adding status columns to the join, at which point it becomes a domain entity.

Verdict: insufficient as the canonical execution history.

### Option B - ExecutionRun <-> ComponentInstance many-to-many

Pros:

- Fits batch execution.
- Keeps `ProductionExecution` as the run header.

Cons:

- A plain join cannot capture per-instance operation status, timestamps,
  operator, rework loop, scrap, evidence or completion result.
- If enriched with these fields, it becomes Option C under another name.

Verdict: useful conceptually, but should be modeled as a dedicated entity.

### Option C - ComponentInstanceExecution

Pros:

- Precise physical lineage.
- Supports many instances per run.
- Supports many operations per instance.
- Supports partial production truthfully.
- Supports rework without deleting or rewriting old history.
- Provides a future anchor for material/heat/lot traceability.
- Keeps legacy `ProductionExecution` intact as the batch/run header.

Cons:

- Higher write volume.
- Requires careful indexes and idempotency.
- Requires UI/operator workflow for instance assignment/scanning.

Verdict: **recommended canonical design.**

### Option D - Use Existing ProductionStage/ProductionTask

Pros:

- Existing UI/shopfloor skeleton.

Cons:

- No ComponentInstance relation.
- Not tied to command-side WorkOrder execution aggregate.
- Existing status model is not enough for physical traceability.

Verdict: not recommended as the permanent physical identity bridge.

## Recommended Canonical Model

Recommended future table/entity:

```text
ComponentInstanceExecution
```

Purpose:

One immutable-ish physical execution line proving that one
`ComponentInstance` participated in one WorkOrder operation, optionally inside
one `ProductionExecution` run.

Suggested fields:

- `id`
- `componentInstanceId`
- `productionOrderId`
- `workOrderId`
- `executionRunId`
- `routingOperationId`
- `sequence`
- `status`
- `assignedAt`
- `startedAt`
- `completedAt`
- `abortedAt`
- `reworkOfInstanceExecutionId`
- `workCenterId`
- `machineId`
- `operatorId`
- `quantity`
- `result`
- `evidence`
- `createdAt`
- `updatedAt`

Suggested statuses:

```text
ASSIGNED
IN_PROGRESS
COMPLETED
FAILED
ABORTED
REWORK_REQUIRED
SCRAPPED
```

V1 can keep `quantity = 1` for physical components while preserving a field for
future sub-piece or bundle semantics.

## Proposed Relations

```text
ProductionOrder
  -> WorkOrder[]
  -> ProductionExecution[]
  -> ComponentInstance[]
  -> ComponentInstanceExecution[]

WorkOrder
  -> ProductionExecution[]
  -> ComponentInstanceExecution[]

ProductionExecution
  -> ComponentInstanceExecution[]

ComponentInstance
  -> ComponentInstanceExecution[]
  -> QcInspection[]
  -> NonConformanceReport[]
```

Cardinality:

- One `ProductionExecution` can include many `ComponentInstanceExecution`
  lines.
- One `ComponentInstance` can have many `ComponentInstanceExecution` lines
  across routing operations and rework loops.
- One WorkOrder can have many instance execution rows across many runs.
- One ComponentInstanceExecution belongs to exactly one ComponentInstance,
  one ProductionOrder and one WorkOrder.

## Lifecycle Transitions

Recommended V1 command semantics:

1. PO release creates `ComponentInstance` rows in `PLANNED`.
2. WorkOrder / execution preparation assigns selected instances by creating
   `ComponentInstanceExecution(status=ASSIGNED)`.
3. Execution start transitions selected lines to `IN_PROGRESS`.
4. If an instance was `PLANNED`, its high-level state becomes
   `IN_PRODUCTION`.
5. Execution complete transitions selected lines to `COMPLETED`.
6. If all mandatory routing operation lines are completed for an instance, the
   instance transitions to `PRODUCED_WAITING_QC`.
7. QC receives exact `componentInstanceId`.

Idempotency should be enforced by command idempotency plus a uniqueness rule
that prevents duplicate active assignment for the same:

```text
componentInstanceId + workOrderId + executionRunId
```

or, for assignment before run creation:

```text
componentInstanceId + workOrderId + active status
```

The exact uniqueness shape should be finalized in the schema sprint with
PostgreSQL partial-index support in mind.

## Routing Completion Rule

For a ComponentInstance to become `PRODUCED_WAITING_QC`:

1. Load the Production Order's released routing basis.
2. Determine mandatory WorkOrders/routing operations.
3. For the instance, verify each mandatory operation has a completed
   `ComponentInstanceExecution`.
4. Verify no mandatory operation is currently failed, aborted without recovery,
   or rework-required.
5. Transition the instance exactly once.

If the released basis has only one mandatory operation, completing that one
operation is enough. Otherwise, WorkOrder completion alone is never enough.

## QC Handoff

Production can prove QC readiness only with exact physical identity:

```text
ComponentInstance X
  has all mandatory ComponentInstanceExecution rows completed
  -> ComponentInstance.state = PRODUCED_WAITING_QC
  -> QC inspection can be created with componentInstanceId = X
```

No aggregate quantity handoff should create QC-ready physical inventory.

QC must not accept a canonical instance inspection unless:

- `ComponentInstance.state = PRODUCED_WAITING_QC`, or
- a later explicitly approved rework/QC flow permits reinspection from
  `REWORK`.

## Rework Compatibility

The proposed model supports future rework without destroying history:

```text
ComponentInstance 003
  -> operation execution rows completed
  -> QC_FAILED / NCR
  -> REWORK
  -> new ComponentInstanceExecution rows for the rework WorkOrder/run
  -> QC again
```

Rules:

- Do not create a replacement ComponentInstance for ordinary rework.
- Do not rewrite previous execution rows.
- Link rework execution rows to the same `componentInstanceId`.
- Use `reworkOfInstanceExecutionId` or metadata/evidence to connect rework
  operations to the failed operation/NCR.

## Material Traceability Future Path

Current material models are Production Order centric:

- `ProductionMaterialReservation`
- `ProductionMaterialReservationLine`
- `ProductionMaterialIssue`
- `ProductionMaterialLedger`
- `ProductionMaterialConsumption`

They currently reference Production Order, reservation, inventory item and
location. They do not reference WorkOrder, ExecutionRun or ComponentInstance.

The recommended `ComponentInstanceExecution` design preserves a future path:

```text
Material / heat / lot
  -> ProductionMaterialIssue / Ledger / Consumption
  -> ProductionOrder / WorkOrder / ExecutionRun
  -> ComponentInstanceExecution
  -> ComponentInstance
```

Do not redesign material workflow in DOMAIN.5C. In a later traceability sprint,
material consumption can be allocated from order/run-level issue/consumption
facts down to `ComponentInstanceExecution` lines where business evidence
exists.

## Scale Analysis

Assumptions:

- millions of ComponentInstances
- tens/hundreds of millions of physical execution rows

Recommended PK:

- CUID/UUID string is compatible with existing project conventions.
- For very high write volume, consider UUID v7 or time-sortable ID later, but
  do not change global ID strategy in this design sprint.

Hot query patterns:

- all instances for a Production Order
- all execution lines for a WorkOrder
- active execution lines for a ProductionExecution run
- current physical status for one ComponentInstance
- instances waiting for QC
- execution history for barcode-scanned instance
- rework history for one instance
- dashboard counts by state and operation

## Indexes

Recommended minimum future indexes:

- `@@index([productionOrderId, status])`
- `@@index([workOrderId, status])`
- `@@index([executionRunId, status])`
- `@@index([componentInstanceId, sequence])`
- `@@index([componentInstanceId, status])`
- `@@index([startedAt])` only if time-range operator dashboards query it
  directly.
- `@@index([completedAt])` only if QC handoff / historical dashboards query it
  directly.
- `@@index([machineId, status])` only if machine cockpit needs active physical
  workload.

Avoid excessive indexes in V1:

- no broad JSON/Gin index until evidence exists
- no profile-like low-value text indexes
- no duplicate single-column indexes when covered by hot composite indexes

For PostgreSQL partial indexes, Prisma may require raw SQL migration notes in
the implementation sprint:

- one active assignment per instance/work operation
- only active statuses indexed for worker queue queries

## UI Impact

No UI was implemented.

Minimum future operator UX:

```text
PO-001 - 20 cấu kiện

[ ] CPL-001
[ ] CPL-002
[ ] CPL-003
...

Select instances
-> Assign to WorkOrder / Execution Run
-> Start
-> Complete
```

Recommended V1 behavior:

- hybrid assignment
- automatic suggestion by lowest available serial sequence
- manual override by operator/supervisor
- barcode/QR scan can add/remove instances from the execution run

Barcode readiness:

- `ComponentInstance.instanceNo` is already unique and human-readable enough to
  become QR/barcode payload.
- Future scan flow should resolve `instanceNo -> componentInstanceId`, then
  validate that the instance belongs to the selected Production Order and is
  eligible for the selected WorkOrder operation.

## Legacy Compatibility

Existing ProductionOrders and WorkOrders must remain readable.

Coexistence strategy:

- Legacy orders without `componentRequirementId` / `ComponentInstance` lineage
  continue to use aggregate Production status and completion quantities.
- Do not fabricate historical instance execution rows for old orders.
- New canonical instance execution applies only to requirement-bound orders
  with `ComponentInstance` rows.
- Read APIs may expose `granularity = LEGACY_AGGREGATE` or
  `granularity = PHYSICAL_INSTANCE` so UI/reporting does not pretend old data
  has physical identity.

## Schema Changes Required

Yes, for implementation sprint.

Expected additive schema:

- new `ComponentInstanceExecution` table/entity
- relations from:
  - `ComponentInstance`
  - `ProductionOrder`
  - `WorkOrder`
  - `ProductionExecution`
- likely relation from `ProductionCompletion` to instance execution evidence
  or a new completion/evidence aggregate if needed
- optional fields for operator, machine, work center and rework lineage

No existing table should be dropped or reinterpreted.

## Migration Strategy

Phase 1 - Additive schema only:

- create `ComponentInstanceExecution`
- add nullable relations/inverse relations
- create minimum indexes
- no backfill

Phase 2 - Command DTO/service adoption:

- add assignment command
- extend execution start/complete to accept selected instance IDs or selected
  assignment IDs
- preserve legacy aggregate commands for legacy orders

Phase 3 - Physical lifecycle transitions:

- start selected instance execution lines
- transition instance high-level state to `IN_PRODUCTION`
- complete selected operation lines
- transition instance to `PRODUCED_WAITING_QC` only after routing completion

Phase 4 - QC handoff:

- allow canonical QC inspection creation only for exact
  `componentInstanceId`
- keep legacy QC order/component paths readable but not canonical Finished
  Goods evidence

Phase 5 - UI/operator workflow:

- assignment panel
- barcode scan path
- instance-level progress and QC-ready queue

## Risks

- Write volume increases significantly.
- Incorrect uniqueness rules could block valid rework or duplicate active
  assignments.
- If routing basis is not immutable at release, historical completion rules can
  drift. Completion must reference the released production basis.
- Material traceability remains order/run-level until a later sprint connects
  issue/consumption evidence to execution lines.
- Legacy dashboards may keep showing aggregate status until read models are
  converted.

## Recommendation

Proceed with an implementation sprint for **Option C:
`ComponentInstanceExecution`**.

This is the smallest design that is honest about physical steel fabrication:
one execution run can process many instances, one instance can move through
many operations, and rework can append new evidence without destroying the
original lineage.

Do not resume DOMAIN.5 state transitions until this bridge exists.
