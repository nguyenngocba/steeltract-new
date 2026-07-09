# Inventory Dashboard UI Audit

## Request Trace

`InventoryOverviewPage` mounts these primary queries:

| Hook | Endpoint | Refresh | Purpose |
|---|---|---:|---|
| `useInventoryAudit()` | `GET /inventory/audit` | 5 seconds | Material rows, stock, cost, locations |
| `useInventoryTransactions({})` | `GET /inventory/transactions` | 4 seconds | Activity, today metrics, trends |
| `useZones()` | `GET /inventory/zones` | query defaults | Warehouse/location analytics |
| return-request hook | `GET /inventory/returns` | hook policy | Pending-return indicators |

`GET /inventory/audit` calls `InventoryService.getInventoryAudit()`, loads up to
1,000 materials through `InventoryRepository`, then loads their transaction items
and reconstructs stock and location balances. It does not use the persisted
inventory dashboard/material snapshot.

`GET /inventory/transactions` loads at most 200 transactions with nested items and
related entities. It returns no total, cursor, or pagination metadata.

## KPI Audit

| Widget | Calculation | Finding |
|---|---|---|
| Tổng mã | count of filtered audit rows | WARNING: capped and filter-scoped |
| Tổng tồn/khối lượng | sum of `currentStock` over filtered rows | FAIL: noncanonical read path and capped payload |
| Giá trị tồn | sum of `inventoryValue` over filtered rows | FAIL: reconstructed and filter-scoped |
| Vật tư chính/phụ/tiêu hao | frontend classification of audit rows | WARNING: depends on loosely normalized labels |
| Sắp hết/Hết hàng | frontend `statusOf()` | WARNING: valid rule over potentially partial rows |
| Nhập hôm nay | today count/quantity; latest-five value | FAIL: value is not restricted to today |
| Xuất hôm nay | today count/quantity; latest-five value | FAIL: value is not restricted to today |
| Điều chuyển hôm nay | today count/quantity; value `0` | FAIL: hard-coded financial value |

Invalid numeric values are normalized to zero. This avoids `NaN` rendering but can
present missing or malformed data as a legitimate zero.

## Chart Audit

### Phân bổ và nhóm vật tư

Derived from the current filtered audit payload. It is deterministic but incomplete
when the material count exceeds the 1,000-row backend cap.

### Biến động tồn

The page starts from current stock and reverses recent transaction quantities to
derive historical balances. The source contains only the latest 200 transactions,
so older periods and high-volume installations are silently wrong.

### Value Trend

When transaction data is absent, the page generates six labeled points using
multipliers of current inventory value. These values are fabricated, not an empty
state or real history. Result: **FAIL**.

### Alerts and Recent Activity

Alerts are derived from filtered material rows. Recent activity uses the limited
transaction payload. Neither widget can establish completeness at scale.

## Request and Cache Behavior

- Queries start when the page mounts; there is no per-widget lazy loading.
- Audit and transactions poll independently every 5 and 4 seconds.
- React Query uses default global settings; these hooks do not define
  `staleTime`, cancellation signals, or `placeholderData`.
- A single page instance shares identical query keys, but navigating between
  workspaces can still trigger refetches under default stale behavior.
- The dashboard does not download an unlimited transaction history, but the
  hard-coded limit creates silent incompleteness rather than safe pagination.

## Result

**FAIL**

Current persisted data matches canonical stock for the 23 checked materials, but
the dashboard read path, metric bindings, and fabricated trend prevent approval.

