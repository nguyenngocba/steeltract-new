# EPIC115 - Project Snapshot Report

Date: 2026-07-08

## Existing Snapshot

Projects currently use the persisted `ProjectDashboardSnapshot` table.

Covered values:

- progress
- delayedTaskCount
- completedTaskCount
- activeTaskCount
- materialProgress
- componentProgress
- logisticsProgress
- costProgress
- healthScore

## Runtime Cutover

`GET /projects/runtime` prefers persisted dashboard snapshots through `DashboardReaderService`.

Fallback conditions:

- snapshot feature flag disabled
- snapshot missing
- snapshot stale
- snapshot/runtime parity mismatch

Fallback behavior is safe and preserves the existing response shape.

## Background Update

Project mutations now publish persistent `project.*` events and request project snapshot update jobs through `SnapshotUpdateDispatcher`.

Events mapped for snapshot update include:

- `project.created`
- `project.updated`
- `project.deleted`
- `project.task.created`
- `project.task.updated`
- `project.task.deleted`
- `project.component.changed`
- `project.material.changed`
- `project.cost.changed`
- `project.inspection.changed`
- `project.wbs.generated`
- `project.tasks.bulk_updated`
- `project.template.applied`

## Limitation

`ProjectDashboardSnapshot` is a dashboard/runtime summary snapshot, not a full Project Detail snapshot. Project can be considered Core Platform compliant for dashboard/runtime reads, but not an absolute Architecture Freeze until detail-tab snapshot payloads are designed and migrated.

