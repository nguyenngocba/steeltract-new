# Inventory Dashboard Validation

Date: 2026-07-08

## Scope

Validated dashboard business metrics for Inventory:

* Tổng giá trị tồn
* Tổng khối lượng
* Số lượng vật tư
* Vật tư chính
* Vật tư phụ
* Vật tư tiêu hao
* Sắp hết hàng
* Hết hàng
* Phân bổ tồn kho
* Biến động tồn
* Cảnh báo
* Top vật tư

## Source Chain

Expected chain:

```text
Inventory Transaction
-> Inventory Transaction Items
-> Inventory Location Stocks
-> Inventory Material / Location / Dashboard Snapshots
-> Repository Read Model fallback
-> Inventory Dashboard / Material Detail
```

## Code Findings

Frontend Overview and Materials pages compute stock health from MAIN warehouse stock:

```text
mainWarehouseStock(item)
productionWarehouseStock(item)
totalWarehouseStock(item)
```

This matches Inventory decision `INV-014`.

Dashboard cards and table values use:

```text
totalWarehouseStock
mainWarehouseStock
productionWarehouseStock
inventoryValue
materialUsageType
minimumStock
```

## Data Validation

Current read-only DB audit:

```text
Items: 23
Transactions: 74
Transaction items: 78
Location stocks: 51
Dashboard snapshots: 4
Material snapshots: 48
Location snapshots: 50
```

Consistency:

```text
item quantity snapshot vs location stock: PASS (0 mismatch)
location stock vs transaction-derived bucket: PASS (0 mismatch)
negative location stocks: PASS (0)
transaction item valuation: PASS (0 missing, 0 zero)
location snapshot total vs location stock total: PASS (21473.4 = 21473.4)
```

Warning:

```text
material snapshot vs location stock: FAIL (3 mismatches)
```

Sample mismatches:

| Material | Snapshot stock | Location stock |
| --- | ---: | ---: |
| VT-NEW-00015 | 44 | 54 |
| VT-NEW-00001 | 28.9 | 5763.9 |
| VT-NEW-00010 | 100 | 200 |

## Interpretation

The transaction ledger, location balances, and item compatibility snapshot are aligned.

The remaining dashboard risk is stale or incomplete `InventoryMaterialSnapshot` rows. Material Detail may fallback to repository read model when stale/missing, but Business Freeze requires snapshot parity to be clean.

## Result

Dashboard validation: BLOCKED for Business Freeze.

Blocking reason:

* Material snapshot parity is not clean in current data.

Non-blocking warning:

* Some Dashboard trend calculations are still frontend-derived historical snapshots rather than persisted long-range dashboard snapshots. They are stable and real-data-derived, but not report-grade historical accounting.
