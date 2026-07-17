# Event Ordering And Idempotency

Date: 2026-07-17  
Status: **APPROVED - ADS004**

## Delivery Model

SteelTrack guarantees at-least-once publication and consumption. It does not
claim exactly-once delivery. Exactly-once business effect is achieved by owner
transaction atomicity and idempotent consumers.

## Event Identity

- `eventId`: globally unique immutable UUID for one Outbox row/fact.
- `idempotencyKey`: stable business-fact key.
- Recommended aggregate-transition key:
  `<eventName>:v<version>:<aggregateId>:<aggregateVersion>`.
- Recommended append-only-record key:
  `<eventName>:v<version>:<recordId>`.

One idempotency key with a different payload hash is a conflict and must dead
letter; it is never treated as a valid retry.

## Ordering

- No global ordering is guaranteed.
- Strict ordering is required per documented ordering key in the catalog.
- Publishers increment `aggregateVersion` in the same transaction as mutation
  and Outbox.
- Consumers track last applied aggregate version and event id.
- Duplicate or older versions are acknowledged without applying side effects.
- A version gap is retried/parked; consumers must not invent missing state.
- Cross-aggregate workflows use correlation/causation, not assumed arrival
  order.

## Retry Policy

Default publisher/consumer schedule:

```text
5 seconds, 30 seconds, 2 minutes, 10 minutes, 30 minutes,
then 1 hour up to 10 total attempts
```

Transient failures retry with jitter. Validation/schema/ownership failures are
non-transient and move directly to dead letter with reason. Exhausted events
remain replayable after operator correction.

## Replay

- Replay preserves original event id, name, version, occurredAt and payload.
- Replay creates a new delivery attempt, not a new business fact.
- Consumer deduplication survives process restart and cache eviction.
- Projection rebuild may replay events; command aggregates are never rebuilt by
  blindly re-executing cross-module commands.
- AD-018 PostingReceipt-linked events can never trigger Issue/Return stock
  mutation again.

## Correlation

The initiating command creates `correlationId`. Every subsequent owner command
retains it and sets `causationId` to the direct source event/command id. A new
domain fact gets a new `eventId` and idempotency key even within one correlation.

