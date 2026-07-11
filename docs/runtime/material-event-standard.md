# Material Event Standard

Date: 2026-07-11

Canonical Production material events:

* `production.material.reserved`
* `production.material.released`
* `production.material.issued`
* `production.material.consumed`
* `production.material.returned`

The constants and TypeScript event-name union are defined in
`production-material-contracts.ts`.

## Publishing Rule

Material events must be inserted into Outbox in the same transaction as their
Production state and ledger changes. They are not published directly after
commit. Snapshot handling remains asynchronous through Background Engine.

## EPIC135A Boundary

This sprint standardizes names and contracts but does not publish all five
Production material events. Full event emission and snapshot routing belong to
EPIC135B Material Flow Implementation. Inventory posting already writes its own
atomic Inventory transaction/stock Outbox events under Inventory ownership.
