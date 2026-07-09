# Inventory Large-Data UX Audit

This is a static architecture assessment, not a load benchmark.

## Capability Matrix

| Scenario | Status | Evidence |
|---|---|---|
| 100,000 materials | NOT READY | `/inventory/audit` caps at 1,000; all list operations and KPIs are client-side |
| 1,000,000 materials | NOT READY | Same cap plus offset-free, cursor-free response and no virtualization |
| 10,000,000 transactions | NOT READY | `/inventory/transactions` caps at 200 with no completeness metadata |
| 100,000,000 transactions | NOT READY | Client trend/history reconstruction cannot represent the dataset |
| Material detail at current volume | CONDITIONALLY READY | Snapshot-first and lazy, but histories are unpaginated |
| Location workspace at current volume | CONDITIONALLY READY | Snapshot-first, but zone payload is broad and unpaginated |

## Pagination and Search

- Material pagination is client-side over at most 1,000 rows.
- Transaction pagination is not exposed by the reviewed endpoint.
- Search/filter/sort are client-side.
- Search is explicit via button/Enter, so debounce is not currently relevant;
  server-side query support is absent.
- No cursor pagination was found.
- Material detail history pagination only slices the full response.

## React Query

- The application uses a default `QueryClient`.
- Inventory audit polls every 5 seconds; transactions poll every 4 seconds.
- No request `AbortSignal` is propagated in the reviewed hooks.
- No `keepPreviousData`/`placeholderData` is configured for list paging.
- Detail loading is selection-gated.
- Attachment loading is tab-gated, although transaction attachments are not
  material-scoped.
- Default stale/retry behavior can repeat expensive requests and makes cache intent
  implicit.

## Rendering and Stability

- Main tables use fixed layouts, minimum widths, truncation, and overflow
  containers. This is conditionally stable for long codes, names, and large values.
- The “show all” view renders every available client row and is not virtualized.
- Wide tables require horizontal scrolling on small screens.
- Drawer content scrolls independently, but full unpaginated histories increase
  render and memory cost.
- Loading states exist; explicit error states are incomplete.
- Empty arrays can mean either no data or a failed request.

## Risks by Priority

### P0: Data completeness

The UI treats capped responses as complete datasets. KPIs and trends can therefore
be numerically wrong without any visible warning.

### P1: Scale

Move material and history operations to segmented server queries with cursor or
well-indexed server pagination. Scope attachments and expose totals/completeness.

### P2: UX

Add explicit error/partial-data states, retain previous page data, and virtualize
only genuinely large rendered result sets.

## Conclusion

The reviewed workspaces are **NOT READY** for the requested enterprise volumes.
Snapshot infrastructure reduces backend aggregation cost for detail reads, but the
current frontend contracts still assume bounded in-memory datasets.

