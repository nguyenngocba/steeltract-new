# EPIC 0.5 Execution Plan

This plan is documentation-only. It does not authorize code changes by itself.

## Completion Summary

| Phase | Module | Current completion | Target completion for phase |
| --- | --- | ---: | ---: |
| 1 | Inventory | 88% | 96% |
| 2 | Components | 78% | 94% |
| 3 | Production | 72% | 92% |
| 4 | Projects | 68% | 88% |
| 5 | Suppliers | 55% | 86% |
| 6 | QC | 62% | 88% |
| 7 | Logistics | 58% | 86% |
| 8 | Planning | 20% | 70% after route decision |
| 9 | Admin | 64% | 86% |

## Phase 1 - Inventory Finish

**Objectives**
- Keep Inventory as the Golden Reference.
- Certify secondary Inventory pages against the four canon pages.
- Decide whether Inventory Reports needs a dedicated workspace.

**Files expected to change**
- `apps/frontend/src/modules/inventory/pages/tabs/InventoryLocationsPage.tsx`
- `apps/frontend/src/modules/inventory/pages/tabs/InventoryTransactionsPage.tsx`
- `apps/frontend/src/modules/inventory/pages/tabs/InventoryReturnRequestsPage.tsx`
- `apps/frontend/src/modules/inventory/pages/tabs/InventoryTransferPage.tsx`
- `apps/frontend/src/modules/inventory/pages/tabs/InventoryStockTakePage.tsx`
- `apps/frontend/src/modules/inventory/pages/tabs/InventoryAdjustmentsPage.tsx`
- `apps/frontend/src/modules/inventory/pages/tabs/InventoryAlertsPage.tsx`
- Potential new route only if approved: `InventoryReportsPage.tsx`

**Backend work**
- None for parity certification.
- Only if Inventory Reports is approved: define read model/API first.

**Frontend work**
- Normalize secondary page shell, KPI, filter, table, chart and pagination against canon.
- Preserve existing workflows and API contracts.

**Real-data integration**
- Existing real Inventory hooks remain source of truth.
- No mock data.

**Estimated complexity**
- Medium, or Large if a new Reports workspace is approved.

**Completion criteria**
- Secondary pages pass visual checklist.
- No fake/static data introduced.
- Inventory remains the UI canon.

## Phase 2 - Components Finish

**Objectives**
- Certify secondary Components tabs.
- Finish BOM/Ready Queue workspace decisions.
- Keep Components visually close to Inventory without copying Inventory data.

**Files expected to change**
- `apps/frontend/src/modules/components/pages/tabs/ComponentsProductionPage.tsx`
- `apps/frontend/src/modules/components/pages/tabs/ComponentsStockPage.tsx`
- `apps/frontend/src/modules/components/pages/tabs/ComponentsMaterialStockPage.tsx`
- `apps/frontend/src/modules/components/pages/tabs/ComponentsTransfersPage.tsx`
- `apps/frontend/src/modules/components/pages/tabs/ComponentsInternalQcPage.tsx`
- `apps/frontend/src/modules/components/pages/tabs/ComponentsHistoryPage.tsx`
- `apps/frontend/src/modules/components/pages/tabs/ComponentsReportsPage.tsx`
- Optional if approved: dedicated BOM or Ready Queue route/page.

**Backend work**
- None for visual certification.
- Only if BOM/Ready Queue needs new real-data contracts.

**Frontend work**
- Align all tabs to Inventory page rhythm.
- Add/verify table pagination, empty rows, right rails and bottom analytics.

**Real-data integration**
- Use `useComponentsWorkspace`, `useComponentsOverview`, `useComponentsDashboard`, component BOM/costing hooks.
- Do not synthesize missing BOM/Ready Queue data.

**Estimated complexity**
- Large.

**Completion criteria**
- Overview/List remain certified.
- All visible Components tabs pass the same audit checklist.
- BOM/Ready Queue either have real workspaces or documented route decisions.

## Phase 3 - Production

**Objectives**
- Certify every Production mode in `ProductionCockpitPage`.
- Resolve Machines workspace decision.
- Normalize table/pagination/empty rows per mode.

**Files expected to change**
- `apps/frontend/src/modules/production/pages/ProductionCockpitPage.tsx`
- `apps/frontend/src/modules/production/components/ProductionOrderTable.tsx`
- `apps/frontend/src/modules/production/components/ProductionExecutionBoard.tsx`
- `apps/frontend/src/modules/production/components/MachineTelemetryPanel.tsx`
- Optional route/page if approved: dedicated Machines workspace.

**Backend work**
- Possible machine read contract if Machines route is kept.
- Possible Query API cleanup for non-order modes.

**Frontend work**
- Per-mode parity pass for Overview, Planning, Work Orders, Execution, BOMs, Reservations, Warehouse, Ledger, Issues, Consumptions, Incidents, Logs and Reports.
- Standardize table heights, pagination footers and right rail card heights.

**Real-data integration**
- Primary: `useProductionCockpitReadModel`.
- Existing: `useProductionBoms`, `useProductionIssues`, `useProductionConsumptions`, `useProductionReservations`, `useProductionMaterialLedger`, `useProductionLogs`.

**Estimated complexity**
- Large.

**Completion criteria**
- Every visible Production route has KPI/filter/table/right rail or truthful empty state.
- Machines route is implemented with real data or intentionally removed.
- No legacy path silently bypasses UI standards.

## Phase 4 - Projects

**Objectives**
- Normalize Projects branches against Inventory canon.
- Decide Timeline route/label strategy.
- Keep rich Projects data but improve consistency.

**Files expected to change**
- `apps/frontend/src/modules/projects/pages/ProjectsPage.tsx`
- `apps/frontend/src/modules/projects/components/ProjectCockpit.tsx`
- `apps/frontend/src/modules/projects/components/ProjectRuntimeTable.tsx`
- `apps/frontend/src/modules/projects/components/ProjectTimeline.tsx`
- `apps/frontend/src/modules/projects/components/ProjectsTable.tsx`

**Backend work**
- Only if Timeline/attachments/photos need real read contracts.

**Frontend work**
- Normalize Overview, List, Templates, Progress, Components, Materials, Costs, Documents, Logs and Reports branches.
- Standardize branch pagination and empty rows.

**Real-data integration**
- `getProjectsRuntime`, `getProjectTemplates`, `getProjectDetailTab`.
- Attachment/photo widgets remain empty until backend contract exists.

**Estimated complexity**
- Large.

**Completion criteria**
- Project pages share consistent KPI/filter/table/right rail structure.
- Timeline/Budget naming is resolved.
- Empty states remain truthful.

## Phase 5 - Suppliers

**Objectives**
- Replace local UI class strings with shared Inventory/Enterprise primitives.
- Add standard pagination.
- Convert empty capability tabs only when real read contracts exist.

**Files expected to change**
- `apps/frontend/src/modules/suppliers/pages/SuppliersPage.tsx`
- `apps/frontend/src/modules/suppliers/components/SuppliersKpiStrip.tsx`
- `apps/frontend/src/modules/suppliers/components/SupplierFormModal.tsx`

**Backend work**
- Supplier pagination/filter API if client-side pagination is not acceptable.
- Future read contracts for quotes, purchase orders, deliveries, payables, logs and reports.

**Frontend work**
- Normalize KPI gap/height, filter panel, table shell, right rail, modal/drawer behavior.
- Add pagination and empty-row behavior.

**Real-data integration**
- `useSuppliersQuery`, `useSupplierCockpitSummaryQuery`, `useSupplierEvaluationCockpitQuery`, `useSupplierCockpitDetailQuery`.

**Estimated complexity**
- Medium/Large.

**Completion criteria**
- Supplier list and quality pages meet Inventory visual standards.
- Empty capability tabs remain clear and useful.
- No fake supplier metrics.

## Phase 6 - QC

**Objectives**
- Fix QC pagination risk.
- Normalize panel/table primitives.
- Decide whether Pending/Passed/Failed should become route-level tabs.

**Files expected to change**
- `apps/frontend/src/modules/qc/pages/QcPage.tsx`
- `apps/frontend/src/modules/qc/components/*` where active branches require shared primitive adoption.

**Backend work**
- QC read model pagination if current API cannot support UI pagination safely.
- Calibration read contract if calibration becomes real.

**Frontend work**
- Add/verify pagination for inspections and production queue.
- Align KPI/filter/table/chart structure with Inventory canon.
- Keep calibration as controlled empty state until data exists.

**Real-data integration**
- `useQcWorkspace`, `useQcDashboard`, QC command APIs.

**Estimated complexity**
- Medium/Large.

**Completion criteria**
- No unbounded `limit: 100` table rendering risk.
- QC dashboard and workspaces pass visual parity checklist.
- No fake calibration/NCR/statistics rows.

## Phase 7 - Logistics

**Objectives**
- Resolve missing Vehicles/Planning routes.
- Add filters, pagination and explicit logs/reports behavior.
- Keep dispatch table as hero workspace.

**Files expected to change**
- `apps/frontend/src/modules/logistics/pages/LogisticsPage.tsx`
- `apps/frontend/src/modules/logistics/components/ShipmentRuntimeTable.tsx`
- `apps/frontend/src/modules/logistics/components/RouteInsightPanel.tsx`
- Optional: distinct Vehicles/Planning workspaces if approved.

**Backend work**
- Logistics vehicles/planning read contracts if routes stay visible.
- Pagination/filter API support for dispatch orders if needed.

**Frontend work**
- Add standard filter bar, table pagination, empty rows.
- Implement or intentionally remove fallback routes.

**Real-data integration**
- `getDispatchDashboard`, `getDispatchOrders`, `getProjectsRuntime`, `suggestDispatchItems`.

**Estimated complexity**
- Medium/Large.

**Completion criteria**
- `/logistics/vehicles` and `/logistics/planning` no longer silently fall back.
- Dispatch/tracking/history tables are paginated and filterable.
- Reports/logs routes are explicit.

## Phase 8 - Planning

**Objectives**
- Decide route visibility first.
- If visible, audit and normalize existing Planning workspace.
- Add Schedule workspace only with real data contract.

**Files expected to change**
- `apps/frontend/src/app/router/AppRouter.tsx` if route is approved.
- `apps/frontend/src/modules/planning/pages/PlanningWorkspacePage.tsx`
- `apps/frontend/src/modules/planning/workspaces/PlanningWorkspace.tsx`
- `apps/frontend/src/modules/planning/features/PlanningOverview.tsx`
- Optional: Schedule workspace if approved.

**Backend work**
- Planning/schedule read contracts if current files lack real data.

**Frontend work**
- Route activation or intentional removal.
- KPI/filter/table/chart parity if activated.

**Real-data integration**
- Must be confirmed by focused Planning audit before implementation.

**Estimated complexity**
- Small for route decision; Medium/Large for full visible module.

**Completion criteria**
- Product decision made: Planning is either visible and audited, or hidden intentionally.
- If visible, page has no blank/placeholder route behavior.

## Phase 9 - Admin

**Objectives**
- Normalize Settings, Users and Roles to shared primitives.
- Add standard pagination.
- Keep security capability gaps as truthful empty states until backend exists.

**Files expected to change**
- `apps/frontend/src/modules/settings/pages/SettingsPage.tsx`
- `apps/frontend/src/modules/users/pages/UsersPage.tsx`
- `apps/frontend/src/modules/roles/pages/RolesPage.tsx`
- `apps/frontend/src/modules/system-logs/workspaces/SystemLogsWorkspace.tsx` if included in Admin/Security pass.

**Backend work**
- Users/Roles pagination if server-side pagination is required.
- Security contracts for MFA, sessions, password policy, API tokens, devices and IP whitelist.

**Frontend work**
- Normalize Settings local table/panel/buttons.
- Add Users/Roles pagination and empty rows.
- Decide whether Admin Dashboard should remain Settings overview.

**Real-data integration**
- `systemApi.overview`, `systemApi.workflow`, `getUsers`, `getRoles`, `systemApi.roleMatrix`, Inventory master-data hooks.

**Estimated complexity**
- Medium/Large.

**Completion criteria**
- Settings/Users/Roles meet Inventory visual standards.
- Pagination is consistent.
- Empty security capabilities remain explicit and non-fake.
