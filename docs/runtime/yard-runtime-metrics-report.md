# Yard Runtime Metrics Report

## Status

EPIC164: **PASS**.

`PerformanceMetricsService` now exposes Yard-specific counters in the existing
24-hour in-memory runtime window:

- `yardSnapshotHit`
- `yardSnapshotMiss`
- `yardReadModelHit`
- `yardFallbackCount`
- `yardAverageAgeSeconds`
- `yardAverageLagMs`

Snapshot repository reads record hit/miss plus age and lag. The ADR011 live
workspace records read-model hits. Snapshot-first dashboard/workspace-summary
fallback records a fallback and retains the existing background rebuild request.
All module counters also contribute to the existing global snapshot/read-model
counters. No new metrics service or read behavior was introduced.

## Validation

Focused Jest coverage records one sample of each metric and verifies the
published runtime snapshot. Metrics remain process-local and reset on process
restart, matching the existing Runtime Platform contract.
