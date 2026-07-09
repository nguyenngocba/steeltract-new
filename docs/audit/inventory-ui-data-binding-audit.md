# EPIC118 Inventory UI/Data Binding Audit

Audit date: 2026-07-09  
Scope: `InventoryOverviewPage`, `InventoryMaterialsPage`, `InventoryMaterialDetailModal`  
Application changes: none

## Conclusion

**Inventory UI/Data Binding: BLOCKED**

The persisted data checked during this audit is internally consistent: all 23 active
materials matched across `inventory_items.quantity`, summed
`inventory_location_stocks.quantity`, and
`InventoryMaterialSnapshot.currentStock`. The UI is nevertheless blocked because
the two primary workspaces do not use that canonical snapshot-first source, contain
incorrect metric bindings, and include a fabricated chart fallback.

## Binding Matrix

| UI | Endpoint | API field | UI field/calculation | Backend source | Read path | Result |
|---|---|---|---|---|---|---|
| Tổng mã vật tư | `GET /inventory/audit` | rows | `summary.totalCodes` | First 1,000 items plus transaction items | Runtime reconstruction | WARNING |
| Tổng tồn | `GET /inventory/audit` | `currentStock` | sum of filtered rows | Sum of transaction-line quantities | No snapshot | FAIL |
| Giá trị tồn | `GET /inventory/audit` | `inventoryValue` | sum of filtered rows | Reconstructed stock x average transaction cost | No snapshot | FAIL |
| Sắp hết/Hết hàng | `GET /inventory/audit` | `currentStock`, `minimumStock` | `statusOf()` | Runtime audit payload | No snapshot | WARNING |
| Nhập hôm nay | `GET /inventory/transactions` | transaction/item rows | count and quantity from today; value from latest five rows | Maximum 200 transactions | Runtime query | FAIL |
| Xuất hôm nay | `GET /inventory/transactions` | transaction/item rows | count and quantity from today; value from latest five rows | Maximum 200 transactions | Runtime query | FAIL |
| Điều chuyển hôm nay | `GET /inventory/transactions` | transaction rows | count/quantity plus hard-coded value `0` | Maximum 200 transactions | Runtime query | FAIL |
| Biến động tồn | audit + transactions | `currentStock`, item quantities | frontend running-balance reconstruction | Maximum 200 transactions | Runtime/client aggregate | WARNING |
| Danh sách vật tư | `GET /inventory/audit` | material and stock fields | client search/filter/sort/page | First 1,000 items | Runtime reconstruction | FAIL |
| Vị trí vật tư | `GET /inventory/zones` | `slotId`, `level`, location stocks | location widgets | Location snapshot, repository fallback | Snapshot-first | PASS |
| Chi tiết vật tư | `GET /inventory/items/:id/detail` | detail payload | drawer sections and analytics | Material snapshot, repository fallback | Snapshot-first | PASS |
| Lịch sử chi tiết | same detail endpoint | inbound/outbound/project histories | client pagination | Snapshot payload containing full histories | Snapshot-first but unbounded | WARNING |
| File vật tư | attachment endpoint scoped by material | attachment rows | image/document tabs | Attachment service | Tab-gated | PASS |
| File giao dịch | attachment endpoint without material scope | all inventory transaction attachments | client-side filtering | Attachment service | Tab-gated, over-fetched | WARNING |

## Real-Data Validation

Read-only Prisma comparisons were run against the available PostgreSQL database.

- Active materials checked: 23.
- `inventory_items.quantity` vs summed location stock: 23/23 match.
- Material snapshot vs summed location stock: 23/23 match.
- Transaction-derived audit stock vs summed location stock: 23/23 match for the
  current dataset.
- `VT-NEW-00001`: all three canonical quantities equal `5763.9`; the detail API
  returned the same value across 10 locations.
- API payloads preserve `slotId` and `level` independently. For example,
  `slotId=A01`, `level=L2`. `A01:L2` appears only as a display/grouping key in
  zone occupancy data.

Current parity does not validate the read-path design. `/inventory/audit` rebuilds
stock from transaction history and is capped at 1,000 materials; it does not read
`InventoryMaterialSnapshot` or canonical location balances.

## Freeze Safety

- **Repository/API boundary:** frontend uses public APIs; no direct database access.
- **Snapshot reader:** material detail and locations comply. Overview and material
  list bypass the frozen snapshot-first path.
- **React Query:** all reviewed API access uses React Query, but global defaults
  provide no module-specific stale/cache policy.
- **Frontend business logic:** stock status, historical balances, forecasts, and
  several business metrics are recomputed in React.
- **Fake data:** Overview fabricates a six-point `valueTrend` when transactions are
  absent. This violates the audit acceptance criteria.
- **Silent truncation:** 1,000-material and 200-transaction backend caps have no
  pagination metadata, so the UI cannot disclose incomplete totals.

## Severity Summary

### P0

- Replace the fabricated value trend with an explicit empty state.
- Bind Overview and Materials to a canonical snapshot/read-model contract.
- Correct inbound/outbound “today” values and transfer value.
- Correct the Materials “stocktake” and “inventory variance” semantic mappings.

### P1

- Add server-side search, filtering, sorting, and pagination.
- Add paginated material history and material-scoped transaction attachments.
- Remove client reconstruction based on the latest 200 transactions.

### P2

- Expose query errors instead of converting failures into empty datasets.
- Clarify when KPIs are filter-scoped.
- Stabilize list keys and improve long-data/overflow behavior.

