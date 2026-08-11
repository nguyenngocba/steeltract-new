# UI.AUDIT.1 - Enterprise UI Consistency Audit

Date: 2026-08-11  
Mode: Audit first, then presentation-only P0 correction  
Backend/API/schema/migration changes: NONE

## Audit Inventory

The audit followed active `AppRouter` routes and their rendered workspace owner,
not inactive legacy filenames.

| Module | Active workspace owners |
| --- | --- |
| Dashboard | `DashboardPage.tsx` |
| Inventory | Overview, Materials, Inbound, Outbound, Locations, Transactions, Returns, Transfer, Stock Take, Adjustments, Alerts, Audit |
| Components | Overview, Definitions, Production, Finished Goods, Production Material, Transfers, Physical QC, History, Reports |
| Production | `ProductionCockpitPage.tsx` route modes |
| QC | `QcPage.tsx` plus canonical physical QC workspace |
| Yard | `YardPage.tsx` plus 2D/3D/topology workspaces |
| Logistics | `LogisticsPage.tsx` route modes |
| Projects | `ProjectsPage.tsx` route modes and entity drawers |
| Settings | Settings, Users, Roles and Logs surfaces; this sprint fixes shared primitives consumed by Settings |
| Master Data | Category, Usage Type, Technical Group, UOM, Warehouse, Location and Yard topology |
| Executive BI | Realtime Dashboard analytics and `HistoricalDashboardPage.tsx` |

## Score Legend

- G: GREEN, canonical or compliant through shared primitive.
- Y: YELLOW, operational but retains page-local visual debt or lacks visual proof.
- R: RED, missing/broken/inconsistent enough to block routine use.

Columns: Typography (Ty), Spacing (Sp), Header (Hd), KPI, Toolbar (Tb), Filter
(Fi), Search (Se), Table (Ta), Density (De), Drawer (Dr), Modal (Mo), Tabs (Ts),
Pagination (Pg), Badge (Ba), Status (St), Loading (Lo), Empty (Em), Error (Er),
Charts (Ch), Export (Ex), Responsive/Accessibility (RA).

| Module | Ty | Sp | Hd | KPI | Tb | Fi | Se | Ta | De | Dr | Mo | Ts | Pg | Ba | St | Lo | Em | Er | Ch | Ex | RA | Overall |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Dashboard | G | Y | G | G | Y | G | G | Y | Y | G | Y | G | G | G | G | G | G | Y | G | Y | Y | Y 84% |
| Inventory | G | G | G | G | Y | G | G | G | G | G | Y | G | G | G | G | G | G | Y | G | G | Y | G 91% |
| Components | G | G | G | G | Y | G | G | G | Y | G | Y | G | G | G | G | G | G | Y | Y | Y | Y | Y 87% |
| Production | G | G | G | G | Y | G | G | G | Y | G | Y | G | G | G | G | G | G | Y | G | Y | Y | Y 86% |
| QC | G | G | G | G | Y | G | G | G | Y | G | Y | Y | G | G | G | G | G | G | Y | Y | Y | Y 88% |
| Yard | G | G | G | G | G | G | G | G | G | G | Y | G | G | G | G | G | G | Y | G | G | Y | Y 89% |
| Logistics | G | Y | G | G | Y | Y | G | G | Y | G | Y | G | G | G | G | G | G | Y | Y | Y | Y | Y 82% |
| Projects | G | Y | G | G | Y | G | G | G | Y | G | Y | G | G | G | G | G | G | Y | G | Y | Y | Y 83% |
| Settings | G | G | G | G | G | G | G | G | G | G | Y | G | G | G | G | G | G | G | Y | G | Y | Y 90% |
| Master Data | G | G | G | G | G | G | G | G | G | G | G | G | G | G | G | G | G | G | N/A | G | Y | G 94% |
| Executive BI | G | G | G | G | G | G | G | G | Y | G | Y | G | G | G | G | G | G | G | G | G | Y | Y 90% |

No active audited module was scored RED after shared P0 correction. YELLOW does
not imply fake data; it identifies remaining visual debt or missing browser
evidence.

## Findings Before P0 Correction

1. Shared cockpit/module panels used 16px radii while newer Industrial Cockpit
   workspaces use compact 8px surfaces.
2. The KPI contract declared 108px while canonical Inventory and recent Master
   Data/Yard cards override it to 92px.
3. Table shells did not enforce stable row/header height, medium typography or
   no-wrap behavior.
4. Detail drawer defaults varied between 45vw, 58vw and 62vw. `max-w-*` callers
   could also lose a stable width because the override replaced the width class.
5. Pagination mixed text Previous/Next with page buttons and lacked first/last
   navigation and complete accessible names.
6. Contextual tabs and module buttons retained larger radii and inconsistent
   heights.
7. Master Data toolbar ordered Export before Density.

## P0 Fixed

| P0 | Correction | Shared impact |
| --- | --- | --- |
| Font/control inconsistency | Inputs/buttons/table rows use medium compact typography and 36px controls | All consumers of `shared/ui/modules` |
| KPI inconsistency | Canonical KPI and skeleton height set to 92px | All `CockpitKpiCard` consumers |
| Table inconsistency | `CockpitTableShell` now enforces 36px, no-wrap, ellipsis-ready cells | Inventory, Components, Production, QC, Yard, Logistics, Projects, Settings, BI |
| Drawer inconsistency | Right drawer basis set to 64vw; max-width-only overrides retain stable width | All `ModuleDetailDrawer` consumers |
| Spacing/radius drift | Shared cockpit/module/tab surfaces normalized to 8px | Shared operational surfaces |
| Pagination drift | One 44px contract with first/previous/pages/next/last and ARIA labels | Every `DataTablePagination`/wrapper consumer |
| Toolbar drift | Master Data follows Search, Filter, Refresh, Density, Export, View, Add | All unified Master Data workspaces |
| Loading geometry | KPI loading matches normal 92px geometry | All KPI loading states |

## Overlay Classification

- Record detail: right `ModuleDetailDrawer`, 64vw desktop.
- Full list: 96vw workspace; not classified as a centered detail modal.
- Focused command/confirmation/media preview: centered modal remains allowed if
  viewport bounded and focus managed.

This distinction prevents visual cleanup from changing command behavior.

## P1

1. Add `title`/accessible tooltip to every page-local truncated business cell;
   CSS can enforce ellipsis but cannot infer the full accessible label.
2. Migrate remaining page-local command overlays to one modal shell without
   changing command semantics.
3. Adopt the shared toolbar in non-Master Data pages after mapping each existing
   filter/action contract; do not add unsupported filters.
4. Reduce local panel/input aliases in the monolithic Production and Projects
   pages.
5. Standardize chart error/retry behavior where current read models expose an
   error state.
6. Complete authenticated visual certification at the four canonical
   breakpoints.

## P2

1. Add screenshot baselines and visual-diff thresholds to CI.
2. Split monolithic page files along presentational boundaries only when a
   dedicated maintainability sprint is approved.
3. Introduce a shared drawer-tab primitive after current module-specific detail
   tab contracts are mapped.
4. Add automated keyboard traversal checks with axe or equivalent tooling.

## Before And After

| Metric | Before | After |
| --- | --- | --- |
| KPI default height | 108px with frequent 92px overrides | 92px canonical |
| Operational surface radius | commonly 16px | 8px shared default |
| Table row/header | page dependent | 36px shared contract |
| Table text | mixed weight/wrapping | medium, single-line shared contract |
| Drawer desktop width | 45/58/62vw and unstable max-width-only overrides | 64vw basis |
| Pagination | page numbers plus text Previous/Next | first/previous/pages/next/last, accessible |
| Master Data command order | Refresh, Export, Density, View, Add | Refresh, Density, Export, View, Add |

## Source Files Changed

- `apps/frontend/src/shared/ui/cockpit/cockpit-tokens.ts`
- `apps/frontend/src/shared/ui/cockpit/EnterpriseKpiCard.tsx`
- `apps/frontend/src/shared/ui/cockpit/cockpit-shell.ts`
- `apps/frontend/src/shared/ui/cockpit/CockpitTableShell.tsx`
- `apps/frontend/src/shared/ui/cockpit/DataTablePagination.tsx`
- `apps/frontend/src/shared/ui/modules/index.tsx`
- `apps/frontend/src/shared/ui/enterprise/EnterpriseWorkspace.tsx`
- `apps/frontend/src/modules/master-data/components/UnifiedMasterDataWorkspace.tsx`
- `apps/frontend/src/shared/ui/ui-contract.test.tsx`

## Verification

| Gate | Result | Evidence |
| --- | --- | --- |
| Frontend tests | PASS | 4 files, 11 tests |
| Typecheck | PASS | `pnpm -C apps/frontend typecheck` |
| Full ESLint | PASS WITH BASELINE WARNINGS | 0 errors, 384 warnings |
| Frontend build | PASS | Vite production build completed; existing large Three.js chunk warning |
| Playwright visual | BLOCKED | Backend could not connect to PostgreSQL at `localhost:5432`; no authenticated real-data page could be certified |
| `git diff --check` | PASS | No whitespace errors |

The Playwright blocker is environmental, not converted into a GREEN result.
No mocked route, frontend-only fixture or direct database mutation was used.
No backend, API, Prisma or migration file was changed by this sprint.
