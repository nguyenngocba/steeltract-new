# Inventory Server Pagination Report

## Materials

`GET /inventory/materials` supports:

- `page`, `pageSize`;
- code/name search;
- category, material type, usage type;
- warehouse and MAIN stock status;
- code, name, stock, value, or updated-time sorting.

Response:

```text
items
page
pageSize
total
totalPages
summary
facets
```

The UI query key includes all query state, uses a 300 ms search debounce, passes
TanStack Query's abort signal to Axios, and retains the previous page while the
next page loads.

Observed smoke tests:

- page 1, size 5: `total=23`, `totalPages=5`, approximately 45 ms, 8.9 KB;
- filtered/sorted page: `total=12`, `totalPages=3`, approximately 37 ms.

## Transaction History

`GET /inventory/transactions` remains backward compatible:

- legacy calls without paging still receive the prior array contract;
- calls with `page`, `pageSize`, or `materialId` receive a paginated envelope.

Material Detail requests history only when the Transactions or Logs tab is open.
For `VT-NEW-00001`, the API reported 14 transactions over five pages at page size
3; the observed request was approximately 23 ms.

Stable ordering remains transaction creation time descending with the existing
database primary-key identity. Cursor pagination is recommended when measured deep
offset latency becomes material; it was not added without large-data evidence.

## Index Review

Existing indexes cover material code/name/type/usage and snapshot material,
warehouse, and update fields. No migration was created because the current small
dataset cannot prove an additional index benefit with `EXPLAIN ANALYZE`.

