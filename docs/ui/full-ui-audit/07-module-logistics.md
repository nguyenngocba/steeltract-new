# EPIC 0 Full UI Audit - Logistics

## Visible Routes And Requested Tabs

All Logistics routes render `LogisticsPage.tsx`; some route paths map back to existing tabs.

| Requested tab | Current route/branch | Coverage |
| --- | --- | --- |
| Dashboard | `/logistics` -> overview | Implemented |
| Deliveries | History/completed dispatch orders | Partial |
| Loading | Dispatch status `LOADING` in `/logistics/dispatch` and `/tracking` | Partial |
| Dispatch | `/logistics/dispatch` | Implemented |
| Vehicles | `/logistics/vehicles` route exists but maps to overview by fallback | Gap |
| Planning | `/logistics/planning` route exists but maps to overview by fallback | Gap |
| Tracking | `/logistics/tracking` | Implemented |
| History/Logs/Reports | `/logistics/history`, `/logs`, `/reports` | History implemented; logs/reports fallback to overview/history behavior |

## A. Layout

- Uses `EnterpriseWorkspace`.
- KPI row + search toolbar + 1fr/360px table/right rail.
- Strong operational layout, but not Inventory canon-equal.

## B. KPI

- Four `CockpitKpiCard` cards.
- PASS for presence; exact height/spacing pending.

## C. Filter

- Search only; no status/date/project/vehicle quick filters.
- Partial against requested filter richness.

## D. Table

- `DispatchTable` renders dispatch orders.
- Uses `CockpitTableShell`; pagination not obvious in the audited branch.
- Needs standard pagination/empty-row certification for large datasets.

## E. Chart

- Right rail includes Delivery Status, Dispatch Trend, Vehicle Utilization using `CockpitChartCard`/status list.
- Vehicle-specific page is missing.

## F. Data Classification

| Widget/page | Classification | Query/API source |
| --- | --- | --- |
| Dashboard KPIs/status/trend | REAL DATA | `getDispatchDashboard` via `useQuery(['logistics-dispatch-dashboard'])` |
| Dispatch/tracking/history table | REAL DATA | `getDispatchOrders` |
| Project data in create drawer | REAL DATA | `getProjectsRuntime` |
| Suggestions | REAL DATA | `suggestDispatchItems` |
| Vehicles route | PLACEHOLDER/GAP | Route exists but no distinct branch |

## G. Missing Features / Gaps

| Gap | Priority | Severity | Effort | Dependencies |
| --- | --- | --- | --- | --- |
| `/logistics/vehicles` and `/logistics/planning` lack distinct workspaces | P1 | High | M/L | Logistics read contracts |
| Add standard filters beyond search | P1 | Medium | M | API filter support |
| Add pagination/empty rows to dispatch table | P1 | Medium | M | API or client pagination |
| Reports/logs routes need explicit UI branch | P2 | Medium | M | Report/log contracts |

