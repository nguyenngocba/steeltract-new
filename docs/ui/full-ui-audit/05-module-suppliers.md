# EPIC 0 Full UI Audit - Suppliers

## Visible Routes And Requested Tabs

All Supplier routes render `SuppliersPage.tsx`.

| Requested tab | Current route/branch | Coverage |
| --- | --- | --- |
| Overview | `/suppliers` | Implemented, same as list view |
| Suppliers | `/suppliers/list` | Implemented |
| Purchase History | `/suppliers/purchase-orders`, `/suppliers/deliveries` | EMPTY capability state |
| Rankings | Right rail/top suppliers and quality view | Partial |
| Performance | `/suppliers/quality` | Implemented via evaluation cockpit |
| Quotes/Payables/Logs/Reports | Routes exist | EMPTY capability states |

## A. Layout

- Uses `EnterpriseWorkspace`, but local `panel/input/tableHead/tableRow` strings remain.
- Supplier list has KPI, filter, 1fr/340px table + right rail layout.
- Visual language is close but not canon-equal to Inventory Materials.

## B. KPI

- Uses local `KpiCard` wrapper over `CockpitKpiCard`.
- KPI row has 4 cards, `gap-3`; Inventory canon generally uses `gap-1`.
- Needs spacing/height parity check.

## C. Filter

- Search and status filter exist.
- Filter panel is local `${panel} flex flex-wrap... p-3`, not `InventoryPanel`.
- Needs standardization.

## D. Table

- Supplier list table exists with empty rows.
- Uses local table classes, not `InventoryPanel`/`CockpitTableShell`.
- No standard pagination; footer absent for list paging.

## E. Chart

- Right rail uses `InsightList` and capability cards, not Inventory chart primitives.
- Quality tab uses evaluation cockpit data; needs visual parity review.

## F. Data Classification

| Widget/page | Classification | Query/API source |
| --- | --- | --- |
| Supplier list | REAL DATA | `useSuppliersQuery(search)` |
| Supplier summary/KPIs/right rail | REAL DATA | `useSupplierCockpitSummaryQuery` |
| Quality/performance | REAL DATA | `useSupplierEvaluationCockpitQuery` |
| Detail drawer | REAL DATA | `useSupplierCockpitDetailQuery` |
| Quotes/PO/deliveries/payables/logs/reports tabs | EMPTY | `SupplierCapabilityEmpty`; no read contract |

## G. Missing Features / Gaps

| Gap | Priority | Severity | Effort | Dependencies |
| --- | --- | --- | --- | --- |
| Replace local panel/table/filter classes with Inventory shared primitives | P1 | High | M |
| Add standard pagination for supplier table | P1 | Medium | M | API pagination or client pagination decision |
| Purchase History/Quotes/Payables/Reports are empty capability states | P2 | Medium | L | Supplier read contracts |
| Ranking/performance needs full dashboard layout | P2 | Medium | M | Supplier evaluation contract |

