# Production Event Standard

Date: 2026-07-17  
Status: **CURRENT CONTRACT DOCUMENTED; SCRAP BLOCKED**

## Canonical Lifecycle Events

New publishers must use:

- `production.order.created`
- `production.order.released`
- `production.order.ready`
- `production.order.started`
- `production.order.paused`
- `production.order.resumed`
- `production.order.completed`
- `production.order.closed`
- `production.order.cancelled`

`production.started`, `production.completed`, and `production.delayed` are
legacy compatibility inputs. They must not replace canonical events.

## Canonical Material Events

- `production.material.reserved`
- `production.material.released`
- `production.material.issued`
- `production.material.consumed`
- `production.material.returned`

These events commit atomically with their Production domain mutation and
immutable ledger rows. Inventory-owned Outbox events remain responsible for
Inventory snapshot refresh after Issue or Return.

## Stage Events

`production.stage.completed` is an existing durable compatibility event and is
written in the stage transaction. A broader stage start/pause event contract is
not approved by this assessment.

## Scrap Decision Gate

`production.scrapped` is not an approved canonical event. PROD-015 states that
Scrap requires a separate command/event/ledger semantic. Before implementation,
the contract must define:

- aggregate owner and command preconditions;
- quantity unit and relationship to rejected/rework quantity;
- Inventory movement, if any;
- ledger event type and immutable payload;
- idempotency key;
- snapshot routing and Operations Center telemetry.

## Atomicity and Idempotency

Every durable event follows:

```text
Repository transaction
  -> domain mutation
  -> ActivityLog/audit record
  -> Outbox upsert with stable idempotency key
  -> commit
```

No new post-commit publisher or module-specific queue is permitted.

