# EPIC 0 Full UI Audit - Suppliers

## EPIC 5.0 Completion Update

Status: **P0/P1 SOURCE IMPLEMENTED - FRONTEND BUILD PASS, BROWSER QA PENDING**

Suppliers now follows the active Inventory/Components/Production/Projects UI
canon at source/build level. The Overview/List workspace uses KPI cards,
standard filter/search panel, hero supplier table, pagination, right analytics
rail and bottom readiness analytics. The Quality workspace uses KPI cards,
filter/search panel, paginated hero evaluation table, right detail rail and
bottom analytics from the existing evaluation cockpit data.

Tabs without backend read contracts now render full empty workspaces with KPI,
filter, table, right rail and bottom analytics structure instead of a lone
placeholder card. No backend, API, schema, route, permission or business logic
changed.

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

- Uses `EnterpriseWorkspace`.
- Supplier list has KPI, filter, hero table + right rail + bottom analytics.
- Capability tabs use the same workspace structure with controlled empty
  states until real read contracts exist.
- Browser screenshot parity remains pending.

## B. KPI

- Uses `CockpitKpiCard` through the local thin `KpiCard` wrapper.
- Synthetic trend arrays were removed from Supplier KPI cards.
- Source-level KPI spacing now follows the current cockpit `gap-1` rhythm.

## C. Filter

- Search exists for Supplier list and Quality.
- Supplier list no longer exposes an inactive filter that has no field in the
  Supplier API contract.
- Filter panels now use the same compact rounded cockpit filter surface.

## D. Table

- Supplier list and Quality list use `CockpitTableShell`.
- Standard `DataTablePagination` is enabled with page-size choices.
- Stable empty rows preserve the table-hero footprint with sparse data.

## E. Chart

- Right rail and bottom analytics now use `CockpitChartCard`,
  `CockpitRecentList`, `CockpitStatusList` or standard `CockpitEmptyState`.
- Quality tab remains backed by `useSupplierEvaluationCockpitQuery`.

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
| Authenticated browser visual certification | P1 | High | M | Screenshot harness |
| Purchase History/Quotes/Payables/Reports are empty capability states | P2 | Medium | L | Supplier read contracts |
| Ranking/performance needs full dashboard layout | P2 | Medium | M | Supplier evaluation contract |
