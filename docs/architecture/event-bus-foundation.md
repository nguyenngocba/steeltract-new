# EPIC105 / Sprint DE.3 - Event Bus Foundation

Date: 2026-07-07

Scope:

- Define the event foundation required for background snapshot updates.
- No code behavior was changed in this sprint.

## Current State

SteelTrack already has:

- `EventBusService`
  - in-process subscription;
  - event metadata;
  - optional outbox metadata.
- `EventsModule`
  - exports `EventBusService`.
- `JobWorkerService`
  - subscribes to selected events and schedules background jobs.
- WebSocket bridge
  - can bridge domain events to clients.
- `OutboxService`
  - currently present but stubbed in active code.

The existing foundation is enough to define contracts, but persistent outbox delivery must be hardened before multi-instance, production-grade event-driven snapshots.

## Event Principles

Use small id-based events.

Do not emit full aggregate payloads.

Recommended shape:

```ts
export interface SnapshotDomainEventPayload {
  aggregateType: string;
  aggregateId: string;
  projectId?: string;
  inventoryItemId?: string;
  warehouseId?: string;
  dispatchOrderId?: string;
  changedFields?: string[];
  occurredAt: string;
  sourceVersion?: string;
}
```

## Snapshot Event Names

Inventory:

- `inventory.transaction.created`
- `inventory.transaction.voided`
- `inventory.stock.changed`
- `inventory.material.updated`
- `inventory.return.requested`
- `inventory.return.received`

Projects:

- `project.task.created`
- `project.task.updated`
- `project.task.deleted`
- `project.schedule.changed`
- `project.material.changed`
- `project.component.changed`
- `project.cost.changed`
- `project.inspection.changed`

Logistics:

- `logistics.dispatch.created`
- `logistics.dispatch.changed`
- `logistics.dispatch.completed`
- `logistics.dispatch.cancelled`

Snapshots:

- `snapshot.update.requested`
- `snapshot.rebuild.requested`
- `snapshot.updated`
- `snapshot.failed`
- `snapshot.stale.detected`

## Event-To-Job Routing

Recommended flow:

```text
Domain event
  -> SnapshotEventRouter
  -> map event to SnapshotUpdateRequest
  -> JobSchedulerService.schedule(...)
  -> background job executes updater/rebuilder
```

Example idempotency keys:

```text
snapshot-update:inventory:transaction:<transactionId>
snapshot-update:projects:task:<projectTaskId>:<sourceVersion>
snapshot-update:logistics:dispatch:<dispatchOrderId>:<sourceVersion>
```

## Outbox Hardening Requirement

Before event-driven snapshots are production critical, `OutboxService` needs real persistence:

- create outbox row;
- claim due rows with lock/worker id;
- mark dispatched;
- mark failed with retry metadata;
- preserve idempotency key;
- avoid logging sensitive payloads.

Until then, the first implementation should rely on `BackgroundJob` scheduling directly from services or in-process event subscribers, with scheduled rebuilds as safety net.

## Ordering and Consistency

Snapshot updates are eventually consistent.

Rules:

- Business transaction commits first.
- Snapshot job is scheduled after the transaction succeeds.
- Snapshot job reads committed source state.
- If multiple events arrive, idempotency and latest source watermark decide final output.
- Stale snapshots should never mutate source business records.

## Failure Handling

Failures must be visible but non-blocking:

- job retry;
- dead-letter after max retries;
- snapshot remains stale;
- runtime API may use fallback source query;
- runtime metrics record snapshot miss/fallback.

## Multi-Instance Readiness

Before multiple backend instances use event-driven snapshots:

- persistent outbox must be implemented;
- worker locking must be validated under concurrency;
- event handlers must be idempotent;
- snapshot upserts must be safe under duplicate jobs;
- metrics must distinguish snapshot source from fallback query source.

## No Behavior Change in DE.3

This sprint defines the event foundation only. No current workflow emits new snapshot events and no user request behavior changes.
