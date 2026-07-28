# COMPONENT DOMAIN.5E - Physical Lifecycle Transition & QC Handoff

Status: **IMPLEMENTED**

## Scope

DOMAIN.5E completes the first canonical physical lifecycle handoff for
ComponentInstance execution evidence and final QC decisions.

No Prisma schema change was required.

## Architecture Implemented

ComponentInstance physical state is now derived from production instance
execution evidence, not ProductionOrder quantity or Component status.

Lifecycle implemented:

```text
PLANNED
  -> IN_PRODUCTION
     when first ComponentInstanceExecution starts RUNNING

IN_PRODUCTION
  -> PRODUCED_WAITING_QC
     only when every mandatory WorkOrder for the ProductionOrder has a
     COMPLETED ComponentInstanceExecution for the same ComponentInstance

PRODUCED_WAITING_QC
  -> QC_PASSED
     when a FINAL QC inspection is accepted

PRODUCED_WAITING_QC
  -> QC_FAILED
     when a FINAL QC inspection is rejected

QC_FAILED / PRODUCED_WAITING_QC / REWORK
  -> REWORK
     when NCR disposition requires rework

QC_FAILED / PRODUCED_WAITING_QC / REWORK
  -> SCRAPPED
     when NCR disposition recommends scrap

QC_FAILED / PRODUCED_WAITING_QC / REWORK
  -> USE_AS_IS
     when NCR disposition accepts use-as-is
```

## Mandatory Operation Basis

V1 treats all WorkOrders attached to the ProductionOrder as mandatory routing
operations. The existing WorkOrder model already stores the operation identity
through `routingOperationId` and sequence. No optional routing flag exists yet,
so no schema change was introduced.

## QC Handoff Basis

Final QC is identified by `QcInspection.checklist.type = FINAL` with a
`componentInstanceId`. Non-final/process inspections do not move physical
ComponentInstance state.

## Finished Goods Eligibility

Added read API:

```text
GET /components/instances/finished-goods
```

Supported filters:

- `componentId`
- `productionOrderId`
- `componentRequirementId`
- `projectId`
- `instanceCode`
- `page`
- `limit`

Eligibility requires physical ComponentInstance state plus evidence:

- `QC_PASSED` requires `producedAt`, `qcPassedAt`, no `scrappedAt`, and a FINAL
  QC inspection with PASSED/APPROVED status.
- `USE_AS_IS` requires `producedAt`, `qcPassedAt`, no `scrappedAt`, and an
  approved NCR disposition of ACCEPT/USE_AS_IS.

The endpoint does not create InventoryTransaction, Yard placement, FinishedGoods
rows or dashboard state.

## Files Changed

- `apps/backend-api/src/modules/production/repositories/production-order.repository.ts`
- `apps/backend-api/src/modules/production/services/production-instance-execution.service.ts`
- `apps/backend-api/src/modules/production/services/production-instance-execution.service.spec.ts`
- `apps/backend-api/src/modules/qc/repositories/qc.repository.ts`
- `apps/backend-api/src/modules/qc/services/qc-command.service.ts`
- `apps/backend-api/src/modules/qc/services/qc-command.service.spec.ts`
- `apps/backend-api/src/modules/components/component-instances.controller.ts`
- `apps/backend-api/src/modules/components/components.module.ts`
- `apps/backend-api/src/modules/components/dto/component-domain-foundation.dto.ts`
- `apps/backend-api/src/modules/components/repositories/finished-goods-eligibility.repository.ts`
- `apps/backend-api/src/modules/components/services/finished-goods-eligibility.service.ts`

## Verification

- `pnpm -C apps/backend-api exec prisma validate`: PASS
- `pnpm -C apps/backend-api exec prisma generate`: PASS
- `pnpm -C apps/backend-api exec prisma migrate status`: PASS, database schema
  is up to date
- `pnpm -C apps/backend-api test -- production-instance-execution.service.spec.ts qc-command.service.spec.ts`: PASS, 19 tests
- `pnpm -C apps/backend-api test`: PASS, 79 suites / 247 tests
- Runtime DB smoke with DOMAIN5E fixture: PASS
- `pnpm -C apps/backend-api build`: PASS
- `pnpm -C apps/frontend build`: PASS
- `git diff --check`: PASS

Runtime smoke evidence:

```json
{
  "afterStart": { "state": "IN_PRODUCTION" },
  "afterPartial": { "state": "IN_PRODUCTION" },
  "afterAll": { "state": "PRODUCED_WAITING_QC", "producedAt": true },
  "timelines": [
    "PRODUCTION_STARTED",
    "PRODUCTION_OPERATION_COMPLETED",
    "PRODUCTION_STARTED",
    "PRODUCTION_OPERATION_COMPLETED",
    "PRODUCTION_COMPLETED_WAITING_QC"
  ]
}
```

The smoke fixture used prefix `DOMAIN5E-SMOKE-` and was cleaned up after the
run.

## Remaining P0

None found for DOMAIN.5E.

## Remaining P1

- Add a later approved routing model if SteelTrack needs optional WorkOrders or
  route branches. Current V1 intentionally treats every ProductionOrder
  WorkOrder as mandatory.
- Add live REST smoke with authenticated HTTP once a stable test token harness
  exists.

## Next Sprint Recommendation

Proceed to the next Component physical workflow sprint for Yard/Delivery
handoff, keeping Finished Goods read eligibility separate from Inventory and
Yard ownership.
