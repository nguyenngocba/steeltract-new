# Inventory Location Snapshot Report

Date: 2026-07-08

## Objective

EPIC112 INV.CORE.2 adds a persisted Inventory location domain snapshot so warehouse location workspaces do not need to aggregate active stock buckets at request time.

This is a reusable domain read model intended for:

- Warehouse map
- Stock by location
- Stock take
- Transfer
- Location optimization
- AI Assistant
- Operations Center

## Schema

Model:

- `InventoryLocationSnapshot`

Table:

- `inventory_location_snapshots`

Important fields:

- `locationKey`
- `warehouseId`
- `warehouseCode`
- `warehouseName`
- `zoneId`
- `zoneCode`
- `zoneName`
- `slotId`
- `level`
- `quantity`
- `occupied`
- `materialCount`
- `materialPayload`
- `updatedAt`

Unique key:

- `locationKey`

Location key format:

```text
warehouseId:zoneId:slotId:level
```

## Writer

The writer reads `inventory_location_stocks` once, groups rows by exact bucket, and writes `InventoryLocationSnapshot` rows through repository upsert.

When a previously occupied location no longer appears in active stock, it is not deleted. The writer marks it:

```text
occupied = false
quantity = 0
materialCount = 0
materialPayload = []
```

This preserves a stable location key and avoids delete/insert churn.

## Reader Cutover

`GET /inventory/zones` and `GET /inventory/zones/:id` now route through:

```text
ZonesController
↓
InventoryReadModelService.locations()
↓
SnapshotReaderService.inventoryLocations()
↓
InventoryLocationSnapshot
↓ fallback
InventoryRepository.listZones()
```

The response shape remains compatible with the previous location workspace.

## Runtime Metrics

Metrics added:

- `locationSnapshotHit`
- `locationSnapshotMiss`
- `snapshotAge`
- `snapshotLag`
- `snapshotFallback`
- `snapshotStale`

