# EPIC131 - Production Read Model Foundation Report

Date: 2026-07-11
Status: FOUNDATION READY

## ADR011 Position

Production inherits the Inventory rule:

```text
Workspace -> Repository Live Read Model
Dashboard / Cockpit / Analytics -> Persisted Snapshot
```

EPIC131 does not implement snapshots. It prepares the repository layer needed for future live read models.

## Workspace Read Model Candidates

| Workspace | Repository Foundation | Status |
| --- | --- | --- |
| Production Orders | `ProductionRepository`, `ProductionOrderRepository` | READY |
| Work Orders | `WorkOrderRepository` | READY |
| Production BOM | `BomRepository` | READY |
| Routing / Stage / Task | `RoutingRepository`, `ProductionRepository` | READY |
| Work Centers / Machines / Schedules | `WorkCenterRepository`, `ProductionRepository` | READY |
| Reservations | `ProductionReservationRepository` | READY |
| Material Issues | `MaterialIssueRepository` | READY |
| Material Ledger | `ProductionMaterialLedgerRepository` | READY |
| Consumptions | `ProductionConsumptionRepository` | READY |
| Production Warehouse | Production stock bucket helpers in repository layer | PARTIAL READY |

## Dashboard Snapshot Readiness

No snapshot was implemented.

Future snapshot targets remain:

- `ProductionDashboardSnapshot`
- `ProductionOrderSnapshot`
- `WorkCenterSnapshot`

Repository hooks now exist for source reads, but EPIC132/EPIC135 must still add:

- schema/migration;
- snapshot repository;
- reader strategy;
- writer/rebuilder;
- event mapping;
- feature flag;
- runtime counters.

## Server-Side List Requirements For Next Sprint

Before Production is enterprise-ready, these endpoints should return explicit pagination metadata:

- `GET /production`
- `GET /production/boms`
- `GET /production/reservations`
- `GET /production/material-issues`
- `GET /production/material-ledger`
- `GET /production/consumptions`
- `GET /production/logs`

EPIC131 did not change API contracts, so this remains a planned additive compatibility task.

## Result

Read Model Foundation: **PASS**

The repository layer is now suitable for building live workspace read models without bypassing the Core Platform boundary.

