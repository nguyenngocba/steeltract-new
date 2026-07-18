# Inventory Table Visibility Fix

## Change

Changed only the HTTP client imported by
`apps/frontend/src/modules/inventory/api/endpoints/inventory.endpoint.ts`:

- before: unauthenticated `shared/http/http-client`;
- after: canonical authenticated `lib/api` client.

The endpoint paths, payloads, response mapping, React Query keys, stale time,
filters, sorting, pagination, table JSX and layout are unchanged.

## Preserved Behavior

- Overview and Materials continue sharing the bounded repository live read.
- Search/filter/sort parameters are forwarded unchanged.
- Pagination continues using backend `page`, `pageSize`, `total` and
  `totalPages`.
- Sticky headers, internal table scrolling, drawer selection and detail reads
  remain intact.
- Token refresh and failed-session clearing now follow the application-wide
  authenticated client contract.

