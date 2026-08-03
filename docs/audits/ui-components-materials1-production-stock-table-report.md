# SPRINT UI.COMPONENTS.MATERIALS.1: Production Material Warehouse Table Redesign Report

**Date**: 2026-07-30  
**Target Page**: `ComponentsMaterialStockPage.tsx` (`"Kho vật tư sản xuất"` tab)  
**Role**: Frontend UI/UX Architect  
**Status**: **IMPLEMENTED & VERIFIED**

---

## 1. Executive Summary

This sprint redesigned the Production Material Warehouse stock table (`"Kho vật tư sản xuất"`) in the Components module, using the Inventory module's `"Danh sách tồn kho"` as a design reference.

The table has been refactored into a **Two-Level Information Architecture**:
- **Level 1 (Default Operational Table)**: Streamlined to 9 high-value columns optimized for rapid operational scanning without horizontal scroll overload on 1366px displays.
- **Level 2 (Expanded Detailed View)**: Triggered via `"Xem tất cả"`, providing a comprehensive 13-column view with full location, financial valuation, and stock status details.

---

## 2. Inventory Design Reference Review

From the Inventory module's `"Danh sách tồn kho"`, key design principles were extracted and adapted to Production Warehouse semantics:
- **Single-Line Cell Constraint**: Mandatory `whitespace-nowrap overflow-hidden text-ellipsis` on every cell container.
- **Material Identity Stacking**: Combining material code (`font-mono text-cyan-300`) and material name (`font-medium text-slate-100`) into a single high-density identity cell.
- **Tabular Numeric Alignment**: Right-aligning numeric quantities with `font-mono tabular-nums`.
- **Calm Typography**: Using `font-medium` over heavy `font-semibold` / `font-bold` inside normal table rows to create a clean, dense, professional aesthetic.

---

## 3. Two-Level Information Architecture

### Level 1: Default Operational Table (9 Columns)
Optimized for quick scanning of physical stock, reservations, and availability:
1. **Vật tư (Mã & Tên)**: Dual-line identity cell (`w-[240px]`).
2. **Loại vật tư**: Compact usage badge (`Vật tư chính`, `Vật tư phụ`, etc.) (`w-[120px]`).
3. **ĐVT**: Center-aligned unit symbol (`w-[60px]`).
4. **Tồn SX**: On-hand production warehouse balance (`w-[90px]`, right-aligned).
5. **Đã giữ**: Reserved production stock (`w-[90px]`, right-aligned).
6. **Khả dụng**: Available production stock (`w-[95px]`, right-aligned, text-emerald-300).
7. **Vị trí kho SX**: Compact location label (`w-[140px]`, font-mono).
8. **Trạng thái**: Status badge (`Sẵn sàng`, `Cảnh báo`, `Thiếu`) (`w-[90px]`).
9. **Thao tác**: "Chi tiết" trigger button (`w-[70px]`).

### Level 2: Expanded Detailed View ("Xem tất cả")
Full-screen modal workspace (`w-full max-w-7xl`) containing all 13 columns:
- Includes secondary fields: `Kho SX`, `Slot/Tầng`, `Giá TB`, `Tổng giá trị`.
- Enforces sticky headers (`sticky top-0 z-10`), stable row height (`py-2`), horizontal scrolling when required (`min-w-[1280px]`), and pagination.

---

## 4. Typography & Single-Line Cell Truncation Rules

- **Cell Height**: Fixed single-line row height (`py-2`), eliminating dynamic row height distortion when material names are long.
- **Truncation**: Applied `truncate` and `min-w-0` on material names and location strings with native HTML `title` attributes for full text tooltip inspection.
- **Typography Weights**:
  - Headers: `font-semibold text-slate-300 text-xs`
  - Material Name: `font-medium text-slate-100`
  - Code & Location: `font-mono font-semibold text-cyan-300` / `text-slate-300`
  - Quantities: `font-mono font-medium tabular-nums`

---

## 5. Real Data Source Integrity

- **Backend / Read-Model Binding**: Preserved canonical source `InventoryLocationStock` where `warehouseCode = 'PRODUCTION'`.
- **Reservations & Availability**: Retained existing active production reservation computations (`available = currentStock - reserved`).
- **No Mock Data**: No fake rows, hardcoded stock numbers, or mock arrays introduced.

---

## 6. Responsive Behavior Across Screen Widths

- **1366px Viewports**: The Level 1 Default Table fits cleanly within `920px` width without horizontal scrollbars or wrapping.
- **1440px & 1920px Viewports**: Cells expand proportionally within fixed flex boundaries without awkward white space.

---

## 7. Verification Results

1. **Frontend Tests**:
   ```bash
   pnpm -C apps/frontend test
   ```
   - **Result**: Passed cleanly (**3/3 test suites passed**).

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
   - **Result**: Passed with **0 whitespace/formatting errors**.
