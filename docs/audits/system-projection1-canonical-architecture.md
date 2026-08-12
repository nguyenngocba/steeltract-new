# SYSTEM.PROJECTION.1 - Canonical Projection & Snapshot Architecture

Date: 2026-08-11 (Asia/Ho_Chi_Minh)  
Result: **IMPLEMENTED - CORE WATERMARK/PARITY GREEN, CONTROLLED GAPS REMAIN**

## Scope

This sprint changed projection and snapshot freshness only. It did not modify
business services, Inventory/Procurement semantics, Prisma schema, migrations,
or transactional records intentionally.

## Architecture

```text
Business command
  -> OutboxEvent(id, aggregateVersion, createdAt, dispatchedAt)
  -> Enterprise projection
     -> ProjectionReceipt(aggregateVersion)
     -> ProjectionCheckpoint(lastOutboxEventId, lastProcessedAt)
  -> ProjectionWatermarkService
     -> module watermark + 31 projection health rows
  -> HistoricalSnapshotEngine
     -> capture watermark before generation
     -> build read-model payload
     -> capture watermark after generation
     -> persist only stable parity as authoritative/fresh
  -> Historical read API
     -> compare stored watermark with current watermark at read time
  -> Historical Dashboard
     -> Live / Snapshot / Lag / Age
```

No calendar date is used as the freshness signal. `snapshotDate` remains the
business date and unique snapshot identity only.

## Projection Watermark

`ProjectionWatermarkService` maps canonical event namespaces to ERP,
Inventory, Components, Production, Projects, Suppliers, QC, Dispatch,
Logistics and Yard. A module watermark exposes `lastEventId`,
`lastAggregateVersion`, `lastProcessedAt`, `sourceOccurredAt`, `status`,
`fresh` and `lagMs`.

`GET /query-api/projections/health` now exposes the same canonical identity
fields for all 31 registered projections. Aggregate version comes from the
receipt for the checkpoint's exact outbox event; it is not inferred from row
counts or timestamps.

Health vocabulary is `HEALTHY`, `LAGGING`, `REBUILDING`, `NOT_INITIALIZED` and
`FAILED`.

## Snapshot Freshness

Every generated dashboard snapshot stores its projection watermark inside
`metadata.projectionWatermark` and the event ID in `sourceWatermark`.
Generation reads the watermark before and after payload construction. A source
advance during generation produces `authoritative=false`, `stale=true` and
`parity=false`.

The read API reevaluates this contract against the current outbox watermark.
An older persisted `authoritative=true` can therefore never hide a later
business event. This dynamic check also applies when an authoritative
date-specific snapshot is requested.

Inventory balance rows use the Inventory projection watermark rather than
`InventoryItem.updatedAt`. No Inventory quantity, valuation, reservation or
posting logic changed.

## Scheduling

The engine additively ensures one `dashboard_daily` metadata definition for
every `HistoricalDashboardModule`, plus `inventory_balance_daily`. Existing
settings remain untouched due to `skipDuplicates`.

A daily job is due when its business date advances or its module watermark
advances on the same day. Job identity includes `snapshotType` and target
watermark. A completed job suppresses replacement only when
`sourceWatermarkEnd` reached that target. Metadata ordering uses the target
event occurrence timestamp, preventing an older concurrent job from moving a
same-day watermark backwards.

## History API and UI

`GET /history/dashboard/latest` no longer filters rows by the persisted
authoritative boolean. It returns the latest row and adds dynamic `freshness`:

```json
{
  "status": "HEALTHY",
  "fresh": true,
  "stale": false,
  "authoritative": true,
  "parity": true,
  "lagMs": 29142,
  "ageMs": 356566,
  "snapshotWatermark": "<event-id>",
  "currentWatermark": {
    "lastEventId": "<event-id>",
    "lastAggregateVersion": "2",
    "lastProcessedAt": "2026-08-11T07:06:54.628Z"
  }
}
```

The Historical Dashboard displays a compact Live, Snapshot, Lag and Age strip.
Existing charts, filters and business calculations were not redesigned.

## Runtime Evidence

- Backend: current tree on `127.0.0.1:3100`
- Frontend/Chromium: Vite on `127.0.0.1:4173`
- PostgreSQL: `steeltrack`, 93 migrations current
- Authentication: real admin JWT, login HTTP 201
- Latest endpoint: HTTP 200 for ERP, Inventory, Production, QC, Projects, Yard,
  Logistics and Dispatch
- ERP, Inventory, Production, QC, Projects and Yard: authoritative/fresh/parity
- Inventory parity: live stock `3212` = snapshot `3212`; live materials `25` =
  snapshot `25`
- Yard parity: live active placements `26` = snapshot `26`
- Snapshot jobs: 38 completed, 0 failed/running in the final probe
- Duplicate dashboard snapshot identities: 0
- Active projection failures: 0
- Projection documents without checkpoints: 0

Projection health: 31 registered, 25 healthy and 6 not initialized. The six
are `ComponentSummary`, `YardLoadingSummary`, `ShipmentSummary`,
`ShipmentTimeline`, `ProjectMaterialAllocation` and
`ProjectAcceptanceSummary`. The retained database has no matching canonical
event for these definitions; they are reported honestly rather than fabricated
as healthy.

All ten historical modules now have snapshot rows and Inventory balance has 51
rows. Dashboard and Inventory monthly rollups remain empty because the reset
runtime has no closed source month. No synthetic month was created.

Playwright passed 1/1 in 36.8 seconds. Dashboard, Inventory, Production, QC,
Projects, Yard, Logistics and History rendered without page exceptions or
failed requests. Evidence is retained under `test-results/snapshot-cert1/`.

An initially malformed Playwright selector ran additional existing E2E/QC
suites before the targeted run. Those suites retained their documented runtime
fixtures and regenerated related `test-results` evidence. This sprint used no
direct Prisma mutation.

## Verification

- Targeted backend: 4 suites / 14 tests PASS
- Full backend: 97 suites / 333 tests PASS
- Frontend: 4 files / 12 tests PASS
- Targeted Playwright: 1/1 PASS
- Backend lint/build: PASS
- Frontend build/typecheck: PASS
- Prisma migration status: 93 migrations, up to date
- `git diff --check`: PASS

## Remaining Gaps

P1:

1. Produce real Logistics/Dispatch source events before those snapshots can
   become initialized and authoritative.
2. Run a closed-month cycle to certify dashboard and inventory rollups.
3. Add exact metric parity assertions for Production, QC, Projects and
   Executive payloads; watermark parity does not replace metric-contract parity.

P2:

1. Decide whether the six eventless projections are future-facing or should be
   retired in a separate architecture sprint.
2. Add monitoring alerts for failed, lagging and excessive watermark lag.

## Decision

The false-freshness architecture is closed. Snapshot authority follows
business-event/projection watermark parity, same-day changes schedule a new
snapshot, and the read API cannot advertise a superseded snapshot as current.
Logistics event coverage and monthly-rollup certification remain explicit gaps.
