# Production Core Platform Compliance Audit

Date: 2026-07-08

Scope: EPIC111. This is an audit only. No Production code, API, UI, workflow, Prisma schema, migration, commit, or staging operation was performed.

## Executive Summary

Production has a useful manufacturing foundation, but it is not yet ready to be treated as a full enterprise MES foundation.

Estimated compliance:

```text
Production: 52%
```

Production already has BOM, production orders, stages, tasks, work centers, machines, schedules, logs, reservations, material issues, ledger, consumption, costing, production warehouse views, and execution board UI. However, repository coverage is partial, snapshot/read-model coverage is limited, background/event usage is not consistent, and several MES-critical domain concepts remain absent or not canonical: shifts, operations, production lines, immutable stage history, runtime/downtime, OEE, operator/machine execution, capacity planning, rework, and labor/machine costing.

## Evidence Reviewed

Backend:

- `apps/backend-api/src/modules/production/production.module.ts`
- `apps/backend-api/src/modules/production/production.controller.ts`
- `apps/backend-api/src/modules/production/repositories/production.repository.ts`
- `apps/backend-api/src/modules/production/services/production.service.ts`
- `apps/backend-api/src/modules/production/services/bom.service.ts`
- `apps/backend-api/src/modules/production/services/material-issue.service.ts`
- `apps/backend-api/src/modules/production/services/production-consumption.service.ts`
- `apps/backend-api/src/modules/production/services/production-material-ledger.service.ts`
- `apps/backend-api/src/modules/production/services/production-reservation.service.ts`
- `apps/backend-api/src/modules/production/services/workorder.service.ts`
- `apps/backend-api/prisma/schema.prisma`

Frontend:

- `apps/frontend/src/modules/production/config/production-tabs.ts`
- `apps/frontend/src/modules/production/pages/*`
- `apps/frontend/src/modules/production/components/*`
- `apps/frontend/src/app/router/AppRouter.tsx`

Prior docs:

- `docs/ai-state/modules/production.md`
- `docs/ai-state/audits/mes-data-audit.md`
- `docs/audit/enterprise-query-audit.md`
- `docs/audit/enterprise-index-audit.md`
- `docs/runtime/snapshot-cutover-report.md`

## Domain Coverage

| Domain Area | Current State | Audit Result |
| --- | --- | --- |
| Production Order | `ProductionOrder` exists with status, stage code, planned/actual dates, component/BOM links. | Partial-ready. Good foundation. |
| Work Order | Separate `WorkOrder` model and `WorkOrderService` still exist. | Debt. Overlaps conceptually with `ProductionOrder` and creates ambiguity. |
| BOM / BOM Item | `BOM`, `BOMItem`, `BOMRoutingStep` exist. | Good. Routing steps are still template-like, not execution-grade operations. |
| Routing | `BOMRoutingStep`, `ProductionStage`, `ProductionTask` exist. | Partial. Missing canonical operation model and immutable transition history. |
| Work Center | `WorkCenter` exists with capacity per day. | Partial. Needs calendars, shifts, capacity buckets, and queue model. |
| Machine | `Machine` exists with status/utilization. | Partial. Needs runtime events, downtime, maintenance linkage, and OEE. |
| Shift | No first-class Shift model found. | Missing. |
| Operation | No first-class production operation model separate from stage/task. | Missing/partial. |
| Production Line | No first-class production line model found. | Missing. |
| Capacity | WorkCenter capacity and schedule capacity fields exist. | Partial. Needs finite capacity scheduling and calendars. |
| Material Consumption | `ProductionMaterialConsumption` exists. | Good for materials. |
| Component Consumption | Component production/staging exists, but no canonical component consumption/install-in-production model. | Partial. |
| Rework | No first-class rework workflow found. | Missing. |
| Scrap | Material scrap quantity exists in consumption. | Partial. Needs rework/scrap cause, QC linkage, and valuation. |
| Downtime | No first-class downtime model found. | Missing. |
| OEE | No canonical OEE model or calculation source found. | Missing. |

## Repository Compliance

Status: Partial.

Strengths:

- `ProductionRepository` exists.
- `ProductionService` delegates some production order, work center, machine, schedule, stage/task/log paths to the repository.
- Repository has transaction helpers and core aggregate queries.

Gaps:

- `BOMService`, `MaterialIssueService`, `ProductionConsumptionService`, `ProductionMaterialLedgerService`, `ProductionReservationService`, and `WorkOrderService` still inject and call `PrismaService` directly.
- `ProductionService` still directly calls Prisma for QC checks, Yard staging, component creation/update, production logs, and production order updates.
- Production repository does not own all aggregate boundaries.

Recommendation:

1. Define Production aggregate boundaries:
   - ProductionOrder aggregate;
   - BOM aggregate;
   - Reservation/Issue/Consumption aggregate;
   - Shopfloor execution aggregate;
   - WorkCenter/Machine aggregate.
2. Wrap current Prisma calls in repositories before changing behavior.
3. Retire or clarify the legacy `WorkOrder` model/service relationship to `ProductionOrder`.

## Runtime Metrics Compliance

Status: Strong at global platform level, medium at Production-specific level.

Strengths:

- Production APIs are covered by global runtime metrics and Prisma query profiler.
- Runtime Analytics can rank slow endpoints and query counts.

Gaps:

- There is no Production-specific performance score broken down by workspace:
  - orders;
  - BOM;
  - reservations;
  - material ledger;
  - material issues;
  - consumptions;
  - warehouse;
  - execution board.
- There is no Production-specific query budget classification for shopfloor/event-heavy endpoints.

Recommendation:

- Tag Production endpoints/workspaces for Operations Center ranking.
- Add query budgets for production execution/detail/readiness paths before adding more MES screens.

## Snapshot Compliance

Status: Weak.

Current snapshot platform targets:

- Inventory dashboard snapshot.
- Project dashboard snapshot.
- Dispatch dashboard snapshot.

Production is not currently a first-class persisted dashboard snapshot target.

Gaps:

- Production cockpit still appears runtime/read-model driven rather than persisted snapshot driven.
- Material readiness, production warehouse shortage, execution board counts, stage bottlenecks, material issue KPIs, and costing summaries are not persisted Production snapshots.

Recommended snapshot models:

1. `ProductionDashboardSnapshot`
2. `ProductionOrderReadinessSnapshot`
3. `ProductionWarehouseSnapshot`
4. `ProductionStageQueueSnapshot`
5. `ProductionMaterialLedgerDailySnapshot`
6. `WorkCenterCapacitySnapshot`
7. `MachineUtilizationSnapshot`

## Background Engine Compliance

Status: Weak-Medium.

Strengths:

- Background engine exists globally and can rebuild snapshots.
- Costing recalculation after production completion is isolated so failures do not rollback production completion.

Gaps:

- Reservation allocation, material issue, consumption, return, ledger writes, costing refresh, readiness refresh, and execution analytics are mostly synchronous.
- There is no Production background snapshot update dispatcher integration per domain event.

Recommendation:

- Keep transactional correctness synchronous for stock/ledger mutations.
- Move these side effects to background:
  - costing recalculation;
  - readiness snapshot refresh;
  - production dashboard snapshot refresh;
  - bottleneck analytics;
  - notification generation;
  - Operations Center health rollups.

## Event Compliance

Status: Partial.

Strengths:

- `EventsModule` is imported by `ProductionModule`.
- `ProductionService` injects `EventBusService`.

Gaps:

- Production lifecycle events are not consistently published through a canonical event contract.
- Cross-module calls to Inventory, Components, Yard, and QC are direct service/table interactions in several workflows.

Recommended event contract:

- `production.order.created`
- `production.order.started`
- `production.stage.completed`
- `production.material.reserved`
- `production.material.issued`
- `production.material.consumed`
- `production.material.returned`
- `production.material.scrapped`
- `production.component.ready`
- `production.component.staged_to_yard`
- `production.costing.recalculated`
- `production.machine.status_changed`
- `production.work_center.capacity_changed`

Events should be published after committed writes via outbox where consistency matters.

## Read Model And Query Compliance

Status: Medium-low.

Known risks:

- Costing and readiness derive across BOM, material issues, consumptions, components, and inventory valuations.
- Production cockpit pages use existing API payloads and frontend calculations for some analytics.
- Execution board uses fallback mapping when canonical shopfloor stage model is not available.

Recommendation:

- Introduce persisted read models before adding more shopfloor screens.
- Keep canonical operational tables normalized; derive cockpit/readiness/cost snapshots in background.
- Split large Production page payloads into tab-native APIs only where not already segmented.

## Operations Center Compliance

Status: Weak-Medium.

Available:

- Production endpoints are visible through global API/runtime ranking.
- Background jobs, outbox, snapshot, cache, database, and storage are visible globally.

Missing Production-specific signals:

- stuck/running production orders;
- delayed orders;
- material issue failures;
- reservation allocation failures;
- stale readiness snapshots;
- costing recalculation failures;
- machine/workcenter health;
- queue length by stage;
- scrap/rework/downtime events;
- ledger imbalance warnings.

Recommendation:

- Add a Production section to Operations Center after Production snapshots/events exist.

## UX Compliance

Status: Medium-high.

Strengths:

- Production has been visually aligned to Inventory/Components cockpit patterns.
- Routes exist for core tabs: overview, orders, BOM, warehouse, execution, reservations, material ledger, material issues, consumptions, logs.
- Router maps `/production/planning`, `/production/incidents`, and `/production/reports` to `ProductionPage`.

Gaps:

- Some configured tabs are placeholders or not backed by full workflows (`planning`, `incidents`, `reports`).
- Production frontend is compact by file count compared with Inventory, but much logic is concentrated in large page/workspace components.
- Execution board still has fallback stage mapping because backend does not expose canonical shopfloor queues.

Recommendation:

- Keep UI stable.
- Add backend/domain foundations before more UX surface area.

## Workflow Compliance

Status: Medium.

Strong workflows:

- BOM CRUD/clone/archive.
- Production order creation/start/stage completion.
- Reservations.
- Material issue from reservation.
- Consume/scrap/return balance equation.
- Production material ledger events for reserve/release/issue/return/consume.
- Component costing and automatic recalculation.
- QC-gated yard staging.

Workflow gaps:

- Manual approval for material issue/return/consumption is incomplete.
- No canonical shopfloor actual operation log with operator, machine, actual start/end, downtime, and rework.
- No shift calendars.
- No finite capacity scheduling.
- No OEE or downtime workflow.
- No complete document/attachment workflow for production issue/return/QC release.
- Ledger adjust events still noted as remaining work.

## Scalability Readiness

Production is not yet ready for tens of millions of production events without additional domain and read-model work.

Risk areas:

- `production_logs`
- `production_material_ledgers`
- `production_material_issues`
- `production_material_consumptions`
- `production_orders`
- future shopfloor event tables
- activity logs

Needed before large-scale MES:

1. Immutable production event log.
2. WorkCenter/Machine/Shift/Operation domain.
3. Persisted production snapshots.
4. Background snapshot and costing workers.
5. Event/outbox publishing for lifecycle transitions.
6. Read models for execution board, capacity, material readiness, and OEE.

## Required Before Further Major Production Features

Critical:

1. Resolve ProductionOrder vs WorkOrder domain ambiguity.
2. Wrap direct Prisma services behind repositories.
3. Define canonical Production lifecycle events and publish them through outbox.
4. Add production dashboard/readiness/stage queue snapshots.

High:

1. Add Shift, Operation, Production Line, Downtime, and OEE domain plan before building deeper MES UI.
2. Move costing/readiness/bottleneck analytics to background read models.
3. Add Operations Center Production health signals.

Medium:

1. Harden approval/document workflows for issue/return/consume/scrap.
2. Add immutable stage transition history.
3. Extract repeated frontend table/drawer logic only after backend domains stabilize.

