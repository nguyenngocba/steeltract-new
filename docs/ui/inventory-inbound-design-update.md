# Inventory Inbound Design Update

This document provides a technical walkthrough of the design modifications applied to `InventoryInboundPage.tsx` to align it with the Industrial Cockpit guidelines.

---

## 1. Import Upgrades

We removed local card/pagination component definitions and imported standard shared UI primitives:
*   **KPI Cards**: Imported `<CockpitKpiCard />` from `shared/ui/cockpit`.
*   **Table Layout**: Imported `<CockpitTableShell />` from `shared/ui/cockpit`.
*   **Pagination**: Imported `<DataTablePagination />` from `shared/ui/cockpit`.
*   **Filters**: Imported `<ModuleFilterBar />` from `shared/ui/modules`.
*   **Loaders & Feedback**: Imported `<ModuleLoadingState />` and `<ModuleEmptyState />` from `shared/ui/modules`.
*   **Toasts**: Imported `toast` from `react-hot-toast` to handle action notifications.

---

## 2. Dynamic KPI Trends

Instead of static zero arrays, we implemented `kpiTrend` calculations over rolling 6-month historical buckets, matching the implementation in the Outbound workspace:
*   *Tổng nhập trong tháng* (blue)
*   *Giá trị nhập trong tháng* (emerald)
*   *Giá trị nhập hôm nay* (purple)
*   *Số phiếu nhập tháng* (cyan)
*   *NCC phát sinh tháng* (amber)
*   *Hoàn thành* (emerald)

---

## 3. Layout Spacing and Densities

*   **Compact Inputs**: Updated `compactInput` height to `h-9` and border token styles to match the search inputs on the Outbound tab.
*   **Quick Actions**: Side-aligned a "Tải lại" (calls React Query refetch) and "Xuất Excel" actions strip to the right of the filter bar.
*   **High-Density Row Heights**: Implemented `px-4 py-2.5 text-xs` row heights inside the table to accommodate up to 14 rows comfortably on typical display screens.
*   **Neon Highlight**: Implemented the cyan neon hover color transition (`hover:bg-cyan-500/5 hover:text-cyan-300 transition-colors`) on all table row elements.
*   **States Feedback**: Connected `isLoading` to standard loaders, and handled cases with empty records using illustrative Empty States.
