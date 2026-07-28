# COMPONENT DOMAIN.5 - Production Completion, QC & Finished Goods Gate

Status: **BLOCKED BY PRODUCTION INSTANCE GRANULARITY GATE - DOMAIN.5B MIGRATION COMPLETE**

Date: 2026-07-28

## Resume Audit After DOMAIN.5A

DOMAIN.5A has been completed and runtime certified. QC physical lineage now
exists:

```text
ComponentInstance
  -> QcInspection(componentInstanceId)
  -> NonConformanceReport(componentInstanceId)
  -> QcInspectionSnapshot(componentInstanceId)
```

The original QC lineage blocker is closed.

The resumed DOMAIN.5 prompt requires the physical instance lifecycle to
include:

```text
PLANNED
  -> IN_PRODUCTION
  -> PRODUCED_WAITING_QC
  -> ACCEPTED / REWORK / SCRAPPED / USE_AS_IS
```

DOMAIN.5B has now added the missing `IN_PRODUCTION` enum value. Current
Prisma `ComponentInstanceState` values are:

```text
PLANNED
IN_PRODUCTION
PRODUCED_WAITING_QC
QC_PASSED
QC_FAILED
REWORK
SCRAPPED
USE_AS_IS
LEGACY_UNKNOWN
```

The state-model blocker is closed. DOMAIN.5B did not backfill data and did not
perform physical transitions.

## DOMAIN.5B Migration Completed

Migration:

`apps/backend-api/prisma/migrations/20260728090000_component_domain5b_instance_in_production_state/migration.sql`

PostgreSQL enum migration:

```sql
ALTER TYPE "ComponentInstanceState" ADD VALUE IF NOT EXISTS 'IN_PRODUCTION';
```

Backup gate:

- Backup file: `/tmp/steeltrack-domain5b-before-20260728.dump`
- Backup format: custom PostgreSQL dump
- Backup size: 821K
- `pg_restore --list` completed successfully

Pre-migration state counts:

```json
{
  "total": 16,
  "groups": [
    { "state": "PLANNED", "_count": { "_all": 16 } }
  ]
}
```

Post-migration state counts:

```json
{
  "total": 16,
  "groups": [
    { "state": "PLANNED", "_count": { "_all": 16 } }
  ]
}
```

PostgreSQL enum values after deploy:

```text
PLANNED
PRODUCED_WAITING_QC
QC_PASSED
QC_FAILED
REWORK
SCRAPPED
USE_AS_IS
LEGACY_UNKNOWN
IN_PRODUCTION
```

PostgreSQL appended `IN_PRODUCTION` at the end of the enum type because the
forward-only migration used `ALTER TYPE ADD VALUE`. Prisma can still use the
enum value by name; no ordering-dependent domain logic should rely on enum
ordinal order.

Compatibility:

- Existing Prisma rows continue to read.
- Existing `PLANNED` rows remain unchanged.
- No `DROP`, `TRUNCATE`, `DELETE`, data rewrite or fabricated history.

Scale/index impact:

- Existing `component_instances_state_idx` remains useful.
- No new index is required because `state` is already indexed.

## Current Limitation - Production Instance Granularity

DOMAIN.5 physical transitions are now blocked by execution granularity, not by
the enum state model.

Current canonical Production start path:

- `ProductionCommandService.startOrder` transitions the Production Order from
  `READY` to `IN_PROGRESS`.
- It finds one `READY` WorkOrder and transitions that WorkOrder to
  `IN_PROGRESS`.
- It creates a `ProductionExecution` for that WorkOrder.
- The command payload does not select `ComponentInstance` IDs, serial
  sequences or physical instance ranges.

Current canonical Production completion path:

- `ProductionCommandService.recordCompletion` records aggregate completion
  quantity scoped to Production Order, optional WorkOrder and optional
  Execution Run.
- `ProductionCommandService.completeOrder` checks all WorkOrders are completed,
  checks there is no active execution, and checks total completed quantity is
  at least `ProductionOrder.quantity`.
- Completion evidence does not identify which physical `ComponentInstance`
  rows were completed.

Because Production can represent partial execution/completion, the system
cannot currently prove:

```text
Instance 001-008 started
Instance 009-014 still planned
Instance 015-020 completed
```

Updating every instance on order start or order completion would fabricate
physical history for partially produced orders. DOMAIN.5 therefore stops before
implementing transitions from `PLANNED -> IN_PRODUCTION` or
`IN_PRODUCTION -> PRODUCED_WAITING_QC`.

## Backward Compatibility

Legacy `Component.status` and `Component.lifecycleState` remain untouched and
must still be ignored for canonical Finished Goods eligibility.

Legacy rows without `ComponentInstance` lineage must not be fabricated into
Finished Goods.

## DOMAIN.5 Resume Decision

Do not implement:

- Production start physical-instance transitions.
- Production completion physical-instance transitions.
- QC PASS / rework / scrap physical transitions.
- Finished Goods service/API.

until Production provides explicit instance-level execution/completion
selection or evidence.

## Previous Semantics

- DOMAIN.4 creates `ComponentInstance` rows at Production Order release for
  requirement-bound orders.
- Initial physical instances are `PLANNED`.
- Production start/completion does not currently move `ComponentInstance`
  state.
- QC currently evaluates Production Orders or legacy Component definitions via
  `QcInspection.productionOrderId` and `QcInspection.componentId`.
- `NonConformanceReport` also stores `productionOrderId` and legacy
  `componentId`.
- Before DOMAIN.5A, no QC model had relational `componentInstanceId`.
  DOMAIN.5A has since added this physical QC lineage.
- Legacy `Component.status` is still mutated and consumed by older read paths.

## Canonical Physical Lifecycle

Target lifecycle remains:

```text
ComponentInstance PLANNED
  -> IN_PRODUCTION
  -> PRODUCED_WAITING_QC
  -> QC PASSED / APPROVED -> Finished Goods eligible
  -> QC FAILED / REWORK -> not Finished Goods
  -> SCRAP -> permanently excluded
```

Production completion alone must not create Finished Goods.

## Production Start Rule

DOMAIN.5 should update requirement-bound instances from `PLANNED` into
`IN_PRODUCTION` only when Production legitimately starts those physical
instances. DOMAIN.5B added the enum value, but current Production start
commands still do not select instance IDs, serial sequences or serial ranges.

Order-level `IN_PROGRESS` is not enough for batched or partial production. A
timeline event such as `PRODUCTION_STARTED` can record history after the
authoritative state change, but it must not become the authoritative status
source.

## Production Completion Rule

When instance-level completion evidence exists, associated instances should
move from `IN_PRODUCTION` to `PRODUCED_WAITING_QC` and receive a timeline event
such as `PRODUCTION_COMPLETED`.

Current Production completion records aggregate completed quantity and does not
identify physical instance IDs or serial ranges. This transition is therefore
not implemented in DOMAIN.5B.

This transition must not set:

- `qcPassedAt`
- legacy `Component.status=READY`
- Inventory stock
- Yard placement
- Finished Goods eligibility

## QC Ownership

QC is the authoritative quality decision owner. Existing QC service paths:

- `POST /qc/inspections`
- `POST /qc/inspections/:id/complete`
- `POST /qc/inspections/:id/approve`
- `POST /qc/inspections/:id/reject`
- `POST /qc/inspections/:id/ncr`

Current schema subjects after DOMAIN.5A:

- `productionOrderId`
- `productionStageId`
- `componentInstanceId`
- `componentId`
- `projectId`

The canonical physical subject is now available.

## QC Instance Lineage

**RESOLVED BY DOMAIN.5A:** `QcInspection`, `NonConformanceReport` and
`QcInspectionSnapshot` can now structurally reference `ComponentInstance`.

Using `metadata.componentInstanceId` remains prohibited. The canonical path is
the nullable relational `componentInstanceId` added in DOMAIN.5A.

## Finished Goods Definition

Finished Goods eligibility should be a reusable query/domain rule:

```text
ComponentInstance exists
AND ComponentInstance.state IN (QC_PASSED, USE_AS_IS)
AND producedAt IS NOT NULL or state transition proves production completion
AND qcPassedAt IS NOT NULL for QC_PASSED / approved acceptance
AND scrappedAt IS NULL
```

For `USE_AS_IS`, current QC/NCR DTO supports `disposition = USE_AS_IS` on NCR
creation, but canonical command disposition currently exposes
`REWORK` and `SCRAP_RECOMMENDATION` helpers. USE_AS_IS is therefore recognized
as a legacy DTO value but is not yet a fully certified command-side acceptance
path.

## Finished Goods Query Source

Recommended canonical source after schema approval:

```text
ComponentInstance
  + latest authoritative QcInspection/QcResult or approved NCR disposition
  + exclusion facts such as SCRAP
```

Do not create a `FinishedGoods` table in DOMAIN.5. Use a repository/service
projection such as:

```text
ComponentFinishedGoodsReadRepository.findEligibleInstances(filters)
```

Supported filters should include:

- projectId
- componentId
- requirementId
- productionOrderId
- componentInstanceId / instanceNo
- qc status / decision

## Rework Rule

- QC `REWORK_REQUIRED` and NCR `REWORK` disposition must not qualify as
  Finished Goods.
- The physical instance identity must remain intact.
- Previous QC/NCR history must be preserved.
- After rework, a new QC acceptance is required before Finished Goods
  eligibility.

## Scrap Rule

- Scrap must permanently exclude the physical instance from Finished Goods,
  Yard availability and Ready To Ship.
- The instance must not be hard-deleted.
- DOMAIN.5 should set `ComponentInstance.state = SCRAPPED` and `scrappedAt`
  only after authoritative QC/NCR scrap evidence exists.

## Use As Is Rule

Current evidence:

- `createNcrSchema.disposition` accepts `USE_AS_IS`.
- `CompleteQcDispositionCommand` supports string `dispositionType`, but
  command helpers only expose `requestRework` and `recommendScrap`.
- `QcCommandService.validateDisposition` only adds special required reason
  validation for `REWORK` and `SCRAP_RECOMMENDATION`.

Recommendation:

- Treat `USE_AS_IS` as Finished Goods acceptance only after a command-side
  approved disposition path is explicitly wired and persisted against
  `componentInstanceId`.
- Do not infer Use-As-Is acceptance from free-text metadata.

## Legacy Component.status Findings

Current writers/consumers still relying on legacy physical-ish Component
status:

- `production.repository.upsertComponentFromProductionOrder` sets
  `Component.status = READY`.
- `production.service` maps stages to `CUTTING`, `WELDING`, `PAINTING`,
  `READY` and `STOCK` compatibility states.
- `projects.repository` can update Project component allocations to
  `ComponentStatus.READY`.
- `logistics.service` updates legacy Component status to `DELIVERED`.
- `yard.repository` mutates legacy Component status for Yard compatibility.
- `components-read-model.repository` still treats `READY` as QC/finished style
  data in several compatibility aggregates.
- `component-snapshot.repository`, project snapshots, dashboard controller and
  runtime integrity still count `READY`/`STOCK` for legacy metrics.

DOMAIN.5 must not use these fields as canonical Finished Goods evidence.
They remain compatibility debt for a later DOMAIN.8 conversion.

## Yard Boundary

Canonical future Yard path:

```text
Finished Goods eligible ComponentInstance
  -> Yard placement
```

QC PASS means Finished Goods eligible, not Yard placement. DOMAIN.5 must not
auto-create Yard placements.

Existing legacy Yard staging must remain functional until Yard is converted to
`ComponentInstance`.

## Timeline Events

Recommended `ComponentInstanceTimeline.eventType` values:

- `PRODUCTION_STARTED`
- `PRODUCTION_COMPLETED`
- `QC_PASSED`
- `QC_FAILED`
- `QC_REWORK`
- `QC_SCRAPPED`
- `QC_USE_AS_IS`

Timeline remains audit/history only. Authoritative state comes from
Production/QC entities plus `ComponentInstance` state fields.

## Prior Current Limitation - Resolved By DOMAIN.5A

`QcInspection` and `NonConformanceReport` previously could not represent
instance-level QC lineage safely. DOMAIN.5A resolved this blocker with nullable
`componentInstanceId` relations.

Current `QcInspection` fields:

- `productionOrderId`
- `productionStageId`
- `componentId`
- `projectId`

Current `NonConformanceReport` fields:

- `inspectionId`
- `issueId`
- `productionOrderId`
- `componentId`

Previously missing:

- `componentInstanceId`

## Why Existing Relation Is Insufficient

`productionOrderId` can identify a batch/order but not which physical item in
the batch passed, failed, reworked or scrapped.

`componentId` points to the engineering definition/legacy overloaded Component
row, not to a physical manufactured steel component.

Without `componentInstanceId`, the system cannot prove:

- Instance 1 passed.
- Instance 2 passed.
- Instance 3 requires rework.
- Instance 4 was scrapped.
- Reworked Instance 3 later passed.

That means Finished Goods would either be derived from batch-level assumptions
or metadata conventions, both of which violate the approved canonical model.

## Prior Minimal Additive Schema - Resolved By DOMAIN.5A

DOMAIN.5A implemented the previously proposed nullable QC instance lineage:

```prisma
model QcInspection {
  componentInstanceId String?
  componentInstance   ComponentInstance? @relation(fields: [componentInstanceId], references: [id], onDelete: SetNull)

  @@index([componentInstanceId])
}

model NonConformanceReport {
  componentInstanceId String?
  componentInstance   ComponentInstance? @relation(fields: [componentInstanceId], references: [id], onDelete: SetNull)

  @@index([componentInstanceId])
}

model QcInspectionSnapshot {
  componentInstanceId String?

  @@index([componentInstanceId])
}
```

Recommended companion relation fields:

```prisma
model ComponentInstance {
  qcInspections QcInspection[]
  ncrs          NonConformanceReport[]
}
```

The snapshot field is not authoritative, but it keeps read-model filters and
projection/search paths aligned with the relational source.

## Indexes

Required:

- `qc_inspections_componentInstanceId_idx`
- `non_conformance_reports_componentInstanceId_idx`
- `qc_inspection_snapshots_componentInstanceId_idx`

Optional later, after query evidence:

- composite `(componentInstanceId, status)`
- composite `(productionOrderId, componentInstanceId)`

Do not add optional composites until real query plans show value.

## Migration Impact

- Additive nullable columns only.
- No existing rows are backfilled.
- No existing QC/legacy Component flow is broken.
- Existing inspections remain order/component-level evidence.
- New canonical inspections can bind to a physical instance.

Expected row impact:

- `QcInspection`: one row per instance inspection or batch inspection.
- `NonConformanceReport`: zero or more rows per failed/reworked/scrapped
  instance.
- Existing high-volume index impact is low because nullable FK indexes are
  sparse for legacy rows.

## Legacy Compatibility

- Existing inspections with only `productionOrderId/componentId` remain
  readable.
- Existing NCRs remain readable.
- Legacy dashboards/read models remain unchanged until a later consumer
  conversion sprint.
- No legacy Component.status value is removed or reinterpreted by migration.

## Runtime Fixture

No production transition fixture was executed in DOMAIN.5B because the
remaining blocker is execution granularity. Updating physical instances without
instance-level start/completion evidence would fabricate history.

DOMAIN.5A runtime fixture remains valid for QC lineage only. DOMAIN.5B runtime
verification is limited to migration/enum/count checks.

## Regression Results

DOMAIN.5B added only the enum value and did not implement Production/QC state
transitions.

- Targeted Production/QC tests: 4 suites / 21 tests passed.
- Full backend tests: 78 suites / 234 tests passed.
- Backend build passed.
- Frontend build passed with existing Vite chunk-size warning.
- `git diff --check` passed.
- No staged files.

## Backend Tests

Passed.

## Backend Build

Passed.

## Frontend Build

Passed with existing Vite chunk-size warning.

## Migration Status

DOMAIN.5B migration
`20260728090000_component_domain5b_instance_in_production_state` is deployed.
`prisma migrate status` reports the database schema is up to date.

## Remaining P0

- Implement the approved DOMAIN.5C Production instance execution granularity
  boundary: start/completion must identify physical instance IDs, serial
  sequences or an equivalent canonical instance selection.
- After instance-level evidence exists, implement Production start/completion
  physical instance transitions.
- Implement instance-level QC decision transitions and Finished Goods
  eligibility query/service/API.

## Remaining P1

- Convert legacy Component.status READY/STOCK consumers to canonical
  ComponentInstance Finished Goods projection.
- Define command-side `USE_AS_IS` approved disposition path if the business
  wants Use-As-Is to count as quality acceptance.
- Convert Yard placement inputs to require Finished Goods eligible
  ComponentInstances in the canonical path.

## Next Sprint Recommendation

Start **DOMAIN.5D - ComponentInstanceExecution Schema Foundation** using the
DOMAIN.5C design. Add the physical instance execution bridge first, then resume
DOMAIN.5 implementation for Production start/completion, QC decisions and
Finished Goods eligibility.
