# EPIC115 - Project Read Model Report

Date: 2026-07-08

## Scope

Reviewed Project Dashboard, Detail, Planning, Progress, Allocation, and Timeline read paths.

## Implementation

Existing read-model boundaries remain API compatible:

- `GET /projects/runtime`
- `GET /projects/:id/detail/:tab`
- Project WBS reads

The service now records Project-specific read-model metrics:

- `projectReadModelHit`
- `projectFallbackCount`

Detail tabs continue to use `ProjectsRepository.findProjectDetailSources(projectId, tab)` so tab reads do not load the full runtime payload by default.

## Snapshot Interaction

Project dashboard runtime uses the Core Platform `DashboardReaderService` strategy:

```text
DashboardReader
  -> SnapshotReaderStrategy
  -> RuntimeAggregateStrategy fallback
```

`ProjectDashboardSnapshot` is used first when enabled, present, fresh, and parity-safe.

## Limitation

Project detail tab payloads are not yet persisted as tab-specific snapshot payloads. They remain repository-backed read models with runtime metrics. This keeps the public API unchanged and avoids inventing a new snapshot table without an explicit migration sprint.

