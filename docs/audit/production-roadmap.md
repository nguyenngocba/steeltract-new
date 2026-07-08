# Production Core Platform Roadmap

Date: 2026-07-08

Scope: roadmap only. No code changes were made.

## Goal

Raise Production Core Platform compliance from 52% to at least 70% before major MES expansion.

## Sprint PROD-CORE.1 - Domain Boundary Clarification

Objective:

Resolve Production aggregate ambiguity before adding new shopfloor features.

Decisions required:

- Is `WorkOrder` deprecated, or does it represent a separate planning concept?
- Is `ProductionOrder` the canonical execution aggregate?
- Are `ProductionStage` and `ProductionTask` enough for operations, or is a new `ProductionOperation` required?
- How should BOM routing steps become executable operations?

Deliverables:

- Domain decision doc.
- Migration-free compatibility plan.
- List of APIs that should continue using current response shapes.

Success criteria:

- Future MES work has one canonical aggregate map.

## Sprint PROD-CORE.2 - Repository Coverage

Objective:

Move direct Prisma services behind repositories without changing behavior.

Targets:

- BOM aggregate.
- Material reservation aggregate.
- Material issue/return aggregate.
- Consumption/scrap aggregate.
- Material ledger aggregate.
- Production order/stage/task aggregate.
- Work center/machine/schedule aggregate.

Success criteria:

- Production services call repositories for persistence.
- Transaction boundaries are explicit and testable.

## Sprint PROD-CORE.3 - Production Event Contract

Objective:

Publish canonical committed lifecycle events.

Events:

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
- `production.work_center.capacity_changed`
- `production.machine.status_changed`

Success criteria:

- Snapshot/background/Operations Center work does not need direct service coupling.

## Sprint PROD-CORE.4 - Production Snapshot Foundation

Objective:

Create persisted read models for Production cockpit and execution analytics.

Snapshot candidates:

- `ProductionDashboardSnapshot`
- `ProductionOrderReadinessSnapshot`
- `ProductionWarehouseSnapshot`
- `ProductionStageQueueSnapshot`
- `ProductionMaterialLedgerDailySnapshot`
- `WorkCenterCapacitySnapshot`
- `MachineUtilizationSnapshot`

Success criteria:

- Production cockpit can eventually switch to snapshot-first reads with runtime fallback.

## Sprint PROD-CORE.5 - MES Domain Foundation

Objective:

Add missing MES domain concepts only after repository/event/snapshot decisions.

Design targets:

- Shift.
- Operation.
- Production line.
- Operator assignment.
- Machine runtime event.
- Downtime.
- Rework.
- OEE source model.
- Immutable stage transition history.

Rules:

- No UI-first MES expansion until source data is canonical.
- No fake shopfloor metrics.

Success criteria:

- Production can support multi-factory, multi-line, multi-shift execution.

## Sprint PROD-CORE.6 - Background Costing And Readiness

Objective:

Move heavy derived calculations to background read models.

Targets:

- material readiness;
- component costing;
- production order cost;
- stage bottleneck;
- warehouse shortage;
- work center capacity;
- machine utilization.

Success criteria:

- Production list/cockpit/detail endpoints stop recomputing large aggregates at request time.

## Sprint PROD-CORE.7 - Operations Center Production Health

Objective:

Expose Production-specific health signals.

Signals:

- delayed orders;
- waiting material count;
- reservation/issue failures;
- stale readiness snapshots;
- costing failure count;
- ledger imbalance count;
- stage bottleneck queue age;
- machine/workcenter unavailable count;
- dead-letter production events.

Success criteria:

- IT/Operations can see Production platform health in Operations Center.

## Recommended Order

```text
1. PROD-CORE.1 Domain Boundary Clarification
2. PROD-CORE.2 Repository Coverage
3. PROD-CORE.3 Production Event Contract
4. PROD-CORE.4 Production Snapshot Foundation
5. PROD-CORE.5 MES Domain Foundation
6. PROD-CORE.6 Background Costing And Readiness
7. PROD-CORE.7 Operations Center Production Health
```

Rationale:

- Production should not add more UI until canonical domain and event foundations exist.
- Repository coverage reduces risk before snapshots/background workers are introduced.
- MES domain additions should come after existing aggregate boundaries are clear.

