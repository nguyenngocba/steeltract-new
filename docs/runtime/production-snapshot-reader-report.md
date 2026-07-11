# Production Snapshot Reader Report

## Status

**READY**

`SnapshotReaderService` now exposes Production snapshot read methods:

* `productionDashboard(snapshotDate)`
* `productionDashboardHistory(take)`
* `productionOrder(productionOrderId)`
* `productionOrders(productionOrderId?)`
* `productionWorkCenter(workCenterId)`
* `productionWorkCenters(workCenterId?)`

These methods read only through `ProductionSnapshotRepository`.

## Freshness And Metrics

Reader methods reuse the existing generic snapshot hit/miss/lag recording path.

Production-specific metrics were intentionally not added in EPIC132 because the sprint rules said not to change Runtime Metrics. The generic counters still allow basic hit/miss/lag observation.

## Fallback Strategy

The reader layer is ready for:

```text
Snapshot
  -> fallback
  -> Repository Read Model
```

The actual Production dashboard API cutover is intentionally deferred so EPIC132 does not change API behavior.

## Workspace Safety

No operator workspace uses the new reader. Production workspace pages remain live-read surfaces under ADR011.
