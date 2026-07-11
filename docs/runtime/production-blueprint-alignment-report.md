# Production Blueprint Alignment Report

Date: 2026-07-11

Status: **APPROVED FOR EPIC134 IMPLEMENTATION**

## Decision

SteelTrack now has one canonical Production Order lifecycle:

```text
DRAFT -> RELEASED -> READY -> IN_PROGRESS <-> PAUSED -> COMPLETED -> CLOSED
DRAFT -> CANCELLED
```

`PLANNED` and `DELAYED` remain additive compatibility values. They are not
targets for the new command state machine and are not silently remapped.

## Event Naming

Canonical Production Order lifecycle events are:

* `production.order.created`
* `production.order.released`
* `production.order.ready`
* `production.order.started`
* `production.order.paused`
* `production.order.resumed`
* `production.order.completed`
* `production.order.closed`
* `production.order.cancelled`

Legacy event names remain consumer-compatible only while existing Outbox rows
drain. New lifecycle command code must publish the canonical names.

## Schema Alignment

The additive migration adds `READY`, `PAUSED`, and `CLOSED` to
`ProductionOrderStatus`. It does not remove enum values, rewrite rows, or change
defaults. Existing `PLANNED` and `DELAYED` rows remain readable.

## Transaction Rule

EPIC134 must write the Production Order transition, audit/activity record, and
Outbox row in the same repository transaction. Event delivery, background jobs,
and snapshot writes remain post-commit asynchronous work.

## Deferred To EPIC134

This alignment sprint intentionally does not add lifecycle endpoints, state
machine code, command DTOs, repository transition methods, atomic Outbox writes,
or tests. Those changes can now be implemented without inventing state or event
semantics.
