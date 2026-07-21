# Shared Pagination Review

## Shared Path

`InventoryPagination` -> `EnterprisePagination` -> `DataTablePagination`

## Compatibility

The shared component was kept backward compatible:

- existing calls need no changes;
- default controls remain page numbers plus "Trước" and "Sau";
- optional page-size selection is rendered only when both `pageSizeOptions` and `onPageSizeChange` are provided.

## Non-Changes

- No duplicate pagination component.
- No alternate inbound-only pagination style.
- No business, API, filtering, sorting, or query changes.
