# Production Snapshot Foundation Report

## Status

**APPROVED**

EPIC132 adds the Production persisted snapshot foundation using the same Core Platform pattern already used by Inventory, Projects, and Logistics:

```text
Production Repository / domain event
  -> Persistent Outbox / Event Consumer
  -> SnapshotUpdateDispatcher
  -> Background Job
  -> SnapshotWriterService
  -> ProductionSnapshotRepository
  -> persisted PostgreSQL snapshot tables
```

No UI, API contract, Inventory code, Production workflow, Operations Center UI, or business logic was changed.

## Persisted Models

Added additive Prisma models and migration `20260711130000_production_snapshot_foundation`:

* `ProductionDashboardSnapshot`
* `ProductionOrderSnapshot`
* `WorkCenterSnapshot`

The migration creates:

* `production_dashboard_snapshots`
* `production_order_snapshots`
* `work_center_snapshots`

The snapshots are summary/domain snapshots, not screen-specific copies.

## Architecture Alignment

The implementation follows the frozen Inventory pattern:

* Snapshot persistence is isolated in `ProductionSnapshotRepository`.
* Snapshot writes run through `SnapshotWriterService`.
* Snapshot rebuilds run through `SnapshotRebuilder`.
* Snapshot updates are scheduled by `SnapshotUpdateDispatcher`.
* Existing `production.*` domain events are mapped by `EventConsumerService`.
* `USE_PRODUCTION_SNAPSHOT` is registered in `SnapshotFeatureFlagService`.

## Read Strategy

ADR011 remains intact:

* Production workspaces continue to use Repository Live Read Models.
* Production dashboard/cockpit/analytics surfaces are now prepared to read persisted snapshots.
* No Production Orders, Reservations, Issues, Ledger, Warehouse, or Execution Board workspace was moved to snapshots.

## Acceptance Checklist

* Snapshot Repository: PASS
* Snapshot Reader: PASS
* Snapshot Writer: PASS
* Background Registration: PASS
* Feature Registration: PASS
* Read Strategy: PASS

## Remaining Work

* Cut over Production dashboard endpoints to `DashboardReader` in a later sprint.
* Add Production-specific Runtime Metrics counters in the Runtime Metrics sprint.
* Expose Production Platform Health in Operations Center in the Operations Center sprint.
* Expand Production event coverage after EPIC133 standardizes all Production event contracts.
