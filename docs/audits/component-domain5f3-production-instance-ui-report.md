# COMPONENT DOMAIN.5F.3 - Production Requirement-First & Instance Execution UI

Status: IMPLEMENTED

Date: 2026-07-28

## Previous Production UI

Production creation still used the legacy `ManufacturingOrderModal` flow:

- select arbitrary Component definition
- select legacy Production BOM from `/production/boms`
- enter aggregate quantity
- call `POST /production`

That flow did not begin from `ProjectComponentRequirement`, did not show
required/allocated/remaining demand, and did not expose generated physical
`ComponentInstance` rows after release.

## Canonical Workflow

The Production UI now follows the canonical entry path:

ProjectComponentRequirement -> ProductionOrder -> Release ->
ComponentInstance -> ComponentInstanceExecution -> QC handoff.

The UI still leaves final QC decisions to QC. Production only shows the
physical instances and their operation evidence.

## API Mapping

- Requirement source:
  `GET /components/foundation/requirements`
- Instance source:
  `GET /components/foundation/instances?productionOrderId=...`
- Create PO:
  `POST /production/commands/orders`
- Release PO:
  `POST /production/commands/orders/:id/release`
- Instance execution command client methods added for canonical endpoints:
  assign, start, complete and history.

Legacy `/production` and `/production/boms` remain available for compatibility
but are no longer used by the main Manufacturing Order modal.

## Requirement-First PO Creation

The modal now selects:

- Project / Công trình
- ProjectComponentRequirement
- production quantity
- planned start/end
- note

It displays:

- Component code/name
- Project code/name
- released revision
- engineering release readiness
- required quantity
- allocated Production Order quantity
- remaining quantity

Frontend validation blocks:

- missing requirement
- unreleased Component/Revision/BOM basis
- non-integer or non-positive quantity
- quantity greater than remaining requirement

Backend remains authoritative through `assertRequirementAllocation`.

## PO List Changes

No broad list redesign was performed. The existing Production table remains
stable. Canonical semantics are introduced through creation and the detail
drawer first.

## PO Detail

The Production Order drawer now displays:

- `componentRequirementId`
- physical instance count
- canonical instance summary cards
- instance table with state, current operation, execution status and QC
  readiness

## Physical Instance UI

The physical instance table uses canonical `ComponentInstance` rows.

Displayed columns:

- instance code
- physical state
- operation
- execution status
- first started date
- last completed date
- QC readiness

State labels are localized:

- `PLANNED` -> `Chờ sản xuất`
- `IN_PRODUCTION` -> `Đang sản xuất`
- `PRODUCED_WAITING_QC` -> `Chờ QC`
- `QC_PASSED` -> `Đạt QC`
- `QC_FAILED` -> `Không đạt QC`
- `REWORK` -> `Làm lại`
- `SCRAPPED` -> `Loại bỏ`
- `USE_AS_IS` -> `Chấp nhận sử dụng`

## WorkOrder UI

The release action builds canonical WorkOrder definitions from the materialized
Production BOM routing steps already attached to the Production Order. If no
routing exists, the drawer shows a blocking message instead of fabricating
operations.

## Assignment Flow

Client methods are available for the canonical assign endpoint. A full
operation assignment UX is left as P1 because the current workspace does not
yet expose a stable ProductionExecution picker without a broader execution
screen change.

## Start Flow

Client methods are available for canonical instance-execution start. Current
drawer keeps existing order/stage start actions and displays instance evidence.

## Completion Flow

Client methods are available for canonical instance-execution completion.
Current drawer displays completion evidence from instance executions.

## Physical Progress

Physical progress now comes from `ComponentInstance.state` and
`ComponentInstanceExecution.status` where available. Aggregate
`ProductionOrder.quantity` is still shown as planning quantity, not as physical
completion proof.

## Partial Production

The UI can display mixed instance states in one PO: planned, running, waiting
QC, QC passed and QC failed. This supports partial-production visibility
without pretending aggregate completed quantity identifies exact pieces.

## Traceability

Each displayed instance preserves lineage to:

- Component definition
- Component revision
- BOM definition
- ProjectComponentRequirement
- Project
- ProductionOrder
- WorkOrder / ProductionExecution evidence when available

## QC Handoff

`PRODUCED_WAITING_QC` is shown as `Sẵn sàng bàn giao QC`. Production does not
execute QC PASS/FAIL.

## Legacy Compatibility

Kept:

- legacy `/production`
- legacy `/production/boms`
- existing Production cockpit/read-model routes
- old compatibility hooks

Removed from main drawer semantics:

- legacy manual `Tạo cấu kiện từ MO` action

## Files Changed

- `apps/backend-api/src/modules/components/repositories/component-domain-foundation.repository.ts`
- `apps/backend-api/src/modules/production/domain/production.commands.ts`
- `apps/backend-api/src/modules/production/dto/production-command.dto.ts`
- `apps/backend-api/src/modules/production/services/production-command.service.ts`
- `apps/frontend/src/modules/production/api/production.api.ts`
- `apps/frontend/src/modules/production/hooks/useProductionCockpit.ts`
- `apps/frontend/src/modules/production/components/ManufacturingOrderModal.tsx`
- `apps/frontend/src/modules/production/pages/ProductionCockpitPage.tsx`

## Runtime Verification

No destructive runtime fixture was created in this iteration. The path is wired
to existing authenticated APIs and protected by backend tests/builds.

## Regression Results

- Prisma validate: PASS
- Backend targeted tests: PASS
- Frontend tests: PASS
- Backend build: PASS
- Frontend build: PASS
- `git diff --check`: PASS

## Backend Tests

- `pnpm -C apps/backend-api test -- production-command.service --runInBand`
- `pnpm -C apps/backend-api test -- component-domain-foundation --runInBand`

## Frontend Tests

- `pnpm -C apps/frontend test`

## Backend Build

- `pnpm -C apps/backend-api build`

## Frontend Build

- `pnpm -C apps/frontend build`

Existing Vite chunk-size warning remains unrelated to this sprint.

## Remaining P0

None for requirement-first creation and physical instance visibility.

## Remaining P1

- Build a dedicated instance assignment panel with a stable
  ProductionExecution picker.
- Add inline start/complete controls at instance-operation row level once the
  assignment panel exists.
- Add browser smoke with authenticated DOMAIN fixture.

## Recommendation

Proceed to QC instance-level final inspection UI. Production now exposes enough
canonical physical evidence for QC to target exact `ComponentInstance` rows.
