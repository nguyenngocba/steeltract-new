# Inventory Pagination Unification

## Source Of Truth

Inventory Outbound uses `InventoryPagination`, exported from `InventoryVisuals.tsx`.

Inbound full-list modal now uses the same wrapper instead of calling `DataTablePagination` directly.

## UI Parity

The modal inherits the same pagination layout used by Outbound:

- same three-column footer structure;
- same page number button shape;
- same active page styling;
- same disabled "Trước/Sau" behavior;
- same border and text color system;
- same responsive grid behavior.

## Page Size

The shared pagination path supports optional page-size selection. Existing pages that do not pass `pageSizeOptions` keep their current UI unchanged.
