# EPIC163 - Yard Snapshot Readiness

## Current Status

**Foundation: APPROVED. Deployment: PENDING.**

- Prisma schema: valid.
- Prisma client: generated.
- Additive migration: `20260713180000_yard_snapshot_foundation`.
- Migration status: pending; no database mutation was performed.
- Repository: implemented and tested.
- Reader/fallback: implemented and tested.
- Writer/background routing: implemented and tested.
- Validator/rebuilder: implemented, warning-only.
- Feature flag: `USE_YARD_SNAPSHOT` registered.
- Workspace ADR011 path: unchanged.
- Fake/backfill data: none.

The foundation becomes operational after an approved `prisma migrate deploy`
and real Yard event/worker processing. Until then, no persisted Yard domain
snapshot rows can exist in the current database.

## Event Limitation

Freshness covers only existing `yard.item.*`, `yard.zone.updated` and manual
snapshot events. Reservation, hold/release, loading and formal dispatch events
do not exist and were not added by EPIC163.

---

# EPIC160 - Yard Snapshot Readiness Audit (Superseded)

## Current State

The schema contains `YardSnapshot`, and `POST /yard/snapshots` creates a JSON
representation of zones, slots, placements, occupancy and heatmap data inside a
Yard repository transaction. This is a manual business snapshot/archive.

It is not a Core Platform persisted snapshot implementation:

- no Yard snapshot repository in `core/snapshots`;
- no `SnapshotReaderService` Yard methods;
- no `DashboardReaderService` Yard strategy;
- no Yard writer routing from Outbox;
- no rebuilder/dispatcher registration;
- no validator/parity support;
- no `USE_YARD_SNAPSHOT` feature flag;
- generation occurs synchronously in the HTTP request.

## Assessment

**Snapshot readiness: 15%, NOT READY.**

The existing `YardSnapshot` should not automatically be treated as a dashboard
snapshot because it stores an operator-named full layout JSON and has different
semantics. EPIC163 must first decide whether to retain it as an audit artifact
and introduce shared domain snapshots for Yard Dashboard/Layout, avoiding one
snapshot per screen.
