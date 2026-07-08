# EPIC105 / Sprint DE.3 - Background Engine Architecture

Date: 2026-07-07

Scope:

- Design the background layer that will move SteelTrack from runtime aggregate reads to background-maintained snapshots.
- No UI, workflow, API contract, Prisma schema, or business logic changes in this sprint.
- No background worker behavior was changed.

## Current Foundation

Existing backend foundation:

- `EventBusService`
  - In-process publish/subscribe.
  - Supports optional `persistToOutbox` metadata.
- `JobSchedulerService`
  - Schedules `BackgroundJob` rows.
  - Supports queue, payload, idempotency key, priority, delay, and max retries.
- `JobWorkerService`
  - Polls due jobs.
  - Claims jobs.
  - Records `JobExecution`.
  - Handles retry/dead-letter transitions.
  - Currently routes only known jobs:
    - `attachment.ocr`
    - `workflow.timeout.check`
    - `notification.deliver`
- `background_jobs` and `job_executions`
  - Already persisted by migration `20260523143000_scheduler_outbox_jobs`.

EPIC106 implementation status:

- `BackgroundJobManager` now wraps `JobSchedulerService`.
- `SnapshotUpdateDispatcher` schedules idempotent snapshot update/rebuild jobs.
- `SnapshotRebuilder` accepts snapshot jobs and safely skips writes until persisted snapshot tables exist.
- `OutboxService` now persists, claims, dispatches, retries, and dead-letters outbox events.
- `EventPublisherService` and `EventConsumerService` provide the event publishing/consuming foundation.

Important limitation:

- Persisted snapshot tables do not exist yet. Snapshot jobs currently execute as accepted/skipped jobs and do not change read behavior.

## Target Background Engine

```text
Domain Workflow
  -> emits lightweight domain event
  -> Snapshot Update Router
  -> schedules idempotent snapshot job
  -> Snapshot Rebuilder executes in background
  -> Snapshot Store updated
  -> Runtime API reads snapshot first
  -> fallback query only when snapshot missing/stale
```

The background engine should make dashboard/detail reads cheap and bounded. User requests should not recompute large aggregates from transaction/log/event tables.

## Job Types

Recommended job names:

| Job | Queue | Purpose |
| --- | --- | --- |
| `snapshot.inventory.update` | `snapshots` | Incrementally refresh Inventory snapshots for affected material/warehouse/date scopes. |
| `snapshot.inventory.rebuild` | `snapshots` | Full or scoped Inventory snapshot rebuild. |
| `snapshot.projects.update` | `snapshots` | Incrementally refresh Project runtime/task health snapshots. |
| `snapshot.projects.rebuild` | `snapshots` | Full or project-scoped Project snapshot rebuild. |
| `snapshot.logistics.update` | `snapshots` | Incrementally refresh Dispatch/Logistics snapshots. |
| `snapshot.logistics.rebuild` | `snapshots` | Full or scoped Logistics snapshot rebuild. |
| `snapshot.dashboard.compose` | `snapshots` | Compose executive dashboard snapshot from module snapshots. |
| `snapshot.health.check` | `maintenance` | Detect stale/missing snapshots and enqueue rebuilds. |

## Idempotency

Every snapshot job must have an idempotency key:

```text
snapshot:<module>:<type>:<scope>:<watermark>
```

Examples:

```text
snapshot:inventory:update:item:VAL-MAT-002:2026-07-07T10:15:00Z
snapshot:projects:update:project:project-id:version-128
snapshot:dashboard:compose:global:2026-07-07T10:15
```

This prevents event storms from creating duplicate rebuild work.

## Queue Policy

Suggested queues:

- `snapshots`
  - Incremental snapshot jobs.
- `snapshot-rebuild`
  - Full rebuilds and backfills.
- `maintenance`
  - Snapshot health checks, staleness scans, repair scheduling.

Suggested priorities:

- Critical stock/project/logistics changes: `90`.
- Project/runtime snapshot changes: `70`.
- Dashboard compose jobs: `50`.
- Full rebuild/backfill jobs: `10`.

## Worker Behavior

The worker should process snapshot jobs in small bounded batches:

```text
claim job
  -> load scoped source rows
  -> calculate snapshot payload
  -> upsert snapshot
  -> record metrics
  -> emit snapshot.updated
```

Failure behavior:

- Retry with existing exponential backoff.
- Mark `DEAD_LETTER` after max retries.
- Preserve last error.
- Never block the originating business workflow.

## Runtime Read Contract

Existing APIs should keep the same DTO shape:

```text
Controller
  -> Service
    -> Snapshot Reader
      -> fresh snapshot: return payload
      -> stale/missing snapshot: fallback source query
      -> enqueue rebuild
```

Fallbacks are allowed while migrating, but runtime metrics must count:

- snapshot hit
- snapshot miss
- stale snapshot
- fallback query
- rebuild queued
- rebuild failed

## Rollout Plan

Phase 1:

- Design contracts and job names only.
- Keep current behavior unchanged.

Phase 2:

- Add snapshot tables for Inventory.
- Add `snapshot.inventory.rebuild` worker path.
- Keep API fallback enabled.

Phase 3:

- Enable event-to-job scheduling for Inventory.
- Add Dashboard compose job.

Phase 4:

- Extend Projects and Logistics.
- Add stale snapshot health scans.

Phase 5:

- Harden persistent outbox and cross-instance event delivery.

## Non-Goals

- No new UI.
- No workflow mutation.
- No fake data.
- No schema changes in this sprint.
- No immediate replacement of current runtime services.
