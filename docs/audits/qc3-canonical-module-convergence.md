# QC.3 - Canonical QC Module Convergence

Date: 2026-08-03

## Audit

### QcPage.tsx Before

`apps/frontend/src/modules/qc/pages/QcPage.tsx` contained a standalone QC
cockpit implementation separate from the Components/QC workspace.

Legacy patterns found:

- KPI values derived from `runtime.metrics` and `runtime.inspections`.
- Final QC values derived from frontend arrays:
  - `finalRows`
  - `passedCount`
  - `failedCount`
  - `scrapCount`
- Local chart datasets derived from inspection rows.
- Final QC table used `waitingInstances` for queue rows but mixed pass/fail
  KPI with inspection runtime rows.
- Multiple tabs rendered inspection-centric tables instead of the physical
  ComponentInstance read model.
- CAPA/log/report tabs contained controlled-but-not-authoritative zero values
  and report charts from legacy runtime summaries.

### Routes

All QC routes still point to the same `QcPage` component:

- `/qc`
- `/qc/inbound`
- `/qc/production`
- `/qc/final`
- `/qc/ncr`
- `/qc/capa`
- `/qc/logs`
- `/qc/dashboard`
- `/qc/reports`

No router changes were required.

### APIs/Hooks

Canonical API reused:

```text
GET /components/foundation/instances?qcScope=true
```

Canonical hook reused:

```ts
useQcComponentInstances()
```

No new API or repository was created in this sprint.

## Legacy Removed

Standalone `QcPage.tsx` no longer contains:

- `runtime.inspections`
- `runtime.metrics`
- `finalRows`
- frontend `passedCount` / `failedCount`
- fake CAPA/log KPI cards
- fake report charts
- production-order-derived QC queue actions
- inspection-centric duplicate detail drawer

`QcPage.tsx` now renders the shared canonical physical QC workspace.

## Source of Truth

Exactly one QC read source is used by both Components/QC and standalone QC:

```text
ComponentInstance
  -> FINAL Inspection
  -> Checklist
  -> Disposition
  -> NCR
  -> Timeline
```

Forbidden sources are no longer used by the standalone QC page:

- `Component`
- `ProductionOrder`
- legacy `Component.status`
- frontend aggregation of `runtime.inspections`

## Read Model

Read model from QC.2 is reused:

- `qcScope=true` limits rows to physical QC states.
- Backend summary provides:
  - Waiting QC
  - Passed
  - Failed
  - Rework
  - Use-As-Is
  - Scrap
- Row include provides:
  - FINAL inspections
  - checklist items/results
  - NCR
  - timeline

No duplicated QC repository or read model was introduced.

## API

Used by both modules:

```text
GET /components/foundation/instances?qcScope=true&page=&limit=&search=&state=
```

No backend schema, migration, Logistics, Yard, Production lifecycle,
Finished Goods eligibility or ComponentInstance state machine change was made.

## Frontend

### Shared Surface

`ComponentsInternalQcPage.tsx` now exports:

```ts
CanonicalPhysicalQcWorkspace
```

Consumers:

- Components internal QC tab wraps it with `EnterpriseModulePage`.
- Standalone QC page wraps it with `EnterpriseWorkspace` and route tabs.

### Table

Canonical columns:

- Instance
- Component
- Project
- Production Order
- Inspection
- Result
- Disposition
- Status
- Action

### Detail

Both modules reuse the same `ModuleDetailDrawer`-based detail surface:

- Overview
- Inspection
- Checklist
- NCR
- Disposition
- History

### Charts

Legacy standalone QC charts were removed from active rendering.
The remaining side panels are controlled physical read-model summaries:

- Final checklist completion status
- Recent physical-instance NCR
- Recent lineage

If no authoritative backend row exists, the UI shows controlled empty states.

## Verified

- `pnpm -C apps/backend-api exec prisma validate` PASS
- `pnpm -C apps/backend-api exec prisma migrate status` PASS
- `pnpm -C apps/backend-api test -- component-domain-foundation` PASS
- `pnpm -C apps/frontend test -- --runInBand` PASS
- `pnpm -C apps/backend-api build` PASS
- `pnpm -C apps/frontend build` PASS

## Remaining Gaps

### P1

- Browser runtime smoke on authenticated `/qc`, `/qc/final`, `/qc/ncr` and
  Components/QC routes with a physical fixture.
- Add checklist result entry UI, then enable disposition command buttons only
  when all required FINAL checklist items are complete.
- Later, if inbound/production process QC must remain separate from final
  physical QC, define a canonical process-inspection read model that still
  preserves `ComponentInstance` identity.

### P2

- Reintroduce analytics charts only after they are backed by the same physical
  ComponentInstance summary/read model or a dedicated canonical QC projection.
