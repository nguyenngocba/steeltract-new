# Projects Architecture Freeze v1.0

Date: 2026-07-08

## Result

Status: APPROVED

Projects is now an Architecture Freeze v1.0 module for the current SteelTrack Core Platform baseline.

## Compliance Checklist

Repository: PASS

* `ProjectsService` does not inject `PrismaService`.
* Project command and read-model source queries route through `ProjectsRepository`.
* Snapshot persistence routes through `ProjectSnapshotRepository`.

Snapshot: PASS

* Project Dashboard uses persisted `ProjectDashboardSnapshot`.
* Project Detail uses persisted `ProjectDetailSnapshot` by project and tab.
* Missing or stale snapshots fall back safely to repository-backed read models.
* Detail snapshots are intentionally scoped to reusable execution summaries: `overview`, `materials`, `components`, `progress`, `command`, `site`, and `costs`.
* Non-summary tabs such as `documents` and `logs` continue to use repository-backed read models instead of becoming one-off screen snapshots.

Read Model: PASS

* `GET /projects/runtime` remains dashboard/read-model compatible.
* `GET /projects/:id/detail/:tab` no longer needs runtime dashboard slicing for the happy path.
* Tab fallback queries remain segmented through `ProjectsRepository.findProjectDetailSources()`.

Event/Outbox: PASS

* Project mutations publish persistent `project.*` events.
* Event consumer maps project task, schedule, material, cost, and inspection changes into snapshot update jobs.

Background Engine: PASS

* Snapshot updates are queued through `SnapshotUpdateDispatcher`.
* `SnapshotWriterService` rebuilds dashboard and detail snapshots outside the request transaction.
* Tab-scoped jobs rebuild only the affected Project Detail tab when possible.
* Incremental policy avoids full Project rebuilds for tab-local changes whenever the event target can be resolved.

Runtime Metrics: PASS

* Runtime metrics include Project dashboard snapshot hits/misses.
* Runtime metrics include Project Detail snapshot hits/fallbacks, tab group hits, age, and lag.

Operations Center: PASS

* Operations Center exposes Project repository, read model, snapshot, event, job, and runtime health.
* Project Detail snapshot health includes freshness, stale count, parity warnings, hits, fallbacks, age, and lag.

Snapshot Parity: PASS

* `SnapshotValidatorService.validateProjectDetails()` compares persisted Project Detail snapshots with repository-backed read models per tab.
* Mismatches are warnings, not silent overwrites.

## Architecture Freeze Rule

New modules should inherit this pattern:

`Controller -> Service -> Repository -> Prisma`

`Mutation -> Persistent Outbox -> Background Job -> Snapshot Writer`

`Read -> Snapshot Reader -> Repository Read Model fallback`

`Runtime Metrics + Operations Center Health`

## Remaining Non-Blocking Follow-Up

* Capture parity samples after real operator activity.
* Add long-term persisted runtime metrics if multi-instance Operations Center history becomes required.
* Keep Project UI unchanged while future feature work builds on the frozen backend architecture.
* If `documents` or `logs` later need enterprise-scale optimization, design a shared attachment/activity snapshot model instead of a Project-screen-specific snapshot.
