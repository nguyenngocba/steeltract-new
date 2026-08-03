# COMPONENTS.QC.2 - Canonical Physical QC Workspace

Date: 2026-08-03

## Audit

### Frontend

- `apps/frontend/src/modules/components/pages/tabs/ComponentsInternalQcPage.tsx`
  previously used `useComponents()` and derived QC area/result from
  `Component.status` through local helpers (`qcArea`, `qcDisposition`).
  This mixed engineering definitions with physical QC state.
- `apps/frontend/src/modules/qc/pages/QcPage.tsx` already has a physical final
  QC queue using `useQcComponentInstances({ state: 'PRODUCED_WAITING_QC' })`
  and existing QC command endpoints. It still derives some cockpit KPI values
  from `runtime.inspections`, so it is not a fully physical-only read surface.
- `apps/frontend/src/modules/qc/hooks/useQcWorkspace.ts` exposes
  `useQcComponentInstances()` over `/components/foundation/instances`.
- `apps/frontend/src/modules/qc/api/qc.api.ts` typed physical instances, but
  did not type the inspection/checklist/NCR/timeline lineage needed by the
  Components QC workspace.

### Backend

- Canonical physical source:
  `GET /components/foundation/instances`.
- Controller:
  `apps/backend-api/src/modules/components/component-domain-foundation.controller.ts`.
- Service:
  `apps/backend-api/src/modules/components/services/component-domain-foundation.service.ts`.
- Repository:
  `apps/backend-api/src/modules/components/repositories/component-domain-foundation.repository.ts`.
- QC commands:
  `apps/backend-api/src/modules/qc/services/qc-command.service.ts` updates
  `ComponentInstance.state` for FINAL inspections and NCR dispositions.

## Source of Truth

Canonical QC source is now `ComponentInstance`, not `Component` or
`ProductionOrder`.

Physical states used by this workspace:

- `PRODUCED_WAITING_QC`
- `QC_PASSED`
- `QC_FAILED`
- `REWORK`
- `USE_AS_IS`
- `SCRAPPED`

Finished Goods eligibility remains outside this sprint and continues to use:

- `GET /components/instances/finished-goods`

## Read Model

`GET /components/foundation/instances` was extended without schema change.

Additions:

- `qcScope=true` query filter limits rows to canonical physical QC states.
- Response now includes `summary`:
  - `waitingQc`
  - `passed`
  - `failed`
  - `rework`
  - `useAsIs`
  - `scrap`
- Row include now exposes:
  - `qcInspections`
  - FINAL `checklist.items`
  - `results`
  - instance-linked `ncrs`
  - `timeline`

This prevents the frontend from calculating QC KPI values from legacy
component definitions.

## API

Used endpoint:

```text
GET /components/foundation/instances?qcScope=true&page=&limit=&search=&state=
```

No new controller was introduced. No schema or migration was created.

## UI

`ComponentsInternalQcPage.tsx` now renders:

- compact KPI row sourced from backend `summary`
- filter/search toolbar
- compact physical QC table with high-value columns:
  - Instance
  - Component
  - Project
  - Production Order
  - Inspection
  - Result
  - Disposition
  - Status
  - Action
- right analytics rail based on current canonical instance page
- right-side `ModuleDetailDrawer`

Detail drawer tabs:

- Overview
- Inspection
- Checklist
- NCR
- Disposition
- History

Checklist behavior:

- Uses the authoritative FINAL checklist attached to the instance inspection.
- Required checklist items must have non-`PENDING` results to be considered
  complete.
- PASS/FAIL/USE-AS-IS/REWORK/SCRAP controls are displayed disabled unless the
  FINAL checklist is complete and routed through the QC command contract.

## Runtime

Runtime browser certification was not executed in this sprint. The UI is
compiled by production build and uses the authenticated API client through the
existing QC hook.

## Verified

- `pnpm -C apps/backend-api exec prisma validate` PASS
- `pnpm -C apps/backend-api exec prisma migrate status` PASS
- `pnpm -C apps/backend-api test -- component-domain-foundation` PASS
- `pnpm -C apps/frontend test -- --runInBand` PASS
- `pnpm -C apps/backend-api build` PASS
- `pnpm -C apps/frontend build` PASS

## Not Verified

- Full backend test suite pending after documentation update.
- Browser runtime interaction on authenticated Components/QC tab pending.
- Actual PASS/FAIL command execution from this Components workspace is not
  enabled here; the existing QC command workspace remains the operational
  command path.

## Remaining Gaps

### P0

- None in `ComponentsInternalQcPage` after this sprint for source-of-truth:
  table and KPI no longer use `Component.status`.

### P1

- Convert remaining `QcPage.tsx` physical final QC KPI calculations to the same
  backend physical summary instead of mixed `runtime.inspections`.
- Add runtime browser smoke with physical fixtures covering:
  `PRODUCED_WAITING_QC -> FINAL checklist complete -> PASS/FAIL`.
- Add a dedicated checklist result entry UI before enabling disposition command
  buttons inside Components/QC.

### P2

- Add richer root-cause/category visualizations once NCR taxonomy is
  authoritative.
