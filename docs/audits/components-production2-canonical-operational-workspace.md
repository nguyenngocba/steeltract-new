# COMPONENTS.PRODUCTION.2 - Canonical Production Workspace & Read Model

Date: 2026-08-03

## AUDIT

Reviewed:

- `apps/frontend/src/modules/components/pages/tabs/ComponentsProductionPage.tsx`
- `apps/frontend/src/modules/components/hooks/queries/useComponents.ts`
- `apps/frontend/src/modules/production/api/production.api.ts`
- `apps/backend-api/src/modules/production/repositories/production.repository.ts`
- `apps/backend-api/src/modules/production/repositories/production-cockpit-read-model.spec.ts`

Current pre-fix UI used the legacy production order list through `/production`
and then performed search, pagination, KPI counts and table projection in the
frontend. It displayed physical progress from `ProductionOrder.quantity`,
legacy component title fields and `metadata` values such as workshop/yard
destination.

## ROOT CAUSE

The Components Production tab was visually complete but semantically legacy.
It treated `ProductionOrder` rows as the whole production workspace and did not
bind to the canonical production read model that includes requirement,
component definition, physical instances, execution, QC and material readiness.

This caused three unsafe UI assumptions:

- production quantity was presented as physical progress;
- component inventory/QC readiness was not derived from `ComponentInstance`;
- detail surfaces lacked canonical tabs for materials, instances, execution,
  QC and authoritative history.

## SOURCE OF TRUTH

Canonical source now used by the workspace:

- `ProductionOrder`
- `ProjectComponentRequirement`
- `Component` engineering definition
- `ComponentRevision`
- `ComponentBomDefinition`
- `ComponentInstance`
- `ComponentInstanceExecution`
- `QcInspection`
- `NonConformanceReport`
- `ProductionMaterialReservation`
- `ProductionMaterialIssue`
- `ProductionLog`

Explicitly avoided:

- `Component.status`
- `STOCK` / `READY` as physical production state
- description JSON quantity
- `COUNT(Component)` as production/finished goods quantity
- frontend aggregation over `/production` list
- production material stock derived from transaction remarks

## READ MODEL

`ProductionRepository.cockpitReadModel()` now enriches each row with a
`canonical` payload:

- production order identity and update timestamp
- project
- project component requirement
- component definition
- revision
- BOM definition and legacy BOM reference
- planned quantity
- allocated quantity
- component instance counts and rows
- execution summary and rows
- QC summary and rows
- material readiness
- reservation and issue details

Summary now exposes canonical physical counts:

- `componentInstances`
- `waitingQc`
- `qcPassed`

## API CHANGES

No new route was added.

Existing route reused:

- `GET /production/read-model/cockpit`

Frontend contract was extended to type the existing/enriched response:

- `ProductionOrder.canonical`
- `ProductionCockpitReadModel.summary.componentInstances`
- `ProductionCockpitReadModel.summary.waitingQc`
- `ProductionCockpitReadModel.summary.qcPassed`
- `ProductionOrder.componentId`
- `ProductionOrder.bomId`

No backend schema, lifecycle, Finished Goods, Yard or Logistics contract was
changed.

## FRONTEND CHANGES

`ComponentsProductionPage` now uses `useComponentsProductionWorkspace()` and
binds to the production cockpit read model.

Main table columns now represent canonical operational meaning:

- Production Order
- Component
- Project
- Planned Quantity
- Physical Instances
- QC
- Material
- Status
- Action

The `Xem tất cả` workspace now uses `ModuleDetailDrawer` in center placement
with a 96vw / 1720px / 88vh bounded shell and canonical columns:

- Order
- Requirement
- Project
- Component
- Revision
- BOM
- Planned Qty
- Instances
- Execution
- QC
- Material
- Updated
- Actions

Record detail now uses a right-side `ModuleDetailDrawer` with tabs:

- Overview
- Materials
- Instances
- Execution
- QC
- History

Material tab displays production reservation/issue data only. Instance tab uses
`ComponentInstance`. Execution tab uses `ComponentInstanceExecution`. QC tab
uses `QcInspection` and NCR rows tied to physical instances. History uses
Production logs where available and otherwise renders a controlled empty state.

## RUNTIME EVIDENCE

Command evidence:

- `pnpm -C apps/backend-api exec prisma validate`: PASS
- `pnpm -C apps/backend-api exec prisma generate`: PASS
- `pnpm -C apps/backend-api exec prisma migrate status`: PASS, database schema
  is up to date
- `pnpm -C apps/backend-api test -- production-cockpit-read-model.spec.ts`:
  PASS
- `pnpm -C apps/backend-api test`: PASS, 89 suites / 291 tests
- `pnpm -C apps/frontend test`: PASS, 2 files / 4 tests
- `pnpm -C apps/backend-api build`: PASS
- `pnpm -C apps/frontend build`: PASS
- `git diff --check`: PASS

Frontend build produced the existing Vite chunk-size warning only.

## VERIFIED

- Components Production no longer depends on the legacy `/production` list for
  workspace KPIs/table data.
- Search, status filtering and pagination are delegated to the production
  cockpit read-model endpoint.
- Backend read model includes canonical requirement, component definition,
  component instance, execution, QC and material readiness fields.
- Targeted backend test covers canonical physical instance, waiting QC, QC pass,
  execution and project enrichment.
- The table and drawers use shared module/cockpit/Inventory visual primitives.

## NOT VERIFIED

- Browser screenshot/runtime interaction certification was not run in this
  pass.
- Live seeded data was not inspected through the browser.
- Material tab currently exposes reservation/issue evidence available on the
  production order read model; a richer Production Warehouse balance drill-down
  remains a later read-model expansion if operators need slot-level stock inside
  this drawer.

## REMAINING GAPS

P0: None identified for this sprint scope.

P1:

- Add browser smoke for opening the Components Production page, `Xem tất cả`
  modal and detail drawer tabs with seeded canonical orders.
- Consider adding server-side sort controls if operators need sortable columns
  beyond the current `updatedAt desc` default.

P2:

- Add richer visual analytics for execution bottlenecks and QC disposition once
  the canonical read model exposes dedicated aggregates.
