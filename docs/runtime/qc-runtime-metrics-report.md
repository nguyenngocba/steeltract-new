# EPIC154 - QC Runtime Metrics Report

## Result

QC now reuses `PerformanceMetricsService`; no QC-specific metrics framework was introduced.

| Metric | Recording point | Status |
| --- | --- | --- |
| `qcSnapshotHit` | `SnapshotReaderService` after a persisted QC snapshot is found | PASS |
| `qcSnapshotMiss` | `SnapshotReaderService` when no persisted QC snapshot is found | PASS |
| `qcSnapshotAge` | persisted snapshot `updatedAt` compared with read time | PASS |
| `qcSnapshotLag` | persisted snapshot `updatedAt` compared with read time | PASS |
| `qcFallbackCount` | `QcSnapshotReadService` before repository fallback | PASS |
| `qcReadModelHit` | QC snapshot success and live read-model reads | PASS |

The counters use the existing process-local 24-hour sliding window. They reset when the API process restarts, matching Inventory, Production, and Components behavior.

## Boundaries

- No read strategy or business calculation changed.
- No schema, migration, feature semantics, UI, or API contract changed.
- Workspace reads remain repository live read models under ADR011.

## Verification

Focused Jest coverage validates all six metric outputs and the snapshot hit/fallback paths.

