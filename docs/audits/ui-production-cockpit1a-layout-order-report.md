# PATCH UI.PRODUCTION.COCKPIT.1A: Restore Production Orders as Primary Workspace & Pagination Report

**Date**: 2026-07-30  
**Target Tab**: `"Tổng quan sản xuất"` (`ProductionCockpitPage.tsx`) in Production Module  
**Scope**: Frontend UI & Layout Only  
**Status**: **IMPLEMENTED & VERIFIED**

---

## 1. LAYOUT BEFORE / AFTER

### Before Patch
- The "Lệnh sản xuất" table was placed at the very bottom of the page (Row 4), underneath all analytical charts.
- Search and filter toolbar was separated from the table by multiple chart rows.
- Table pagination was missing from the main embedded preview table.

### After Patch
- **Restored Primary Information Hierarchy**:
  1. **Page Header**: Title & subtitle.
  2. **KPI Strip**: 6 top operational KPI cards.
  3. **Search / Filter Toolbar**: Single-line filter bar (`statusFilter`, `search`, `Làm mới`, `Tìm kiếm`).
  4. **Lệnh sản xuất Table + Pagination**: Placed directly below the toolbar as the primary operational workspace.
  5. **Production Analytics Section**: Tải xưởng (8 cols) + Trạng thái (4 cols), Sẵn sàng vật tư (6 cols) + Lệnh cần chú ý (6 cols), Nhật ký vận hành (12 cols).

---

## 2. TABLE POSITION & SEARCH/FILTER FLOW

- **Table Position**: Immediately below the Search/Filter toolbar. No charts or cards are interspersed between the search toolbar and the Lệnh sản xuất table.
- **Search / Filter Flow**:
  - `statusFilter` & `search` state directly drive `useProductionCockpitReadModel({ page, limit: 8, search, status })`.
  - Filter changes trigger page reset (`setCockpitPage(1)`).
  - Search operates on the full dataset at the API query level.

---

## 3. PAGINATION RESTORED & PAGINATION SOURCE

- **Pagination Restored**: Added `<InventoryPagination>` directly underneath the primary dashboard table.
- **Pagination Source**: **SERVER** (derived from `readModel.meta` returning `page`, `limit`, `total`, `totalPages` from backend query `GET /production/cockpit`).
- **Rows Per Page**: Default 8 items (`maxRows={8}`) for compact overview preview.

---

## 4. XEM TẤT CẢ BEHAVIOR

- Clicking `[Xem tất cả]` opens Level 2 expansive workspace modal (`w-[96vw] max-w-[1720px] h-[88vh]`).
- Level 2 workspace includes its own sticky header, 9-column detailed table, and independent bottom pagination.

---

## 5. PROGRESS SOURCE & PROJECT NAME AUDITING

- **Progress Source**: `order.cockpit.progress` (authoritative backend calculation derived from stage completion ratio and order execution state).
- **Project Label Auditing**:
  - Audited `row.component?.project`: Renders `${project.code} - ${project.name}` font-medium when project object is populated.
  - Fallback: Renders `row.projectId` font-mono when only raw project string ID is available in backend model.

---

## 6. ANALYTICS POSITION

Analytics section is positioned below the primary table and pagination under a clear section divider:
- **Row A**: `Tải xưởng theo Công đoạn` (8 cols, `h-[270px]`) & `Trạng thái Lệnh sản xuất` (4 cols, `h-[270px]`).
- **Row B**: `Tình trạng sẵn sàng Vật tư` (6 cols, `h-[260px]`) & `Lệnh sản xuất cần chú ý` (6 cols, `h-[260px]`).
- **Row C**: `Nhật ký vận hành sản xuất` (12 cols, `h-[240px]`).

---

## 7. VERIFICATION RESULTS

### Verified Commands
1. `pnpm -C apps/frontend test` -> **PASS** (2/2 test suites passed, 4/4 tests passed).
2. `pnpm -C apps/frontend exec tsc --noEmit` -> **PASS** (0 type errors).
3. `pnpm -C apps/frontend build` -> **PASS** (0 build errors).
4. `pnpm -C apps/backend-api build` -> **PASS** (0 build errors).
5. `git diff --check` -> **PASS** (0 formatting/whitespace errors).

### Not Verified
- Browser visual certification was not executed in automated CLI mode (verified via static typing, unit tests, frontend & backend compilation).
