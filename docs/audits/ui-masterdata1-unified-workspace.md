# UI.MASTERDATA.1 - Unified Master Data Workspace

Date: 2026-08-11  
Scope: Frontend presentation only  
Status: IMPLEMENTED; browser mutation certification blocked by runtime database capacity

## Objective

Standardize SteelTrack master-data administration around one operator flow:

`Header -> KPI strip -> Toolbar -> Table -> right detail drawer`

No backend API, business workflow, Prisma schema or migration was changed by
this sprint.

## Canonical UI Foundation

`UnifiedMasterDataWorkspace` provides the 96vw full workspace, compact header,
KPI/toolbar/table regions and one scroll owner. `UnifiedMasterDataToolbar`
provides search, filters, refresh, CSV export, density, essential/complete view
and create actions. `UnifiedMasterDataDrawer` reuses `ModuleDetailDrawer` and
standardizes four tabs: Overview, Dependencies, History and Settings.

Dependency presentation is shared through `MasterDataDependencyTree`. It only
renders counts returned by canonical APIs or counts already present in a
canonical read model. No local fixture, mock row or synthetic history was added.

## Workspace Mapping

| Requested domain | Canonical UI owner | Result |
| --- | --- | --- |
| Warehouse | Settings -> Warehouse | 96vw workspace, four real KPI, unified toolbar/table and dependency-aware drawer |
| Warehouse Zone | Inventory Locations | Warehouse-scoped location topology, canonical Warehouse picker and drawer |
| Inventory Location | Inventory Locations | Unified toolbar, compact table, create/edit right drawer and dependency detail |
| Yard | Yard workspace | Cockpit KPI strip, unified toolbar and operational table |
| Yard Zone | Yard workspace | Zone filter/create path and slot detail in the same canonical workspace |
| Material Category | Settings -> Material Category | Full workspace, real usage KPI/count, unified CRUD drawer |
| Material Usage Type | Settings -> Material Usage Type | Full workspace, canonical InventoryItem usage counts and unified CRUD drawer |
| Technical Group | Settings -> Technical Group | Full workspace, canonical MaterialType records and unified CRUD drawer |
| UOM | Settings -> Unit & Conversion | Full workspace, usage derived from canonical Material Master records and unified CRUD drawer |

Warehouse Zone and Yard Zone remain parts of their existing canonical topology
workspaces. No parallel master-data model or API was introduced merely to create
new menu pages.

## Header And KPI

Workspace headers now contain only a module name and short operational subtitle.
KPI strips use `CockpitKpiCard` and real query/read-model values. Examples include
total/active/used/inactive Warehouse records, location utilization and Yard slot
occupancy. Missing history remains a controlled unavailable state rather than a
fabricated timeline.

## Toolbar And Table

The shared toolbar has consistent 36px controls and icon commands. Essential
view limits tables to high-value columns; Complete view exposes secondary
columns. Compact and Comfortable density alter row height without changing data.
Cells use medium typography, single-line truncation and `title` affordances where
the source text can exceed the column width.

Exports are generated from the currently filtered canonical rows. Refresh uses
the existing TanStack Query keys. No alternate client-side source of truth was
created.

## Detail And Dependencies

Create, inspect and edit actions open a right-side `ModuleDetailDrawer`; centered
record dialogs were removed from the migrated flows. Deactivation is reviewed in
the Dependencies tab. Warehouse uses its dedicated dependency endpoint. Category,
usage type, technical group, UOM and location use canonical usage counts already
provided by their APIs/read models.

Referenced records are not blindly deleted. The UI displays the dependency tree
and follows the existing deactivate/delete capability of each backend contract.
This sprint did not invent cascade or archive semantics.

## Files Changed

- `apps/frontend/src/modules/master-data/components/UnifiedMasterDataWorkspace.tsx`
- `apps/frontend/src/modules/settings/pages/SettingsPage.tsx`
- `apps/frontend/src/modules/settings/components/WarehouseMasterWorkspace.tsx`
- `apps/frontend/src/modules/inventory/pages/tabs/InventoryLocationsPage.tsx`
- `apps/frontend/src/modules/yard/pages/YardPage.tsx`
- `apps/frontend/src/modules/settings/pages/SettingsPage.test.tsx`
- `apps/frontend/e2e/warehouse-master.spec.ts`

## Verification

| Gate | Result | Evidence |
| --- | --- | --- |
| Frontend typecheck | PASS | `pnpm -C apps/frontend typecheck` |
| Frontend tests | PASS | 3 files, 8 tests |
| Targeted ESLint | PASS WITH BASELINE WARNINGS | 0 errors; 26 warnings in pre-existing large page surfaces plus one Fast Refresh export warning |
| Frontend production build | PASS | Vite build completed; existing chunk-size warning only |
| `git diff --check` | PASS | No whitespace errors |
| Playwright visual/mutation | BLOCKED | Backend startup failed with PostgreSQL `FATAL: sorry, too many clients already`; no mock or direct DB bypass was used |
| Backend/schema/API changes | NONE | Frontend-only implementation |

The Playwright scenario is prepared to prove Warehouse create/edit/deactivate,
Warehouse selection in Location creation and Yard rendering, with screenshots.
It must be rerun after PostgreSQL connection capacity is restored. Build success
is not treated as browser CRUD certification.

## Remaining Work

P0: Restore runtime database connection capacity and run
`apps/frontend/e2e/warehouse-master.spec.ts` against the real backend.

P1: Add canonical history endpoints only in a separately approved backend
sprint if audit history is required inside every master-data drawer. Until then,
the History tab must remain an explicit controlled unavailable state.

