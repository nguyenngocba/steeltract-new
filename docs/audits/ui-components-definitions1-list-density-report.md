# SPRINT UI.COMPONENTS.DEFINITIONS.1: Component Definition List Density & Detail Redesign Report

**Date**: 2026-07-30  
**Target Page**: `ComponentsListPage.tsx` (`"Hồ sơ cấu kiện"` tab)  
**Role**: Frontend UI/UX Architect  
**Status**: **IMPLEMENTED & VERIFIED**

---

## 1. Executive Summary

This sprint redesigned the Component Definition workspace (`"Hồ sơ cấu kiện"`) in the Components module. The redesign establishes a crisp **Three-Level Information Architecture** while strictly enforcing canonical domain semantics (`Component` = engineering definition, `ProjectComponentRequirement` = project demand, `ProductionOrder` = production allocation, `ComponentInstance` = physical unit).

The workspace layout features:
- **Level 1 (Default Operational Table)**: 8 high-value columns optimized for operational scanning of engineering definitions and project requirements.
- **Level 2 (Expanded Detailed Workspace)**: Full 12-column modal view triggered by `"Xem tất cả"`.
- **Level 3 (Detail Drawer)**: Engineering-focused drawer displaying technical specs, revision status, project requirement breakdowns, and production allocation lineage.

---

## 2. Information Architecture & Table Specifications

### Level 1: Default Operational Table (8 Columns)
1. **Cấu kiện (Mã & Tên)**: Combined dual-line identity cell (`w-[240px]`). Code in `font-mono text-cyan-300 text-[11px]`, Name in `font-medium text-slate-100 text-xs truncate`.
2. **Công trình**: Compact project requirement summary (`w-[150px]`). Shows single project code/name or `Project A (+2)` for multiple project requirements.
3. **Loại / Quy cách**: Combined `componentType` & `profile` (`w-[160px]`). e.g. `Dầm · H300×150` with `truncate`.
4. **Nhu cầu**: Total required quantity `requiredQuantity` (`w-[85px]`, right-aligned, `font-mono tabular-nums text-slate-200`).
5. **Còn lại**: Remaining requirement quantity `remainingRequirementQuantity` (`w-[85px]`, right-aligned, `font-mono tabular-nums font-medium text-emerald-300`).
6. **Rev / BOM**: Engineering readiness badges (`w-[110px]`, center-aligned). Combines `R03` + `BOM ✓` or `BOM ✗`.
7. **Trạng thái kỹ thuật**: Engineering lifecycle status badge (`w-[130px]`, center-aligned).
8. **Thao tác**: "Chi tiết" trigger button (`w-[70px]`, center-aligned).

### Level 2: Expanded Detailed Workspace ("Xem tất cả")
Full 12-column modal workspace (`w-full max-w-7xl`):
- Columns: `Mã hồ sơ`, `Tên cấu kiện`, `Công trình / Yêu cầu`, `Loại`, `Profile / Quy cách`, `Revision`, `BOM State`, `SL yêu cầu`, `Đã phân bổ`, `Còn lại`, `Trạng thái kỹ thuật`, `Thao tác`.
- Features sticky headers (`sticky top-0 z-10`), stable row height, sticky search/filter toolbar, and pagination.

### Level 3: Engineering Detail Drawer
Opened via row click or "Chi tiết" action:
- **Identity Header**: `Hồ sơ thiết kế kỹ thuật (Engineering Definition)` with clear project context.
- **KPI Summary Cards**: `Trạng thái KT`, `SL Yêu cầu`, `Đã phân bổ PO`, `Nhu cầu còn lại`.
- **Engineering Specs Grid**: `Mã hồ sơ`, `Tên cấu kiện`, `Loại cấu kiện`, `Profile`, `Revision`, `BOM State`.
- **Project Requirements Table**: `RequirementTable` with `requiredQuantity`, `allocatedProductionQuantity`, `remainingRequirementQuantity`.
- **BOM & Production Orders Lineage**: Linked Production BOMs table.

---

## 3. Domain & Quantity Semantics Enforcement

- **Engineering Definition Integrity**: `Component` represents engineering drawings/specifications only. No physical inventory states (`STOCK`, `READY`, `SHIPPED`, `DELIVERED`) are used for Component Definitions.
- **Real Quantity Read-Model**:
  - `requiredQuantity`: Total project demand.
  - `allocatedProductionQuantity`: Quantity allocated into Production Orders.
  - `remainingRequirementQuantity`: `Math.max(0, requiredQuantity - allocatedProductionQuantity)`.
- **Zero Mock Data**: Derived strictly from existing read models (`useComponentsWorkspace`, `useComponents`).

---

## 4. Typography & Truncation Principles

- **Cell Height**: Enforced single-line height (`py-2`) across Level 1 and Level 2 tables.
- **Truncation**: Applied `truncate` and `min-w-0` on material names, profiles, and project strings with native HTML `title` tooltips for hover inspection.
- **Typography Weights**:
  - Table Text: `font-medium text-slate-100`
  - Code & Profile: `font-mono text-cyan-300` / `text-slate-300`
  - Numeric Quantities: `font-mono font-medium tabular-nums`

---

## 5. Responsive Behavior Across Viewports

- **1366px Viewports**: Level 1 default table fits within `940px` min-width without horizontal scrollbar overspill.
- **1440px & 1920px Viewports**: Table columns expand smoothly within fixed flex bounds without awkward visual gaps.

---

## 6. Verification Results

1. **Frontend Tests**:
   ```bash
   pnpm -C apps/frontend test
   ```
   - **Result**: Passed cleanly (**2/2 test suites passed, 4/4 tests passed**).

2. **TypeScript Compilation**:
   ```bash
   pnpm -C apps/frontend exec tsc --noEmit
   ```
   - **Result**: Passed with **0 type errors**.

3. **Frontend Build**:
   ```bash
   pnpm -C apps/frontend build
   ```
   - **Result**: Compiled 100% cleanly (**0 errors**).

4. **Backend Build**:
   ```bash
   pnpm -C apps/backend-api build
   ```
   - **Result**: Compiled 100% cleanly (**0 errors**).

5. **Git Code Quality**:
   ```bash
   git diff --check
   ```
   - **Result**: Passed with **0 formatting/whitespace errors**.
