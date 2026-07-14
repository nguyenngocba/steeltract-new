# EPIC160 - Yard Event Audit

## Existing Events

- `yard.item.placed`
- `yard.item.moved`
- `yard.item.removed`
- `yard.zone.updated`
- `yard.snapshot.generated`

These events request persistent Outbox storage, but are emitted after the Yard
business transaction commits. Event names also differ from the draft blueprint.

## Proposed Canonical Contract

This audit does not implement or approve these names. They require an architecture
decision before EPIC161:

- `yard.receipt.received`
- `yard.reservation.created`
- `yard.reservation.released`
- `yard.placement.created`
- `yard.placement.moved`
- `yard.placement.held`
- `yard.placement.released`
- `yard.loading.started`
- `yard.loading.completed`
- `yard.dispatch.released`

Compatibility mapping from current `yard.item.*` events must be explicit. Do not
dual-publish without idempotency rules because that would trigger duplicate
snapshot or downstream work.

## Event Gaps

- no consumer for QC PASS admission;
- no reservation, hold/release, loading or dispatch events;
- no shared snapshot routing for Yard events;
- event payloads pass full returned entities rather than consistently lightweight identifiers;
- atomic Outbox is absent.

