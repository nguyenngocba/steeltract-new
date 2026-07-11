# Inventory Historical Snapshot Report

Date: 2026-07-10

Status: IMPLEMENTED

## Snapshot Model

`InventoryDashboardSnapshot` now supports a canonical global scope for reusable historical Inventory metrics:

- `scopeKey = 'ALL'` for global Inventory Overview metrics.
- `scopeKey = 'WAREHOUSE:<warehouseId>'` for warehouse-specific dashboard rows.
- Existing rows without global semantics remain warehouse-scoped or legacy-scoped.

Additional nullable fields support real historical series:

- `outOfStockCount`
- `primaryMaterialCount`
- `primaryStock`
- `secondaryMaterialCount`
- `secondaryStock`
- `consumableMaterialCount`
- `consumableStock`

Fields are nullable by design so old snapshots do not masquerade as real historical data.

## Writer Path

The historical metrics follow the existing Core Platform boundary:

`Repository -> Background Snapshot -> Snapshot Repository -> Persisted Snapshot`

No HTTP request writes dashboard snapshots directly.

The global snapshot row is calculated from live location stock and active inventory items:

- Total stock uses all `inventory_location_stocks`.
- Low/out-of-stock uses MAIN warehouse stock, matching the Inventory Business Freeze rule.
- Category stock uses all location stock grouped by `materialUsageType`.
- Reserved and available quantities retain the existing reservation-aware rules.

## Reader Path

Inventory Overview reads:

`InventoryReadModelService.overview() -> SnapshotReaderService.inventoryOverviewHistory() -> InventorySnapshotRepository.findOverviewHistory()`

The reader returns only persisted `ALL` rows ordered by snapshot date. No synthetic point is appended for the current runtime state.

## Historical Behavior

| Scenario | Result |
|---|---|
| No persisted snapshot | Empty series |
| One persisted snapshot | Single point, delta shows insufficient history |
| Two or more persisted snapshots | Adjacent persisted-point delta |
| Old warehouse snapshot without new fields | Not used for global category/out-of-stock history |

## Migration Policy

The migration only adds fields and backfills `scopeKey` for identity. It does not backfill category/out-of-stock values, because doing so would create reconstructed history instead of persisted history.

## Known Limitation

At the time of verification, the database has one real `ALL` row. Historical category/out-of-stock deltas therefore correctly show `Chưa có dữ liệu lịch sử` until the next persisted `ALL` snapshot is produced.
