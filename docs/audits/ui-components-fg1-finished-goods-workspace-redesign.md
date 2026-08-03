# SPRINT UI.COMPONENTS.FG.1: Finished Goods Warehouse Enterprise UI Redesign Audit & Verification Report

**Date**: 2026-07-30  
**Target Tab**: `"Danh sách cấu kiện thành phẩm"` (`ComponentsStockPage.tsx`) in Components Module  
**Scope**: Frontend UI Only  
**Status**: **IMPLEMENTED & VERIFIED**

---

## 1. IMPLEMENTED SUMMARY

Redesigned the Finished Goods Warehouse (`ComponentsStockPage.tsx`) into an enterprise operational workspace matching the exact design language, typography, row density, and information architecture established across SteelTrack (`Inventory "Danh sách tồn kho"`, `Components "Kho vật tư sản xuất"`, `Components "Hồ sơ cấu kiện"`).

- **Level 1 (Default Table)**: Redesigned as a compact 8-column operational table focused on high-value daily dispatch and inspection metrics.
- **Level 2 ("Xem tất cả" Workspace)**: Standardized as a near-full workspace modal (`w-[96vw] max-w-[1720px] h-[88vh]`) featuring an expansive 12-column table grid, sticky headers, and full dataset visibility.
- **Level 3 (Instance Detail Drawer)**: Converted from a generic popup into a right-sliding operational workspace (`w-screen md:w-[64vw] md:max-w-[1280px] md:min-w-[820px] 100vh`) with backdrop dim/blur, 4-card KPI header, horizontal tab navigation (`Tổng quan`, `Sản xuất`, `QC`, `Bãi / Yard`, `Truy vết`), and strict physical vs. engineering semantics.

---

## 2. SOURCE OF TRUTH

- **Canonical Endpoint**: `GET /components/instances/finished-goods` via `useFinishedGoodsInstances` hook.
- **Physical vs. Engineering Semantics Enforcement**:
  - Finished Goods are strictly PHYSICAL `ComponentInstance` records that satisfy backend `FinishedGoodsEligibilityService` (`state: QC_PASSED | USE_AS_IS`).
  - No physical stock estimates are derived from `Component` definition quantities, `ProductionOrder` planned quantities, or legacy `Component.status`.
  - Pure canonical binding retained; no fake rows or mock data created.

---

## 3. DEFAULT TABLE (LEVEL 1)

Designed with 8 high-value operational columns:
1. **Cấu kiện (Instance)**: Stacked identity cell (`instanceNo` font-mono font-semibold cyan top, `${component.code} · ${component.name}` white bottom, single-line truncated).
2. **Công trình**: `project.code - project.name` (truncated).
3. **Loại / Quy cách**: `componentType · profile` (single-line truncated).
4. **Trạng thái**: Physical `ComponentInstance` state badge (`Đạt QC` or `Chấp nhận sử dụng`).
5. **QC Inspection**: Authoritative QC inspection number (`inspectionNo`) or NCR disposition (`ncrNo · Use-As-Is`).
6. **Vị trí**: Yard / Warehouse location (`installedAt ? "Đã lắp đặt" : "Kho thành phẩm"`).
7. **Cập nhật**: Timestamp font-mono (`updatedAt` / `qcPassedAt` / `producedAt`).
8. **Thao tác**: `[Chi tiết]` compact action button.

---

## 4. KPI STRIP

4 compact operational KPI cards rendered above the table:
- **Tổng thành phẩm**: `formatQuantity(summary.total, 0)` (`PackageCheck` icon, blue tone).
- **Đạt QC**: `formatQuantity(summary.qcPassed, 0)` (`CheckCircle2` icon, emerald tone).
- **Chấp nhận sử dụng (Use-As-Is)**: `formatQuantity(summary.useAsIs, 0)` (`ShieldCheck` icon, cyan tone).
- **Công trình liên kết**: `formatQuantity(summary.projectCount, 0)` (`Building2` icon, purple tone).

---

## 5. DETAILED WORKSPACE (LEVEL 2)

- **Modal Dimensions**: `w-[96vw] max-w-[1720px] h-[88vh]`.
- **12 Operational Columns**:
  1. `Serial Instance` (font-mono cyan)
  2. `Mã cấu kiện` (font-mono white)
  3. `Tên cấu kiện` (truncate)
  4. `Công trình` (truncate)
  5. `Mã Yêu cầu` (font-mono)
  6. `Lệnh SX (PO)` (font-mono cyan)
  7. `Loại` (truncate)
  8. `Quy cách` (truncate)
  9. `Rev` (font-mono)
  10. `Trạng thái` (Badge)
  11. `QC Evidence` (font-mono emerald)
  12. `Thao tác` (`[Chi tiết]`)

---

## 6. INSTANCE DETAIL WORKSPACE (LEVEL 3)

- **Slide behavior**: Slide right -> left (`w-screen md:w-[64vw] md:max-w-[1280px] md:min-w-[820px] 100vh`) with backdrop blur.
- **Horizontal Tabs (`ModuleTabs`)**:
  - `[Tổng quan]`: Physical identity, Component Definition, Project, Requirement, Production Order, Physical state, timestamps.
  - `[Sản xuất]`: Lineage `ProductionOrder` -> `ComponentInstance` (`orderNo`, `status`, `producedAt`, `requirementNo`).
  - `[QC]`: Authoritative inspection records (`qcInspections`) and NCR records (`ncrs`).
  - `[Yard]`: Yard staging location (`installedAt ? "Đã lắp đặt tại công trình" : "Lưu kho tại Kho thành phẩm"`).
  - `[Truy vết]`: Controlled empty state (`"Nguồn truy vết nâng cao cho cấu kiện vật lý đang được đồng bộ"`).

---

## 7. YARD AWARENESS & ACTIONS AUDIT

- **Yard Awareness**: Finished Goods UI correctly identifies physical staging state (`installedAt ? "Đã lắp đặt" : "Kho thành phẩm"`).
- **Deprecated Endpoint Audit**: No legacy `POST /production/:id/stage-to-yard` calls exist in this page. Canonical `POST /yard/stage` with `componentInstanceId` remains the authoritative backend endpoint when yard staging actions are invoked.

---

## 8. REAL DATA SOURCES

- `useFinishedGoodsInstances`: `GET /components/instances/finished-goods` (Returns `data`, `meta`, and `summary`).
- `useProjectsQuery`: `GET /projects`.
- `useComponentsWorkspace`: `GET /components/workspace` (Dropdown options).

---

## 9. VERIFICATION & BACKEND/DATA GAPS

### Verified Commands:
1. `pnpm -C apps/frontend test` -> **PASS** (2/2 test suites passed, 4/4 tests passed).
2. `pnpm -C apps/frontend exec tsc --noEmit` -> **PASS** (0 type errors).
3. `pnpm -C apps/frontend build` -> **PASS** (0 build errors).
4. `pnpm -C apps/backend-api build` -> **PASS** (0 build errors).
5. `git diff --check` -> **PASS** (0 formatting/whitespace errors).

### Not Verified:
- Browser visual certification was not executed in automated CLI mode (verified via static typing, unit tests, frontend & backend compilation).

### Data Gaps Identified:
- `YardItemPlacement` detail breakdown: Currently `FinishedGoodsInstanceRow` provides `installedAt` boolean/timestamp, but detailed grid zone/rack placement relies on full Yard module query when instance is active.
- Advanced event history trail: `Truy vết` tab renders a controlled empty state until `ActivityLog` instance event logging is exposed via API.

---

## 10. NEXT RECOMMENDATIONS

1. Apply the same 3-level information architecture and slideover workspace pattern to remaining production sub-tabs (`ComponentsProductionPage.tsx`, `ComponentsInternalQcPage.tsx`, `ComponentsTransfersPage.tsx`).
2. Consolidate Yard placement detail queries into `FinishedGoodsInstanceRow` read model.
