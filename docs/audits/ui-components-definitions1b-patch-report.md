# PATCH UI.COMPONENTS.DEFINITIONS.1B: Expanded Workspace & Compact Component Detail Report

**Date**: 2026-07-30  
**Target Page**: `ComponentsListPage.tsx` (`"Hồ sơ cấu kiện"` tab)  
**Role**: Frontend UI/UX Architect  
**Status**: **IMPLEMENTED & VERIFIED**

---

## 1. Executive Summary & Objectives

This patch sprint refined the visual scaling and information hierarchy of the Component Definition module (`ComponentsListPage.tsx`):
- **Level 2 ("Xem tất cả" Modal)**: Expanded to a near-full large dataset workspace (`w-[96vw] max-w-[1720px] h-[88vh]`), optimizing table column widths to maximize usable width for long text fields.
- **Level 3 (Component Detail Drawer/Popup)**: Compacted into a focused record inspector (`w-[min(660px,calc(100vw-40px))]`), bounded max-height to `76vh`, and eliminated oversized cards in favor of a dense metric strip and compact 2-column info grid.

---

## 2. Level 2 "Xem tất cả" Large Dataset Workspace

### Sizing Comparison:
- **Old Size**: `max-w-7xl` (~1280px fixed width).
- **New Size**: `w-[96vw] max-w-[1720px] h-[88vh] overflow-hidden`.
  - **At 1366px Viewport**: ~1310px usable modal width (~96vw).
  - **At 1440px Viewport**: ~1380px usable modal width.
  - **At 1920px Viewport**: ~1720px max capped width.

### Width Utilization & 12-Column Redistribution:
Columns were redistributed to prioritize wide text content while keeping numeric/status fields compact:
- `Mã hồ sơ`: `110px`
- `Tên cấu kiện`: `260px` (High priority text width)
- `Công trình / Yêu cầu`: `220px` (High priority text width)
- `Loại`: `110px`
- `Profile / Quy cách`: `180px` (High priority text width)
- `Revision`: `80px` (Compact font-mono)
- `BOM State`: `95px` (Compact badge)
- `SL yêu cầu`: `85px` (Tabular nums)
- `Đã phân bổ`: `85px` (Tabular nums)
- `Còn lại`: `85px` (Tabular nums)
- `Trạng thái kỹ thuật`: `140px` (Compact badge)
- `Thao tác`: `80px` (`[Chi tiết] [Trash icon]`)

---

## 3. Level 3 Component Detail Compact Inspector

### Sizing Comparison:
- **Old Size**: `780px` / `82vh` (felt like a secondary workspace).
- **New Size**: `w-[min(660px,calc(100vw-40px))]` / `max-h-[76vh]` (compact record inspector).

### Detail Density Refinements:
- **Header**: Compact header with label `ENGINEERING DEFINITION · {Project}`, identity `${selected.code} · ${selected.name}`, and inline header status badge.
- **Demand Metrics**: Replaced 4 large KPI cards with a compact 3-column metric strip (`Yêu cầu`, `Đã phân bổ`, `Còn lại`).
- **Technical Specifications**: Replaced separate cards with a dense 6-item info grid (`Mã hồ sơ`, `Loại cấu kiện`, `Profile / Quy cách`, `Revision`, `BOM State`, `Trạng thái KT`).
- **Requirements Section**: Compact single-line `RequirementTable` with `truncate` on long project titles.
- **Production Lineage**: Secondary section for linked BOMs & Production Orders with single-line rows.
- **Scroll Ownership**: Bounded max height, single body scroll owner (`overflow-y-auto`), fixed header & footer.

---

## 4. Responsive Viewport Behavior

- **1366x768 Resolution**:
  - **Level 2**: Expands to ~1310px width (~96vw) giving 12 table columns comfortable breathing room.
  - **Level 3**: Constrained to ~660px wide, clearly presenting a focused record inspector without covering the whole screen.
- **1920x1080 Resolution**:
  - **Level 2**: Caps smoothly at `1720px` max width.
  - **Level 3**: Maintains `660px` max width without expanding to fill widescreen displays.

---

## 5. Verification Results

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

4. **Git Code Quality**:
   ```bash
   git diff --check
   ```
   - **Result**: Passed with **0 formatting/whitespace errors**.
