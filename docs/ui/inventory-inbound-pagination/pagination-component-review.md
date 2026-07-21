# Pagination Component Review

## Component Used

`InventoryPagination` from `apps/frontend/src/modules/inventory/components/InventoryVisuals.tsx`.

This matches the Inventory Outbound page. `InventoryPagination` delegates to the shared enterprise pagination implementation, so Inbound and Outbound keep a single visual system.

## Decision

No new pagination component was created. The shared pagination path was extended with optional page-size props:

- `pageSizeOptions`
- `onPageSizeChange`

Existing usages remain backward compatible because the new props are optional. The default Outbound-style layout, spacing, active state, disabled state, typography, and "Trước/Sau" controls are unchanged.

## Modal Fit

The inbound full-list modal uses the same `InventoryPagination` wrapper as Outbound and enables only the optional page-size selector required by the modal.
