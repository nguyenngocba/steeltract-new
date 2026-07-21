# EPIC 0 Full UI Audit - Admin

Admin scope includes Settings, Users, Roles and system logs surfaces visible in `AppRouter`.

## Visible Routes And Requested Tabs

| Requested tab | Current route/file | Coverage |
| --- | --- | --- |
| Dashboard | `/settings` overview | Implemented |
| Users | `/users` -> `UsersPage.tsx` | Implemented |
| Roles | `/roles` -> `RolesPage.tsx` | Implemented |
| Settings | `/settings` -> `SettingsPage.tsx` | Implemented |
| System logs | `/system-logs` -> `SystemLogsWorkspace` | Implemented outside requested tab list |

## A. Layout

| Page | Result | Notes |
| --- | --- | --- |
| Settings | CONDITIONAL | Uses `EnterpriseWorkspace`; overview table/right rail pattern, but local panel/table classes remain. |
| Users | CONDITIONAL | Uses Inventory visual exports for table/filter, but root still `EnterpriseWorkspace` with action/header layer. |
| Roles | CONDITIONAL | Similar to Users; table + right detail panel. |
| System Logs | Not fully audited | Needs separate Admin/Security audit. |

## B. KPI

- Settings uses `MiniKpi` rather than canonical `CockpitKpiCard`.
- Users/Roles use `CockpitKpiCard`.
- KPI parity with Inventory canon is mixed.

## C. Filter

- Users/Roles use Inventory input/muted button exports.
- Settings uses local `panel/input/actionButton/primaryButton`.
- Needs consolidation.

## D. Table

- Users/Roles use `inventoryTableShell`, `inventoryTableHead`, `inventoryTableRow`, but no standard pagination component.
- Settings uses local table classes and capability empty rows.

## E. Chart

- Admin pages are table/detail oriented with limited charts.
- Settings has right guidance panels rather than analytics charts.

## F. Data Classification

| Widget/page | Classification | Query/API source |
| --- | --- | --- |
| Settings overview stats | REAL DATA | `systemApi.overview`, `systemApi.workflow` |
| Settings master data inputs | REAL DATA | `useCategories`, `useInventoryItems`, `useMaterialTypes`, `useUnits` |
| Settings org/security/monitoring/report capabilities | STATIC/EMPTY guidance | Local capability arrays; intentionally no fake metrics |
| Users table/KPI/detail | REAL DATA | `getUsers` via `useQuery(['system-users'])` |
| Roles table/KPI/detail | REAL DATA | `getRoles`, `systemApi.roleMatrix` |
| MFA/sessions/API tokens/devices/IP whitelist | EMPTY/GAP | No backend read contract |

## G. Missing Features / Gaps

| Gap | Priority | Severity | Effort | Dependencies |
| --- | --- | --- | --- | --- |
| Users/Roles lack standard pagination | P1 | Medium | M | API/client pagination decision |
| Settings uses local UI classes instead of Inventory primitives | P1 | Medium | M |
| Admin Dashboard is Settings overview, not a dedicated admin dashboard route | P2 | Medium | M | Navigation decision |
| MFA/sessions/password policy/API tokens/devices/IP whitelist are empty capability states | P2 | Medium | L | Security backend contracts |
| System logs not included in requested audit categories | P2 | Medium | M | Security audit scope |

