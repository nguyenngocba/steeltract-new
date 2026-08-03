# SPRINT UI.PRODUCTION.COCKPIT.1: Production Overview Layout Density & Work Order Table Redesign Report

**Date**: 2026-07-30  
**Target Tab**: `"Tổng quan sản xuất"` (`ProductionCockpitPage.tsx`) in Production Module  
**Scope**: Frontend UI & Layout Only  
**Status**: **IMPLEMENTED & VERIFIED**

---

## 1. AUDIT FINDINGS

Prior to redesigning the overview layout, all widgets, charts, and cards in `ProductionCockpitPage.tsx` were audited:

| Component / Chart Title | Data Source / Hook | Primary Metric | Height / Grid Span Before | Status / Action |
|---|---|---|---|---|
| **KPI Strip** (6 Cards) | `useProductionCockpitReadModel` | `total`, `running`, `completed`, `issuedQty`, `consumedQty`, `reservedQty` | 6 cols, inconsistent spacing | **RETAINED & COMPACTED** into 6 top cards |
| **Luồng thép & Tiêu thụ xưởng** | `readModel.summary` | Steel Issued / Consumed / Reserved (kg) | `CHART_LG` (4 cols) | **REPOSITIONED & EXPANDED** to Row 1 (8 cols, `h-[270px]`) |
| **Trạng thái Lệnh sản xuất** | `readModel.overview.progress` | Running / Pending / Completed distribution | `CHART_LG` (4 cols) | **REPOSITIONED** to Row 1 (4 cols, `h-[270px]`) |
| **Tải xưởng theo Công đoạn** | `readModel.overview.stages` | Cutting, Assembly, Welding, Painting, Inspection | `CHART_LG` (8 cols) | **REPOSITIONED** to Row 2 (6 cols, `h-[260px]`) |
| **Tình trạng sẵn sàng Vật tư** | `readModel.overview.material` | Issued / Waiting / Shortage material readiness | `CHART_MD` (3 cols) | **REPOSITIONED** to Row 2 (6 cols, `h-[260px]`) |
| **Lệnh SX cần chú ý** | `attentionRows` (filtered POs) | Delayed, Material Shortage, Low Progress POs | `CHART_MD` (3 cols) | **REPOSITIONED** to Row 3 (6 cols, `h-[240px]`) |
| **Nhật ký vận hành sản xuất** | `useProductionLogs` | Recent production activity logs | `CHART_MD` (3 cols) | **REPOSITIONED** to Row 3 (6 cols, `h-[240px]`) |
| **Bảng "Lệnh sản xuất"** | `readModel.data` | Production Orders operational table | Embedded 9 cols | **REDESIGNED** to Row 4 (Full 12 cols, 8 compact cols) |

---

## 2. LAYOUT BEFORE / AFTER

### Before Redesign
- Asymmetric 9-column / 3-column split: Main table squeezed into 9 columns on the left with a narrow 3-column sidebar containing multiple stacked Donut charts and lists.
- Vertical height imbalances: Charts had varying heights (`CHART_LG` vs `CHART_MD`), creating empty gaps on 1366px & 1920px viewports.
- Table headers & title: Titled `"Top 8 lệnh sản xuất"` when embedded, causing confusion regarding full dataset availability.

### After Redesign
- **Structured 4-Level Information Hierarchy**:
  - **Level A (Tình hình hiện tại)**: 6 Top KPI Cards + Row 1 Primary Production Analytics (8-col Steel Flow & 4-col Status Distribution).
  - **Level B (Tiến độ & Tải xưởng)**: Row 2 Operational Analytics (6-col Stage Workload & 6-col Material Readiness).
  - **Level C (Điểm nghẽn & Nhật ký)**: Row 3 Bottleneck Analytics (6-col Attention POs & 6-col Production Activity Logs).
  - **Level D (Lệnh sản xuất)**: Row 4 Primary Operational Table ("Lệnh sản xuất" 12-col full width grid + 96vw workspace modal).

---

## 3. KPI STRIP

Rendered as 6 compact cards in a single row (`grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-2`):
1. **Tổng Lệnh sản xuất**: `formatQuantity(summary?.total ?? orders.length, 0)` (Blue tone, `Factory` icon).
2. **Đang sản xuất**: `formatQuantity(running, 0)` (Cyan tone, `Clock` icon).
3. **Đã hoàn thành**: `formatQuantity(completed, 0)` (Emerald tone, `CheckCircle2` icon).
4. **Steel Issued**: `formatQuantity(issuedQty, 0) kg` (Purple tone, `Package` icon).
5. **Steel Consumed**: `formatQuantity(consumedQty, 0) kg` (Amber tone, `Wrench` icon).
6. **Vật tư giữ chỗ**: `formatQuantity(reservedQty, 0) kg` (Blue tone, `FileStack` icon).

---

## 4. CHART GRID REORGANIZATION

### Row 1: Primary Production Analytics (12 Columns)
- **Left (8 cols)**: `Luồng thép & Tiêu thụ xưởng` (`h-[270px]`) – Visualizes `issuedQty`, `consumedQty`, `reservedQty` (kg) with compact summary tiles.
- **Right (4 cols)**: `Trạng thái Lệnh sản xuất` (`h-[270px]`) – Donut chart visualizing `Running`, `Pending`, `Completed` MOs.

### Row 2: Operational Analytics (12 Columns)
- **Left (6 cols)**: `Tải xưởng theo Công đoạn` (`h-[260px]`) – Stage workload breakdown (`Cutting`, `Assembly`, `Welding`, `Painting`, `Inspection`).
- **Right (6 cols)**: `Tình trạng sẵn sàng Vật tư` (`h-[260px]`) – Donut chart (`Đã cấp phát`, `Chờ cấp phát`, `Thiếu vật tư`).

### Row 3: Bottleneck & Activity Analytics (12 Columns)
- **Left (6 cols)**: `Lệnh sản xuất cần chú ý` (`h-[240px]`) – Lists top 5 attention items (Delayed, Material Shortage, Low Progress).
- **Right (6 cols)**: `Nhật ký vận hành sản xuất` (`h-[240px]`) – Lists 5 recent operational logs (`logs.slice(0, 5)`).

---

## 5. PRODUCTION ORDER TABLE REDESIGN

### Title & Scope
- Renamed table header title to **`Lệnh sản xuất`** (removed "Top 8" terminology).
- Renders a 6-8 item operational preview grid in full 12-column width.
- `[Xem tất cả]` button opens Level 2 expansive workspace modal (`w-[96vw] max-w-[1720px] h-[88vh]`).

### 8 High-Value Operational Columns
1. **Lệnh SX (WO No)**: Stacked identity (`orderNo` font-mono font-semibold cyan top, `title` text-slate-400 bottom, single-line truncated).
2. **Cấu kiện**: `component.code · component.name` (single-line truncated).
3. **Công trình**: `projectId` / `project.code` (font-mono truncated).
4. **Số lượng**: `quantity` font-mono tabular-nums text-white.
5. **Vật tư sẵn sàng**: `materialReadiness` % with compact progress meter & status label.
6. **Tiến độ SX**: Real `progress` % with status-toned progress meter.
7. **Kế hoạch**: Formatted `plannedEndAt` date font-mono (+ `Trễ tiến độ` badge if delayed).
8. **Trạng thái**: ProductionOrder `StatusChip`.

---

## 6. REAL DATA SOURCES

- `useProductionCockpitReadModel`: Authoritative overview numbers, order list, stage distribution, and material readiness.
- `useProductionLogs`: Operational activity log events.
- Pure canonical data binding retained; zero mock data or sample rows created.

---

## 7. RESPONSIVE TARGETS

- **1366x768**: Standardized card heights (`h-[270px]`, `h-[260px]`, `h-[240px]`) eliminate vertical layout gaps.
- **1440x900 & 1920x1080**: Full 12-column grid spans balance visualization widths cleanly without stretching charts awkwardly.

---

## 8. VERIFICATION RESULTS

### Verified Commands
1. `pnpm -C apps/frontend test` -> **PASS** (2/2 test suites passed, 4/4 tests passed).
2. `pnpm -C apps/frontend exec tsc --noEmit` -> **PASS** (0 type errors).
3. `pnpm -C apps/frontend build` -> **PASS** (0 build errors).
4. `pnpm -C apps/backend-api build` -> **PASS** (0 build errors).
5. `git diff --check` -> **PASS** (0 formatting/whitespace errors).

### Not Verified
- Browser visual certification was not executed in automated CLI mode (verified via static typing, unit tests, frontend & backend compilation).
