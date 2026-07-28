# COMPONENT DOMAIN.5F.4 - Canonical QC Physical Instance UI

Status: IMPLEMENTED

Date: 2026-07-28

## Previous QC UI

The QC workspace primarily operated on aggregate Production Orders and legacy
Component references. The final inspection tab displayed inspection rows and
static outgoing-quality presentation, so an operator could not reliably tell
which exact physical manufactured component was being inspected.

Legacy quick approval paths used:

- ProductionOrder aggregate identity
- Component definition identity
- aggregate QC quantities/status

Those paths remain available for non-final / compatibility QC workflows but are
not the canonical final manufactured-component inspection flow.

## Canonical QC Workflow

Final manufactured-component QC now starts from:

`ComponentInstance.state = PRODUCED_WAITING_QC`

The UI then creates a FINAL `QcInspection` bound to
`QcInspection.componentInstanceId` and calls canonical command endpoints:

- PASS -> `QC_PASSED`
- FAIL -> `QC_FAILED` and NCR creation

QC does not create ComponentInstances, Finished Goods rows,
InventoryTransactions or Yard placements.

## API Mapping

Read:

- `GET /components/foundation/instances?state=PRODUCED_WAITING_QC`
- `GET /qc/inspections/:id`
- existing QC cockpit/read-model endpoints for legacy inspection history and
  KPI context

Write:

- `POST /qc/inspections`
- `POST /qc/commands/inspections/:id/pass`
- `POST /qc/commands/inspections/:id/fail`
- `POST /qc/commands/inspections/:id/ncr`
- `POST /qc/commands/ncr/:id/rework`
- `POST /qc/commands/ncr/:id/scrap`
- `POST /qc/commands/ncr/:id/use-as-is`

The new command routes call existing `QcCommandService` logic. No business rule
was reimplemented in the frontend.

## Waiting QC Queue

The `/qc/final` tab now renders one row per physical `ComponentInstance`.

Columns:

- Mã cấu kiện vật lý
- Hồ sơ cấu kiện
- Công trình
- Production Order
- Hoàn thành SX
- Trạng thái
- Thao tác

Rows are sourced only from `PRODUCED_WAITING_QC`.

## Inspection Target

The detail modal keeps physical identity visible:

- ComponentInstance code
- Component definition
- Project
- ProjectComponentRequirement
- Production Order
- production completion date
- revision
- latest operation

The modal explicitly states that the target is a physical
`ComponentInstance`, not the CPL engineering definition and not aggregate PO
quantity.

## Inspection Flow

For PASS or FAIL, the UI creates a READY inspection with:

- `checklistId` from an active FINAL checklist
- `componentInstanceId`
- metadata source `qc-final-component-instance`

If no FINAL checklist exists, the UI blocks final QC because the canonical
backend transition only applies to FINAL inspections.

## QC Result Mapping

- PASS calls `POST /qc/commands/inspections/:id/pass`
- FAIL calls `POST /qc/commands/inspections/:id/fail`

Backend remains authoritative for state transitions and rejects invalid
instance states.

## NCR

After FAIL, the UI creates canonical NCR through
`POST /qc/commands/inspections/:id/ncr`.

The NCR inherits `componentInstanceId` from the inspection through backend
lineage validation.

## Rework

The command route for rework disposition is exposed:

`POST /qc/commands/ncr/:id/rework`

The UI client hook is available for the next NCR detail pass. Rework keeps the
same physical `ComponentInstance`; no replacement instance is created.

## Scrap

The command route for scrap recommendation is exposed:

`POST /qc/commands/ncr/:id/scrap`

Scrapped instances remain historically readable and do not become Finished
Goods.

## Use As Is

The command route for accepted deviation is exposed:

`POST /qc/commands/ncr/:id/use-as-is`

Eligibility remains controlled by backend Finished Goods rules.

## History

The physical instance detail shows operation execution evidence already exposed
by the component foundation read model. Full inspection/NCR chronology by
instance remains a P1 UI expansion because the current QC cockpit read model
does not yet provide a compact instance-history panel.

## KPI

The final QC tab now uses physical-instance metrics for the canonical final
workflow:

- Chờ QC
- Đạt QC
- Không đạt
- Làm lại
- Loại bỏ
- FINAL checklist readiness

It no longer uses `COUNT(Component)` or ProductionOrder completed quantity for
the final component QC queue.

## Filters

Implemented filters:

- search by instance code, component code/name, project and PO
- Project
- physical QC state

Backend filtering is used for the queue state.

## Production Handoff

Production 5F.3 exposes physical instances. The QC final queue consumes the
authoritative state `PRODUCED_WAITING_QC`. No manual quantity copying or
Component.status bridge is used.

## Finished Goods Handoff

PASS transitions the exact physical instance to `QC_PASSED`. Finished Goods
eligibility continues to be derived by
`GET /components/instances/finished-goods`.

## Legacy Compatibility

Kept:

- existing QC cockpit overview
- inbound QC
- production/in-process QC
- legacy ProductionOrder-based queue/action paths
- NCR/CAPA/report/log pages

Only final manufactured-component QC is converted to physical instance
identity.

## Files Changed

- `apps/backend-api/src/modules/components/dto/component-domain-foundation.dto.ts`
- `apps/backend-api/src/modules/components/repositories/component-domain-foundation.repository.ts`
- `apps/backend-api/src/modules/qc/domain/qc.commands.ts`
- `apps/backend-api/src/modules/qc/dto/qc.dto.ts`
- `apps/backend-api/src/modules/qc/qc.controller.ts`
- `apps/backend-api/src/modules/qc/services/qc-command.service.ts`
- `apps/backend-api/src/modules/qc/qc-dashboard.controller.spec.ts`
- `apps/frontend/src/modules/qc/api/qc.api.ts`
- `apps/frontend/src/modules/qc/hooks/useQcWorkspace.ts`
- `apps/frontend/src/modules/qc/pages/QcPage.tsx`

## Runtime Verification

Authenticated runtime fixture smoke was not executed in this iteration. The UI
and command path were verified through build, unit tests and backend full test
suite. A browser/API smoke with a controlled 3-instance fixture remains P1.

## Regression Results

- Prisma validate: PASS
- Targeted QC command tests: PASS
- Targeted QC controller test: PASS
- Full backend tests: PASS
- Frontend tests: PASS
- Backend build: PASS
- Frontend build: PASS
- `git diff --check`: PASS

## Backend Tests

- `pnpm -C apps/backend-api test -- qc-command.service --runInBand`
- `pnpm -C apps/backend-api test -- qc-dashboard.controller --runInBand`
- `pnpm -C apps/backend-api test --runInBand`

## Frontend Tests

- `pnpm -C apps/frontend test`

## Backend Build

- `pnpm -C apps/backend-api build`

## Frontend Build

- `pnpm -C apps/frontend build`

Existing Vite chunk-size warning remains unrelated.

## Remaining P0

None for final QC queue identity and PASS/FAIL physical-state transition UI.

## Remaining P1

- Add authenticated runtime smoke fixture:
  001 PASS -> Finished Goods eligible, 002 FAIL/NCR/REWORK, 003
  IN_PRODUCTION not queued.
- Add instance-level inspection/NCR history panel.
- Add NCR detail actions to apply rework/scrap/use-as-is from visible NCR rows.
- Add final QC table pagination against backend paging when large queues exist.

## Recommendation

Proceed to QC instance history and NCR disposition UI polish, then convert Yard
handoff to consume only finished-goods eligible ComponentInstances.
