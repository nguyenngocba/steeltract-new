# Inventory Snapshot Cutover Report

Date: 2026-07-08

## Scope

EPIC112 INV.CORE.2 completes the Inventory snapshot read path for:

- Material Detail
- Inventory Location workspace
- Operations Center Inventory health

No UI, workflow, public API contract, or business logic behavior was changed.

## Background Update Path

Inventory lifecycle events still publish through the persistent Outbox. They now also schedule background snapshot update jobs:

```text
Inventory command
↓
InventoryEventService
↓
Persistent Outbox event
↓
SnapshotUpdateDispatcher
↓
background_jobs
↓
JobWorkerService
↓
SnapshotRebuilder
↓
SnapshotWriterService
↓
InventoryMaterialSnapshot / InventoryLocationSnapshot
```

Events covered:

- `inventory.transaction.created`
- `inventory.stock_bucket.updated`
- `inventory.adjustment.posted`
- `inventory.stocktake.completed`
- `inventory.return.requested`
- `inventory.return.received`
- `inventory.return.rejected`
- `inventory.return.accepted`
- `inventory.material.updated`

## Snapshot Writer

Inventory snapshot jobs now write:

- dashboard snapshots
- material snapshots
- location snapshots

Writer behavior:

- uses repository methods
- writes with upsert
- does not write inside the original business transaction
- does not delete/reinsert snapshot tables
- marks missing active locations empty instead of deleting rows

## Reader Strategy

Material Detail:

```text
Snapshot first
↓
fallback to repository-backed read model if missing/stale
```

Locations:

```text
Snapshot first
↓
fallback to repository-backed read model if missing/stale
```

Freshness:

- default max age: `INVENTORY_SNAPSHOT_MAX_AGE_SECONDS=3600`
- if stale, request still succeeds from fallback source
- fallback schedules a background update

## Runtime Metrics

Runtime analytics can now observe:

- material snapshot hit
- material snapshot miss
- location snapshot hit
- location snapshot miss
- snapshot fallback
- snapshot stale
- snapshot age
- snapshot lag
- rebuild duration

## Operations Center

`GET /operations-center/overview` now exposes Inventory snapshot health:

- Material Snapshot Health
- Location Snapshot Health
- Snapshot Freshness
- Snapshot Hit Ratio
- Snapshot Lag
- Snapshot Rebuild Status

