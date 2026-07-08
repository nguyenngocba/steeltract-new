# Read Model Effectiveness Report

Date: 2026-07-07

Scope: EPIC 103 – Runtime Analytics Foundation.

## Goal

Measure whether SteelTrack read models and caches are actually reducing live database aggregation.

## Current Signals

Tracked:

* cache hits
* read model hits
* fallback query signals
* snapshot miss signals

Currently instrumented:

* `CacheService.get()` records cache hits.
* `DashboardInventoryReadModelService.getSnapshot()` records read-model hits when the in-memory snapshot is reused.

Foundation methods exist for future:

* `recordReadModelFallback()`
* `recordSnapshotMiss()`

## Effectiveness Formula

Current hit rate:

```text
(cache hits + read model hits)
/
(cache hits + read model hits + query count + fallback queries + snapshot misses)
```

If hit rate is low after enough traffic:

* runtime analytics emits a warning
* recommendation engine suggests more snapshot/read-model coverage

## Output

Available in:

* `/performance/metrics`
  * `analytics.windows['5m'].readModelEffectiveness`
  * `analytics.windows['1h'].readModelEffectiveness`
  * `analytics.windows['24h'].readModelEffectiveness`

## Known Limitation

This is a reuse signal, not a full cache ROI model.

Future persisted snapshots should record:

* snapshot generatedAt
* snapshot staleness
* live fallback count
* rebuild duration
* rebuild failure count

