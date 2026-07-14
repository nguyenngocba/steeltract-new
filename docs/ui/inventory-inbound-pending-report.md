# Inbound Multi-Material Pending Items UX Report

This document reports on the design, implementation details, and operator walkthrough of the **Multi-material Pending Items UX (Inbound Pilot)** introduced in EPIC183.

---

## 1. UI Implementation Details

We refactored `InboundTransactionModal` within `InventoryTransactionModals.tsx` to support a local batching workflow:

*   **State Management**:
    *   `pendingItems`: A local React state array holding draft material transaction items.
    *   `showPendingList`: A boolean toggle for displaying the detailed pending list panel.
*   **Header Widget**:
    *   Displays when `pendingItems` has at least 1 item.
    *   Displays the total unique material count, aggregate quantities grouped by unit/UOM, and total value (inclusive of VAT).
    *   Includes a button to show or hide the detailed list panel.
*   **Detailed Panel**:
    *   Displays the full list of pending materials with Code, Name, Quantity, UOM, Warehouse, Zone, Slot, and Level.
    *   Provides two actions per item:
        *   **Edit (✏️)**: Populates the modal's input fields with the item's values (triggering user confirmation if the form is dirty) and removes the item from the pending list.
        *   **Remove (❌)**: Deletes the item from the pending list with success notification.
*   **Add-to-Pending Action**:
    *   A prominent button `+ Thêm vào danh sách chờ nhập` is placed below the current item's calculations.
    *   Enabled only when the current line form inputs (Material, Quantity, Unit Price, Location) are valid and free of occupancy conflicts.
*   **2D Warehouse Mini-Map**:
    *   Kept fully operational and unchanged. Clicking cells on the map dynamically populates the Slot/Level form fields as before.

---

## 2. Walkthrough of Operator Workflow

```mermaid
graph TD
  A[Open Nhập Kho Modal] --> B[Fill Material A, Quantity, Price, Location]
  B --> C[Select Slot on WarehouseMiniMap]
  C --> D[Click 'Thêm vào danh sách chờ nhập']
  D --> E[Form Resets Line Fields, General Fields Retained]
  E --> F[Fill Material B & Add to Pending]
  F --> G[Verify Pending Header & Summary]
  G --> H[Click 'Xác nhận nhập kho']
  H --> I[API Receives Single Payload with items[]]
```

1.  **Open Drawer**: The operator clicks the global WMS Inbound trigger.
2.  **Add First Item**:
    *   Selects a supplier (e.g. Supplier X) and date.
    *   Selects Material A, enters quantity and unit price.
    *   Interacts with the `WarehouseMiniMap` to pick a free slot and level.
    *   Clicks **"Thêm vào danh sách chờ nhập"**.
    *   *System Behavior*: The item is validated, added to the pending list, and the line fields reset. Supplier, date, remarks, and attachments are retained.
3.  **Add Second Item**:
    *   Selects Material B, enters quantity, price, and maps the slot.
    *   Clicks **"Thêm vào danh sách chờ nhập"**.
4.  **Review List**:
    *   The operator reviews the totals at the top.
    *   Clicks **"Xem danh sách"** to expand the list.
    *   If necessary, clicks **Edit (✏️)** to modify a line or **Remove (❌)** to delete it.
5.  **Confirm Submission**:
    *   Clicks **"Xác nhận nhập kho (2)"**.
    *   *System Behavior*: A single transaction POST request is fired containing the `items[]` array. On success, cache is invalidated, pending state is cleared, and modal closes.

---

## 3. Business & Safety Rules Adhered

*   **Exact Duplicate Merge**: If the operator adds an item with the exact same material ID, zone ID, slot ID, level, and UOM, the system automatically merges their quantities.
*   **Different Locations**: Adding the same material to different slots or levels results in separate pending lines (no merge).
*   **Atomic Submission**: All items are submitted in a single array payload, ensuring the database transaction is fully atomic (all succeed or all rollback).
*   **Rollback & Pending Preservation**: If the API call fails, the pending list state is **preserved** intact in the UI, allowing the user to troubleshoot without losing entered data.
*   **Dirty Confirmation**: If the user has pending items or form edits and clicks the backdrop or Hủy, the system prompts them for confirmation.
