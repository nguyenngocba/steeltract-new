# SPRINT UI.COMPONENTS.DEFINITIONS.2: Component Detail Sliding Workspace Report

**Date**: 2026-07-30  
**Target Page**: `ComponentsListPage.tsx` (`"Hồ sơ cấu kiện"` tab) & `ModuleDetailDrawer` (`shared/ui/modules/index.tsx`)  
**Role**: Principal UI/UX & Frontend Architect  
**Status**: **IMPLEMENTED & VERIFIED**

---

## 1. Component Detail Shell Architecture

- **Old Interaction**: Centered compact dialog (`max-w-[600px]`, `72vh` height popup modal).
- **New Interaction**: Large Right-Side Detail Workspace sliding from **RIGHT -> LEFT** (matching Inventory Material Detail interaction pattern).
- **Actual Sizing**:
  - Desktop: `w-[64vw]` (`max-width: 1280px`, `min-width: 820px`).
  - At 1920px Widescreen: ~1200–1230px usable workspace width.
  - At 1366px Desktop: ~850–900px usable workspace width.
  - Mobile: `w-screen`.
  - Height: `100vh` (full application viewport height).
  - Backdrop: `bg-black/65 backdrop-blur-sm` (background Components page remains visible behind it with dim and blur).

---

## 2. Reference Reuse from Inventory Material Detail

- **Reused Shared Primitives**:
  - `ModuleDetailDrawer`: Reused as slideover container with `placement="right"`.
  - `ModuleTabs`: Reused for top horizontal tab bar (`Tổng quan`, `BOM`, `Nhu cầu`, `Sản xuất`, `Instances`, `Lịch sử`).
  - `ModuleEmptyState`: Reused for controlled empty states.
  - `moduleTableHead`, `inventoryTableRow`: Reused for table row density, single-line cell constraints (`truncate`), font-medium typography, and font-mono tabular nums.

---

## 3. Header, KPI Strip & Tab Navigation

### Header Identity:
- **Tag**: `CẤU KIỆN · ENGINEERING DEFINITION`
- **Title**: `${selected.code} · ${selected.name}` (with `truncate` tooltip).
- **Subtitle**: `${type} · ${profile} · Rev ${revisionNo} · ${statusLabel}`.
- **Actions**: `[BOM]`, `[Tạo Lệnh SX]`, `[Xóa]` (destructive delete confirmation), `[X]` (Close).

### 6-Card Operational KPI Strip:
1. **Nhu cầu**: `requiredQuantity` (canonical demand).
2. **Đã phân bổ PO**: `allocatedProductionQuantity` (allocated production).
3. **Còn lại**: `remainingRequirementQuantity` (remaining demand).
4. **Production Orders**: Count of linked POs.
5. **Instances**: Count of physical component units (`0` if none yet).
6. **Thành phẩm**: Count of QC-accepted finished goods (`0` if none yet).

---

## 4. Tab Breakdown & Canonical Data Sources

1. **Tổng quan (Tab 1)**:
   - Two-column dashboard layout (Left: Engineering Definition specs, Right: Demand & Production summary, Bottom: Project Requirements preview table).
2. **BOM (Tab 2)**:
   - Engineering BOM read model (`useComponentProductionBoms`) showing `Mã BOM`, `Phiên bản`, `Số vật tư`, `Routing`, `KL ước tính (kg)`, `Trạng thái`.
   - Button `[Mở BOM Editor]` launches canonical `ProductionBomModal`.
3. **Nhu cầu (Tab 3)**:
   - `ProjectComponentRequirement` breakdown table showing `Công trình`, `SL Yêu cầu`, `Đã phân bổ PO`, `Còn lại`.
4. **Sản xuất (Tab 4)**:
   - `ProductionOrder` breakdown table linked to this Component Definition showing `Mã Lệnh SX`, `Công trình`, `Số lượng`, `Tiến độ`, `Trạng thái`.
   - Button `[Tạo Lệnh Sản xuất]` launches canonical `ManufacturingOrderModal`.
5. **Instances (Tab 5)**:
   - Physical component instances (`ComponentInstance`).
   - Controlled empty state: `"Chưa có Component Instances vật lý."` (NO fake data).
6. **Lịch sử (Tab 6)**:
   - Audit / Activity log.
   - Controlled empty state: `"Chưa có nguồn lịch sử cấu kiện đầy đủ."` (NO fabricated logs).

---

## 5. Dual Entry Point Consistency

- **Level 1 Default Table -> "Chi tiết"**: Opens the 64vw right-sliding Component Detail Workspace.
- **Level 2 "Xem tất cả" Workspace -> "Chi tiết"**: Opens the exact same 64vw right-sliding Component Detail Workspace.
- **Level 2 Workspace Size**: Level 2 "Xem tất cả" remains unchanged as an expansive dataset workspace (`w-[96vw] max-w-[1720px] h-[88vh]`).

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
