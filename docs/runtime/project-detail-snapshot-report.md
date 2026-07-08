# Project Detail Snapshot Report

Date: 2026-07-08

## Scope

EPIC116 completes persisted snapshots for `GET /projects/:id/detail/:tab` without changing the API contract, UI, workflow, or business logic.

## Persisted Model

New table:

`project_detail_snapshots`

Fields:

* `projectId`
* `tab`
* `payload`
* `sourceWatermark`
* `parityStatus`
* `warningCount`
* `stale`
* `refreshReason`
* `generatedAt`
* `updatedAt`

Uniqueness:

* `projectId + tab`

Indexed dimensions:

* `projectId`
* `tab`
* `stale`
* `updatedAt`

## Covered Tabs

The snapshot writer supports these Project Detail tab payloads:

* `overview`
* `materials`
* `components`
* `progress`
* `command`
* `site`
* `costs`
* `documents`
* `logs`

## Snapshot Payload Groups

The snapshot payloads preserve the existing frontend response shape and split heavy project detail data by tab:

* Progress and planning: WBS tree, dependency scheduling, health signals.
* Timeline: logs, WBS state, return request activity.
* Resources and allocations: materials, components, return requests.
* Cost control: financial summary plus WBS cost traceability.
* Documents: attachment metadata.
* Project health: health score, warnings, suggested actions.

## Writer Path

Project changes publish persistent events and schedule snapshot jobs:

`Project mutation -> Outbox/Event -> SnapshotUpdateDispatcher -> Background Job -> SnapshotWriterService -> ProjectSnapshotRepository.upsertDetail()`

The writer updates Project Dashboard snapshots and Project Detail snapshots in the same background snapshot pass. For tab-scoped requests such as `ProjectDetailSnapshot:materials`, only that tab payload is rebuilt for the project.

## Repository Boundary

Project detail snapshots are accessed through `ProjectSnapshotRepository`.

No controller reads Prisma directly for Project Detail. `ProjectsService.detailTab()` now delegates snapshot access to `SnapshotReaderService` and falls back to `ProjectsRepository.findProjectDetailSources()`.

## Migration

Migration:

`apps/backend-api/prisma/migrations/20260708143000_project_detail_snapshots/migration.sql`

Verification:

`prisma migrate deploy` applied successfully.
