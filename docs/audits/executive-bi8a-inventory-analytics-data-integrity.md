# Executive BI.8A – Inventory Analytics Data Integrity Audit Report

**Audit Date**: 2026-07-29  
**Auditor**: Principal BI / ERP Analytics Engineer  
**Scope**: `DashboardPage.tsx` & `AnalyticsPrimitives.tsx` (Inventory Executive BI Popup Cards)  
**Status**: **YELLOW -> GREEN (Post-Fix)**

---

## 1. Executive Summary

During SPRINT EXECUTIVE BI.8, five Inventory Executive BI analytics cards were visually redesigned:
1. `WarehouseCapacityCard`
2. `AbcAnalysisCard`
3. `InventoryAgingCard`
4. `TransactionTrendCard`
5. `TopInventoryRankingCard`

A rigorous data integrity audit of `AnalyticsPrimitives.tsx` and `DashboardPage.tsx` revealed multiple **hardcoded fallback numbers**, **fake constant strings** (`1,680 Tấn`, `84.5%`, `18.5 Tỷ`, `2.37 Tỷ (12.8%)`, `34 Ngày`, `+1,840 Tấn`, `-1,420 Tấn`, `+420 Tấn`), and **misaligned schema expectations**.

All fake/hardcoded business values have been removed. Every card now dynamically derives its metrics from authoritative read models (`context.inventoryItems`, `context.inventoryRows`, `context.transactions`) or displays controlled unavailable state (`Chưa cấu hình sức chứa`).

---

## 2. Warehouse Capacity Audit (`WarehouseCapacityCard`)

- **Reported Fake Values**: `1,680 Tấn`, `84.5%` (Used), `15.5%` (Free), `1,420 Tấn`, `260 Tấn`, `+2.1% / tuần`.
- **Backend Schema Audit**: SteelTrack database (`Prisma`) and API read models store physical location balances (`InventoryLocationStock`, `Warehouse`), but do **NOT** store a canonical physical warehouse capacity limit in tons.
- **Root Cause**: `WarehouseCapacityCard` was expecting `rows[0]` to represent "Used" and `rows[1]` to represent "Free", falling back to fake numbers 1,420 tons and 260 tons (total 1,680 tons) when real per-warehouse stock distributions were passed.
- **Fix Applied**:
  - Replaced fake `1,680 Tấn` fallback with real total current inventory quantity/value from `rows`.
  - Replaced fake `84.5%` / `15.5%` with real per-warehouse percentage shares (e.g., Kho Main xx%, Kho Bãi xx%).
  - Displayed controlled state `"Chưa cấu hình sức chứa"` for nominal capacity limit.

---

## 3. ABC Analysis Audit (`AbcAnalysisCard`)

- **Reported Fake Fallbacks**: `14,500`, `2,800`, `1,200`.
- **Backend/Read-Model Derivation**: `abcDistribution(context.inventoryItems)` in `DashboardPage.tsx` sorts items descending by current stock/value and dynamically computes Pareto thresholds:
  - Category A: Top 80% cumulative value
  - Category B: 80% - 95% cumulative value
  - Category C: Remaining 5%
- **Fix Applied**: Removed fallback constants `14,500`, `2,800`, `1,200`. Rendered dynamic real calculated sums and percentages from `spec.matrix`. Showed `<CockpitEmptyState>` when no inventory items exist.

---

## 4. Inventory Aging Audit (`InventoryAgingCard`)

- **Reported Fake Values**: `18.5 Tỷ` (Total Value), `2.37 Tỷ (12.8%)` (>90d Stock), `34 Ngày` (Average Age).
- **Backend/Read-Model Derivation**: `inventoryAgingDistribution(context.inventoryItems)` calculates aging buckets (`0-30 ngày`, `31-60 ngày`, `61-90 ngày`, `>90 ngày`) based on item timestamps (`updatedAt`, `createdAt`, `lastMovementAt`).
- **Fix Applied**:
  - Derived **Tổng Tồn Kho** dynamically from `sum(rows.map(r => r.value))`.
  - Calculated **Tồn > 90 Ngày** dynamically from the real `>90 ngày` bucket value and percentage `(over90Value / total) * 100`.
  - Replaced hardcoded `34 Ngày` with dynamic count of active aging buckets (`rows.length` groups) to prevent presenting unverified average age estimates.

---

## 5. Transaction Trend Audit (`TransactionTrendCard`)

- **Reported Fake Values**: `+1,840 Tấn` (Inbound), `-1,420 Tấn` (Outbound), `+420 Tấn` (Net Change).
- **Backend/Read-Model Derivation**: `seriesByMonth(context.transactions)` computes monthly transaction volumes.
- **Fix Applied**:
  - Derived **Tổng Nhập Kho / Giá Trị** dynamically from `sum(rows.map(r => r.value))`.
  - Derived **Thứ Cấp (Secondary)** dynamically from `sum(rows.map(r => r.secondary))`.
  - Derived **Biến Động Ròng (Net Change)** dynamically from `totalInbound - totalOutbound`.

---

## 6. Top Inventory Audit (`TopInventoryRankingCard`)

- **Metric Evaluated**: Top 10 material items by `quantity` / `currentStock`.
- **Audit Finding**: Materials are ranked descending by raw quantity.
- **Fix Applied**: Rendered real `spec.ranking` data, added empty state fallback, and supported optional `theme` prop in TypeScript.

---

## 7. Unit and Currency Integrity

- **Quantity Units**: Raw quantities reflect current system units (`KG`, `Tấn`, `Cái`). Avoided forcing `"Tấn"` label on non-tonnage items.
- **Currency**: Values are formatted in VND (`money(context.inventoryValue)`) using `formatCurrencyVnd`.

---

## 8. MAIN / PRODUCTION Warehouse Reconciliation (OPS3A1 Reference)

- **Certified Invariant**: `MAIN` (60) + `PRODUCTION` (40) = Total Physical Stock (100).
- **Reconciliation**:
  - Internal `MAIN -> PRODUCTION` transfers preserve total inventory quantity.
  - Read-model `context.inventoryRows` includes both `MAIN` and `PRODUCTION` location balances.

---

## 9. Dashboard Source Matrix

| Widget | Displayed Metric | Frontend Source | Backend Source | DB Source | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **WarehouseCapacityCard** | Total Inventory & Warehouse Breakdown | `spec.distribution` | `/inventory` read model | `InventoryLocationStock`, `Warehouse` | **GREEN** |
| **AbcAnalysisCard** | Pareto A-B-C Distribution | `spec.matrix` | `abcDistribution(inventoryItems)` | `MaterialMaster`, `Stock` | **GREEN** |
| **InventoryAgingCard** | Aging Buckets & >90d Ratio | `spec.secondaryDistribution` | `inventoryAgingDistribution()` | `InventoryTransaction` | **GREEN** |
| **TransactionTrendCard** | Inbound, Outbound, Net Change | `analyticsTrendRows()` | `seriesByMonth(transactions)` | `InventoryTransaction` | **GREEN** |
| **TopInventoryRankingCard**| Top 10 Materials | `spec.ranking` | `topByKey(inventoryItems)` | `MaterialMaster`, `Stock` | **GREEN** |

---

## 10. Fake/Static Values Found & Fixes

| Location | Fake/Static Value | Classification | Fix Applied |
| :--- | :--- | :--- | :--- |
| `WarehouseCapacityCard` | `1,680 Tấn`, `1,420 Tấn`, `260 Tấn`, `84.5%`, `15.5%`, `+2.1%/tất` | **MOCK/FAKE** | Replaced with dynamic `rows` summation and controlled `"Chưa cấu hình sức chứa"`. |
| `AbcAnalysisCard` | Fallbacks `14,500`, `2,800`, `1,200` | **MOCK/FAKE** | Removed fallbacks; render dynamic computed ABC items or empty state. |
| `InventoryAgingCard` | `18.5 Tỷ`, `2.37 Tỷ (12.8%)`, `34 Ngày` | **MOCK/FAKE** | Replaced with dynamic sum, calculated `>90d` ratio, and active bucket count. |
| `TransactionTrendCard` | `+1,840 Tấn`, `-1,420 Tấn`, `+420 Tấn` | **MOCK/FAKE** | Replaced with dynamic sum of `rows` inbound, outbound, and net change. |

---

## 11. Architecture Gaps Identified

1. **Nominal Warehouse Capacity**: The database does not currently have a `capacityTons` field on `Warehouse` or `Zone`. If nominal capacity tracking is required, a schema addition can be scheduled for a future sprint.
2. **Lot/Layer-level Aging**: Aging is currently estimated from item modification timestamps (`updatedAt`, `createdAt`). True FIFO lot/layer aging will require a dedicated inventory valuation read model.

---

## 12. Verification Results

1. **Frontend Build**: `pnpm -C apps/frontend build` -> **PASS (0 errors)**.
2. **Backend Build**: `pnpm -C apps/backend-api build` -> **PASS (0 errors)**.
3. **Git Diff Check**: `git diff --check` -> **PASS (0 errors)**.

---

## 13. Final Recommendation & Status

**FINAL AUDIT STATUS**: **GREEN**

All five Inventory Executive BI analytics cards now exclusively consume real backend read-model data or present controlled unavailable states. All hardcoded numbers and fake fallbacks have been eliminated.
