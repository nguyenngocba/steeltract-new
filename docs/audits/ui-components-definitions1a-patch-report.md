# PATCH UI.COMPONENTS.DEFINITIONS.1A: Component Definition Expanded Actions & Compact Detail Popup Report

**Date**: 2026-07-30  
**Target Page**: `ComponentsListPage.tsx` (`"Hồ sơ cấu kiện"` tab)  
**Role**: Frontend UI/UX Architect  
**Status**: **IMPLEMENTED & VERIFIED**

---

## 1. Executive Summary & Scope

This patch sprint refined the Component Definition workspace (`ComponentsListPage.tsx`):
1. Added a compact **Delete Action** with a safety **Confirmation Dialog** in the Level 2 "Xem tất cả" workspace and Level 3 detail popup without cluttering Level 1 default table rows.
2. Compacted the **Component Detail Drawer/Popup**: Reduced width to `780px` (`w-[min(780px,calc(100vw-48px))]`), bounded max-height to `82vh`, simplified header hierarchy, and ensured a single scroll owner for body content.
3. Preserved Level 2 "Xem tất cả" as a full-screen large dataset workspace (`w-full max-w-7xl`).

---

## 2. Delete Action & Confirmation Flow

- **API Integration**: Used canonical real API mutation `useDeleteComponent` (`DELETE /components/:id`). Zero local-only fake deletion or mock state.
- **Safety Confirmation Modal**: Clicking Delete triggers a compact confirmation dialog:
  - Header: `Xóa hồ sơ cấu kiện?`
  - Details: `${deletingRow.code} · ${deletingRow.name}`
  - Buttons: `[Hủy]` and `[Xóa hồ sơ]` (Destructive primary button).
- **Backend Dependency Error Handling**: Catches real API rejection errors (e.g. active BOMs, Production Orders, or Project Requirements) and displays the exact backend error message via toast notifications.

---

## 3. Detail Popup / Drawer Sizing & Compactness

- **Old Sizing**: Previously `w-[min(48rem,calc(100vw-2rem))]` (near full-screen on 1366px displays).
- **New Sizing**: Compact width `w-[min(780px,calc(100vw-48px))]` (55-60vw on desktop, bounded at 780px max-width).
- **Height & Single Scroll Owner**: Fixed header, fixed footer/actions, and single scroll owner for the body container.
- **Header Density**: Reduced header height to display identity (`Mã hồ sơ · Tên cấu kiện`), engineering status badge, and compact actions (`[BOM]`, `[Tạo Lệnh Sản xuất]`, `[Xóa]`).
- **Content Density**: Replaced large individual KPI cards with compact metric strips (`Tổng quan`, `Nhu cầu`, `Requirements Table`, `BOM Lineage`).

---

## 4. Level 2 "Xem tất cả" Workspace

- Retained Level 2 as a large workspace modal (`max-w-7xl`, `min-w-[1280px]`).
- Added a subtle trash icon button `[Trash2]` alongside `[Chi tiết]` in the `Thao tác` column to enable compact row deletion within the expanded view.

---

## 5. Data Refresh & Query Invalidation

- Successful component deletion invokes `useDeleteComponent` `onSuccess` callback:
  ```ts
  queryClient.invalidateQueries({ queryKey: ["components"] });
  queryClient.invalidateQueries({ queryKey: ["production", "components"] });
  ```
- Automatically triggers refetching of `useComponentsWorkspace` and `useComponents`, immediately updating Level 1 default table, Level 2 workspace, and KPI counter strips with real server state.

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
