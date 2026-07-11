# EPIC130 - Production Core Foundation Report

Date: 2026-07-11
Status: FOUNDATION AUDIT COMPLETE - CORE COMPLIANCE NOT YET APPROVED

## Scope

EPIC130 audited the current Production module against the frozen Inventory Core Platform pattern and ADR011:

```text
Workspace -> Repository Live Read Model -> Strong read-after-write
Dashboard / Cockpit / Analytics -> Persisted Snapshot -> Eventual consistency
```

No Inventory code, Core Platform code, Operations Center code, workflow, or API contract was changed.

## Architecture Chain

| Layer | Current Evidence | Status |
| --- | --- | --- |
| Controller | `ProductionController` delegates to services and uses Zod validation pipes. | PARTIAL PASS |
| Service | `ProductionService` uses `ProductionRepository` for many order paths, but also injects `PrismaService` directly. | PARTIAL |
| Repository | `ProductionRepository` exists for orders, stages, tasks, logs, machines, schedules, and metrics. | PARTIAL |
| Outbox | Main production start/stage/complete events use `EventBusService` with `persistToOutbox: true`. | PARTIAL |
| Background | Core Background Engine exists, but no Production snapshot job mapping exists. | MISSING |
| Snapshot | No `ProductionDashboardSnapshot`, `ProductionOrderSnapshot`, or `WorkCenterSnapshot` Prisma model was found. | MISSING |
| Read Model | Current reads are mostly live service/repository reads plus frontend derivations. | PARTIAL |
| Runtime Metrics | Global HTTP/Prisma metrics apply, but no Production-specific snapshot/read-model counters exist. | PARTIAL |
| Operations Center | Operations Center exposes Inventory, Projects, and Dispatch snapshot health, not Production Platform Health. | MISSING |

## Current Strengths

- Controller validation is already stronger than many legacy modules: request bodies use `ZodValidationPipe`.
- Production Orders have a repository entry point through `ProductionRepository`.
- Production mutations emit several persistent domain events:
  - `production.started`;
  - `production.stage.completed`;
  - `production.delayed`;
  - `production.completed`;
  - `production.staged.to-yard`.
- Workspaces currently use live runtime endpoints rather than persisted snapshots, so no ADR011 workspace-snapshot violation was found.
- Existing UI query keys are scoped by Production families and mutation success invalidates `['production']`.

## Core Gaps

### Repository Boundary

Repository coverage is not Inventory-level yet.

Examples:

- `ProductionService` injects `PrismaService` directly at `apps/backend-api/src/modules/production/services/production.service.ts:85`.
- `ProductionService.stageToYard()` queries QC, Yard slot, Yard placements, Component, ComponentTimeline, ProductionLog, and ProductionOrder directly through Prisma at lines 486-603.
- `ProductionService.createComponentFromProductionOrder()` starts from a direct `productionOrder.findUnique()` at line 634.
- `MaterialIssueService` injects `PrismaService` directly at `apps/backend-api/src/modules/production/services/material-issue.service.ts:25` and directly mutates issue, stock, item quantity, and warehouse lookup state.
- `ProductionReservationService` injects `PrismaService` directly at `apps/backend-api/src/modules/production/services/production-reservation.service.ts:77` and owns reservation, bucket, and stock query composition.
- `BOMService`, `ProductionConsumptionService`, `ProductionMaterialLedgerService`, and `WorkOrderService` also inject Prisma directly.

### Snapshot Foundation

The module documentation mentions:

- `ProductionDashboardSnapshot`;
- `ProductionOrderSnapshot`;
- `WorkCenterSnapshot`.

However, no matching Prisma models or backend snapshot repositories were found. `SnapshotFeatureFlagService` currently supports only `inventory`, `projects`, and `logistics`, so Production cannot use the platform `DashboardReaderService` yet.

### Event / Background Flow

Production domain events exist, but `EventConsumerService` does not map any `production.*` event to a snapshot update request. This means Production events are audit/outbox-capable but not snapshot-update-capable.

### Operations Center

Operations Center currently builds platform health for Inventory and Projects and snapshot health for Inventory, Projects, and Dispatch. Production Platform Health is not registered yet.

## Production Pilot Decision

No Production code rollout was performed in EPIC130.

Reason:

- No workspace was found reading a persisted Production snapshot, so there is no ADR011 violation requiring immediate code remediation.
- Fixing repository coverage, persisted snapshots, event-to-snapshot mapping, and Operations Center Production Health is larger than a safe pilot patch and should be handled as EPIC130 follow-up implementation sprints.

## Compliance Result

| Area | Score | Result |
| --- | ---: | --- |
| Controller validation | 80% | PASS WITH GAPS |
| Repository boundary | 35% | BLOCKED |
| Workspace live-read compliance | 80% | PASS WITH SCALABILITY GAPS |
| Dashboard snapshot readiness | 0% | BLOCKED |
| Event/outbox foundation | 45% | PARTIAL |
| Background snapshot integration | 0% | BLOCKED |
| Runtime metrics readiness | 45% | PARTIAL |
| Operations Center integration | 0% | BLOCKED |

Overall: **Production Core Platform Foundation is documented, but Production is not yet Core Platform compliant.**

## Recommended Next Sprints

1. **EPIC130A - Production Repository Boundary**
   Move all Production DB access from service classes into `ProductionRepository` or focused Production repositories without changing API behavior.

2. **EPIC130B - Production Live Read Models**
   Create explicit repository-backed read-model methods for Production Orders, BOMs, Reservations, Material Issues, Ledger, Consumptions, Logs, and Warehouse views.

3. **EPIC135 - Production Dashboard Snapshot**
   Add persisted dashboard snapshots, feature flags, reader strategy, writer/rebuilder, and event mappings.

4. **EPIC130C - Production Operations Center Health**
   Expose repository/read-model/event/outbox/job/snapshot health for Production through existing Operations Center contracts.

