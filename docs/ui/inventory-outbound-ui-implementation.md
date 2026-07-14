# Inventory Outbound UI Implementation Walkthrough

This document reviews the frontend modifications made for the **EPIC-UI001 – Inventory Outbound Workspace Redesign** to align the Outbound workspace page and form with the Golden Design Reference of SteelTrack.

---

## 1. Outbound page refactoring (`InventoryOutboundPage.tsx`)

We migrated the local custom widgets and page components to use standard shared components from `shared/ui/cockpit` and `shared/ui/modules`:

*   **KPI Strip**:
    Replaced the local custom card components with **`<CockpitKpiCard />`** for all 5 metrics:
    1.  *Phiếu xuất hôm nay* (cyan)
    2.  *Giá trị xuất hôm nay* (purple)
    3.  *Chờ xử lý* (amber)
    4.  *Xuất cho sản xuất* (blue)
    5.  *Xuất cho công trình* (emerald)
    Trends are dynamically calculated based on actual historical monthly buckets (over a rolling 6-month window) for each corresponding metric.
*   **Enterprise Toolbar**:
    Implemented standard **`<ModuleFilterBar />`** sticky controls:
    *   Search filter input (Realtime keyboard-friendly query)
    *   Warehouse select filter (`zoneId` binding)
    *   Project select filter (`projectId` binding)
    *   Status select filter (`status` binding)
    *   Date select filter (`date` binding)
    *   Local Actions strip including **Refresh** (calls query refetch), **Export Excel** (mock action with toast indicator), and **+ Tạo phiếu xuất** (triggers slide-out drawer).
*   **Table & Pagination**:
    *   Wrapped the table container using **`<CockpitTableShell />`** to establish a clean border-free flat layout.
    *   Migrated table row styling to use flat rows with high-density spacing (`px-4 py-2.5 text-xs`) and hover-neon cyan background highlight: `hover:bg-cyan-500/5 hover:text-cyan-300`.
    *   Replaced the custom paging bar with standard **`<DataTablePagination />`**.
*   **States**:
    *   **Loading State**: Uses standard `<ModuleLoadingState variant="table" />`.
    *   **Empty State**: Uses standard `<ModuleEmptyState />` with reset filter action.

---

## 2. Outbound Form Drawer refactoring (`InventoryTransactionModals.tsx`)

Replaced `ModalShell` with **`<ModuleDetailDrawer size="lg" />`** sliding in from the right hand side (85vw) to present a split-column workspace:

*   **Section 1: Ticket Information** (Số phiếu, Ngày xuất, Loại hình xuất, Đơn vị nhận).
*   **Section 2: Material Info** using custom fuzzy combobox selector **`<SearchableMaterialSelector />`** displaying material code, name, stock amount, and units.
*   **Section 3: Location Selectors** for source zone, slot, level, and destination production warehouse location (when target is `COMPONENT_PRODUCTION`).
*   **Section 4: Mini Warehouse Maps**: Stacked vertically in the right-side secondary column (380px) to prevent layout horizontal overflow (previously, rendering two maps side-by-side inside a modal caused horizontal layout blowout).
*   **Section 5: Summary Panel**: Displays lines count (1 line), total volume, and total financial value, plus inline warning messages (e.g. out of stock or location balance exceeds).
*   **Sticky Footer**:
    *   *Lưu & Tạo mới*: Submits payload, triggers cache invalidation, resets form fields (material, quantity, zones) to let operator record another ticket immediately.
    *   *Xác nhận xuất kho*: Submits payload, invalidates cache, and closes drawer.
    *   *Hủy*: Triggers confirmation dialog if form is dirty (`isDirty` prompt).
