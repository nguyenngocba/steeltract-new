# Production Runtime Readiness Report

## Status

**APPROVED**

Production is now runtime-ready for dashboard snapshot-first reads.

## Dashboard Readiness

`ProductionService.metrics()` now uses the existing `DashboardReaderService` strategy:

```text
ProductionDashboardSnapshot
  -> Repository runtime aggregate fallback
```

The response shape for `/production/metrics` remains unchanged.

## Feature Flag

`USE_PRODUCTION_SNAPSHOT` is honored by the shared `SnapshotFeatureFlagService`.

When disabled or when snapshots are missing/stale, Production falls back to the existing repository aggregate and schedules a background snapshot update.

## ADR011

Production workspaces remain on Repository Live Read Models.

Only the cockpit/dashboard metrics endpoint is prepared for persisted snapshot reads.

## Runtime Signals

Production records:

* snapshot hit/miss;
* snapshot age;
* snapshot lag;
* fallback count;
* read-model hit.

## Remaining Work

* Broaden Production event contracts for material reservation, issue, return, consumption, scrap, and rework.
* Validate production snapshot parity with real production activity after the migration is applied.
