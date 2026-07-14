# EPIC161 - Yard Atomic Outbox Report

## Before

Yard committed business rows, then called `EventBusService.emit` to persist the
domain event in a second transaction. Audit Outbox persistence also did not
receive the active Yard transaction client.

## After

`YardRepository.createOutboxEvent` performs idempotent Outbox upsert through the
active `YardTx`. `YardService` writes:

1. business rows;
2. ActivityLog;
3. `audit.activity.created` Outbox row;
4. existing Yard domain Outbox row;
5. one commit.

Existing event names, full payload serialization, metadata, correlation ID and
idempotency-key semantics are preserved. No canonical event rename was made.

No in-process subscribers exist for the current Yard event names, so removal of
the post-commit EventBus call does not drop a synchronous handler. Persistent
consumers continue to receive the same Outbox event contract.

## Result

Atomic Outbox: PASS for all existing Yard mutations that previously emitted
events. Snapshot/background routing remains EPIC163 scope.

