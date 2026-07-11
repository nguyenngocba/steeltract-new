# Production Runtime Metrics Report

## Status

**APPROVED**

EPIC133 adds Production-specific runtime counters to the existing `PerformanceMetricsService`.

## Metrics Added

Production now records:

* `productionSnapshotHit`
* `productionSnapshotMiss`
* `productionAverageLagMs`
* `productionAverageAgeSeconds`
* `productionFallbackCount`
* `productionReadModelHit`

These metrics are exposed through the existing runtime analytics windows:

* 5 minutes
* 1 hour
* 24 hours

No new Metrics service or runtime framework was created.

## Recording Points

Production snapshot reads are recorded by `SnapshotReaderService`:

* `productionDashboard()`
* `productionDashboardHistory()`
* `productionOrder()`
* `productionOrders()`
* `productionWorkCenter()`
* `productionWorkCenters()`

Production dashboard fallback/read-model use is recorded by `ProductionService.metrics()`.

## Snapshot Analytics

Runtime snapshot analytics now has Production-specific hit/miss/fallback/age/lag signals. Generic snapshot rebuild and queue metrics continue to be shared across all modules.

## Non-Goals

EPIC133 does not add a separate Production metrics backend, UI panel, or workflow-specific metric stream.
