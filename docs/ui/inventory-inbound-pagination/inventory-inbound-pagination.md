# Inventory Inbound Modal Pagination

## Scope

Inventory Inbound full-list modal now paginates transaction rows on the client side without changing backend APIs, filters, sorting, attachments, or row click behavior.

## Behavior

- Modal resets to page 1 whenever it opens.
- Default modal page size is 20 rows.
- Supported page sizes: 10, 20, 50, 100.
- The modal table renders only the current page slice.
- Pagination is hidden when the filtered row count is less than or equal to the selected page size.
- Existing row click opens the inbound detail drawer.
- Existing attachment button behavior is preserved.

## Validation

The implementation keeps the existing filtered and sorted `rows` source, then derives `modalPagedRows` with `slice()` before rendering the table.
