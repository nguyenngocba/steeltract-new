# Inventory Outbound Component Reuse Map

This document lists all components reused, redesigned, or newly created for the **EPIC-UI001 – Inventory Outbound Workspace Redesign**.

---

## 1. Shared Cockpit & Module Components Reused

To maintain consistent styling and logic with the Golden Design Reference, we reused these shared components instead of custom self-built ones:

| Component Name | Source Path | Purpose |
| :--- | :--- | :--- |
| **`<CockpitKpiCard />`** | `shared/ui/cockpit/CockpitKpiCard` | Visual reference card for high-density display of Outbound operational KPIs. |
| **`<CockpitTableShell />`** | `shared/ui/cockpit/CockpitTableShell` | Flat borderless table wrapper layout. |
| **`<DataTablePagination />`** | `shared/ui/cockpit/DataTablePagination` | Standard paging control supporting row count indicators and navigation. |
| **`<ModuleDetailDrawer />`** | `shared/ui/modules/ModuleDetailDrawer` | Slide-out right drawer workspace shell (at size `lg` - 85vw). |
| **`<ModuleFilterBar />`** | `shared/ui/modules/ModuleFilterBar` | Row-based filter inputs layout container. |
| **`<ModuleLoadingState />`** | `shared/ui/modules/ModuleLoadingState` | Standard pulse loading skeleton for table rows. |
| **`<ModuleEmptyState />`** | `shared/ui/modules/ModuleEmptyState` | Standard center text and action display when rows is empty. |

---

## 2. Reused Module-Local Components

| Component Name | Source Path | Purpose |
| :--- | :--- | :--- |
| **`<WarehouseMiniMap />`** | `modules/inventory/components/material-table/MaterialDrawer` | Visual 2D warehouse map indicating slots/levels occupancy and selection. |
| **`<InventoryTabWorkspace />`** | `modules/inventory/components/InventoryTabWorkspace` | Local WMS section tabs container. |
| **`<InventoryTransactionAttachmentButton />`** | `modules/inventory/components/InventoryAttachmentPanel` | List action button to trigger file attachment view. |
| **`<InventoryTransactionAttachmentDrawer />`** | `modules/inventory/components/InventoryAttachmentPanel` | Slide drawer listing attached documents for transactions. |

---

## 3. New / Custom Components Created

| Component Name | Declared In | Purpose |
| :--- | :--- | :--- |
| **`<SearchableMaterialSelector />`** | `InventoryTransactionModals.tsx` | Searchable combobox input supporting real-time fuzzy filter on materials with complete keyboard support (Arrows, Enter, Escape). |
