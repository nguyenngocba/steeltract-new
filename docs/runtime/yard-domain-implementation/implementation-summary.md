# RFC006 Yard Domain Implementation Summary

Date: 2026-07-17  
Status: IMPLEMENTED

## Implemented

- Added internal `YardItemAggregate` and `YardLocationAggregate` boundaries.
- Added commands for placement, relocation, hold/release, loading preparation,
  loading queue readiness, and release to Logistics.
- Enforced active-placement uniqueness, current-location checks, destination
  capacity, ordered loading transitions, optimistic concurrency, and durable
  idempotent replay.
- Kept persistence, movement history, ActivityLog, audit Outbox, and canonical
  domain Outbox writes in one Serializable repository transaction.
- Published `yard.item.placed`, `yard.item.moved`, and
  `yard.loading.completed` using the AD-019 V1 envelope. No Inventory balance,
  Production, QC, Component, Logistics, Projection Engine, API, or UI write was
  introduced.
- Reused existing Yard tables and JSON metadata for aggregate state/version;
  no schema change, migration, or fake backfill was required.

## Contract Note

RFC006 called `yard.loading.ready` canonical, while approved AD-019 defines
`yard.loading.completed`. The implementation keeps `LOADING_READY` as an
internal Yard state and publishes only `yard.loading.completed` when Yard
releases the completed loading task to Logistics. No unapproved alias was
created.

## Compatibility

The command service is an internal application boundary and adds no controller
or public route. Existing Yard APIs remain unchanged. Legacy API orchestration
continues to exist for compatibility and can be cut over separately when an
additive public command contract is approved.

## Verification

- Yard aggregate/command/legacy service tests: PASS (11/11).
- Yard plus Enterprise Projection tests: PASS (19/19).
- Prisma validate: PASS; migration: NOT REQUIRED (schema unchanged).
- Backend build: PASS.
- Frontend build: PASS.
- `git diff --check`: PASS.
- Staged files and commits: none created.
