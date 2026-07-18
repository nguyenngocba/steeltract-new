# Shared Component Extraction Report

## Canonical Ownership

| Concern | Shared owner |
|---|---|
| Page composition | `shared/ui/enterprise/EnterpriseWorkspace` |
| KPI | `shared/ui/cockpit/CockpitKpiCard` |
| Chart frame | `shared/ui/cockpit/CockpitChartCard` |
| Table shell | `shared/ui/cockpit/CockpitTableShell` |
| Pagination | `shared/ui/cockpit/DataTablePagination` |
| Filter shell | `shared/ui/modules/ModuleFilterBar` |
| Drawer/modal frame | `shared/ui/modules/ModuleDetailDrawer` |
| States | `EnterpriseWorkspaceStatePanel`, `ModuleLoadingState`, `ModuleEmptyState` |

UI001 removed duplicated root shell/header/tab structures from the target root
pages and replaced repeated KPI markup in QC, Suppliers, Users and Roles. Local
components remain valid where they own domain formatting, table columns, chart
series, timeline entries or typed status mappings.

No `ProductionToolbar`, `QcToolbar`, `ProjectsToolbar` or equivalent
module-specific framework component was introduced.
