# Inventory Cache Consistency Report

Date: 2026-07-10

Status: PASS

## Cache Settings Audit

| Query | staleTime | placeholderData | Risk | Remediation |
|---|---:|---|---|---|
| `useInventoryMaterials` | 10s | `keepPreviousData` | Old page remains visible during refetch | Mutation helper now active-refetches immediately and retries |
| `useInventoryOverview` | 10s | none | Snapshot can lag Background Engine | Existing 5s mounted refetch retained |
| `useMaterialTransactions` | 10s | `keepPreviousData` | Old history remains visible during refetch | Mutation helper active-refetches and retries |
| `useInventoryTransactions` | default + 4s interval | none | Already refreshes frequently | Still invalidated/refetched after mutation |
| `useMaterialDetail` | default | none | Correct key, previously not always paired with new read-model keys | Covered by helper |
| `useZones` | default | none | Incorrect old invalidation key existed | Corrected through helper |

## Local Derived State

`InventoryMaterialsPage` derives table rows directly from `materialsData.items`.

No persistent local row cache was found:

- `rows = materialsData?.items ?? []`
- `filteredRows = rows`
- `pagedRows = rows`

When query data changes, the table should render the new rows.

## Refetch Policy

EPIC118.5 avoids:

- `staleTime = 0` globally.
- Whole-app polling.
- Window reload.
- Optimistic stock edits in React state.

It uses:

- Targeted key invalidation.
- Active query refetch.
- Two short active-only retries after mutation to catch snapshot/read-model completion.

## Result

Frontend cache behavior is now aligned with Inventory read-after-write requirements while preserving the frozen backend architecture.
