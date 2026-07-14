# Inventory UI Consistency Report

This document reports on the design consistency of the three primary inventory tab workspaces: **Overview (Dashboard)**, **Outbound (Xuất kho)**, and **Inbound (Nhập kho)**.

---

## 1. Unified Design Language Elements

| Design Aspect | Overview Dashboard | Outbound Workspace | Inbound Workspace |
| :--- | :--- | :--- | :--- |
| **KPI Component** | `<CockpitKpiCard />` | `<CockpitKpiCard />` | `<CockpitKpiCard />` |
| **Filter Component** | `<ModuleFilterBar />` | `<ModuleFilterBar />` | `<ModuleFilterBar />` |
| **Table Shell** | `<CockpitTableShell />` | `<CockpitTableShell />` | `<CockpitTableShell />` |
| **Paging component** | N/A (Overview has no paging) | `<DataTablePagination />` | `<DataTablePagination />` |
| **Table Spacing** | `px-4 py-2.5 text-xs` | `px-4 py-2.5 text-xs` | `px-4 py-2.5 text-xs` |
| **Neon Hover Class** | `hover:bg-cyan-500/5 transition` | `hover:bg-cyan-500/5 transition` | `hover:bg-cyan-500/5 transition` |
| **Feedback States** | Standard Loader & Empty | Standard Loader & Empty | Standard Loader & Empty |

---

## 2. Shared Assets Inherited

### A. Inherited from Dashboard
*   **Colors**: Sleek WMS dark theme styling tokens (slate-950 backdrop, cyan/emerald accents).
*   **Visual Panels**: Reused standard donut summaries, horizontal bars, and cockpit panel cards (`InventoryChartCard`, `InventoryPanel`).

### B. Inherited from Outbound
*   **Action Alignments**: Placed the quick actions strip to the right of the filter bar (incorporating "Tải lại" and "Xuất Excel" buttons).
*   **Row Densities**: Standardized row height padding and fonts to maintain uniform list scanning density.

---

## 3. Intentionally Unmodified Elements (UX Safety Guard)

Under the **Presentation First – UX Later** rule guidelines, the following elements were left unmodified to prevent changes to WMS business workflows and operational contract behaviors:
1.  **Creation Modals**: Inbound uses its existing global creation action, while Outbound uses its custom slide-out drawer workspace. No swaps or modal conversions were made for Inbound.
2.  **Searchable Selector**: We did not introduce keyboard fuzzy selectors or searchable combobox components to Inbound fields; the existing dropdowns are preserved.
3.  **Validation & APIs**: All inputs, validator warnings, and transaction creation payload formats remain unchanged.
