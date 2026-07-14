# Inventory Outbound Workspace Design Review

This document provides a design review of the redesigned Outbound workspace interface compared to the original implementation.

---

## 1. Before vs After UX Comparison

| Area | Before (Original Modal-based UI) | After (Redesigned Cockpit-based UI) |
| :--- | :--- | :--- |
| **Workspace Bố cục** | Native padding, simple list table, and local metric cards scattered inside. | Complies with fluid-width, compact spacing, and standard cockpit cards. |
| **Hệ thống Lọc (Filters)** | Simple panel, lacking refresh and export actions. Local button launches creation modal. | Standard `ModuleFilterBar` sticky toolbar, with local actions for refetching, exporting, and drawer creation. |
| **Tạo phiếu (Creation)** | Center modal overlay `ModalShell` that blocks the viewport completely. | Side drawer `ModuleDetailDrawer lg` (85vw) allowing the operator to cross-check historical lists underneath. |
| **Chọn vật tư** | HTML `<select>` dropdown. Awkward and slow when catalog grows beyond 50 entries. | Keyboard-friendly `<SearchableMaterialSelector />` combobox with live search. |
| **Sơ đồ kho (Mini Maps)** | Renders two mini maps side-by-side inside the modal, causing horizontal width overflow. | Stacked vertically in the right-hand column, keeping form sections clean and preventing layout blowout. |
| **Xác nhận thoát** | Instantly closes when clicking escape or close button, losing unsaved input data. | Intercepts closure when inputs are dirty, prompting `window.confirm` message. |

---

## 2. Shared Cockpit Design Compliance Audit

*   **KPI Heights & Typography**: Complies 100% with the standard `108px` card height, vertical typography hierarchy, and delta notes.
*   **Grid gap density**: Uses `gap-2` and `space-y-3` density to maximize information display on a single screen.
*   **Table Cells**: Cell padding is standardized and rows now include proper neon cyan hover transitions: `hover:bg-cyan-500/5 transition-colors`.

---

## 3. Known Limitations & Recommendations

*   **Realtime Search debounce**: The filter bar search input binds to `searchDraft` and debounces on submit (clicking "Lọc" or hitting Enter) to prevent excessive backend API calls.
*   **Export Action Mocking**: The "Xuất Excel" button in the toolbar currently triggers a visual toast notification since there is no backend Excel generation service endpoint for outbound transactions.
