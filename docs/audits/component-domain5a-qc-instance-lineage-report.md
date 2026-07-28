# COMPONENT DOMAIN.5A - QC Physical Instance Lineage Foundation

Status: **IMPLEMENTED - MIGRATION/TEST/BUILD/RUNTIME PASS**

Date: 2026-07-27

## Schema Added

Added nullable physical lineage fields for backward compatibility:

- `QcInspection.componentInstanceId String?`
- `NonConformanceReport.componentInstanceId String?`
- `QcInspectionSnapshot.componentInstanceId String?`

Legacy QC rows remain valid with `componentInstanceId = NULL`.

## Relations

Added explicit nullable Prisma relations:

- `QcInspection.componentInstance -> ComponentInstance?`
- `NonConformanceReport.componentInstance -> ComponentInstance?`
- `ComponentInstance.qcInspections -> QcInspection[]`
- `ComponentInstance.ncrs -> NonConformanceReport[]`

Existing `componentId`, `productionOrderId`, `productionStageId` and
`projectId` fields remain available for compatibility and context.

## Indexes

Added focused single-column indexes:

- `qc_inspections_componentInstanceId_idx`
- `non_conformance_reports_componentInstanceId_idx`
- `qc_inspection_snapshots_componentInstanceId_idx`

No compound indexes were added because current query paths only require direct
lookup by physical instance. Compound indexes should wait for a proven
high-value read path.

## Migration

Migration:

`apps/backend-api/prisma/migrations/20260727224000_component_domain5a_qc_instance_lineage/migration.sql`

The SQL is additive only:

- `ALTER TABLE ... ADD COLUMN`
- `CREATE INDEX`
- nullable foreign keys with `ON DELETE SET NULL`

No `DROP`, `TRUNCATE`, destructive `DELETE`, blind backfill or fabricated
lineage was introduced.

## Backup

Created and verified backup before migration deployment:

`/tmp/steeltrack-domain5a-before-20260727.dump`

`pg_restore --list` completed successfully when written to:

`/tmp/steeltrack-domain5a-before-20260727.dump.list`

Pre-migration row counts:

- `QcInspection`: 1
- `NonConformanceReport`: 0
- `QcInspectionSnapshot`: 0
- `ComponentInstance`: 16

Post-migration row counts:

- `QcInspection`: 1
- `NonConformanceReport`: 0
- `QcInspectionSnapshot`: 0
- `ComponentInstance`: 16

Counts were unchanged, confirming no data rewrite.

## Legacy QC Compatibility

Legacy QC create/list/read paths remain readable without
`componentInstanceId`. The new field is optional in DTOs and filters.

Legacy subject fallback remains:

`ComponentInstance -> ProductionOrder -> Component -> Project -> Inspection`

## Physical Instance Validation

`QcService` now validates instance-level lineage before writing canonical
instance QC:

- instance must exist
- supplied `componentId` must match `ComponentInstance.componentId`
- supplied `productionOrderId` must match
  `ComponentInstance.productionOrderId`
- supplied `projectId` must match `ComponentInstance.projectId`

When `componentInstanceId` is supplied and contextual fields are omitted, the
service derives `componentId`, `productionOrderId` and `projectId` from the
instance.

## QC Lineage

`POST /qc/inspections` and inspection update DTOs can now carry
`componentInstanceId`.

Canonical QC event payloads now preserve:

- `componentInstanceId`
- `componentId`
- `productionOrderId`

For instance-level QC, event subject is now `COMPONENT_INSTANCE`.

## NCR Lineage

NCR creation from an instance-level inspection preserves:

- `componentInstanceId`
- `inspectionId`
- `componentId`
- `productionOrderId`

If an inspection already has `componentInstanceId`, NCR creation cannot supply a
different instance id.

Disposition command events now include `componentInstanceId`, `componentId` and
`productionOrderId`, preserving the same physical identity through rework.

## Snapshot Lineage

`QcInspectionSnapshot` now stores `componentInstanceId`.

`QcSnapshotRepository.calculateInspectionSnapshots()` selects the live QC
lineage and `upsertInspection()` writes it into the snapshot projection.

Snapshots remain projections. Live QC entities remain the source of truth.

## Runtime Fixture

Runtime smoke used existing controlled DOMAIN4 physical instance:

- `ComponentInstance.id`: `cms31uquo001epvk716nvtrja`
- `instanceNo`:
  `STABILITY7-1785129114051-COMP-DOMAIN4-1785146027125-PO-B-007`

Created through `QcService`:

- `QcInspection.id`: `cms33uxww0000pvogvdmb41dm`
- `NonConformanceReport.id`: `cms33uya80003pvog7pqwhhkx`

Verified DB chain:

```text
Component
  -> ComponentRevision / BOM definition lineage from DOMAIN4 fixture
  -> ProjectComponentRequirement
  -> ProductionOrder
  -> ComponentInstance
  -> QcInspection(componentInstanceId)
  -> NonConformanceReport(componentInstanceId)
```

Runtime side-effect delta:

- `ComponentInstance`: +0
- `InventoryTransaction`: +0
- `YardItemPlacement`: +0
- `QcInspection`: +1
- `NonConformanceReport`: +1

No Finished Goods classification was introduced.

## DOMAIN4 Regression

DOMAIN4 data remains readable. Existing 16 `ComponentInstance` rows were
preserved across migration.

## QC Regression

Targeted QC tests passed:

- legacy inspection transition and outbox boundary
- AD-019 QC event envelope
- canonical instance inspection creation
- instance/component mismatch rejection
- NCR physical lineage preservation
- canonical command idempotency/concurrency tests
- NCR disposition lineage preservation

## Production Regression

No Production code was modified in DOMAIN.5A. Full backend tests passed.

## Backend Tests

`pnpm -C apps/backend-api test`

Result:

- 78 suites passed
- 234 tests passed

Targeted QC/snapshot tests:

- 4 suites passed
- 13 tests passed

## Backend Build

`pnpm -C apps/backend-api build`

Result: PASS

## Frontend Build

`pnpm -C apps/frontend build`

Result: PASS

Existing warning remains: Vite reports large chunks after minification.

## Migration Status

`pnpm -C apps/backend-api exec prisma migrate status`

Result: PASS

Database schema is up to date.

## Remaining P0

None for DOMAIN.5A.

## Remaining P1

- Resume DOMAIN.5 to implement Production completion -> QC wait transition.
- Implement QC PASS / approved Use-As-Is -> Finished Goods eligibility.
- Implement QC failed/rework/scrap instance state transitions.
- Convert future Yard/Delivery flows to consume `ComponentInstance` identity.

## Recommendation

Proceed to **COMPONENT DOMAIN.5 - Production Completion, QC & Finished Goods
Gate**. The required physical QC lineage foundation is now available and
validated.
