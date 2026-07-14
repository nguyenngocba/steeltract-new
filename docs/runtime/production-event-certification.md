# Production Event Certification

Date: 2026-07-12

## Canonical Publishers

Order publishers use only:

```text
production.order.created/released/ready/started/paused/resumed/completed/closed/cancelled
```

Material publishers use only:

```text
production.material.reserved/released/issued/consumed/returned
```

Each publisher writes through repository transaction-bound Outbox primitives.
Focused tests verify state-machine and material transaction behavior.

## Compatibility Consumers

`EventConsumerService` retains routing for legacy `production.started` and
`production.completed` (plus existing stage/delay compatibility events). New
lifecycle code does not publish both canonical and legacy names, preventing
dual publication for new commands.

All canonical order and material events route to `ProductionOrderSnapshot`.
Issue/Return also create Inventory-owned events for Inventory snapshots.

## Runtime Result

No matching Production Outbox row currently exists, so dispatch status,
idempotency under operator retries, and runtime duplicate absence cannot be
certified from persisted evidence.

Event contract/routing: PASS.

Runtime event delivery: NOT CERTIFIED.

