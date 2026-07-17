# Enterprise Projection Engine

## Decision

SteelTrack uses the durable `OutboxEvent` stream as the only projection input.
`JobWorkerService` invokes `ProjectionEngineService` before publishing an event
to in-process subscribers and before marking the Outbox row dispatched. A
projection failure therefore follows the existing Outbox retry/dead-letter path.

## Guarantees

- Idempotency: `(projectionName, outboxEventId)` is unique and persisted as a receipt.
- Atomic apply: document, receipt, checkpoint and failure resolution share one Prisma transaction.
- Determinism: projected timestamps come from the event envelope, not wall-clock reducer time.
- Isolation: each registered projection owns independent documents, receipts and checkpoint.
- No aggregate access: reducers consume persisted event payload/envelope only.

## Storage

- `EnterpriseProjectionDocument`: versioned JSON projection rows.
- `EnterpriseProjectionReceipt`: durable event-processing receipts.
- `EnterpriseProjectionCheckpoint`: progress, count, lag and health.
- `EnterpriseProjectionFailure`: retry/dead-letter diagnostics.

The additive migration is `20260717170000_enterprise_read_platform`. It does not
alter existing aggregate, snapshot or business tables.

## Boundary

The engine extends the existing Outbox and background worker. It does not create
a second queue, event bus, snapshot engine or business mutation path.
