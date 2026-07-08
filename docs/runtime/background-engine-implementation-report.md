# EPIC106 - Enterprise Background Engine Implementation

Date: 2026-07-07

Scope:

- Implement the core background engine foundation from EPIC105.
- Preserve UI, workflow, API contract, Prisma schema, and business logic.
- Do not create fake data.
- Do not add standalone cron jobs.

## Implemented

### BackgroundJobManager

Added:

- `apps/backend-api/src/core/jobs/background-job-manager.service.ts`

Responsibilities:

- Schedules background jobs through the existing `JobSchedulerService`.
- Applies idempotency keys when one is not supplied.
- Uses stable payload stringification so duplicate logical jobs map to the same key.

### SnapshotUpdateDispatcher

Added:

- `apps/backend-api/src/core/jobs/snapshot-update-dispatcher.service.ts`

Responsibilities:

- Standardizes snapshot update/rebuild requests.
- Schedules:
  - `snapshot.<module>.update`
  - `snapshot.<module>.rebuild`
- Uses queue names:
  - `snapshots`
  - `snapshot-rebuild`
- Generates idempotency keys using module, snapshot type, scope, and watermark.

### SnapshotRebuilder

Added:

- `apps/backend-api/src/core/jobs/snapshot-rebuilder.service.ts`

Current behavior:

- Accepts snapshot jobs.
- Returns a `skipped` result because persisted snapshot tables are not enabled yet.
- Does not mutate business data.
- Emits no fake snapshot payload.

This is intentional. The worker path is now wired, but persisted snapshot storage remains a future migration sprint.

### Persistent Outbox

Updated:

- `apps/backend-api/src/core/outbox/outbox.service.ts`

Implemented:

- `create()`
- `claimDue()`
- `markDispatched()`
- `markFailed()`

Behavior:

- Persists outbox events through Prisma.
- Claims due events with worker lock metadata.
- Retries failed events with exponential backoff.
- Moves events to `DEAD_LETTER` when max retries is reached.

### Event Publisher

Added:

- `apps/backend-api/src/core/events/event-publisher.service.ts`

Responsibilities:

- Publishes normal in-process events.
- Publishes persistent events by setting `persistToOutbox: true`.

### Event Consumer

Added:

- `apps/backend-api/src/core/events/event-consumer.service.ts`

Responsibilities:

- Subscribes to snapshot-relevant domain events.
- Maps domain events to snapshot update requests.
- Dispatches idempotent snapshot update jobs.

Mapped event groups:

- Inventory transaction/stock/return events.
- Project task/schedule/material/cost events.
- Logistics dispatch events.

### Retry Policy

Added:

- `apps/backend-api/src/core/jobs/job-retry-policy.service.ts`

Updated:

- `apps/backend-api/src/core/jobs/job-worker.service.ts`

Behavior:

- Centralizes exponential retry backoff.
- Centralizes dead-letter decision.
- Existing job failure semantics remain unchanged.

### Worker Snapshot Handling

Updated:

- `apps/backend-api/src/core/jobs/job-worker.service.ts`

Behavior:

- Handles `snapshot.*` job names.
- Invokes `SnapshotRebuilder`.
- Emits `snapshot.rebuild.completed` after accepted snapshot jobs.

## Module Wiring

Updated:

- `apps/backend-api/src/core/jobs/jobs.module.ts`
- `apps/backend-api/src/core/events/events.module.ts`

New providers are registered through existing Core modules. No new top-level module was created.

## Behavior Preservation

No user-facing behavior changed:

- Existing APIs keep the same contract.
- Existing workflows still write business records the same way.
- Existing dashboard/runtime reads still use current sources.
- Snapshot jobs do not write snapshot tables because those tables do not exist yet.

## Current Runtime Limitation

The Background Engine now has executable plumbing, but not persisted snapshot storage.

Current snapshot job result:

```text
status = skipped
reason = Snapshot tables are not enabled yet.
```

This is safer than inventing data or silently pretending a persisted snapshot exists.

## Next Step

The next implementation sprint should:

1. Create the first persisted Inventory snapshot tables.
2. Implement `snapshot.inventory.rebuild` writer logic.
3. Add dry-run parity checks against current live Inventory aggregation.
4. Enable snapshot-first reads only after parity is proven.

## Verification

Commands:

```bash
pnpm -C apps/backend-api build
pnpm -C apps/frontend build
git diff --check
```

Result:

- Backend build: PASS.
- Frontend build: pending at time of report creation.
- `git diff --check`: pending at time of report creation.
