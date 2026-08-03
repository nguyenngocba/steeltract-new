# PATCH UI.COMPONENTS.DEFINITIONS.1C: Fix Actual "Chi tiết" Component Inspector Size Report

**Date**: 2026-07-30  
**Target Page**: `ComponentsListPage.tsx` (`"Hồ sơ cấu kiện"` tab) & `ModuleDetailDrawer` (`shared/ui/modules/index.tsx`)  
**Role**: Principal UI/UX & Frontend Architect  
**Status**: **IMPLEMENTED & VERIFIED**

---

## 1. Root Cause Analysis

Tracing the actual click path in `ComponentsListPage.tsx`:
`Row / [Chi tiết] Button` -> `setSelected(row)` + `setDetailOpen(true)` -> `<ModuleDetailDrawer>`

### Identified Causes:
1. **Unconditional `w-screen` Prepending**: `ModuleDetailDrawer` in `apps/frontend/src/shared/ui/modules/index.tsx` calculated `resolvedWidthClass` as `widthClass ? `w-screen ${widthClass}` : sizeClass`. Prepending `w-screen` (`width: 100vw`) forced full viewport width fallback regardless of caller `widthClass`.
2. **Default Full-Height Right Slideover**: `ModuleDetailDrawer` defaulted to `placement="right"`, which applied `h-full` (`100vh` top-to-bottom viewport height).
3. **Inner Component Layout Overflows**: Inner tables (`RequirementTable` and Production Lineage table) lacked `table-fixed w-full` cell constraints and text truncation.

---

## 2. Implemented Fix

### Dimension Changes:
- **Before**:
  - Width: `w-screen w-[min(780px,calc(100vw-48px))]` (evaluated to `100vw` / `780px` full height slideover).
  - Height: `h-full` (`100vh` full screen height).
- **After**:
  - Width: `w-full max-w-[600px] w-[min(600px,calc(100vw-32px))]` (~44% viewport width at 1366px, strictly capped at `600px` on 1920px widescreen).
  - Height: `max-h-[72vh]` (centered record inspector dialog).
  - Placement: `placement="center"` with backdrop blur.

### Inner Layout Compactness:
- **Header**: Compact `ENGINEERING DEFINITION · {Project}` label, title `${selected.code} · ${selected.name}`, inline status badge, and compact actions (`[BOM]`, `[Tạo Lệnh SX]`, `[Xóa]`).
- **Demand Metric Strip**: Compact 3-column strip (`Yêu cầu`, `Đã phân bổ`, `Còn lại`), height ~54px.
- **Technical Information Grid**: Compact 2-column grid (`Mã hồ sơ`, `Loại`, `Profile`, `Revision`, `BOM State`, `Trạng thái KT`).
- **Requirements Table**: Compact 4-column table (`Công trình`, `YC`, `PO`, `Còn`) with `truncate` on project name.
- **Production Lineage**: 3-column table (`Mã BOM / Lệnh`, `SL Vật tư`, `Trạng thái`).
- **Scroll Ownership**: Bounded max height `72vh`, single body scroll owner (`overflow-y-auto`), fixed header and footer.

---

## 3. Verification Across Entry Points

- **Level 1 Default Table -> "Chi tiết"**: Opens centered compact `600px` record inspector (`max-h-[72vh]`).
- **Level 2 "Xem tất cả" Modal -> "Chi tiết"**: Opens centered compact `600px` record inspector (`max-h-[72vh]`).

---

## 4. Level 2 "Xem tất cả" Confirmation

- **Level 2 Workspace**: Remains unchanged as a large dataset workspace (`w-[96vw] max-w-[1720px] h-[88vh]`).

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
