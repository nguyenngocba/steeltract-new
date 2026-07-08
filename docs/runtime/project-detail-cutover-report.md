# Project Detail Snapshot Cutover Report

Date: 2026-07-08

## Objective

Cut over `GET /projects/:id/detail/:tab` to prefer persisted Project Detail snapshots while preserving the existing response contract.

## Read Strategy

The endpoint now follows:

1. Normalize requested tab.
2. Load persisted detail snapshot with `SnapshotReaderService.projectDetail(projectId, tab)`.
3. Return snapshot payload if:
   * snapshot exists;
   * snapshot is not marked stale;
   * snapshot age is within `PROJECT_DETAIL_SNAPSHOT_MAX_AGE_SECONDS`, `USE_PROJECT_SNAPSHOT_MAX_AGE_SECONDS`, or `SNAPSHOT_MAX_AGE_SECONDS` fallback.
4. If missing or stale:
   * record project detail fallback metrics;
   * enqueue `ProjectDetailSnapshot:<tab>` update through Background Engine;
   * return the existing repository-backed read model.

## API Compatibility

No response shape changed.

Existing tab payloads remain:

* `overview`: project, materials, components, WBS, financial, health, returns, documents, logs.
* `materials`: project, materials, return requests.
* `components`: project, components.
* `progress`, `command`, `site`: project, WBS, health, documents, logs.
* `costs`: project, financial, WBS.
* `documents`: project, documents.
* `logs`: project, logs, WBS, return requests.

## Fallback Safety

Fallback remains repository-backed and does not read Prisma in the service.

Fallback also schedules a background refresh and does not rebuild snapshots inside the request.

## Feature Controls

Freshness is controlled by environment variables:

* `PROJECT_DETAIL_SNAPSHOT_MAX_AGE_SECONDS`
* `USE_PROJECT_SNAPSHOT_MAX_AGE_SECONDS`
* `SNAPSHOT_MAX_AGE_SECONDS`

Default: `900` seconds.

## Runtime Signals

The cutover records:

* `projectDetailSnapshotHit`
* `planningSnapshotHit`
* `timelineSnapshotHit`
* `allocationSnapshotHit`
* `projectDetailFallback`
* `projectDetailAverageAgeSeconds`
* `projectDetailAverageLagMs`
