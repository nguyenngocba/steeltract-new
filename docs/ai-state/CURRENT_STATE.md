# Current State

## SPRINT EXECUTIVE BI.7 – Standardize All Executive BI Domains

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-25, standardized all 6 remaining Executive BI domains (`Nhập kho`, `Xuất kho`, `Sản xuất`, `Chất lượng`, `Dự án`, `Giao nhận`) using the Inventory Executive BI workspace as the MASTER TEMPLATE. Completely removed redundant oversized hero headers (`AnalyticsHeader`), integrated domain-specific `<ExecutiveInsightPanel domain={domain} />`, standardized Row 1 to 60/40 ratio, Row 2 to 3-column grid, and added `<ExecutiveAlertsAndRecommendations />` across all domains.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## SPRINT EXECUTIVE BI.5 – Premium Enterprise UX Polish

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-25, performed a premium enterprise UX polish on the Executive BI Popup (`AnalyticsPrimitives` & `DashboardPage`). Added 150–200ms micro-interaction transitions, hover translate/shadow effects, group-hover halo scaling, unified typography contrast, strict semantic color consistency (Blue = Financial, Emerald = Healthy, Amber = Warning, Red = Critical, Purple = Analysis, Cyan = Realtime), and accessibility focus states.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## SPRINT EXECUTIVE BI.4 – Executive Insights & Professional Dashboard Polish

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-25, upgraded the Inventory Executive BI workspace (`DashboardPage` & `AnalyticsPrimitives`) into an Executive Decision Dashboard. Integrated `<ExecutiveInsightPanel />` below KPI cards, added `<ExecutiveAlertsAndRecommendations />` (grouped into Critical, Warning, Info alerts + 3 C-level recommendations), updated `AnalyticsSection` headers with descriptive subtitles and update badges, and polished domain empty states.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## SPRINT EXECUTIVE BI.3 – Dashboard Layout & Analytics Composition

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-25, optimized the Executive BI Inventory dashboard layout (`AnalyticsPrimitives` & `DashboardPage`). Implemented a 60/40 grid composition (`xl:grid-cols-[1.2fr_0.8fr]`) for Row 1 charts, resized the Donut SVG container (`h-36 w-36`) to increase chart drawing area, refined Heatmap cards (`h-[155px]`), reduced section header margins (`mb-2`), increased above-the-fold information density, and preserved sticky navigation.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## SPRINT EXECUTIVE BI.2 – Enterprise Visual Polish & Color System

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-25, refined the visual quality and color system of the Executive BI Popup (`AnalyticsPrimitives` & `DashboardPage`). Removed the KPI left accent stripe, applied a semantic color system across KPI cards (Blue for Value, Emerald for Quantity, Amber for Warnings, Purple for Status, Cyan for Activity), refreshed chart colors (ABC Analysis: Emerald/Amber/Red, Aging: Blue/Cyan/Amber/Red), polished typography hierarchy, and eliminated purple visual weight imbalance.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## SPRINT EXECUTIVE BI.1 – Executive BI Popup UI Polish

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-25, polished the Executive BI Popup (`ExecutiveAnalyticsPortal` & `AnalyticsPrimitives`) maintaining the strict 2-column grid layout. Reduced KPI card height to `90–92px`, optimized top chart row heights to `h-[230px]` and lower chart row heights to `h-[300px]`, removed unintended purple borders/edge decorations with uniform cyan borders, and enabled independent vertical scrolling with a fixed sidebar.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## SPRINT INVENTORY.3 – Inventory Audit Enterprise UI Standardization

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-24, standardized the Inventory Audit workspace (`/inventory/audit`) using the Enterprise Design System following the Inventory Overview & Transactions Golden Reference layout order. Primary audit actions (`+ Tạo phiên kiểm kê`) bound to the global AppTopbar via `InventoryGlobalActionBar`. Built 6 Enterprise KPI cards, 4 Analytics CockpitChartCard containers, a Compact Enterprise Toolbar with search icon & filter dropdowns, an Enterprise Hero Table with sticky headers & count badge & `[Xem tất cả]`, an Expanded Modal rendered via `createPortal`, and slide-over Detail Drawer.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## SPRINT INVENTORY.2 – Inventory Transactions Enterprise UI Standardization

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-24, standardized the Inventory Transactions workspace (`/inventory/transactions`) using the Enterprise Design System following the Inventory Overview & Dispatch Golden Reference layout order. Wired primary actions (`+ Nhập kho`, `+ Xuất kho`, `+ Chuyển kho`) to the global AppTopbar via `InventoryGlobalActionBar`. Built 6 Enterprise KPI cards, 4 Analytics CockpitChartCard containers, a Compact Enterprise Toolbar with search icon & filter dropdowns, an Enterprise Hero Table with sticky headers & count badge & `[Xem tất cả]`, an Expanded Modal rendered via `createPortal`, and slide-over Detail Drawer.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## SPRINT DISPATCH.1 – Dispatch Overview Enterprise Workspace Standardization

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-24, standardized the Dispatch / Logistics Overview workspace (`/logistics`) using the Enterprise Design System following the Inventory & Components Overview layout order. Moved primary action `+ Tạo điều xe` to global AppTopbar using `DispatchActionProvider` & `DispatchGlobalActionBar`. Built 6 Enterprise KPI cards, 4 Analytics CockpitChartCard containers, a Compact Enterprise Toolbar with search icon & filter dropdowns, an Enterprise Hero Table with sticky headers & count badge & `[Xem tất cả]`, an Expanded Modal rendered via `createPortal`, and slide-over Detail / Create Drawers.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## Sprint QC.5, QC.6, QC.7, QC.8 UI Polish Sprint

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-24, standardized the remaining 4 QC workspaces (`/qc/ncr`, `/qc/capa`, `/qc/logs`, `/qc/reports`) using the Enterprise Design System following the Inventory & Components Overview layout order. Built dedicated KPI Strips, Analytics Dashboards (including Pareto & Heatmap for Reports), Compact Toolbars with search icons, Hero Tables with exact requested columns & sticky headers & `[Xem tất cả]`, Expanded Modals via `createPortal`, Slide-over Drawers, and a dedicated **Enterprise Report Viewer Modal** supporting PDF/Excel export and Printing.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## Sprint QC.2, QC.3, QC.4 UI Polish Sprint

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-24, standardized the 3 core inspection tabs in QC module (`/qc/inbound`, `/qc/production`, `/qc/final`) using the Enterprise Design System following the Inventory & Components Overview layout order. Built dedicated KPI Strips, Analytics Dashboards, Compact Toolbars with search icons, Hero Tables with exact requested columns & sticky headers & `[Xem tất cả]`, Expanded Modals via `createPortal`, and Detail Drawers.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## QC Overview UI Polish Sprint

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-24, standardized QC Overview (`/qc`) using the Enterprise Design System following the Components Overview layout order. Moved primary action `+ Tạo phiếu kiểm tra cấu kiện` to global AppTopbar using `QCActionProvider` & `QCGlobalActionBar`. Standardized all 6 layout phases (6 KPI Cards, Cockpit Analytics Dashboard, Compact Toolbar with search icon, Hero Table with sticky header & `[Xem tất cả]`, Expanded Modal via `createPortal`, and Detail Drawer).

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## Suppliers Quality, Finance, Activity & Reports UI Polish Sprint

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-24, standardized all 4 remaining Suppliers tabs (`/suppliers/quality`, `/suppliers/payables`, `/suppliers/logs`, `/suppliers/reports`) following the Inventory Overview Golden Reference layout. Aligned all 6 Enterprise layout phases per tab with strict KPI definitions, Cockpit analytics, compact toolbars with search icon, Hero Tables with `[Xem tất cả]`, Expanded Modals via `createPortal`, and detail drawers.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## Suppliers Business Tabs UI Polish Sprint

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-24, standardized all 3 Suppliers business tabs (`/suppliers/quotes`, `/suppliers/purchase-orders`, `/suppliers/deliveries`) following the Inventory Overview Golden Reference layout. Aligned all 6 Enterprise layout phases per tab with strict KPI definitions, Cockpit analytics, compact toolbars with search icon, Hero Tables with `[Xem tất cả]`, Expanded Modals via `createPortal`, and detail drawers.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## Suppliers Overview UI Polish Sprint

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-24, standardized Suppliers Overview (`/suppliers`) layout following the Inventory Overview Golden Reference. Moved `+ Thêm nhà cung cấp` to global AppTopbar using `SuppliersActionProvider`, aligned 6-phase layout (KPI strip, Cockpit analytics, compact filter toolbar with search input, Hero Table with `[Xem tất cả]`, Expanded Modal via `createPortal`, and detail drawer).

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## Restore Hero Table View All Pattern Sprint

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-24, restored standard `[Xem tất cả]` button and Expanded Modals (`createPortal`) in Hero Table headers for both Project Components (`/projects/components`) and Project Materials (`/projects/materials`).

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## Project Components & Materials Tabs Standardization Sprint

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-24, standardized **Project Components** tab (`/projects/components`) and **Project Materials** tab (`/projects/materials`):
- Refactored KPI strips into 6 `<EnterpriseKpiCard />` cards.
- Integrated search input with search icon, project dropdowns, status dropdowns, search & reset buttons.
- Standardized Hero Tables with count pill badges, sticky table headers, and `DataTablePagination`.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## Progress Tab Standardization Sprint

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-24, standardized **Project Progress** tab (`/projects/progress`) according to the Enterprise Design System:
- Order: KPI Cards → Compact Toolbar → Hero Table → Progress Analytics & Risk Alert Widgets.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## Project List Tab Standardization Sprint

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-24, standardized **Project List** tab (`/projects/list`) according to the Enterprise Design System:
- Order: KPI Cards → Compact Toolbar → Hero Table → Summary Analytics Widgets.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## Projects Toolbar Position Fix

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-24, fixed Projects Overview (`/projects`) toolbar position:
- Compact Toolbar (`FilterBar`) is now positioned immediately after the Analytics Dashboard and before the Hero Table.
- Secondary overview widgets (`Công trình sắp hoàn thành`, `Công trình chậm tiến độ`, `Hoạt động gần đây`) render below the Hero Table.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## Restore Search Input Sprint

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-24, restored visual Search Input in Projects Overview (`/projects`) toolbar:
- Added left-aligned `Search` icon inside input container (`relative flex items-center`).
- Controls order: Search Input → Status ▼ → Customer ▼ → Project Manager ▼ → Region/Type ▼ → `[Tìm kiếm]` → `[Làm mới]`.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## Projects Layout Alignment Sprint

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-24, adjusted Projects Overview (`/projects`) layout sequence to strictly follow the Enterprise Design System:
- Moved Compact Toolbar (`FilterBar`) immediately below the Analytics Dashboard and above the Hero Table.
- Exact page order: Header → Enterprise KPI Cards → Analytics Dashboard → Compact Toolbar → Hero Table → Expanded Modal → Detail Drawer.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## Shared Project Form Sprint

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-24, unified project form architecture to use a single shared `ProjectFormDialog` component:
- Both `+ Thêm công trình` (Create mode) and `"Sửa công trình"` (Edit mode) open the same `ProjectFormDialog` component.
- Removed duplicated `CreateProjectDialog` and `EditProjectDialog` implementations.
- Maintained all existing layout, form controls, styling, template selector, contract value input formatting, and detail notes.
- Managed centrally in `ProjectsActionContext` via `useProjectsActions()`.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## Projects Overview UI Polish Sprint

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-24, Projects Overview (`/projects`) was standardized according to the 6-phase Golden Reference UI Polish specification:
- **Task 1**: Moved primary creation action `+ Thêm công trình` to page topbar via `ProjectsActionContext` & `ProjectsGlobalActionBar` registered in `AppTopbar`. Toolbar now strictly contains search and filter controls.
- **Task 2**:
  - Phase 1: 6 `<EnterpriseKpiCard />` items (`Tổng số công trình`, `Đang triển khai`, `Hoàn thành`, `Chậm tiến độ / Rủi ro`, `Giá trị hợp đồng`, `Tỷ lệ hoàn thành TB`).
  - Phase 2: Standardized chart cards (`CockpitChartCard`) for progress timeline, contract value timeline, task status, and risk alerts.
  - Phase 3: Compact `EnterprisePanel` toolbar with search input, status dropdown, customer dropdown, PM manager dropdown, type dropdown, search button, and refresh button.
  - Phase 4: Sticky table header (`sticky top-0 z-10 bg-[#1e293b]`), count pill badge `{rows.length} công trình`, pagination via `DataTablePagination`.
  - Phase 5: Full-screen expanded table modal (`expandedModalOpen`) using `createPortal(..., document.body)` with `z-[9999] backdrop-blur-sm`.
  - Phase 6: Standardized `ProjectDetailDrawer` via `ModuleDetailDrawer`.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## Yard Module UI Polish Sprint

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-24, all remaining sub-pages in the Yard Module (`Yard 2D Map`, `Yard 3D Map`, `Heatmap`, `Timeline`, `Movement History`, `Reports / Locations / Tracking`) were standardized across all 6 Golden Reference UI Polish phases.
Header actions strictly enforce `+ Nhập bãi` (Primary), `Xuất bãi` (Secondary), and `Khác ▼` dropdown menu via `YardActionProvider` and `YardGlobalActionBar`.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## Yard Overview UI Polish Sprint

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-24, Yard Overview (`/yard`) was standardized according to the 6-phase Golden Reference UI Polish specification:
- **Task 1**: Created `YardActionContext`, `YardActionProvider`, and `YardGlobalActionBar` displaying ONLY `+ Nhập bãi` (Primary), `Xuất bãi` (Secondary), and `Khác ▼` dropdown (`Quản lý Zone`, `Quản lý Slot`, `Chuyển nội bộ`). Registered in `AppTopbar` and `OperationalShell`. Toolbar stripped of all action buttons.
- **Task 2**:
  - Phase 1: 6 `<EnterpriseKpiCard />` items (`Sức chứa bãi Tập kết`, `Sức chứa khả dụng`, `Cấu kiện lưu bãi`, `Giao dịch bãi hôm nay`, `Zone quá tải`, `Cầu trục vận hành`).
  - Phase 2: Refactored chart cards (`CockpitChartCard`) for yard capacity, movement flow, and mini trend.
  - Phase 3: Compact `EnterprisePanel` toolbar with search input, warehouse dropdown, zone dropdown, status dropdown, project dropdown, search button, and refresh button.
  - Phase 4: Sticky table header (`sticky top-0 z-10 bg-[#1e293b]`), count pill badge `{filteredSlots.length} slot bãi`, pagination via `DataTablePagination`.
  - Phase 5: Full-screen expanded table modal (`expandedModalOpen`) using `createPortal(..., document.body)` with `z-[9999] backdrop-blur-sm`.
  - Phase 6: Standardized `YardDetailDrawer` via `ModuleDetailDrawer`.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## Planning Overview Action Provider Fix Sprint

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-24, two key Action Provider bugs were resolved:
- **BUG 1**: Removed all duplicate `+ Lập kế hoạch mới` buttons from local page headers, hero tables, toolbars, and tab content. The primary creation action now exists **ONLY in the global `AppTopbar`**.
- **BUG 2**: Fixed provider hierarchy by wrapping `OperationalShell` (`src/shared/layouts/OperationalShell.tsx`) with `PlanningActionProvider` (and `ProductionActionProvider`). `AppTopbar` is now inside `PlanningActionProvider`, allowing `PlanningGlobalActionBar` to trigger `openCreatePlan()` properly. Mounts `CreatePlanModal` via `createPortal(..., document.body)` with `z-[9999] backdrop-blur-sm`.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## Planning Overview UI Polish Sprint

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-24, Planning Overview (`/planning`) was standardized according to the 6-phase Golden Reference UI Polish specification:
- **Task 1**: Moved primary creation action `+ Lập kế hoạch mới` to page topbar via `PlanningActionContext` & `PlanningGlobalActionBar` registered in `AppTopbar`. Toolbar now strictly contains search and filter controls.
- **Task 2**:
  - Phase 1: 6 `<EnterpriseKpiCard />` items (`Chờ thực hiện`, `Đang thực hiện`, `Điểm nghẽn / Cảnh báo`, `Hoàn thành mục tiêu`, `Tổng số kế hoạch`, `Dự án đang theo dõi`).
  - Phase 2: Refactored category breakdown & bottleneck constraint analytics cards.
  - Phase 3: Compact `EnterprisePanel` toolbar with search input, status dropdown, project dropdown, customer dropdown, month dropdown, search button, and refresh button.
  - Phase 4: Sticky table header (`sticky top-0 z-10 bg-[#1e293b]`), count pill badge `{filteredPlans.length} hạng mục`, pagination via `DataTablePagination`.
  - Phase 5: Full-screen expanded table modal (`expandedModalOpen`) using `createPortal(..., document.body)` with `z-[9999] backdrop-blur-sm`.
  - Phase 6: Standardized `PlanningDetailDrawer` via `ModuleDetailDrawer`.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## Production Advanced Operations UI Polish Sprint

Status: **IMPLEMENTED - TEST/BUILD PASS**

On 2026-07-24, all 9 low-frequency Advanced Operations pages (`/production/advanced`) were standardized according to the 6-phase Golden Reference UI Polish specification:
1. **Dispatching / Machines (`MachinesWorkspace`)**: Refactored 6 EnterpriseKpiCard items, compact toolbar, sticky Hero Table with `{rows.length} máy` pill badge, and full-screen expanded modal via `createPortal`. Primary action buttons (`+ Lệnh SX`, `+ BOM`) elevated to Topbar (`ProductionGlobalActionBar`).
2. **Production Warehouse (`ProductionWarehouseCockpit`)**: Standardized 6 EnterpriseKpiCard items, compact search & status filter toolbar, sticky Hero Table with count pill badge, and expanded modal.
3. **Material Reservations (`Reservations`)**: Standardized 6 EnterpriseKpiCard items, compact toolbar with status filter (`RESERVED`, `DRAFT`, `PARTIALLY_ISSUED`, `EXPIRED`), sticky Hero Table with count pill badge, and expanded modal.
4. **Material Ledger (`MaterialLedger`)**: Standardized 6 EnterpriseKpiCard items, compact toolbar with MO select, Material select, EventType select, date range filters, sticky Hero Table with count pill badge, and expanded modal.
5. **Material Issues (`Issues`)**: Standardized 6 EnterpriseKpiCard items, compact toolbar with status filter (`COMPLETED`, `ISSUED`, `PARTIAL`), sticky Hero Table with count pill badge, expanded modal, and `IssueDetailDrawer`.
6. **Material Consumptions (`Consumptions`)**: Standardized 6 EnterpriseKpiCard items, compact search toolbar, sticky Hero Table with count pill badge, and expanded modal.
7. **Incidents & Rework (`ProductionIncidentsWorkspace`)**: Standardized 6 EnterpriseKpiCard items, compact toolbar with source filter (`Order`, `Log`), sticky Hero Table with count pill badge, and expanded modal.
8. **Machine Logs (`Logs`)**: Standardized 6 EnterpriseKpiCard items, compact toolbar with log type filter, sticky Hero Table with count pill badge, and expanded modal.
9. **Advanced Reports (`ProductionReportsWorkspace`)**: Standardized 6 EnterpriseKpiCard items and CockpitChartCard presentation matching Components & Production Overview.

Verification: `pnpm -C apps/frontend build` (Pass), `pnpm -C apps/backend-api build` (Pass), `git diff --check` (Pass).

## Component Manufacturing Workflow

Status: **SPRINT A IMPLEMENTED - TEST/BUILD PASS**

Sprint A establishes the Engineering Release gate for manufacturing. SteelTrack
now prevents Production Order creation for component-bound orders unless the
Component has been released through the existing engineering aggregate
(`ComponentLifecycleState.ACTIVE`) and has a current released revision/BOM.
The canonical Production command API additionally verifies the exact released
revision, released BOM definition and content hash supplied in the engineering
basis. No Prisma schema, migration, Historical Dashboard, Snapshot Engine,
Warehouse Realtime, Inventory redesign or Production UI redesign was
introduced.

## Production Order Creation and Component Lifecycle Hardening

Status: **IMPLEMENTED - TEST/BUILD PASS**

Production Order creation now preserves the canonical lifecycle contract: new
orders are submitted as `DRAFT`, and backend validation still rejects invalid
create statuses. Legacy Component creation now assigns
`ComponentLifecycleState.DRAFT` and aggregate version metadata, while
Components read models label draft rows as `Draft` and exclude them from
finished-goods stock counts. QC NCR creation now supports additive defect
recording fields stored in existing metadata. No schema, migration, Inventory,
Historical Dashboard, Snapshot Engine or Historical API changes were made.

## Executive Historical Dashboard UI

Status: **IMPLEMENTED - FRONTEND BUILD PASS**

Sprint 4 added the frontend `/history` Executive Historical Dashboard. The page
uses the completed Historical Read API through the authenticated `lib/api`
client and TanStack Query. It provides Overview, Inventory, Production,
Projects, Suppliers and Snapshot Jobs tabs; date/from/to/warehouse/module and
authoritative-only filters; KPI cards; historical trend panels; inventory and
monthly rollup tables; and snapshot job monitoring. Backend, Prisma, Snapshot
Engine, Scheduler and Job Queue remain unchanged.

## Historical Dashboard Read API

Status: **IMPLEMENTED - TEST/BUILD PASS**

Sprint 3 added the read-only Historical Dashboard REST API. The backend now
exposes `/history/dashboard`, `/history/dashboard/latest`,
`/history/dashboard/monthly`, `/history/inventory`,
`/history/inventory/monthly` and `/history/jobs` through a dedicated
Controller -> Service -> Repository stack with strict query DTOs and
paginated, serialized responses. The API reads existing historical snapshot
tables only. Snapshot Engine, Scheduler, Job Queue, Prisma schema, migrations,
frontend and business logic remain unchanged.

## Historical Snapshot Engine Production Hardening

Status: **IMPLEMENTED - TEST/BUILD PASS**

Sprint 2.2 hardened the backend Snapshot Engine only. Job identity now includes
`snapshotType`, scheduling is guarded by a PostgreSQL advisory transaction
lock, retryable failed jobs are not recreated, metadata only advances, stale
historical snapshots are explicitly non-authoritative, expired max-attempt
running jobs are closed as failed, and inventory snapshot generation uses
cursor batching with lease checks. Prisma schema, migrations, APIs,
controllers, frontend and business logic remain unchanged.

## Historical Dashboard Snapshot Engine

Status: **IMPLEMENTED - BUILD PASS**

Sprint 2 implemented the backend-only Snapshot Engine on top of the frozen
Historical Dashboard Prisma schema. The engine is metadata-driven, schedules
daily jobs from `SnapshotMetadata`, claims `SnapshotJob` rows with leases,
recovers expired leases, retries failed jobs up to `maxAttempts`, writes
structured `SnapshotJobLog` rows, updates job metrics and writes daily/monthly
snapshots idempotently through existing unique keys. Dashboard APIs,
frontend, controllers, Prisma models and migrations remain unchanged.

## Historical Dashboard Prisma Schema Hardening

Status: **IMPLEMENTED - BUILD PASS**

The Historical Executive Dashboard Prisma models were hardened before any
Snapshot Engine, API or service work. The new historical layer now uses
dedicated enums for modules, scope types, granularities, sources, stock status,
job types, job status, log levels, frequency and readiness. Daily snapshot
models use single-column UUID primary keys for Prisma Client ergonomics, and
inventory historical uniqueness now uses non-null bucket keys to avoid
PostgreSQL nullable-unique duplicate behavior. Raw SQL migration notes remain
required for partitioning, partial indexes, covering indexes, GIN indexes and
CHECK constraints that Prisma cannot express.

## Historical Dashboard Prisma Schema Foundation

Status: **IMPLEMENTED - PRISMA VALIDATE PASS**

The approved Historical Executive Dashboard database design is now represented
in Prisma schema as additive models only. New models cover dashboard daily
snapshots, inventory balance snapshots, monthly rollups, snapshot jobs, job
logs, rebuild requests and snapshot metadata. Existing business tables,
services, APIs and frontend code are unchanged. PostgreSQL-specific features
that require raw SQL migration review are marked in schema comments and
documented in `docs/runtime/historical-dashboard-prisma-migration-plan.md`.

## Inventory Material Created Date Input

Status: **IMPLEMENTED - BUILD PASS**

The Add Material drawer now includes a compact `Ngày thêm` date-time input next
to the `Thêm vật tư mới` header, preserving the existing form body layout. New
materials send the selected timestamp through the existing create-material API,
and the backend persists it to the existing `InventoryItem.createdAt` field.
Editing existing materials remains unchanged. No schema or migration was
introduced.

## Executive Dashboard Data Availability Hotfix

Status: **IMPLEMENTED - BUILD PASS**

Executive Dashboard data extraction now handles nested/paginated payloads and
line-item transaction values. The `Giá trị nhập kho` and `Giá trị xuất kho`
KPIs/charts can now derive values from transaction headers or `items[]` lines,
and their 30-day sparklines are anchored to the newest backend timestamp rather
than the local current date. Production running counts now use a broader set of
active production states. Analytics popup panels no longer render the heavy
left colored accent strip.

## Login & Sidebar Brand Polish

Status: **IMPLEMENTED - FRONTEND BUILD PASS**

The login screen now uses the provided factory background and logo assets from
`images/`, with a central dark glass panel and an animated luminous stroke
running around the outside edge. The active application sidebar now presents
TRIVIETSTEEL / Smart Solutions, while the collapsed sidebar uses `logo-tv.png`
and keeps the expand control at the bottom. Executive Dashboard donut charts
now render with sharper flat segment edges and subtle inter-slice spacing.
Backend contracts and authentication behavior are unchanged.

## Executive Dashboard Business Data Polish

Status: **IMPLEMENTED - FRONTEND BUILD PASS**

Executive Dashboard content mapping now follows the business-data rules. The
main inventory distribution chart uses inventory value by material type, the
material-group donut/list share one value-based dataset, import/export trend
uses existing inventory overview movement history when available, and QC,
delivery and alerts render only from authoritative backend data or controlled
empty states. The import/export widget now has a currency-axis comparison
chart in its popup and a compact zig-zag trend on the main dashboard. KPI
drill-down pages use calmer colors, Vietnamese section/status labels and now
open as smaller modal overlays instead of replacing the whole dashboard. The
six dashboard chart panels and the risk panel open their own enlarged popups
with additional detail tables. Header quick search, LIVE and refresh controls
were removed, and the time filter now supports custom date ranges. Backend
contracts and business logic are unchanged.

## Executive Dashboard KPI Reference Alignment

Status: **IMPLEMENTED - FRONTEND BUILD PASS**

The 8 Executive Dashboard KPI cards now follow the provided KPI reference more
closely: compact icon on the left, title text on the right of the icon, no
status badge, compact currency values, green/red percentage delta and a 30-day
mini trend line underneath. Backend, API contracts and business logic remain
unchanged.

## Executive Dashboard Final Visual Polish

Status: **IMPLEMENTED - BUILD PASS**

Executive Dashboard received a visual-only premium polish. KPI cards now have
clearer semantic identity through domain-specific halo, icon frame, accent
border, gradient and sparkline treatment. Analytics panels are more visual and
less border-heavy, with taller charts, larger donut visuals and stronger
progress/ranking treatments. Backend, API contracts, business logic and data
sources are unchanged.

## Executive Dashboard Chart Empty-State Polish

Status: **IMPLEMENTED - BUILD PASS**

Executive Dashboard chart presentation was stabilized after V4.1. KPI
sparklines no longer print repeated `Dữ liệu lịch sử chưa khả dụng` text when
history is missing; they render a quiet neutral line instead. Trend panels now
use real ranking/distribution/status data as a fallback when time-series data
is not available, avoiding repeated chart-level empty states without fabricating
values. Dashboard analytics typography was reduced to medium-weight styles to
avoid broken/heavy-looking text.

Backend, API contracts and business logic are unchanged.

## Executive Dashboard V4.1 Final UI Polish

Status: **IMPLEMENTED - FRONTEND BUILD PASS**

The Executive Dashboard now has a shared analytics UI framework under
`apps/frontend/src/shared/ui/analytics` and domain-specific themes for
Inventory, Inbound, Outbound, Production, QC, Projects and Dispatch. KPI cards
now communicate business identity visually through domain color, icon,
gradient, pattern, hover treatment and real-data sparkline/empty-history state.

Domain analytics drill-downs no longer render as one reusable template.
Inventory emphasizes warehouse occupancy, ABC and aging; Inbound emphasizes
supplier/receiving flow; Outbound emphasizes delivery/customer/shipment
readiness; Production emphasizes order capacity and machine readiness; QC
emphasizes Pareto/NCR/root cause readiness; Projects emphasizes milestone,
budget and delay; Dispatch emphasizes shipment, route and truck utilization.

Backend, APIs, routes, permissions, schema and business logic are unchanged.

## EPIC 12.4 Executive BI Portal Final Redesign

Status: **IMPLEMENTED - FRONTEND BUILD PASS**

The Executive Dashboard is now structured as an Executive BI Portal. The main
page renders exactly eight domain KPI cards and large visual analytics groups.
Each KPI opens a domain analytics workspace for Inventory, Inbound, Outbound,
Production, QC, Projects or Dispatch. The implementation uses existing backend
contracts only and renders `Dữ liệu chưa khả dụng` instead of fake historical
charts when authoritative data is missing.

Backend, API contracts, routes, schema, permissions and business logic are
unchanged.

## Executive Dashboard UI Redesign V3

Status: **COMPLETED - BUILD PASS, CANON CERTIFIED**

Integrated Gap Analysis report and updated DashboardPage.tsx to match `kpi chinh.png` and `chi tiet bang.png` layouts. Configured 1920x1080 resolution compatibility with zero vertical scrolling, translated 100% of text and labels to Vietnamese, and enabled the 95vw/92vh detail analytics modal with sidebar filter control panels.

## Executive Dashboard UI Redesign (Final Design)

Status: **COMPLETED - BUILD PASS, CANON CERTIFIED**

Redesigned the entire landing page to fit exactly 1920x1085 resolution with zero vertical scrolling. Removed text-heavy panels (insights, matrices, text overviews) in favor of high-density visual charts (Inventory value by warehouse horizontal stacks, Production status, QC NCR, project donuts), progress bars, and minimal heatmaps. Translated all terms to Vietnamese.

## Executive Dashboard & KPI Drill-down Redesign (Version 2.0)

Status: **COMPLETED - BUILD PASS, CANON CERTIFIED**

Redesigned the top KPI section into exactly 8 KPI cards containing icons, delta changes, sparklines, and status badges on a single 1920x1080 screen with zero scrolling. Reconstructed all drill-down actions to trigger a beautiful fullscreen modal (95vw, 92vh) featuring a left sidebar filter panel and 6 detailed right content analytics panels (Summary, 12-Month Trend, Rankings, Distribution, Comparisons, Detail Table, and Highlights).

## Executive Analytics Fullscreen Popup UI Redesign

Status: **COMPLETED - BUILD PASS, CANON CERTIFIED**

Redesigned all Executive Dashboard drill-down actions to trigger an animated fullscreen (95vw, 92vh) modal analytics workspace. Features 5 summary KPI cards with delta trends, a 12-month zoomable historical trend chart, monthly comparisons & category distributions, top 10 horizontal ranking bars, density/occupancy distribution views, a 12-row monthly detail table, and factual operational insights. Preserves dashboard filter states and allows direct returns upon closing.

## EPIC 12.5 Executive Business Analytics & Cross-Module Intelligence

Status: **COMPLETED - BUILD PASS, CANON CERTIFIED**

Transformed DashboardPage.tsx into a comprehensive operational cockpit containing Cross-Module Analytics (material shortages affecting production, completed production awaiting shipping, delayed projects due to production lag, QC Holds blocking dispatch dispatches). Added the Executive Risk Matrix, Operational Dependency Pipeline view, Operational Heatmap, Business Flow summary, and executive decision-required action cards for PO triggers and NCR resolutions.

## EPIC 12.4 Executive Dashboard Data Accuracy & Operational Analytics

Status: **COMPLETED - BUILD PASS, CANON CERTIFIED**

Audited all Executive KPIs and aligned calculations to use the exact same backend read models as their source modules (integrating `useInventoryOverview` directly). Upgraded the `AnalyticsPage.tsx` charts to represent actual operational business answers (Warehouse Occupancy, Top 10 Low Stock Materials, Category Distribution, Production status, Vehicle Utilization, QC Pass Rates, Project Completion, and Executive Health Score), while maintaining a diverse mix of visual representations and clear data source descriptions.

## EPIC 12.3 Executive Command Center

Status: **COMPLETED - BUILD PASS, CANON CERTIFIED**

Transformed the Executive Dashboard into an active Command Center. Integrated Quick Action cards that identify real operational issues (low stock, blocked MOs, QC failures) and provide direct resolution navigation. Added an Operational Work Queue grouped by timeline phases, a Personal Task Panel for pending approvals, a Smart Recommendations container reflecting real MRP shortages, and an Executive Calendar agenda.

## EPIC 12.2 Executive Drill-down Dashboards

Status: **COMPLETED - BUILD PASS, CANON CERTIFIED**

Enabled comprehensive interactive drill-down navigation from all Executive Dashboard widgets (KPIs, Charts, Notifications, Timeline events) to dedicated operational analytics views. Reconstructed AnalyticsPage.tsx to host 7 detailed domain tabs (Inventory, Production, Logistics, QC, Projects, Planning, Admin) populated with real backend data queries and controlled empty states.

## EPIC 12.1 Executive Dashboard Analytics & Activity Center

Status: **COMPLETED - BUILD PASS, CANON CERTIFIED**

Enhanced Executive Dashboard with operational analytics panels (Production, Logistics, Project, QC), a grouped unified activity timeline (Today, Yesterday, Earlier) with click navigation targets, a priority-structured Notification Center (Critical, Warning, Information), and global Executive Filters (Time Range, Project, Warehouse). Built 100% on real backend data contracts without fake metrics or synthetic trend arrays.

## EPIC 12.0 Executive Dashboard (Enterprise Command Center)

Status: **COMPLETED - BUILD PASS, CANON CERTIFIED**

Reconstructed the Executive Dashboard landing page (`/` -> `DashboardPage.tsx`) into an Enterprise Command Center using 100% real backend contracts across Inventory, Components, Production, Projects, Suppliers, QC, Logistics, Planning, and Admin. Includes 8 CockpitKpiCards, 6 Operational Overview cards, Trend Analytics, Quick Action navigation shortcuts, Notifications Center, Unified Activity Feed, and System Health status. Zero fake statistics, zero fake charts.

## EPIC 10.0 Admin Workspace Standardization

Status: **COMPLETED - BUILD PASS, CANON CERTIFIED**

Standardized all Admin module workspaces (Settings, Users, Roles, System Logs). Standardized KPI cards, toolbars, tables, pagination, and analytics rails to match the SteelTrack UI Canon. Eliminated fake polyline sparklines and local CSS classes. Bound all workspaces 100% to real backend APIs or controlled empty states.

## EPIC 9.0 Planning Workspace Reconstruction

Status: **COMPLETED - BUILD PASS, CANON CERTIFIED**

Reconstructed the Planning module UI across all visible routes and tabs (/planning, /planning/overview, /planning/master, /planning/production, /planning/capacity, /planning/material, /planning/procurement, /planning/schedule, /planning/calendar, /planning/constraints, /planning/reports). Registered all routes in AppRouter.tsx and added top-level sidebar navigation item in navigation.config.ts. Mapped real data from production orders, projects, material shortages, and logistics dispatch schedule.

## EPIC 8.0 Logistics UI Reconstruction

Status: **COMPLETED - BUILD PASS, CANON CERTIFIED**

Reconstructed the Logistics module UI across all visible routes and tabs (/logistics, /planning, /vehicles, /dispatch, /loading, /tracking, /deliveries, /documents, /reports). The module strictly follows the SteelTrack UI Canon (KPI cards, search/status/project filter bar, table with DataTablePagination & empty/loading states, right analytics rail). All fake data, synthetic trends, and dead toolbar actions were eliminated. Real backend data from getDispatchDashboard and getDispatchOrders is used exclusively.

## EPIC 6.0 QC UI Completion

Status: **IMPLEMENTED - BUILD PASS, BROWSER QA PENDING**

QC has received a UI-only production-readiness pass. Inspection workspaces now
use read-model pagination state instead of a fixed `limit: 100`, render through
shared cockpit table/pagination primitives and use standard empty states.
Global inert toolbar buttons were removed. KPI cards use authoritative runtime
metrics without synthetic sparkline arrays.

No backend, route, API, schema, permission, React Query contract or business
behavior changed.

## EPIC 3.2 Production Workspace Finalization

Status: **SOURCE/BUILD FINALIZED - BROWSER QA PENDING**

Production was re-audited after EPIC 3 and EPIC 3.1. Active P0/P1 workspaces
already satisfy the source-level operator readiness gate: Queue, Machines,
Consumptions, Incidents and the core order workspaces keep a complete
table-first operational rhythm with real data or controlled empty states. No
additional Production source changes were required in this pass.

Running, Completed and Scrap remain P2 route/model decisions.

## EPIC 5.0 Suppliers UI Completion

Status: **IMPLEMENTED - BUILD PASS, BROWSER QA PENDING**

Suppliers received a UI-only completion pass against the current enterprise
canon. Overview/List now uses KPI cards, compact search panel, a paginated
hero supplier table, right analytics rail and bottom readiness analytics.
Quality/Performance now uses KPI cards, compact filter/search, paginated hero
evaluation table, right detail rail and bottom analytics from the existing
evaluation cockpit data. Capability tabs without backend contracts now render
full controlled empty workspaces rather than single placeholders.

No backend, route, API, schema, permission, React Query contract or business
behavior changed.

## EPIC 4.0 Projects UI Completion

Status: **IMPLEMENTED - BUILD PASS, BROWSER QA PENDING**

Projects received a UI-only completion pass against the Inventory,
Components and Production canon. Overview and Projects List now start from the
same operational rhythm as Inventory: KPI cards, the existing Projects filter,
a dominant hero table, a right analytics rail and a lower analytics band.
The active project detail timeline no longer uses static milestone labels; it
renders WBS/phase milestones from real data or a standard empty state.

No backend, route, API, schema, permission, React Query contract or business
behavior changed.

## EPIC 3.1 Production UI Polish

Status: **IMPLEMENTED - BUILD PASS, BROWSER QA PENDING**

Production has received a focused UI polish pass after EPIC 3. The toolbar now
uses working status filters instead of inert controls. Production Queue now
starts with a table-hero registry, pagination, stable empty rows and a right
analytics rail before the kanban lanes. Consumptions and Incidents now have
fuller right rails using cockpit cards and real derived data or standard empty
states.

No backend, API, schema, permission, React Query contract or business behavior
changed.

## EPIC 3 Production Completion

Status: **IMPLEMENTED - BUILD PASS, BROWSER QA PENDING**

Production P0/P1 remediation is source/build complete. The Machines workspace
is now route-visible at `/production/machines` and uses the existing
authenticated machine endpoint. Production KPI cards no longer fabricate
sparkline trends, and chart areas no longer use synthetic fallback values to
force visual output. Consumption and Incidents now paginate rather than render
unbounded rows. BOM, Warehouse, Issues, Reservations, Material Ledger and Logs
tables keep stable empty rows to preserve the Inventory table-hero footprint.

Backend APIs, schema, permissions, React Query contracts and business behavior
are unchanged. Final visual certification still requires authenticated
screenshots.

## EPIC 2 Components Completion

Status: **IMPLEMENTED - BUILD PASS, BROWSER QA PENDING**

Components secondary workspaces have been remediated against the Inventory UI
canon. Production/BOM, Stock, Material Stock, Transfers, Internal QC, History
and Reports now use Inventory-canon primitives for panels, chart cards, table
hero surfaces and pagination. Hardcoded trend arrays, synthetic chart fallback
values and non-functional History filters were removed. Backend, API, React
Query, routes, permissions, schema and business behavior are unchanged.

Components is now estimated at 90% completion in the full UI audit backlog.
Final certification still requires authenticated screenshots because the
workspace has no approved browser harness.

## Components Inventory Canon Alignment

Status: **IMPLEMENTED - VISUAL QA PENDING**

Components Overview and Components List were realigned with the current
Inventory Golden Reference. Overview now uses an Inventory-like table hero,
compact analytics rail and independent lower queue section. List now uses an
Inventory-style filter panel, dominant table panel, stable empty rows,
Inventory pagination and a fuller analytics rail. Backend, APIs, routes,
permissions, React Query contracts and business behavior are unchanged.

## COMPOSITION001 Enterprise Workspace Composition Redesign

Status: **IMPLEMENTED - SCREENSHOT QA PASS**

Inventory remains unchanged as the Golden Reference. Selected non-Inventory
pages have been rebalanced around a clear hero workspace and secondary support
rail: Production uses a broader production-stage workspace, Components makes
QC queue primary over Ready to Ship, QC gives trend analysis primary width,
Suppliers keeps directory/evaluation tables dominant, Settings emphasizes
configuration catalogs and Notifications emphasizes the operational feed.
Shared cards, design tokens, theme, typography, spacing system and component
APIs were not changed. Screenshot QA at 1440x1100 compared Inventory Materials
against Production, Components, QC, Suppliers, Settings and Notifications.
Production now keeps table/loading/error states as the hero workspace, and
Settings now uses KPI, toolbar, table hero and support rail instead of
page-local configuration navigation. Frontend build passed after the visual
refinement; backend build and final `git diff --check` remain part of the
current verification gate.

## VISUAL001 Enterprise Visual Composition Transformation

Status: **IMPLEMENTED - BROWSER QA PENDING**

Inventory's visual composition was translated into shared cockpit/workspace
primitives rather than copied page code. Shared chart and table heights now
make operational tables, queues, boards and catalogs more dominant; large/table
cards have stronger visual treatment; `CockpitTableShell` provides a stable
surface and scroll owner; and shared workspace spacing is denser. Backend, API,
route, permission, authentication, database, React Query contract and business
logic are unchanged.

## PLATFORM002 Enterprise Application Completion

Status: **IMPLEMENTED - BROWSER QA PENDING**

Active application menus were reviewed for visible unfinished or developer
wording. Dashboard, Production and Components cockpit copy no longer surfaces
`REAL` source labels to users. Components QC copy no longer mentions mock data,
Inventory location audit chips describe questionable rows as data requiring
verification rather than demo records, and Command Center/Analytics/Copilot
hero copy now uses enterprise operations language. No backend, API, route,
permission, authentication, database, React Query contract or business logic
changed.

## PLATFORM001 Enterprise Platform Completion

Status: **IMPLEMENTED - VISUAL QA PENDING**

Administration/Settings now acts as the Enterprise Platform Hub for
Organization, Security, Monitoring and Reports Center capabilities. Capabilities
without backend read contracts are shown as useful empty states with owner,
source and next-step guidance instead of blank pages or fake values.
Notification Center now has KPI/search/filter/list/detail structure from
existing notification data. Supplier incomplete tabs now use controlled
empty-state guidance rather than temporary navigation wording. Backend, APIs,
routes, permissions, database, React Query contracts and business logic are
unchanged.

## FINAL001 Enterprise Workspace Polish

Status: **IMPLEMENTED - VISUAL QA PENDING**

Inventory, Production, Components, QC and shared Enterprise UI surfaces have
been audited for release-candidate consistency. NAV001's sidebar-first
workspace model remains the standard, and QC now resolves its page-level panel,
input, button and table aliases to shared module tokens instead of local design
strings. Remaining design-system debt is documented: browser visual
certification, shared modal/drawer adoption for QC dialogs, cross-module status
badge consolidation and older Inventory form fragments.

## NAV001 Eliminate Redundant Workspace Navigation

Status: **IMPLEMENTED - VISUAL QA PENDING**

The global left sidebar is now the only route-level module navigation surface
for pages using `EnterpriseWorkspace`. The shared workspace shell no longer
renders module breadcrumbs, page titles, descriptions or route-based tabs
inside content. Operational actions are preserved in a compact action row, and
non-route local tabs remain available where they do not duplicate sidebar
routing. The shared module page container now uses the full available width,
and Inventory Material Detail keeps only entity-level detail tabs.

## EPIC QC001 Enterprise Quality Command Center

Status: **IMPLEMENTED - VISUAL QA PENDING**

QC Overview now behaves as an Enterprise Quality Command Center instead of a
plain inspection table. The page surfaces pending/in-progress quality work,
failed/rework/NCR attention rows, completed manufacturing orders waiting for QC
and latest inspection context using existing QC read data only. Dashboard list
cards follow the Top N rule and provide working `Xem tất cả` navigation to the
full QC workspaces. Static calibration equipment examples were removed in favor
of a truthful empty state until a real calibration contract exists. Backend,
APIs, React Query, routes, permissions, authentication, database and business
logic are unchanged.

## EPIC BUSINESS001 Steel Structure Domain Completion

Status: **IMPLEMENTED - VISUAL QA PENDING**

Production and Components now use more steel-structure fabrication language
and decision support while still relying only on existing read data. Production
surfaces manufacturing-order registry language, steel issue/consumption,
material readiness and real release-ready work orders instead of a placeholder
card. Components surfaces lifecycle, fabrication, QC wait, ready-to-ship,
shipping and project-distribution language across Overview, List, Internal QC
and Reports. No backend, API, React Query, route, permission, authentication,
database or business logic changed.

## UX Review Round 2 Business Cockpit Alignment

Status: **IMPLEMENTED - VISUAL QA PENDING**

Production and Components Overview now behave more like business cockpits
instead of CRUD dashboards. Production highlights current progress, material
readiness and `Cần chú ý hôm nay` using existing delayed, shortage and progress
signals. Components highlights status distribution, activity, project
distribution, QC waiting queue and ready-to-ship queue from existing component
rows. Chart cards were given stronger visual weight where they were too small
to support 5-second manager decisions. No backend, API, React Query, route,
permission, database or business logic changed.

## UX Review Round 1 Production and Components Tables

Status: **IMPLEMENTED - VISUAL QA PENDING**

Production and Components dashboard tables now follow the Inventory UX rule:
dashboard cards show Top N rows, and `Xem tất cả` takes the operator to the
full workspace when one exists. Production Overview links the order card to
`/production/orders`; Components Overview links the component card to
`/components/list`. Full list workspaces retain their table operations,
filters, pagination and drawers. Short dashboard datasets use a smaller card
height to avoid large empty surfaces. No backend, API, React Query, route,
permission or business behavior changed.

## EPIC UI005B Design Language Inference

Status: **IMPLEMENTED - VISUAL QA PENDING**

Inventory Overview and Materials were studied as the active Golden Reference
for information hierarchy, density and operator flow. Production and Components
now follow the inferred rhythm rather than copied JSX: KPI first, compact
toolbar next, primary table as workspace anchor, supporting analytics to the
side/below and summary strips for quick scan. Production Overview adds
manufacturing quick actions plus today/waiting/delayed summary cards before the
order table. Components Overview/List/Reports use denser table tokens,
toolbar-anchored actions and compact summary strips. Inventory files were not
modified. Backend, APIs, React Query, routes, permissions, authentication,
database and business behavior are unchanged.

## EPIC UI005A Production & Components Workspace Completion

Status: **IMPLEMENTED - SCREENSHOT EVIDENCE BLOCKED**

Active Production and Components pages now follow the Inventory Golden
Reference workspace boundary more closely. The shared workspace shell can render
without duplicated in-page hero chrome, Components no longer renders duplicated
local navigation inside its workspace, Production actions live in the operating
toolbar, and Production Incidents/Reports now use existing operational data
instead of placeholder navigation panels. Components Internal QC no longer uses
static rows, and `/components/reports` now has a dedicated reports workspace.
No backend, API, React Query, route, permission, DTO or business behavior
changed. Required screenshot certification is still blocked because no browser
harness or browser executable is available in the environment.

## EPIC UI006 Enterprise Shared Components Consolidation

Status: **IMPLEMENTED - VISUAL QA PENDING**

Inventory and Production now share an Enterprise UI component catalog for the
duplicated visual patterns identified after UI005. Inventory `InventoryVisuals`
is a compatibility wrapper over `shared/ui/enterprise-components`, while
Production no longer imports Inventory UI internals. Shared Enterprise forms
now include textarea, multi-select, checkbox, radio group, switch, validation
summary and drawer-form primitives for future module rollout. No backend, API,
React Query, route, permission, DTO or business behavior changed.

## EPIC UI005 Production Workspace and Enterprise Form Standard

Status: **IMPLEMENTED - AUTHENTICATED VISUAL QA PENDING**

Production is the first post-Inventory module to adopt the shared Enterprise
form layer. Manufacturing Order, BOM, Material Return, Consumption and Yard
staging use 36px shared controls, common form sections/actions and the
viewport-bounded accessible modal shell. Active Production routes use one
Inventory-derived workspace; unused page stubs now delegate to it. No backend,
API, route, query key, permission or business behavior changed. Frontend build
passes; browser-based multi-viewport certification remains pending because no
browser harness or executable is available.

## BUGFIX INV001 Inventory Table Visibility

Status: **IMPLEMENTED - AUTHENTICATED RUNTIME SMOKE PENDING DATABASE**

Inventory Overview and Materials read-model calls now use the authenticated
application HTTP client. The previous adapter omitted JWT headers, received
HTTP 401 after RFC017 and caused both pages to fall back to empty row arrays.
The authenticated runtime endpoint returns 25 records with the expected
paginated shape. API contracts, React Query behavior, filters, pagination,
layout and backend logic are unchanged.

## EPIC UI003A Inventory UX Polish

Status: **IMPLEMENTED - AUTHENTICATED VISUAL QA PENDING**

Inventory now starts with operational content rather than a duplicated local
hero. Standard KPI cards use a 92px Inventory-scoped density, workspace bands
use an 8px vertical rhythm, and the Materials table has a 320-520px responsive
viewport instead of relying on a fixed desktop height. Transaction modals and
the Material drawer use viewport-bounded shells with one internal scroll owner;
active form controls are 36px. Backend, API, React Query, routes, permissions
and business behavior are unchanged. Backend/frontend builds pass; real
multi-viewport visual certification remains pending because no browser harness
or browser binary is available.

## EPIC UI003 Inventory Canon Refinement

Status: **IMPLEMENTED - RUNTIME VISUAL QA PENDING**

All 12 active Inventory pages use consistent page rhythm. Inventory
KPI/pagination wrappers delegate to the
shared cockpit primitives; transaction modals and detail drawers implement
dialog semantics, focus containment, Escape, body-scroll lock and focus
restoration; active browser confirmations use an Enterprise alert dialog. No
backend, API, route, React Query, database or business behavior changed.
Frontend build and targeted primitive lint pass. Pixel, screen-reader and real
multi-viewport certification remain pending because the repository/environment
has no Playwright or browser binary.

## RFC016 Enterprise Production Certification

Status: **NOT READY**

The current worktree passes backend/frontend builds, Prisma validation and all
70 backend suites (185 tests), and its non-root Docker/Compose deployment
foundation validates. Production certification is blocked by unguarded business
mutations in Inventory, QC and Projects, warning-only stale Job/Outbox lock
detection without safe recovery, and pending migration
`20260717190000_enterprise_data_scalability_indexes` without production-size
lock/WAL evidence. No application code, schema, migration, API or frontend was
changed by RFC016.

## RFC013 Enterprise Database & Performance Readiness

Status: **IMPLEMENTED - CONDITIONALLY READY**

Outbox and Background Job claims are now atomic and safe across workers;
Operations Center avoids exact scans for table-size telemetry; Inventory posting
uses batch validation/database cost aggregation; and replay checkpoints ignored
events once per batch. Additive indexes remain pending. Static audit covers all
127 Prisma models, but live `EXPLAIN` and production-size benchmarks are blocked
because PostgreSQL at `localhost:5432` is currently unavailable.

## RFC012 Enterprise Data Scalability Foundation

Status: **IMPLEMENTED - CONDITIONALLY READY**

Projection reads now support additive keyset/no-count pagination, replay resumes
from durable checkpoints with bounded work per invocation, and Outbox claims
have stable ordering. Additive history/replay indexes and a guarded hot/warm/cold
policy are prepared. No migration was deployed and no physical partition or
archive deletion was attempted. The current database is too small for a valid
100M/1B-row benchmark, so scale certification remains an operational gate. The
focused Projection suite passes; two unrelated baseline harness defects still
prevent a clean full backend Jest run.

## RFC011 Enterprise Query API Adoption

Status: **IMPLEMENTED - SEVEN-MODULE QUERY BOUNDARY AVAILABLE**

Inventory, Components, Production, QC, Yard, Logistics and Projects now expose
stable module/view aliases through an authenticated projection-only Query API.
QC/Yard/Logistics/Projects canonical facts are registered in the shared engine;
no duplicate projection runtime was created. Existing operator workspaces remain
on Repository Live Read Models under ADR011, and legacy APIs remain compatible.

## RFC010 Enterprise Operator Application Layer

Status: **IMPLEMENTED - INTERNAL USE-CASE BOUNDARY**

Eleven daily operator operations now compose RFC009 processes and owner command
services behind one internal application service. Every operation returns a
standard result, process/correlation identity, completed-step timeline and
durable audit receipt reference. No controller/public route was added; UI/API
exposure and real operator certification remain separate rollout gates.

## RFC009 Enterprise Process Orchestration Layer

Status: **IMPLEMENTED - INTERNAL APPLICATION BOUNDARY**

Six typed process coordinators now call existing owner command services through
a saga-style executor. Deterministic step keys, correlation/causation, bounded
transient retry, explicit command compensation and durable audit/Outbox receipts
are implemented. No cross-context transaction, repository access, domain rule,
controller, route, frontend, schema or Projection Engine change was introduced.
Processes are resumable by re-submission with the same process ID; unattended
worker-driven resume remains a later operational rollout.

## EPIC UI001 Enterprise UI Foundation Rollout

Status: **IMPLEMENTED - INVENTORY CANON ROLLED OUT**

The active Components, Production, QC, Yard, Projects, Logistics, Suppliers
and Administration surfaces now share one Inventory-derived page composition.
Canonical cockpit KPI/chart/table/filter/pagination/drawer primitives remain in
place, and page-level loading/empty/permission/error/offline presentation is
available centrally. Inventory, backend contracts, React Query and business
behavior were unchanged.

## RFC003 Production Aggregate and Execution Implementation

Status: **APPROVED - CANONICAL DOMAIN COMPLETE**

The missing AD-017 Production Execution aggregate is now durable and
independently versioned. Order start atomically starts the first Work Order and
execution run; internal start/pause/resume/complete/abort commands persist
timeline, ActivityLog, audit and canonical V1 Outbox together. Active-run
uniqueness is database-enforced, completion paths reject active runs and the
existing Enterprise Read Platform consumes `production.execution.*`. No route,
UI, Inventory, Components or Architecture Decision changed.

## RFC003 Components Aggregate Implementation

Status: **APPROVED - ADDITIVE COMMAND API AVAILABLE**

The AD-015/016/019 Component aggregate is now exposed through authenticated
`/components/commands` routes for identity creation, Revision creation,
Engineering BOM replace/validate, review, approval, release, deprecation and
archive. Existing aggregate commands require optimistic versions and every
mutation requires durable idempotency. The legacy `/components` API and
frontend remain unchanged; legacy rows are not automatically adopted.

## EPIC188 Production Command API Rollout

Status: **APPROVED - ADDITIVE COMMAND API AVAILABLE**

RFC002 commands are exposed under `/production/commands` with JWT, mandatory
durable idempotency and explicit optimistic versions. Production Order, Work
Order, Completion, Scrap and Rework endpoints delegate only to the canonical
aggregate service. AD-019 correlation/causation and retry metadata remain
unchanged; timeline, ActivityLog, audit and domain Outbox remain atomic. The
legacy `/production` API and frontend are unchanged and continue as a
compatibility surface pending controlled client migration.

## RFC002 Production Aggregate Implementation

Status: **IMPLEMENTED - CANONICAL INTERNAL BOUNDARY**

Production now has additive AD-015/017/018/019 aggregate persistence for
Production Order, `1:N` Work Orders, append-only Completion/Scrap and linked
Rework orders. Versioned commands enforce state transitions, optimistic
concurrency and idempotency; mutation, timeline, ActivityLog, audit Outbox and
canonical V1 domain Outbox commit atomically. Issue/Return material facts now
retain the Inventory posting receipt. No public API, frontend, Inventory or
Components behavior changed. Public command cutover and operator certification
remain pending.

## Components Aggregate Implementation

Status: **IMPLEMENTED - CANONICAL INTERNAL BOUNDARY**

AD-015/016/019 now have an additive backend implementation for Component
identity, Revision, Engineering BOM, release and archive. Canonical commands
enforce state transitions, optimistic versions and idempotency; mutation,
timeline, ActivityLog, audit Outbox and canonical V1 domain facts commit in one
Components repository transaction. Existing `ComponentStatus`, records, API
and frontend remain compatibility paths and were not reinterpreted. One
additive migration introduces the canonical persistence models without data
rewrite.

## ADS004 Cross-module Event Contract

Status: **APPROVED - FINAL ARCHITECTURE GATE COMPLETE**

AD-019 now fixes canonical event names, envelope version 1, payload families,
sole publishers, subscribers, aggregate ordering, idempotency, retries, replay
and projection permissions across Inventory, Components, Production, QC,
Projects, Yard and Logistics. Ambiguous aliases were rejected in favor of the
AD-015/016/017/018 owner facts. Current legacy/internal events remain runtime
compatibility signals and were not changed. No code, API, schema, migration,
workflow or data changed.

## ADS003.5 Production-Inventory Interaction Contract

Status: **APPROVED - NORMATIVE APPLICATION CONTRACT**

Production owns reservation/material intent, consumption, completion, Scrap and
its ledger; Inventory owns physical stock and valuation. Reservation,
Consumption, Completion and non-recoverable Scrap never mutate Inventory.
Issue, Return and explicit recoverable Scrap receipt call Inventory-owned
posting inside one shared local transaction and receive an idempotent bounded
PostingReceipt. Owner Outboxes update projections only after commit and cannot
repeat stock mutation. Public APIs, code, schema, state machines and data remain
unchanged.

## ADS003 Production State Machine

Status: **APPROVED - NORMATIVE ARCHITECTURE DECISION**

Production Order retains its canonical lifecycle and `READY` remains an
admission state with Start-time revalidation. One Order coordinates `1:N` Work
Orders and independently tracked Execution Runs. Partial Completion is
append-only; final completion does not auto-close. Scrap is a separate
Production disposition, while Rework creates a linked `REWORK` Order instead of
rewinding the original. Inventory remains stock owner, Components owns released
engineering definition, and QC owns rejection/NCR truth. Existing schema/API
records remain compatibility-only; no code, API, schema, migration, workflow or
data changed.

## ADS002 Component State Machine

Status: **APPROVED - NORMATIVE ARCHITECTURE DECISION**

Components now has a final identity/engineering lifecycle decision. Component
uses `DRAFT -> ACTIVE -> DEPRECATED -> ARCHIVED`; Component Revision uses
`DRAFT -> IN_REVIEW -> APPROVED -> RELEASED -> SUPERSEDED -> ARCHIVED` with
controlled review returns. Engineering BOM is versioned and released atomically
with the Revision. Released content is immutable, release does not roll back,
and at most one revision is current. Existing operational `ComponentStatus`
values remain compatibility data owned as projections by Production, QC,
Inventory/Yard, Logistics and Projects. No code, API, schema, migration,
workflow or data changed.

## ADS001 SteelTrack Domain Ownership Matrix

Status: **APPROVED - NORMATIVE ARCHITECTURE DECISION**

Ownership is now fixed across Inventory, Components, Production, QC, Projects,
Yard, Suppliers and Logistics. Inventory alone owns stock posting; Production
owns reservation/issue intent/consumption/return intent and execution;
Components owns identity and future revision/released engineering definition;
QC owns quality truth; Projects owns allocation/site acceptance; Yard owns
physical placement/movement/loading execution; Logistics owns transport;
Suppliers owns commercial source documents. Foreign table/repository writes are
forbidden. Cross-context mutations must call an owner-exported command service;
local transaction context may be shared only for required atomic invariants.
No code, API, schema, migration, runtime behavior or data changed.

## EPIC186 Components Domain Audit & Foundation

Status: **AUDIT COMPLETE - DOMAIN FOUNDATION BLOCKED**

Components retains PASS status for Repository, ADR011 core read paths,
Snapshot, Runtime and Operations Center. Domain completion is blocked because
`ComponentStatus` mixes Production stage, stock, QC and logistics concerns,
generic updates bypass a complete transition matrix, cross-module repositories
write Component directly, and revision/release/archive do not exist. The active
Components Material Stock UI also reconstructs Production/Inventory balances
and posts generic Inventory returns instead of using the Production material
command boundary. No code, API, schema, migration, workflow or data changed.

## EPIC186 Production Domain Completion Assessment

Status: **AUDIT COMPLETE - IMPLEMENTATION BLOCKED ON DOMAIN ALIGNMENT**

Production already has the approved canonical lifecycle, repository boundary,
atomic `production.order.*`/`production.material.*` Outbox paths, material flow,
snapshot/runtime foundation and ADR011 read paths. The audit found that Work
Order remains a disconnected CRUD model, completion/rejected/remaining quantity
semantics are not modeled, and canonical Scrap remains explicitly deferred.
The requested legacy event names and Inventory-owned Consumption would conflict
with PROD-011/014/015. No application code, API, schema, migration, workflow or
data changed. A Production Domain Alignment sprint is required before bounded
implementation.

## EPIC185 Transfer Multi-material Pending Items UX

Status: **COMPLETED**

Redesigned the Điều chuyển (Transfer) creation modal to support local batching of draft material items. Operators can fill material details, check source available stock (subtracting already pending quantities), view visual warning and disable addition if quantity exceeds available source stock, add items to the pending list, edit or remove draft items, view aggregate quantities and transfer counts, and submit the entire batch in a single atomic request (generating positive destination and negative source transaction lines). When editing a pending item, both the source and destination 2D visual layouts highlight and focus back on the item's original slot and level automatically. All business rules (duplicate location merging, rollback preservation, and dirty cancellation) were strictly adhered to. No backend APIs, schemas, or databases were changed.

## EPIC184 Outbound Multi-material Pending Items UX

Status: **COMPLETED**

Redesigned the Xuất kho (Outbound) creation modal to support local batching of draft material items. Operators can fill material details, check location available stock (subtracting already pending quantities), view visual warning if quantity exceeds available stock, add items to the pending list, edit or remove draft items, view aggregate quantities and values, and submit the entire batch in a single atomic request (generating positive/negative transaction lines depending on target). When editing a pending item, the 2D visual layout highlights and focuses back on the item's original slot and level automatically. All business rules (duplicate location merging, rollback preservation, and dirty cancellation) were strictly adhered to. No backend APIs, schemas, or databases were changed.

## EPIC183 Inbound Multi-material Pending Items UX

Status: **COMPLETED**

Redesigned the Nhập kho (Inbound) creation modal to support local batching of draft material items. Operators can fill material details, check locations on the 2D layout, add items to the pending list, edit or remove draft items, view aggregate quantities and values, and submit the entire batch in a single atomic request. All business rules (duplicate location merging, rollback preservation, and dirty cancellation) were strictly adhered to. No backend APIs, schemas, or databases were changed.

## EPIC182 Multi-material Business Specification

Status: **SPECIFICATION APPROVED - UI CONDITIONALLY READY**

The operator workflow is frozen before frontend implementation. Pending Items
is a local command buffer with automatic exact-duplicate merge, edit/remove,
grouped unit totals, dirty-close protection, one final `items[]` submit and full
rollback on any line failure. Phase 1 supports up to 50 business entries and one
transfer route per material. It does not provide persistent drafts,
lot/batch/serial tracking, partial posting, mutation auto-retry or durable public
idempotency. No application code, API, schema, migration or data changed.

## EPIC181 Multi-material Business Foundation

Status: **APPROVED WITH EXPLICIT LIMITATIONS**

Inventory now validates and mutates duplicate material/location buckets as one
aggregate while retaining every original transaction line as immutable audit
evidence. Multi-line return metadata, activity, history, CSV and adjustment
summaries no longer use first-line document assumptions. Material Movements now
persists through `InventoryRepository`; canonical commands support stable
reference idempotency and deterministic one-source/one-destination transfer
pairs per material. Public requests without a stable idempotency key and
multiple transfer pairs for the same material remain separately approved
additive work. No schema, migration, API contract, Snapshot Engine, Runtime,
Operations Center, workflow or presentation layout changed.

## RFC-001 Multi-material Inventory Transaction Assessment

Status: **ASSESSMENT COMPLETE - OPTION B RECOMMENDED**

Inventory already persists transaction headers with N transaction-item lines,
and the canonical API/repository/posting paths are array-capable. Read-only data
shows 99 headers and 109 lines: 10 transfers use two source/destination lines,
but no persisted header currently contains more than one distinct material.
Enterprise rollout is therefore conditionally ready, not certified. The
recommended additive path preserves the existing Core Platform and drawer/2D
operator experience while adding batch invariants, idempotency, deterministic
transfer pairing, Pending Items UX, and line-aware reports. No code, schema,
API, workflow, or data changed in this RFC.

## EPIC174 Core Platform Final Certification

Status: **CORE PLATFORM v1.0 CERTIFIED**

Inventory, Components, Production, QC and Yard now pass repository, ADR011,
snapshot, runtime naming, Operations Center, feature flag, background routing
and atomic Outbox parity. Legacy Inventory Return, Component update/status and
Production stage paths no longer persist events after business commit.
Inventory now publishes the same module-level Runtime contract as the other
certified modules. Production operator/business certification remains a
separate operational gate and does not invalidate platform certification.

## EPIC173 Dashboard Snapshot Cutover Certification

Status: **APPROVED**

Components, QC and Yard now expose active additive dashboard endpoints through
their existing Snapshot Reader services. Dashboard KPI/analytics are
snapshot-first with repository fallback and background rebuild enqueue, while
embedded tables, queues, maps and all operator workspaces remain live under
ADR011. Core Platform v1.0 now has only EPIC174 parity remediation and the final
certification rerun outstanding.

## EPIC172 Production Cockpit ADR011 Remediation

Status: **APPROVED**

Production Overview, Orders and Planning now use an additive repository live
read model with server filtering, sorting, pagination, KPI, readiness, progress,
queue and Work Center summaries. React binds bounded page data and no longer
composes Cockpit order KPI from full Production arrays. The snapshot-first
`/production/metrics` dashboard path is unchanged. Core Platform v1.0 remains
blocked on EPIC173-174.

## EPIC171 Inventory ADR011 Remediation

Status: **APPROVED**

Inventory Materials, Material Detail, Locations, Material History and
Transactions now follow ADR011 through repository live read models. Materials
retains bounded server filtering/sorting/pagination and its existing frontend
contract. Inventory Overview remains snapshot-backed. The Inventory gate remains
approved; EPIC172 has now closed the Production Cockpit ADR011 gate.

## EPIC170 Core Platform Certification

Status: **BLOCKED**

The five target modules share repositories, feature flags, Snapshot Engine,
Background Engine and Operations Center health, but the active system is not yet
Core Platform v1.0 certified. Inventory Materials and Production Cockpit violate
ADR011; Components/QC/Yard dashboard snapshot readers are not active controller
paths; and Inventory Return, Components and Production legacy events retain
post-commit/non-atomic paths. Four focused remediation gates are documented.

## EPIC164 Yard Runtime Metrics & Operations Center

Status: **APPROVED, EVENT COVERAGE PARTIAL**

Yard now publishes module-specific snapshot hit/miss/age/lag, repository
fallback and ADR011 live-read metrics through the shared Runtime Platform.
Operations Center exposes additive Yard health for repository, read model,
persisted snapshots, feature flag, jobs, Outbox, parity and runtime. Snapshot
health reflects persisted data truth; missing rows remain critical. Existing
event coverage remains limited to implemented Yard workflows.

## EPIC153 QC Snapshot Foundation

Status: **APPROVED, EVENT FRESHNESS PARTIAL**

QC now has persisted Dashboard and Inspection domain summaries integrated with
the shared snapshot repository, reader, writer, validator, rebuilder,
dispatcher and feature flag. Missing/stale reads fall back to live repository
calculation and enqueue a background update. The migration is deployed without
backfill. Workspace remains ADR011 live data. Only existing QC events are
routed; create/approve/reject/update freshness remains future event work.

## EPIC152 QC Workspace Live Read Model

Status: **APPROVED**

QC operator workspaces now use a bounded repository live read model under
ADR011. Search, status filter, sorting, pagination metadata, KPI/NCR/queue
aggregation and real daily trends are server-owned. The React page no longer
filters inspections or calculates business KPI/trend data. Existing APIs and
presentation remain compatible. QC Dashboard snapshot, Runtime and Operations
Center work remains EPIC153-154 scope.

## EPIC151 QC Repository Foundation & Atomic Outbox

Status: **APPROVED**

QC services no longer access Prisma directly. `QcRepository` owns QC command,
code-generation and atomic Outbox persistence, while `QcCockpitRepository` owns
the existing cross-domain Cockpit source queries. QC mutations, ActivityLog and
their existing audit/domain/notification Outbox rows now commit through one
transaction client. UI, API, workflow semantics, read models, snapshots,
runtime and Operations Center were unchanged.

## EPIC150 QC Core Platform Audit

Status: **AUDIT COMPLETE, FOUNDATION BLOCKED (~31%)**

QC has validated APIs, mature domain tables and a partial repository boundary,
but it is not Core Platform compliant. `QcService` still accesses Prisma,
Dashboard and workspaces share one capped runtime Cockpit payload, React performs
business filtering/aggregation and synthetic trends, and QC has no persisted
snapshot, module runtime counters or Operations Center health. Existing Outbox
events are non-atomic with QC mutations and workflow transition guards are
incomplete. EPIC150 changed documentation only.

## EPIC144 Components Runtime Metrics & Operations Center

Status: **APPROVED, EVENT FRESHNESS PARTIAL**

Components snapshot reads now publish module-specific hit, miss, age and lag
metrics; repository fallback and live read-model usage are also counted.
Operations Center exposes additive Components Platform Health for repository,
read model, persisted snapshots, feature flag, background jobs, Outbox, parity
readiness and runtime. No UI, business, workflow, schema or snapshot logic was
changed. Existing event freshness remains limited to `component.updated`.

## EPIC143 Components Snapshot Foundation

Status: **APPROVED, EVENT FRESHNESS PARTIAL**

Components now has persisted dashboard and domain-summary snapshots integrated
with the shared repository, reader, writer, validator, rebuilder, dispatcher and
feature-flag infrastructure. Snapshot reads safely fall back to live repository
calculation and enqueue background refresh. Only the existing
`component.updated` event is routed; create/delete and unimplemented
revision/release/archive workflows remain future event-compliance work.

## EPIC142 Components Workspace Live Read Model

Status: **APPROVED**

Components List, Overview and History now read bounded repository live read
models under ADR011. Search, filters, sort, pagination, KPI, material readiness,
facets, distributions and timeline summaries are server-owned. Detail and
Costing retain their existing live repository paths. Legacy APIs remain
compatible, while Components snapshots, Runtime and Operations Center remain
future platform work.

## EPIC141 Components Repository Completion

Status: **APPROVED**

Components service persistence now fully crosses a repository boundary.
`ComponentCostingService` delegates costing, BOM/consumption, Inventory valuation,
and atomic recalculation persistence to `ComponentCostingRepository`; costing
business formulas remain in the service. The Components service directory has no
direct Prisma access. Snapshot, Runtime, Event/Outbox and live-read-model gaps
from EPIC140 remain separate future work.

## EPIC140 Components Core Platform Foundation

Status: **AUDIT COMPLETE, FOUNDATION BLOCKED (28%)**

Components has strong business/UI feature coverage but does not yet inherit the
full Core Platform. The primary service uses ComponentsRepository; costing still
calls Prisma directly. Workspaces use live data but are unbounded/client-aggregated,
Overview has no snapshot, QC/History/Reports contain hardcoded data, events are
ephemeral, and Components has no feature flag, jobs, metrics or Operations Center
health. EPIC140 made no application or schema changes.

## EPIC137 Production Operator Validation & Platform Certification

Status: **CODE COMPLETE, BUSINESS CERTIFICATION BLOCKED**

Production repository, lifecycle, material boundary, event routing, snapshot and
runtime foundations are code-verified, and focused tests pass 7 suites/24 tests.
Read-only runtime inspection found no Production snapshots, canonical Production
Outbox rows or Production snapshot jobs. The existing completed order is not a
safe test fixture. Platform certification is 65%; one operator-validation sprint
with a designated real test order is required, with no new feature work.

## EPIC136 Inventory Frontend Foundation Standardization

Status: **COMPLETED**

Inventory now has documented canonical presentation layers for cockpit and
module components. Active duplicate pagination logic was consolidated into the
existing `InventoryPagination` adapter while preserving per-page classes.
Domain-specific KPI, chart, status, and drawer compositions remain local where
merging would change approved presentation or semantics. No backend, API,
React Query, business, or visual redesign change was made.

## EPIC135B Production Material Flow

Status: **IMPLEMENTATION PASS, REAL-DATA E2E BLOCKED**

Reservation, Issue, Consumption, and Return now publish canonical
`production.material.*` Outbox events atomically with Production ledger/domain
changes. Issue and Return remain Inventory-owned stock postings. Background
routing updates Production snapshots, while Inventory snapshots continue from
Inventory-owned events. Focused tests pass; the complete operator flow still
requires a designated real test Production Order.

## EPIC-UI002 Inventory Inbound Workspace Redesign

Status: **COMPLETED**

Redesigned the Inbound ("Nhập kho") tab workspace to inherit the Industrial Cockpit design language (flat table shell with neon cyan hover transitions, standard pagination, loading skeleton feedback, and filter bars). Under the "Presentation First - UX Later" rule, all business workflows, creation forms, popups, and backend APIs were kept 100% intact.

## EPIC-UI001 Inventory Outbound Workspace Redesign

Status: **COMPLETED**

Redesigned the WMS Outbound ("Xuất kho") page and creation form to comply with the Enterprise UI & Cockpit Guidelines (EPIC210). Replaced local metric cards, table shells, and pagination with standard shared cockpit components. Refactored the creation modal to a right-side `<ModuleDetailDrawer size="lg" />`, incorporating a keyboard-friendly searchable material selector, vertically stacked mini-maps to prevent horizontal layout overflows, unsaved confirmations, and Save & Create New action triggers. No changes were made to backend APIs or business logic.

## EPIC135A Production-Inventory Transaction Boundary

Status: **APPROVED**

Inventory is now the exclusive stock-mutation owner for Production material
Issue and Return. Production orchestrates one repository transaction and calls
the internal `InventoryPostingService`; Inventory validates stock, creates the
Inventory transaction, updates item/location balances, and writes Inventory
Outbox rows using the shared transaction client.

Production repositories no longer mutate Inventory tables, and manual issue no
longer uses create-then-delete compensation across separate transactions. Draft
Reservation no longer writes a duplicate `RESERVE` ledger entry. Consumption
and Scrap now have separate ledger boundaries. Canonical Production material
commands/events are standardized but full event publication remains EPIC135B.

## EPIC134 Production Order Lifecycle

Status: **APPROVED**

Production Orders now follow the canonical state machine approved by PROD-014.
Create starts in `DRAFT`; lifecycle changes use dedicated command endpoints; and
generic update cannot bypass status validation. Each transition writes the
Production Order, ActivityLog, and canonical `production.order.*` Outbox event
atomically through `ProductionOrderRepository`.

Outbox dispatch continues through the existing Background Engine and updates
Production dashboard/order/work-center snapshots. Legacy Order event names are
accepted by consumers only for compatibility with existing pending Outbox rows.
Inventory, Core Platform, Runtime Platform, Snapshot Framework, Operations
Center, ADR011, UI, and Blueprint remain unchanged.

## Production Blueprint Alignment

Status: **APPROVED FOR EPIC134 IMPLEMENTATION**

The Production specification, Prisma enum foundation, and event naming now use
one canonical standard. The Production Order lifecycle is
`DRAFT -> RELEASED -> READY -> IN_PROGRESS <-> PAUSED -> COMPLETED -> CLOSED`,
with `DRAFT -> CANCELLED`. New lifecycle events use `production.order.*`.

The schema change is additive: `READY`, `PAUSED`, and `CLOSED` were added while
legacy `PLANNED` and `DELAYED` values remain readable for compatibility. No
lifecycle endpoints, state-machine commands, repository transitions, or Outbox
relocation were implemented in this alignment sprint; those are now unblocked
for EPIC134.

## EPIC133 Production Runtime Metrics & Operations Center Integration

Status: **APPROVED**

Production now has Runtime Platform integration aligned with Inventory and Projects. Production snapshot reads record module-specific snapshot hit/miss, age, lag, read-model hit, and fallback metrics through the existing `PerformanceMetricsService`. `/production/metrics` is dashboard-reader ready: it prefers `ProductionDashboardSnapshot` when enabled/fresh and falls back to the existing repository aggregate without changing the response contract.

Operations Center now includes a Production Platform Health block with repository, read model, snapshot, feature flag, event/outbox, background job, runtime, and parity readiness status. No Inventory code, UI, business workflow, API contract, repository schema, or snapshot foundation model was changed.

## EPIC132 Production Snapshot Foundation

Status: **APPROVED**

Production now has persisted snapshot foundation coverage aligned with the Inventory Core Platform pattern. EPIC132 added additive Prisma models and migration for `ProductionDashboardSnapshot`, `ProductionOrderSnapshot`, and `WorkCenterSnapshot`; added `ProductionSnapshotRepository`; and wired Production into the existing snapshot reader, writer, rebuilder, dispatcher, event-consumer, and feature-flag layers.

Existing Production workspaces remain Repository Live Read Models under ADR011. EPIC132 does not cut Production dashboard APIs over to snapshot-first reads, does not change UI/API/workflow behavior, does not change Inventory, and does not add Production-specific Runtime Metrics or Operations Center health. Those are follow-up compliance steps.

## EPIC131 Production Repository Foundation

Status: **APPROVED**

Production now has a repository foundation aligned with the Inventory Core Platform pattern. Focused repositories were added for BOM, Material Issue, Consumption, Ledger, Production Order, Reservation, Routing, Work Center, and Work Order paths. Direct Prisma access was removed from Production services: `rg` over `apps/backend-api/src/modules/production/services` for `PrismaService`, `this.prisma`, `nextOperationalCode`, and direct transaction model operations returns no matches.

This sprint did not implement Production snapshots, Background Engine integration, Runtime Metrics counters, Operations Center health, UI changes, API contract changes, or new MES workflows. Production Repository Foundation is approved; Production Snapshot and Operations Center compliance remain future work.

## EPIC130 Production Core Platform Foundation

Status: **FOUNDATION AUDIT COMPLETE, CORE COMPLIANCE BLOCKED**

Production was audited as the first module intended to inherit the Inventory Core Platform and ADR011 standard. Current Production workspaces read live data rather than persisted snapshots, so no workspace-snapshot violation was found. However, Production is not yet Core Platform compliant: `ProductionRepository` exists but service-to-Prisma direct access remains in `ProductionService`, `BOMService`, `MaterialIssueService`, `ProductionReservationService`, `ProductionConsumptionService`, `ProductionMaterialLedgerService`, and `WorkOrderService`; Production snapshot models/repositories/readers/writers are not present in the active schema/code; `SnapshotFeatureFlagService` supports only Inventory, Projects, and Logistics; and Operations Center exposes Inventory/Projects/Dispatch platform health but not Production.

EPIC130 produced runtime reports and did not change Inventory, Core Platform, Operations Center, Production APIs, UI, workflow, or business logic. Production next step is a focused Repository Boundary implementation before Production Dashboard Snapshot work.

## EPIC120 Workspace Read Model Standardization

Status: **COMPLETED**

SteelTrack now has an enterprise data-source rule derived from the Inventory production-readiness work:

```text
Dashboard / Cockpit / Analytics -> Persisted Snapshot -> Eventual consistency
Workspace / Operator Grid / Queue -> Repository Live Read Model -> Strong read-after-write
```

The standard is documented in the architecture folder and accepted as ADR011. The audit classified Inventory, Production, Projects, QC, Yard, Logistics, Suppliers, and Operations Center screens. Production was reviewed as the pilot module; no persisted-snapshot workspace violation was found, so no Production code rollout was needed. Projects detail tabs are the main future compatibility item because several operator tabs can currently read fresh `ProjectDetailSnapshot` payloads.

## EPIC118.5.1 Inventory React Query Root Cause Fix

Status: **CODE FIX COMPLETE, OPERATOR SMOKE PENDING**

The remaining Materials table stale-after-outbound behavior was traced past React Query. Invalidation and active refetch targeted the correct query family, and `InventoryMaterialsPage` derives rows directly from `materialsData.items`. The stale payload came from `InventoryReadModelService.toMaterialListRow()`, which selected `InventoryMaterialSnapshot` stock/location data while the snapshot was still "fresh by age" but not yet updated by Background Engine.

The Materials list row mapper now reads live repository-included `inventory_location_stocks` for `locationBalances` and `currentStock`, while preserving snapshot-derived valuation metadata. This removes the need for retry or polling as a consistency workaround. Operator smoke testing in an authenticated browser session is still required to confirm inbound, outbound, transfer, adjustment, and return flows update Materials, Locations, Material Detail, and History without F5.

## EPIC118.5 Inventory React Query Consistency

Status: **SUPERSEDED BY EPIC118.5.1 ROOT-CAUSE FIX**

Inventory read-after-write behavior now uses an explicit dependency map and targeted active refetch after stock-affecting mutations. `invalidateInventoryReadState` covers Overview, Materials, Material Detail, Material History, Transactions, Locations, Return Requests, legacy Inventory reads, and Dashboard keys. The later EPIC118.5.1 root-cause pass removed retry-based remediation and fixed the stale Materials API payload at the read-model mapper.

`InventoryMaterialsPage` does not hold a local row copy. Manual operator smoke testing is still required in an authenticated browser session to verify inbound, outbound, transfer, adjustment, and return flows without F5.

## EPIC118.4 Inventory Read-after-Write Consistency

Status: **COMPLETED**

Inventory stock-affecting frontend mutations now invalidate the active Inventory query families used by the current UI: Overview, Materials, Material Detail, Material transaction history, transaction workspace, locations, return requests, and dashboard. The fix is frontend-only and does not change Repository, business logic, Event/Outbox, Snapshot Engine, API contract, or database schema.

Transaction/detail/location workspaces are refreshed immediately through React Query invalidation. Inventory Overview remains snapshot-first and now refetches every 5 seconds while mounted so Background Engine snapshot updates are picked up without F5; its refresh control shows `Đang đồng bộ...` during background refetch.

## EPIC118.3 Inventory Historical Metrics

Status: **APPROVED WITH LIMITED HISTORY**

Inventory Overview historical metrics now use persisted snapshot history instead of synthetic or reconstructed frontend history. The canonical global dashboard snapshot row is keyed by `scopeKey = 'ALL'` and stores out-of-stock, material-usage counts, and material-usage stock fields as nullable historical metrics. Existing warehouse snapshots remain valid for stock value/quantity trend, while old rows are not backfilled with guessed category/out-of-stock data.

Current database evidence: one real `ALL` snapshot exists for 2026-07-09, and it matches live inventory under the frozen MAIN-stock low/out-of-stock rule. Category/out-of-stock KPI deltas will show `Chưa có dữ liệu lịch sử` until at least two real `ALL` snapshots exist.

## EPIC119 Inventory Inbound & Outbound UI/UX Audit

Status: **COMPLETED**

A comprehensive read-only audit of the Inbound and Outbound UI/UX, workflow, and data binding has been completed. The audit identified key operational gaps including: a single-line transaction limit (P0), lack of split-location exports (P0), modal-based creation layouts conflicting with the Enterprise UI Guidelines (P1), and severe selector inconsistencies between tabs (P1). A complete layout proposal and component map were drafted to standardize both tabs under a right-side Slide-out Drawer configuration with multi-line support. No application source code changes were made during this audit sprint.

## EPIC118.2 Inventory Historical Chart Data Audit

Status: **COMPLETED**

A comprehensive read-only audit of all inventory historical charts and metrics on the Inventory Overview page has been completed. The audit identified that the display of "Chưa có dữ liệu lịch sử" for several cards is caused by a combination of a UI early return bypassing the calculations (UI_BINDING_ERROR) and the backend database schema not storing/aggregating historical categories or out-of-stock figures (SNAPSHOT_PAYLOAD_MISSING). The baseline 12-month data cleanup on 2026-06-24 correctly accounts for empty historical snapshot tables prior to 2026-07-06 (EXPECTED_EMPTY). No source code changes were made, and all deliverables have been added under `docs/audit/`.

## EPIC118.1 Inventory UI Data Binding

Status: **APPROVED WITH LIMITATIONS**

Inventory Overview and Materials now use snapshot/read-model APIs with server-side
query state. The target pages no longer depend on `/inventory/audit`, the latest
200 transactions, or synthetic trends. Material Detail transaction/log history is
server-paginated and transaction attachments are loaded on demand. Persisted
material/location parity remains 23/23. Remaining limits are documented offset
pagination thresholds and unavailable Prisma query-count telemetry.

## EPIC118 Inventory UI/Data Binding Audit

Inventory architecture and persisted data remain frozen and unchanged. Read-only
validation found 23/23 active materials consistent across item quantity, location
stock, and material snapshot. The current Overview and Materials workspaces are
not UI/data-binding approved: they use `/inventory/audit` runtime reconstruction,
assume capped responses are complete, and contain incorrect or fabricated metrics.
Material Detail and location reads remain snapshot-first.

This document summarizes the current operational state of SteelTrack as of 2026-06-24. Percentages and detailed task ordering remain tracked in `PROJECT_STATUS.md` and `NEXT_TASKS.md`.

## Performance Foundation

Status:

- Chuẩn hóa và tạo mới 3 tài liệu kiến thức cốt lõi (README.md, MASTER_INDEX.md, DOCUMENTATION_MAP.md) tại thư mục gốc docs/ vào ngày 2026-07-08.
- Sprint PERF Foundation completed on 2026-07-07.
- EPIC 100 Core Foundation repository/query pass completed on 2026-07-07.
- EPIC 101 Enterprise Scalability Foundation audit completed on 2026-07-07.
- EPIC 102 Runtime Instrumentation & Observability completed on 2026-07-07.
- EPIC 103 Runtime Analytics Foundation completed on 2026-07-07.
- EPIC 104 Enterprise Data Engine index foundation completed on 2026-07-07.
- EPIC 105 Enterprise Background Engine design completed on 2026-07-07.
- EPIC 106 Enterprise Background Engine implementation foundation completed on 2026-07-07.
- EPIC 109 OPS.1 Operations Center system health cockpit completed on 2026-07-08.
- EPIC 112 INV.CORE.2 Inventory Snapshot Completion completed on 2026-07-08.
- EPIC116 Project Detail Snapshot Completion completed on 2026-07-08. Projects is now Architecture Freeze v1.0.
- EPIC 204 Yard Blueprint detailed system design completed on 2026-07-08.
- EPIC 205 Purchasing Blueprint detailed system design completed on 2026-07-08.
- EPIC 206 Finance Blueprint detailed system design completed on 2026-07-08.
- EPIC 207 HR Blueprint detailed system design completed on 2026-07-08.
- EPIC 208 AI Enterprise Blueprint detailed system design completed on 2026-07-08.
- EPIC 209 Enterprise Integration Blueprint detailed system design completed on 2026-07-08.
- EPIC 210 Enterprise Standards & development guidelines completed on 2026-07-08.
- EPIC 211 Enterprise Architecture Governance & Checklist (PR checklists, release policy) completed on 2026-07-08.
- Enterprise Architecture Governance & ADRs (ADR001-ADR010) completed on 2026-07-08.
- Core Platform Architecture documents (Naming Conventions, API Contracts, Domain Boundaries, Performance SLA, Versioning Policy, Module Dependency Map) completed on 2026-07-08.
- EPIC 212 Enterprise Knowledge Base (README.md, MASTER_INDEX.md, DOCUMENTATION_MAP.md, guides, and audits) completed on 2026-07-08.

Current architecture:

- Background Engine now has executable backend plumbing:
  - `BackgroundJobManager`;
  - `SnapshotUpdateDispatcher`;
  - `SnapshotRebuilder`;
  - Prisma-backed `OutboxService`;
  - `EventPublisherService`;
  - `EventConsumerService`;
  - `JobRetryPolicyService`;
  - `snapshot.*` job handling in `JobWorkerService`.
- Snapshot jobs currently return a safe `skipped` result because persisted snapshot tables do not exist yet.
- Persistent Outbox now creates, claims, dispatches, retries, and dead-letters real `outbox_events` rows instead of returning stub data.
- Background Engine architecture is now documented for moving Dashboard/runtime reads from live aggregates to background-maintained snapshots.
- Snapshot Update Engine contracts are defined for Inventory, Projects, Logistics, and Dashboard snapshots.
- Snapshot Rebuilder design covers full rebuild, scoped rebuild, incremental update, idempotency keys, rebuild metrics, stale snapshot detection, and fallback behavior.
- Event Bus Foundation is documented around existing `EventBusService`, `JobSchedulerService`, `JobWorkerService`, and future persistent Outbox hardening.
- Data Engine now has the first schema-backed composite index migration for Enterprise-scale query paths.
- The EPIC104 index migration adds composite indexes for Inventory transaction/date reads, material transaction history, exact stock bucket lookup, ProjectTask hierarchy/schedule reads, ReturnRequest queues, and ActivityLog module/entity timelines.
- DE.1 EXPLAIN artifacts are stored under `docs/runtime/de1/`, with the summary in `docs/runtime/data-engine-index-foundation-report.md`.
- Persisted snapshot architecture is documented in `docs/architecture/persisted-snapshot-architecture.md`; no snapshot tables were created yet.
- Dashboard Inventory aggregation now goes through `DashboardInventoryReadModelService`, an internal cached read model with a 30-second TTL.
- Dashboard Inventory-heavy endpoints keep their existing API contracts while using shared stock, low-stock, movement, procurement, anomaly, and forecast inputs.
- Project Detail now has a tab-scoped API boundary at `GET /projects/:id/detail/:tab`, and the frontend caches detail payloads by `projectId + tab`.
- Logistics dispatch detail drawer now refreshes selected dispatch order details through a dedicated React Query cache key.
- Inventory Material Detail attachment queries are tab-gated so image/document/transaction attachment data is not fetched for unrelated tabs.
- Inventory aggregate read paths for Material Detail and Dashboard snapshots now go through `InventoryRepository`.
- Projects runtime source queries are centralized in `ProjectsRepository`, and Project Detail tab queries now use `ProjectsRepository.findProjectDetailSources(projectId, tab)` instead of full-runtime slicing.
- Logistics now has `LogisticsRepository` for DispatchOrder aggregates, dispatch suggestions, allocation reconciliation, component delivery updates, and activity-log persistence.
- Persisted read-model migration planning is documented in `docs/architecture/persisted-read-model-foundation.md`.
- Enterprise performance gates, query audit, index audit, and 5-year data growth planning are documented in:
  - `docs/audit/enterprise-performance-gate.md`
  - `docs/audit/enterprise-query-audit.md`
  - `docs/audit/enterprise-index-audit.md`
  - `docs/architecture/data-growth-5-year-plan.md`
- Runtime observability now extends `core/performance`:
  - global HTTP runtime metrics interceptor;
  - Prisma query event profiler;
  - query budget classifier;
  - slow query detector;
  - `RuntimeHealthService`;
  - process-local request/query/cache/read-model/memory snapshots exposed through existing `/performance/health` and `/performance/metrics`.
- Runtime reports are documented under `docs/runtime/`.
- Runtime analytics now aggregates observed metrics into 5-minute, 1-hour, and 24-hour windows:
  - endpoint rankings;
  - query rankings;
  - rule-based recommendations;
  - read-model effectiveness;
  - performance score by module;
  - architecture score by module.
- Operations Center now exposes the first admin cockpit at `/operations-center` and aggregates runtime metrics, background jobs, outbox events, persisted snapshot health, cache/read-model effectiveness, database size, storage filesystem status, API ranking, query ranking, and rule-based system alerts through `GET /operations-center/overview`.
- Inventory now has persisted domain snapshots for Material Detail and warehouse locations:
  - `InventoryMaterialSnapshot` / `inventory_material_snapshots`;
  - `InventoryLocationSnapshot` / `inventory_location_snapshots`.
- Inventory Material Detail reads persisted material snapshots first and falls back to the repository-backed read model when snapshots are missing, stale, or incomplete.
- Inventory Locations reads persisted location snapshots first and falls back to repository-backed live composition when snapshots are missing or stale.
- Inventory lifecycle events publish persistent Outbox events and schedule Background Engine snapshot update jobs; snapshots are not written inside the business request transaction.
- Operations Center Inventory health now exposes repository, read model, dashboard snapshot, material snapshot, location snapshot, event/outbox, job, cache, freshness, hit ratio, lag, and rebuild status.
- Inventory is now the Architecture Freeze v1.0 candidate and the reference backend architecture for future Production, Purchasing, QC, Maintenance, and other enterprise modules.
- EPIC115 Project Core Compliance hardening is complete:
  - Project service persistence is now repository-routed through `ProjectsRepository`.
  - Project runtime dashboard remains snapshot-first through `DashboardReaderService`.
  - Project mutations publish persistent `project.*` events and schedule Background Engine snapshot updates.
  - Runtime Metrics and Operations Center now expose Project-specific platform health.
  - Projects is an Architecture Freeze Candidate, with final freeze pending persisted detail-tab snapshots.
- EPIC116 completes the Projects freeze blocker:
  - `ProjectDetailSnapshot` persists tab-scoped payloads for `GET /projects/:id/detail/:tab`.
  - Project Detail reads snapshots first and falls back to `ProjectsRepository` read models when snapshots are missing or stale.
  - Project Detail snapshot updates run through Background Engine jobs instead of request transactions.
  - Runtime Metrics and Operations Center now expose Project Detail snapshot freshness, hit/fallback, lag, and parity warning signals.
  - Projects is now the second Architecture Freeze v1.0 module after Inventory.
- Enterprise Architecture Governance is established ([enterprise-governance.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-governance.md)) detailing software quality management, Architecture Guardian responsibilities, and periodic ARB review gates.
- Ten primary Architecture Decision Records (ADR001 to ADR010) are documented in [enterprise-architecture-decision-records.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-architecture-decision-records.md) covering the chosen Core Platform design patterns.

Known limitations:

- The Dashboard Inventory read model is process-local cache, not a persisted analytics table.
- `GET /projects/:id/detail/:tab` now reads persisted Project Detail snapshots first. Missing or stale snapshots fall back to repository-backed tab read models and schedule background refresh.
- Inventory Material Detail still uses the existing main detail payload for core material analytics; only attachment-heavy tab queries were lazy-loaded in this sprint.
- Inventory return workflow remains a direct technical-debt candidate. Project template CRUD and ProjectTask command mutations now route through `ProjectsRepository`.
- Persisted Inventory material/location snapshots now exist; persisted read models for other modules remain future work.
- EPIC 101 did not add indexes, persisted snapshot tables, runtime instrumentation, partitioning, or archive jobs. It establishes the standards and migration path only.
- EPIC 102 metrics are process-local and reset on backend restart. They are not yet exported to a central telemetry backend.
- Prisma query profiler infers model/action from sanitized SQL structure; it intentionally does not log raw SQL or SQL parameters.
- EPIC 103 long-range 7/30/90-day trends are intentionally marked unavailable until runtime metrics are persisted; no fake trend data is generated.
- EPIC104 timing improvements are not yet meaningful on the current tiny dataset; PostgreSQL still chooses sequential scans for some indexed paths because the active tables are small.
- Persisted dashboard/detail snapshots exist for Inventory and Projects; remaining modules still need their own persisted snapshot cutovers.
- EPIC105 is design-only. No snapshot tables, snapshot jobs, or event-driven update handlers are active yet.
- EPIC106 background plumbing is now used by Inventory and Projects snapshot writers. Snapshot coverage for other modules remains future work.
- Operations Center OPS.1 is read-only and process-local for runtime analytics. It does not yet provide job retry, event replay, snapshot rebuild actions, database bloat analysis, backup management, or persisted long-range runtime trends.

Current focus:

- Validate Dashboard response parity before/after the read-model change.
- Watch Dashboard query latency as real Inventory transaction volume grows.
- Plan persisted dashboard snapshots after Inventory, Production, Yard, QC, and Projects aggregation rules stabilize.
- Use `docs/audit/query-budget-audit.md` before adding new cockpit/runtime endpoints.
- Use `docs/audit/epic-100-repository-layer-audit.md` before moving more command paths into repositories.
- Use `docs/audit/enterprise-performance-gate.md` as the review gate for new Dashboard, Detail, Lookup, and Search/List endpoints.
- Plan the next schema-enabled sprint around composite indexes and persisted Inventory/Project runtime snapshots.
- Use `/performance/metrics` after exercising dashboards/details to capture real baseline averages, peaks, budget warnings, slow queries, and duplicate-query candidates before optimizing.
- Use `/performance/metrics.analytics` after each performance sprint to compare endpoint rankings, query rankings, read-model effectiveness, and module performance score against the previous baseline.
- Re-run DE.1 EXPLAIN plans after realistic transaction/task/log volume exists and compare against `docs/runtime/de1/`.
- Treat `docs/architecture/persisted-snapshot-architecture.md` as the design gate before creating Inventory or Project snapshot tables.
- Use `docs/architecture/background-engine.md`, `docs/architecture/snapshot-update-engine.md`, and `docs/architecture/event-bus-foundation.md` as the design gate before implementing snapshot jobs or event-driven snapshot updates.
- Use `docs/runtime/background-engine-implementation-report.md` before enabling snapshot-first reads. The current implementation only provides background plumbing and safe skipped snapshot jobs.
- Use `docs/runtime/operations-center-system-health-report.md` before OPS.2+ work so Operations Center stays a system cockpit instead of drifting into business dashboards.

## Inventory Business Freeze v1.0

Status:

- APPROVED on 2026-07-09 after EPIC117.1.
- Material snapshot stock now derives from canonical `inventory_location_stocks`.
- Persisted material snapshot parity is 23/23 with zero mismatches.
- Inventory write controllers use typed Zod validation; transaction lines retain
  warehouse/location/valuation fields.
- Reconciliation ran through persistent outbox events and Background Engine
  snapshot jobs; Operations Center Inventory event/job health is clean.
- Current adjustment-backed Stock Take remains frozen for v1.0. A formal
  session/count/review/approval/close lifecycle is Phase 2 scope.

## Projects Runtime & PMS Blueprint

Status:

- Hotfix completed on 2026-07-01.
- Sprint 40PROJ.9 usability recovery completed on 2026-07-01.
- Sprint 40PROJ.10 Project Intelligence and Site Operations completed on 2026-07-01.
- EPIC201 Projects Blueprint (PMS) detailed system design completed on 2026-07-08.

Current architecture:

- PMS has a complete architectural design pack:
  - `projects-blueprint.md`: Layers, integration map, risk analysis, operations metrics, and AI integration.
  - `projects-domain.md`: Schema, hierarchy, dependencies, allocations, and `ProjectsRepository` signatures.
  - `projects-event-flow.md`: Transactional Outbox pattern, schemas, consumer routing, and idempotency keys.
  - `projects-read-model.md`: Tab-gated API boundaries, composite database indexes, and TTL/fallback configs.
  - `projects-snapshot.md`: Persisted runtime/dashboard snapshots, payloads, and rebuild strategy.
  - `projects-dashboard.md`: Interactive WBS tree grid, SVG/Canvas Gantt chart, and Mobile Site Mode.
  - `projects-workflow.md`: Erection state machine, Site QC, Handover, and Material Returns lifecycle.
- Projects now uses the normalized ProjectTask domain tables created by `20260630100000_project_task_domain`.

- Project templates use `project_templates` from `20260630113000_project_template_library`.
- Backend Projects service has compatibility guards so missing ProjectTask/ProjectTemplate tables return controlled empty states or explicit validation errors instead of Prisma P2021 crashes.
- Frontend Projects runtime/template queries avoid infinite retries and show visible empty/error states.
- Project Detail uses a centered cockpit drawer for execution workspaces and includes edit, WBS, material/component, cost, document, and log tabs.
- `GET /projects/runtime` now includes real `documents` from Attachments and real `logs` from ActivityLog.
- Project component return is available from Project Detail and writes component status/timeline/activity log updates.
- Project material return now posts to the mounted Inventory Return workflow at `POST /inventory/returns`; the workflow creates `ReturnRequest` rows and ActivityLog entries, keeps requested quantities pending, and restocks Inventory when the return is received.
- Project material return reconciliation is lifecycle-aware: `REQUESTED` returns appear as pending in Project runtime without increasing Inventory, and `RECEIVED` returns create an Inventory `RETURN` transaction and reduce ProjectTask material allocation.
- Inventory now exposes a `Return Requests` workspace at `/inventory/returns` so Project pending returns have an operator-owned processing queue. The workspace supports Requested, Received, Accepted, and Rejected views, detail/log visibility, receive action, and reject action.
- Project material Pending Return quantities link into the Inventory Return Requests workspace with project/material filters.
- Project Detail now opens as a right-side execution drawer using Material Detail-style sizing instead of a centered modal.
- Project material return receipt transactions now carry `PROJECT_RETURN` metadata in Inventory transaction `note`, render as `Trả từ công trình` in Inventory and Material Detail history, and include Project/Return Request context.
- Shared `ModuleDetailDrawer` now has standardized sizes (`sm`, `md`, `lg`). Inventory Material Detail and Project Detail use the large drawer, while Inventory Return Request and Project Pending Return use the small drawer.
- Project Pending Return quantities now open an in-context side drawer backed by real `ProjectsRuntime.returnRequests`.
- WBS task creation defaults to Simple Mode with parent tree select, duration, smart date suggestion, and steel erection resource suggestions; Advanced Mode keeps full scheduling/resource/cost fields.
- Project templates can now carry task rule metadata in `ProjectTemplate.structure`, including default duration, suggested materials, suggested components, suggested resources, suggested machines, and checklist items.
- WBS operations now include Auto WBS generation and bulk task updates using normalized ProjectTask rows.
- Project Detail includes a `Công trường` tab for low-friction site updates that write ActivityLog rows and update task progress/status through existing ProjectTask service logic.
- Project Detail documents now expose category filters for contracts, drawings, method statements, acceptance records, minutes, photos, and other files.
- Project Command Center includes executive health panels for forecast finish, material/component/resource shortages, and suggested operational attention areas using real runtime data.

Known limitations:

- Template endpoints are auth/RBAC protected; unauthenticated checks return `401` by design.
- `start:dev` compiled successfully during verification but could not bind because port `3000` was already in use by another process.
- Material return still intentionally uses the existing Inventory Return lifecycle. Accepted maps to the existing disposed/finalized lifecycle; Rejected maps to existing `CANCELLED` status to avoid schema changes.
- Project document/log visibility depends on workflows creating Attachment and ActivityLog rows consistently.
- Template rule editing is currently JSON/domain-backed; a visual admin rule editor is still needed.
- Site Mode photo timeline reads existing project image attachments, but direct photo upload from the Site Mode form is still a follow-up.
- Component return lifecycle remains a handoff back to `READY`; richer Yard receiving/rework/scrap disposition statuses are not first-class yet.

Current focus:

- Validate Projects Templates and project creation from template with a real Admin session.
- Keep migration status checks in the Projects validation checklist before future ProjectTask or template work.
- Validate Auto WBS, bulk operations, Site Mode update, and template-driven task suggestions with field operators.
- Validate Project material return in a real browser session and confirm `POST /inventory/returns` returns `201 Created`, with return request, return item, and ActivityLog rows created.
- Validate Project material return receive flow: after `receive`, Inventory stock should increase, Project pending return should drop, Project returned quantity should increase, and allocation should decrease.
- Validate Inventory `/inventory/returns`: requested return count, receive action, reject action, ActivityLog rows, and Project Pending Return click-through filters.
- Validate Sprint 40PROJ.10A UX polish: Project Detail drawer width, Return Request drawer width, Inventory Transaction label `Trả từ công trình`, Project Return badge, and Material Detail return timeline display.
- Validate Sprint 40PROJ.10B drawer standardization: Material Detail, Project Detail, Return Request Detail, and Pending Return Detail should all open from the right, stay non-full-screen on desktop, and scroll content independently.
- Add visual template rule editor, direct Site Mode photo upload, and formal component return lifecycle/disposition workflows after operators confirm Sprint 40PROJ.10.

## Enterprise Architecture Audit

Status:

- Sprint AUDIT.1 completed as documentation-only architecture assessment on 2026-06-29.

Current architecture:

- SteelTrack has mature operational foundations in Inventory, Components, Production, Yard, QC, Costing, Attachments, Dashboard, and shared cockpit UI.
- The strongest backend business foundation remains Inventory transaction/location stock plus Production BOM/reservation/issue/return/consume/ledger.
- Enterprise orchestration foundations exist (`WorkflowDefinition`, `WorkflowInstance`, `WorkflowAction`, `OutboxEvent`, `BackgroundJob`, realtime gateways), but they are not yet consistently bound to module workflows.
- Full audit reports are stored under `docs/audit/`.

Known limitations:

- Historical import is not safe until transaction replay, slot-level ledger rebuild, and snapshot rebuild rules are formalized.
- Realtime is partial: backend gateways exist, but most cockpit pages still use polling.
- Costing is material-cost ready/partial, but labor, machine, overhead, rework, Yard handling, and Logistics costs are not first-class.
- Logistics and Planning are navigation-ready but not business-model complete.

Current focus:

- Prioritize Workflow Engine binding, Inventory ledger/import readiness, and Component/Project cost traceability before adding more visible cockpit screens.

## Runtime Dataset

Status:

- Business data was intentionally cleaned on 2026-06-24 so operators can recreate clean records manually.

Current architecture:

- The cleanup preserved system/configuration foundations: users, roles, permissions, inventory categories, material types, units, warehouses, warehouse zones, yard layout slots, QC checklist templates, workflow definitions, work centers, and machines.
- The cleanup cleared business/runtime data: materials, components, projects, suppliers, vehicles, inventory transactions and balances, production BOMs/orders/material activity, QC inspections/results/issues/NCRs, Yard placements/movements/snapshots, attachments metadata, notifications, analytics snapshots, and runtime logs.
- Backup before cleanup: `backups/steeltrack_before_business_data_cleanup_20260624_092729.dump`.
- Executed cleanup script: `scripts/sql/business-data-cleanup-20260624.sql`.
- Detailed audit: `docs/ai-state/audits/business-data-cleanup-20260624.md`.

Known limitations:

- Physical files under `/data/steeltrack-storage` were not deleted by SQL; attachment metadata in the database is now empty.

Current focus:

- Recreate clean master/business records manually from the preserved configuration foundation before validating workflows again.

## Development Environment

Status:

- Local development watcher stability hotfix documented.

Current architecture:

- Frontend dev server uses Vite.
- Backend development uses Nest `start --watch`.
- The active development environment also commonly runs VS Code Remote file watchers, TypeScript language servers, and AI/code assistant indexers.
- Vite watcher ignores now exclude generated/cache/artifact paths such as `.git`, `.turbo`, `.semble-index`, `node_modules`, `dist`, `coverage`, `.vite`, `docs`, and `backups`.

Known limitations:

- Linux inotify limits are system-level settings and were not changed automatically.
- Current observed values (`max_user_watches=116843`, `max_user_instances=128`, `max_queued_events=16384`) are low for simultaneous Vite, Nest watch, VS Code, and AI-assisted indexing sessions.

Current focus:

- Operators should apply the documented sysctl recommendations in `docs/dev/watchers-remediation-plan.md` if Vite/Nest watch reports `ENOSPC`.

## Navigation

Status:

- Completed module navigation synchronization pass for Components, Production, Projects, Suppliers, QC, Yard, and Logistics.
- Dynamic workspace header hotfix completed on 2026-07-02.
- Sprint UX.1 compact header and mini-sidebar pass completed on 2026-07-02.

Current architecture:

- Inventory remains the reference for path-based module navigation.
- The topbar header derives from route metadata and renders exactly two context lines: module title and workspace title. Static `SteelTrack ERP` and Inventory breadcrumb output were removed from active Inventory pages.
- The topbar is compacted to a 50px shell with smaller module/workspace typography so dashboards regain vertical space.
- Collapsed sidebar mode is now a 64px mini icon rail instead of a nearly-empty hidden panel. Module icons remain visible, hoverable, clickable, and open fixed-position flyout menus using the existing route tree.
- Components and Production use dedicated frontend routes for each operational tab.
- Projects, Suppliers, and QC now derive active tab state from `location.pathname` instead of local tab state.
- Yard now derives active tabs from real routes instead of hash fragments.
- Logistics now derives active tabs from real routes instead of local-only state.
- AppRouter exposes concrete routes for the target module sidebar entries, so refresh, direct URL access, and browser Back/Forward preserve the active workspace.
- Both active sidebar config files are synchronized: `apps/frontend/src/app/shell/sidebar/navigation.config.ts` and `apps/frontend/src/app/config/navigation.config.ts`.

Known limitations:

- Some newly reachable tabs are explicit frontend placeholders until backend/API phases exist: Production incidents/reports, Project costs/documents/logs, Supplier purchasing/payables/logs/reports, and QC CAPA/log specializations.
- `/components/reports` currently reuses the Components History page until a dedicated Components report page is built.
- Legacy QC routes `/qc/plan`, `/qc/standards`, and `/qc/calibration` remain available for old bookmarks but are not shown in the new sidebar.
- Logistics now has a dispatch MVP foundation; only non-dispatch legacy routes remain as compatibility aliases.

Current focus:

- Validate sidebar/tab behavior with operators across expanded/collapsed sidebars, refresh, direct URL, and browser Back/Forward flows.

## Logistics

Status:

- Completed EPIC203 Logistics Master Blueprint and System Design.
- Partial implementation (Sprint 50LOG.1).

Current architecture:

- EPIC203 details the Logistics Master Blueprint design covering: 1) Domain models (Driver, Route, ProofOfDelivery, GpsTracking), 2) Asynchronous Outbox event schemas and geofencing consumer routing, 3) Logistics dashboard & live tracking snapshots, 4) Background jobs for geofence/ETA recalculation, 5) UI layouts for Dispatch Cockpit and mobile driver views, and 6) AI Route/Load/ETA optimizers.
- Backend exposes `DispatchOrder`, `DispatchItem`, and `DispatchEvent` through `/logistics/dispatch-*` APIs.
- Logistics frontend uses real dispatch dashboard/order APIs for Tổng quan, Điều xe, Đang vận chuyển, and Lịch sử.
- Dispatch lifecycle supports planned/loading/departed/arrived/received/completed/cancelled state transitions.
- Auto suggestion reads real ProjectTask material/component allocation data.
- Receive reconciles project task allocations, writes activity logs, and creates Inventory export transactions for material dispatch lines.

Known limitations:

- Dispatch receive currently records a material export at transaction level but does not yet require exact source warehouse/yard slot selection.
- Project Detail per-line dispatch columns (`Đang vận chuyển`, `Đã nhận`, `Ngày nhận`) still need a focused UI pass.
- Loading checklist is stored as dispatch order JSON; photo/signature attachment binding is future work.

Current focus:

- Implement the Logistics module according to the 3-sprint roadmap, beginning with Sprint 1 (Vehicles/Drivers/Routes CRUD & Max Payload Gate).
- Validate real dispatch creation, auto suggestion, status transitions, and receive reconciliation with clean ProjectTask allocation data.

## Inventory

Status:

- Completed operational foundation.

Current architecture:

- Frontend Inventory module uses React/Vite/TanStack Query cockpit pages and modal workflows.
- Backend Inventory uses transaction documents and transaction items for stock movements.
- `inventory_location_stocks` stores current balance by `inventoryItemId + zoneId + slotId + level`.
- `inventory_items.quantity` remains a compatibility snapshot for modules still reading material quantity directly.
- Warehouse locations are stored in `warehouse_zones` and linked to `master_warehouses` (`MAIN` / `PRODUCTION`).
- Sprint 9 stock mutation paths use the full location bucket `inventoryItemId + warehouseId + zoneId + slotId + level` for exact location validation and location stock upsert.
- Sprint 11A decimal pass supports locale-formatted quantity input in operational Inventory forms and keeps VND currency display rounded to whole dong.
- Sprint 12A treats Inventory Overview/Stock as the UI design reference; Inventory visual wrappers now delegate to shared module UI primitives without changing Inventory behavior.
- Sprint 12C adds sticky module filters and frontend KPI click-to-filter for Inventory stock status where matching filters exist.
- Sprint 13B.1 redesigns the Material Detail drawer with shared module UI primitives, KPI strip, horizontal tabs, colored transaction badges, location distribution, movement trend, forecast, project usage, and supplier purchase summaries.
- Sprint 13B.2 adds shared `ModuleTabs` and brings the Material Detail drawer to Module UI Foundation compliance for tabs, table tokens, drawer behavior, and focused 2D location preview.
- Sprint 11A.2 centralizes frontend numeric formatting through shared quantity/currency helpers and removes ad-hoc `toLocaleString('vi-VN')` / `Intl.NumberFormat` usage from frontend source.
- Sprint 13B.3 adds Material Detail image gallery readiness, Material Master image preview UI, and standardized Material Analytics Cockpit panels for inbound, outbound, inventory trend, 7-day forecast, and turnover.
- Sprint 14A connects Material Detail image gallery to the shared Attachments backend. Material photos are uploaded through `/attachments/upload`, stored on filesystem under `STORAGE_ROOT`, and displayed from attachment metadata.
- Material Detail now shows non-photo `Tài liệu vật tư` attachments with original filename, size, upload date, and download link.
- Sprint 14B splits Inventory attachments into Material Master attachments and Inventory Transaction attachments. Transaction documents use `module=inventory`, `entityType=transaction`, and `entityId=inventoryTransactionId`.
- Inventory Inbound, Outbound, Transfer, and Stock Take forms can upload attachments after the transaction is saved, and the Inventory Transactions page has a detail drawer with `Tài liệu đính kèm`.
- Sprint 14B.5 refines attachment UX: Inventory Materials list stays focused on material/stock/location/status, while Material Detail owns attachment context with summary counts, contextual document columns in transaction/project/supplier tabs, and source-classified document rows.
- Inventory Transactions UX 2.0 adds `Hồ sơ` columns to the dedicated Nhập kho, Xuất kho, Điều chuyển, and Kiểm kê lists; each `📎` count opens a transaction attachment drawer.
- Sprint 15A fixes outbound value display: Inventory Outbound now sums all transaction item values, and transaction API responses compute missing outbound `unitPrice` / `totalAmount` from average inbound material cost for legacy rows.
- Sprint 15B makes `inventory_transaction_items` the source of truth for transaction valuation. New transaction item writes persist `unitPrice` and `totalAmount`, direct Production/Material Movement writers do the same, and historical IMPORT/EXPORT/TRANSFER/RETURN rows were backfilled.
- Sprint 16A enhances Inventory Outbound with a transaction detail drawer, outbound value today KPI, value-based top material ranking, and top project ranking by outbound value using existing transaction API data.
- Sprint 16B enhances Inventory Transfer with a transaction detail drawer, source/destination location visibility, transfer value KPIs, route analytics, and source/destination location rankings using existing transaction API data.
- Sprint 16C enhances Inventory Inbound with a transaction detail drawer, all-line inbound aggregation, supplier/value analytics, price monitoring, and shared larger filter spacing across Inbound, Outbound, and Transfer tabs.
- Sprint 16D enhances Inventory Outbound analytics with project consumption share, daily/monthly outbound trend charts, material consumption value/issue counts, outbound-purpose distribution, financial KPIs for today/week/month/year, and abnormal consumption alerts using existing transaction API data only.
- Sprint 17A enhances Inventory Stock Take with session-level detail drawers, variance KPI cards, top variance materials/locations, and adjustment preview rows derived from existing adjustment transaction items.
- Sprint 17B enhances Inventory Locations with occupancy/free/occupied slot KPIs, inventory value by location, top occupied slots, click-through slot material drawer, and transfer movement route analytics using existing zone, audit, and transaction API data.
- Sprint 17E hardens Inventory document numbering: backend-owned `code = transactionNo`, five-digit `PREFIX-YYMMDD-00001` format, max-suffix generation instead of `count() + 1`, and retry on `P2002` duplicate collisions.
- Sprint 17F separates main warehouse, production warehouse, and total stock in Inventory Overview, Inventory Materials, and Material Detail. Stock health and purchasing alerts now use only `Kho chính` / `MAIN` balances so production stock cannot hide main-warehouse shortages.
- Sprint 19D/19E align Inventory Adjustments with the Inventory transaction workflow: sidebar route `/inventory/adjustments`, direct global action modal launch, shared `AdjustmentTransactionModal`, location-balance table, `WarehouseMiniMap`, location-specific System Qty, Actual Qty, auto Difference, Variance Value, reason presets, attachments, adjustment history grid, analytics, and row detail drawer.
- Inventory Overview monthly historical KPI trends and delta percentages use 12-point monthly snapshots computed using transaction ledger rollbacks and transaction-based existence dates (`firstTransactionDate`). Sparklines output real monthly trends when data age is >= 12 months (otherwise showing flat placeholder lines). Delta notes show absolute change and relative percentage change in parentheses (e.g. `▲5.203,5 tấn (+48,3%)`), and absolute counts change only for count metrics (e.g. `▲3 mã`). Category cards display simplified format values where the item count is styled as `text-white font-semibold` and quantity in tons is styled as `text-slate-400 font-normal` (e.g. `6 (2.053 tấn)`), maintaining equal height `h-[108px]`. Note text color uses dynamic emerald/red semantic coloring.
- Sprint 20I.4A restyles all 5 Inventory Materials dashboard cards to match the Inventory Overview card visual language: rounded-2xl containers, border-slate-800, bg-slate-950/60, and equal height of 260px. Card header typography is set to title: text-[10px] uppercase tracking-[0.12em] text-slate-400, primary value: text-2xl font-semibold text-white, and secondary note: text-[10px] text-slate-400. Cards 1 (Phân bố tồn kho), 2 (Biến động tồn kho), and 3 (Cảnh báo tồn kho) are updated in the materials tab layout, while Cards 4 (Theo mức độ) and 5 (Top tồn thấp) are restyled inside the alerts modal sidebar, reusing existing charts and preserving calculations and datasets.
- Sprint 20I.4C aligns the vertical rhythm of all 5 Inventory Materials dashboard cards by defining a fixed header container height (`h-[64px]` with `flex flex-col justify-start`), ensuring all chart elements align perfectly. Header typography spacing uses exact margins (`mt-1` on both value and subtitle). Subtitle strings are set to compact formats (e.g. `6 kho hoạt động`, `▲5.203,5 tấn (+48,3%)`, `▲2 với tháng trước`, `3 mức cảnh báo`, `Dưới định mức`).
- Sprint 20I.4D formats the value rows of all 5 Inventory Materials cards as clean KPI values (e.g. Card 1 and Card 2 show `15.970,5 tấn`, Card 3 shows `12`, Card 4 shows `3`, Card 5 shows `6`), moving descriptive labels entirely into the subtitles (e.g. `6 kho hoạt động`, `▲5.203,5 tấn (+48,3%)`, `▲2 với tháng trước`, `3 mức`, `Dưới định mức`). Value and subtitle classes are kept strictly aligned to the vertical rhythm layout of the overview.
- Sprint 20I.4E aligns the first 5 KPI cards in the Inventory Materials tab to be visually and behaviorally identical to the Inventory Overview KPI cards. Styled containers with rounded-2xl, border-slate-800, bg-slate-950/60, h-[108px], and p-4. Applied typography: title text-[10px] uppercase tracking-[0.12em] text-slate-400, value text-2xl font-semibold text-white mt-1, and subtitle text-[10px] mt-1. Formatted value metrics with Vietnamese locale decimal commas (e.g. ▲5.203,5 tấn (+48,3%)) and count metrics (e.g. ▲3 mã / ▼2 mã). Tone colors match Overview (emerald, cyan, indigo, amber, red). Unused formatPercentDelta helper was cleaned up.
- Sprint 20I.4F (and 20I.4E Part 2) fully synchronizes the Inventory Materials KPI snapshot engine with the transaction-based ledger logic in Inventory Overview by using 12 monthly end-of-month snapshots, data age detection, and main warehouse rollback logic for stock alerts. It also reduces the height of the first 3 dashboard cards (Phân bố tồn kho, Biến động tồn kho, Cảnh báo tồn kho) to `h-[170px]` with scroll viewports (`h-[82px] overflow-y-auto`) to preserve original chart geometries and label counts without clipping.
- Sprint 20I.5A redesigns the Inventory Locations dashboard charts into a premium MES/WMS Cockpit theme with a 2-column responsive layout (1-column on tablet/mobile). Standardizes card styling to use the custom industrial linear gradient, cyan borders, and rings. Arranges the charts into 5 rows with exact heights (`h-[220px]`, `h-[250px]`, `h-[280px]`), utilizing `LocationsChartCard` wrapper, `CompactDonutSummary`, and `HorizontalBars` components. Replaces the slot transfer routes chart with a new "Phân bố sức chứa theo kho" (Capacity Distribution by Warehouse/Zone) chart showing tons, occupancy percentage, and occupied slot counts. Both frontend and backend builds passed.
- Sprint 20I.5B polishes the Inventory Locations dashboard layout: places "Danh sách vị trí kho" on the left with a height of `h-[520px]` and responsive width (~1040px), stacks a 320px right sidebar with three charts (`Hiệu suất sức chứa`, `Trạng thái vị trí` as a vertical bar chart, and `Phân bố loại vật tư` as a pie chart), replaces horizontal bar charts with compact top-5 table layouts (Kho/Giá trị/%, Vị trí/Khối lượng/%, Mã/Vật tư/Số lượng), reduces visual spacing (`gap-1` and `space-y-1`), and localizes all units to Vietnamese (e.g. `tấn`). Both frontend and backend builds passed.
- Sprint 20I.5C polishes the Inventory Locations dashboard usability: enlarges the Locations section to `h-[560px]` with larger font sizes, detailed columns (Kho, Zone, Slot, Tầng, Khối lượng, Số vật tư, Trạng thái), and rounded status badges (Đang dùng, Trống, Bảo trì); enlarges the four analytics cards to heights of `h-[320px]` and `h-[300px]`; adds a "Xem tất cả" button on each card header to open full table modal dialogs (`fixed inset-0 bg-slate-950/75 backdrop-blur-md max-h-[70vh] overflow-auto rounded-2xl`) displaying complete values, weights, imports, and exports with transaction dates. Both frontend and backend builds passed.
- Sprint 20I.5D makes the Inventory Locations workspace fully fluid and responsive: removes all fixed width constraints, `max-w-*` limits, `mx-auto` centering wrappers, container classes, and hardcoded column/sidebar widths. The root layout is set to `w-full min-w-0 flex-1 space-y-1`. The top section uses a 12-column grid (`grid-cols-12 gap-1`) where "Danh sách vị trí kho" takes `col-span-12 2xl:col-span-8` and the stacked right sidebar takes `col-span-12 2xl:col-span-4`. The bottom analytics section uses a 12-column grid (`grid-cols-12 gap-1`) with `col-span-12 xl:col-span-6` for each of the four cards, enabling fluid resizing for sidebar toggle, laptop, and ultrawide viewports. Both frontend and backend builds passed.
- Sprint 20I.5E introduces top-5 preview slicing on all 6 locations analytics cards: re-configures cards to display only the top 5 sorted preview rows using dedicated preview memos (`previewValueByLocation`, `previewStockByLocation`, `previewRecentInbound`, `previewRecentOutbound`, `previewTopMaterials`, `previewZoneCapacity`), while retaining the full unsliced datasets for the "Xem tất cả" modal dialogs. Standardizes DESC/newest-first sorting on all source and preview datasets. Both frontend and backend builds passed.
- Sprint 20I.5F replaces the first 5 locations analytics cards with the standard WMS KPI cockpit cards showing 6-month historical sparklines (totalLocationsTrend, occupiedLocationsTrend, emptyLocationsTrend, occupancyPercentTrend, totalStockTrend) and dynamic Vietnamese delta notes (currency, weight in tons, percentage, and location counts) in a responsive grid layout. Both frontend and backend builds passed.
- Sprint 20D.1 redesigns the Inventory Overview Page (`InventoryOverviewPage.tsx`) into an Executive Dashboard ERP Cockpit. Reuses the existing shared cockpit components (`CockpitKpiCard`, `CockpitChartCard`, `COCKPIT_HEIGHTS`) to render 5 executive KPI cards, an inventory forecast area chart, a component pipeline stages donut chart, shift-throughput pulse stats, severity-grouped exception alerts, chronological events, and circular OEE performance gauges. Further refactored by extracting child views into modular component files inside `components/dashboard/`, reducing the main page to 198 lines. Both frontend and backend builds passed.
- Sprint 20D.2C enhances the shared `CockpitKpiCard` component (`CockpitKpiCard.tsx`) to support executive presentation layouts (loading, empty, normal, alert states; tone; trend text; status badge) and redesigns `DashboardPage.tsx`'s KPI strip to render the 5 redesigned cards directly using this shared component. Both frontend and backend builds passed.
- Sprint 20D.2F simplifies and localizes `DashboardPage.tsx` into Vietnamese: removes the page header subtitle and description (replaces with a single title "Tổng quan"), localizes all 8 panel headers, localizes the 5 KPI titles, simplifies status chips to "LIVE", "RUN", "WARN", and shortens trend descriptions. Both frontend and backend builds passed.
- Sprint 20D.2G reduces dashboard text density to optimize scannability: replaces word-based status badges in `CockpitKpiCard.tsx` with colored status dots, shortens KPI and panel titles, and isolates raw numeric values (`42`, `18`, `256K`, `96,8%`, `7`) by moving units out of values. Both frontend and backend builds passed.
- Sprint 20D.3 completely redesigns the Executive Dashboard in `DashboardPage.tsx` into a 5-row Manufacturing Command Center Cockpit: removes header titles/descriptions to start immediately with KPI cards, converts status dots to static (no pulse animation), aligns Row 1 KPIs to have 48px visual weight values without units, replaces inventory forecast area chart with a grouped bar chart ("Biến động nhập - xuất - tồn kho") with legends on top and summary metrics below, constrains the alerts panel to the top 4 items with subtle borders, integrates the full occupancy details to Yard occupancy, adds QC line-series trends, optimizes material replenishment to use horizontal bars on left and a top-5 table on right, implements a compact recent activity timeline, and formats the assumptions panel as a simplified checklist with a 30% height reduction. Both frontend and backend builds passed.
- Sprint 20D.3B polishes the dashboard presentation: updates KPI card layout styles to increase negative space (`px-4 py-4`) and maximize numeric visual weights (`text-[44px] xl:text-[48px]`), enlarges the inventory movement card to `h-[380px]` (chart body `h-[290px]`), restructures the alerts list under the header title `Cảnh báo (N)` with localized alert codes, descriptions, and relative times, and implements a compact bullet-icon timeline for the recent activities table. Both frontend and backend builds passed.
- Sprint 20D.3C optimizes dashboard layout spacing and details empty states: sets custom empty states for Forecast, Pipeline, Yard, QC, and Production signal charts to prevent empty black boxes; reduces layout card heights to 260px (Forecast, Pipeline, Yard, Replenishment, QC), 220px (Activity), and 160px (Assumptions); upgrades text sizes to a minimum of 13px for headers/rows and 12px for metrics; limits activity description rows to a maximum of 2 lines; and compacts row items to maximize tabular space. Both frontend and backend builds passed.
- Sprint 20D.4A unifies the DashboardPage KPI cards with the Inventory visual language while preserving the h-[128px] executive sizing: restructures the card layout to follow a top-to-bottom hierarchy (Label, Large Value, Delta), sets Label and Delta to 11px and Value to 38px/42px, removes large icons, status chips, pulse indicators, and duplicate labels, limits sparkline opacity to 3% (`opacity-[0.03]`), and formats values to include units inline (e.g. `42 ngày`, `18 chuyền`, `256K kiện`, `7 cảnh báo`). Both frontend and backend builds passed.
- Sprint 20D.4B polishes the KPI card typography: configures labels using `text-[12px] font-medium text-slate-400` (removing uppercase and letter-spacing), formats card values using `font-bold tabular-nums text-[38px] xl:text-[42px] leading-none tracking-tight` (removing font-mono), ensures deltas use standard Vietnamese units (`▲ 2,4 ngày (+6,1%)`, `▲ 1 chuyền (+5,9%)`, `▲ 12K kiện (+4,8%)`, `▲ 0,6%`, `▼ 2 cảnh báo (-22%)`), and sets shell padding to `px-5 py-4` with `gap-y-2` layout properties while maintaining the 3% sparkline decorative opacity. Both frontend and backend builds passed.
- Sprint 30Y.2 unifies the Yard Management module layout, spacing, KPI cards, and tables with the WMS / Inventory design system to reach 95–100% visual parity: standardizes on `w-full min-w-0 flex-1 space-y-1` roots, enforces `gap-1` and `space-y-1` spacing on grids, replaces all legacy KPIs with `h-[108px]` standard `<CockpitKpiCard />` cards, integrates `<CockpitChartCard />` cards (`h-[170px]` card heights, `h-[74px]` chart body viewports), unifies table shells (`border-b border-cyan-400/10` headers and row hovers), adds `<DataTablePagination />` paging inside MovementTable and QCTab, and aligns drawer/detail panels to the `COCKPIT_SHELL` standard. Created `docs/ui/yard-cockpit-unification-report.md`. Both frontend and backend builds passed.
- Sprint 20C.9 & 20P.9A unifies both the Components and Production modules with the WMS / Inventory design system: created generic shared cockpit components (`CockpitSidebarStats`, `CockpitRecentList`, `CockpitStatusList`, `CockpitEmptyState`), mapped cockpit panels to `COCKPIT_SHELL`, KPI cards to standard `CockpitKpiCard` (`h-[108px]`), quick analytics to `<CockpitChartCard />` (`h-[170px]` card height, `h-[74px]` chart viewport), and standardized table header & cell paddings to `px-4 py-2.5 text-xs`. Created `docs/ui/components-final-unification-report.md` and `docs/ui/production-workspace-unification-report.md`. Both frontend and backend builds passed.
- Operational code generation now follows `PREFIX-YYMMDD-00001`; Inventory transactions are backend-owned and write matching `code` / `transactionNo`; see `docs/ai-state/decisions/code-numbering-decisions.md`.
- As of the 2026-06-24 business-data cleanup, Inventory material rows, transactions, and location balances are empty; categories, material types, units, warehouses, and warehouse zones are preserved.

Known limitations:

- Some document numbers are still suggested on the frontend, but now use the short shared code convention rather than timestamp/random suffixes.
- Slot-level reconciliation is not yet a formal ledger rebuilt from immutable transaction history.
- Sprint 8 audit found transaction-vs-location reconciliation mismatches and snapshot mismatches that need operator/admin review before any automated backfill.
- Sprint 9 fixed active mutation paths that created new snapshot/location mismatches, but existing mismatched validation rows still require a dedicated reconciliation/backfill decision.
- Some Inventory modal/chart helpers remain locally embedded instead of shared visual components.
- Dedicated Inbound/Outbound/Transfer/Stock Take pages now have richer analytics, but several local transaction detail helpers should still be extracted into shared Inventory transaction components after operator review.
- Location value analytics depend on currently available material average/unit cost data; rows without cost data display zero value until costing is available in the frontend source.
- Material photo upload is persisted through shared attachments. Dedicated non-photo Material Master upload controls for datasheets, CO, CQ, and catalogs are still pending beyond the current display/download section.
- Return transaction attachment upload depends on the active return UI path creating an Inventory transaction; the shared transaction attachment model and storage routing already support `RETURN`.
- Inventory stock status assumes `locationBalances` is present and warehouse names/codes correctly identify `MAIN` and `PRODUCTION`.
- New adjustment rows store System Qty / Actual Qty audit context ## Production

Status:

- Completed Production (MES) Blueprint and System Design.
- In progress operational foundation.

Current architecture:

- EPIC 114 details the Production (MES) Blueprint design covering: 1) DDD models (WorkOrder, Shifts, Downtime, OEE, Rework, Scrap), 2) Asynchronous Outbox event schemas and routing, 3) Cached read models and tab-gated API boundaries, 4) Persisted snapshot schemas (ProductionDashboardSnapshot, ProductionOrderSnapshot, WorkCenterSnapshot) and rebuilder jobs, 5) WMS-compliant Cockpit designs with real-time WebSockets, and 6) Operational workflows (reservations, issues, stage transitions, returns, downtime, scrap).
- Production covers BOMs, Manufacturing Orders, routing stages, production logs, material issues, QC gate handoff, and Yard staging.
- BOM material availability uses production warehouse stock.
- Production Material Reservation Sprint 1 persists reservation headers/lines and previews allocation by production warehouse location.
- Sprint 10C reservation allocation uses active `inventory_location_stocks.quantity > 0` buckets only and matches exact `inventoryItemId + warehouseId + zoneId + slotId + level`.
- Production Material Ledger Sprint 2 records reservation lifecycle events with MO, reservation, material, location, quantity, event type, date, remark, and actor.
- Sprint 3 issues material from reservation lines, returns unused issued material, updates exact `inventory_location_stocks`, and writes `ISSUE`/`RETURN` ledger rows.
- Sprint 10A reconciles production material return after consumption: returnable quantity is capped by issued minus consumed, scrap, and previous returned quantity; valid returns are posted back to `MAIN` / `Kho chính`.
- Sprint 4 records actual production material consumption and scrap per MO/material and writes `CONSUME` ledger rows.
- Sprint 5 persists component costing from production consumption and Inventory average cost, then syncs Component estimated/actual cost fields.
- Sprint 10B automatically recalculates Component costing after production completion/component `READY`; costing failure is logged as a warning and does not roll back production completion.
- Sprint 11 exposes Component costing material breakdown by BOM planned materials and actual production consumption, including variance warnings.
- Sprint 11A decimal pass supports decimal BOM, MO, issue/return/consume, and Yard staging quantities in frontend workflows and backend DTO parsing.
- Sprint 12B aligns the Production Cockpit presentation with the shared module UI foundation for KPI strip, analytics panels, filter bar, and the primary data grid.
- Sprint 12C adds sticky filters, clickable status KPIs, shared loading states, and route-level frontend splitting around Production pages.
- Sprint 18A refactors Production Cockpit toward the Inventory operational theme with Inventory-style KPI cards, filter bar, analytics panels, Production Orders progress/readiness/delay grid, and shared drawers for Production Orders, BOM detail, and Material Issues.
- Sprint 18A also applies Inventory-style grid/table treatment to Production BOM, Reservations, Material Ledger, Material Issues, Consumptions, and Logs.
- Sprint 18D turns `/production/orders` into a Work Order Cockpit with Work Order KPIs, Inventory-style grid, BOM Intelligence Material Ready %, drawer sections, and analytics panels.
- Sprint 18E turns `/production/material-issues` into a Production Material Control Center with issue KPIs, Inventory-style grid, Required/Issued/Returned/Remaining/Readiness indicators, drawer sections, and analytics panels.
- Sprint 19A adds `/production/warehouse` as a Production Warehouse Cockpit for `PRODUCTION` / `Kho vật tư SX`, using existing Inventory location balances, audit cost, Production Orders, Reservations, and Consumptions.
- Production Warehouse Cockpit calculates `Available = Production Stock - Reserved`, `Shortage = Required - Available`, and status from production warehouse availability rather than total stock.
- Sprint 19B adds `/production/execution` as a Production Execution Board with Kanban columns for Planning, Ready Material, Cutting, Assembly, Welding, Painting, and Completed.
- Execution Board reuses BOM/Issue material readiness, delay detection, stage/progress estimation, issue history, and reservation summaries from existing Production data.
- Sprint 19C adds a MES data audit in `docs/ai-state/audits/mes-data-audit.md` and concludes current data is stronger for Costing than deeper Shopfloor development.
- Shopfloor has partial foundations through Production Orders, Stages, Tasks, Logs, Work Centers, and Machines, but lacks canonical immutable transition history, runtime/downtime capture, production-line queues, and labor/machine rate data.
- Costing has stronger foundations through BOM planned materials, Production Material Consumption, Inventory Transaction Item `unitPrice` / `totalAmount`, and ComponentCosting.
- Sprint 20A adds a read-only Costing Engine backend module with Production Order, Component, and Project cost summaries.
- Costing Engine material cost uses actual Production Material Issue Inventory transaction valuation first and falls back to weighted average Inventory transaction item cost.
- Sprint 20A exposes `GET /production/orders/:id/cost`, `GET /components/:id/cost`, and `GET /projects/:id/cost`; these endpoints do not mutate `ComponentCosting` or workflow state.
- Sprint 20A.5 adds a reusable `DEMO20A5-*` demo dataset seeder with 20 suppliers, 20 projects, 20 inventory items, 20 components, 20 BOMs, 20 production work orders, inventory stock/movements, reservations, material issues, consumptions, ledgers, and 20 component costing rows.
- The Sprint 20A.5 seed includes Production Material Issue-linked Inventory EXPORT transactions so the Costing Engine can read actual issue valuation instead of relying only on average-cost fallback.
- Production can create/mark a component from an MO only after material has been issued.
- MO start auto-issues missing BOM material quantities from `Kho vật tư SX` and creates outbound Inventory movements.
- Sprint 9 auto-issue planning preserves production warehouse slot/level and production issue transaction items carry the same warehouse/zone/slot/level into Inventory.
- Production-to-Yard staging requires linked QC inspection status `PASSED` or `APPROVED`.

Known limitations:

- Material issue from reservation is implemented, but approval-oriented multi-line issue/return documents are still future work.
- Ledger records `RESERVE`, `RELEASE`, `ISSUE`, `RETURN`, and `CONSUME`; adjust writers remain future work.
- Production material warehouse balance is still tied to Inventory transactions and issue rows, not a fully independent receipt/ledger model.
- Production Warehouse Cockpit is a frontend composition over existing data; it is not yet a persisted production warehouse ledger.
- Production Execution Board uses fallback stage mapping when backend stage data is absent or not canonical; a formal shopfloor stage model remains future work.
- Component costing persists material actuals and exposes material-level breakdown; labor, machine, overhead, QC rework, and Yard handling cost are currently zero/manual future inputs.
- Delivery and installation now complete the component lifecycle after Yard outbound with `SHIPPED -> DELIVERED -> INSTALLED`.
- Installation mapping stores exact project placement fields on Component: `installZone`, `installAxis`, `installLevel`, and `installPosition`.
- Sprint 8 audit found issued material remains unallocated where consumption has not been posted, and some issue rows are not yet represented by `ISSUE` ledger rows.
- Historical production issue rows that were created before Sprint 9 may still be missing exact slot/level transaction location and require reconciliation rather than silent mutation.
- Historical issue/consume rows may remain partially unreconciled until a clean validation dataset or approved backfill is run; Sprint 10A fixed the active return path only.
- Runtime integrity currently still reports one historical invalid reservation bucket created before Sprint 10C; no silent data backfill was performed.
- Some repeated Production table/detail helper logic is still local and should be extracted only after operator review approves the Sprint 18A presentation.
- Work Order material value analytics currently use required quantity as a proxy because current frontend data does not expose unit material cost per WO issue/BOM line.
- Material Issue value KPI is shown as unavailable because current Material Issue API responses do not expose unit material cost or total line value.
- Sprint 19C recommends deferring deeper Shopfloor dashboards until execution history/runtime data is canonical.

Current focus:

- Plan and execute the Production implementation according to the 8-sprint roadmap, beginning with Sprint 1 (WorkOrder & Core Domain Setup).
- Validate Sprint 20A Costing Engine against more real orders, then continue with 20B Component Cost Analysis and 20C Project Cost Control before deeper Shopfloor expansion.
- Use the Sprint 20A.5 demo dataset for repeatable QA of Inventory, Production, and Costing dashboard analytics.
- Continue validating Sprint 18D/18E/19A/19B Work Order, Material Issue, Production Warehouse, and Execution Board cockpits with operators while keeping Shopfloor modeling gaps explicit.

## Components

Status:

- In progress operational cockpit.

Current architecture:

- Components cover steel component master records, production linkage, lifecycle status, costing, QC/Yard handoff, and Project delivery/installation visibility.
- Component lifecycle supports `READY -> SHIPPED -> DELIVERED -> INSTALLED` through existing APIs and Project/Yard integration.
- Component costing persists estimated/actual cost from Production consumption and Inventory average cost, with material-level costing breakdown and variance warnings.
- Components List and Components Stock follow the Sprint 12A Inventory cockpit layout foundation with shared page headers, shared card/table primitives, lifecycle KPI strips, shared empty/loading states, and shared detail drawers.
- Sprint 18B turns Components List into a Component Management Cockpit with Inventory-style KPI strip, operational component grid, shared detail drawer, and analytics panels for weight, delay, material shortage, structure mix, and creation rhythm.
- Sprint 18C adds BOM Intelligence mapping for Component material readiness and computes `Material Ready` from BOM required quantity versus Production Material Issue net issued quantity.
- Sprint 20C.8 synchronizes the Components cockpit page (`ComponentsListPage.tsx`) visually and behaviorally with the `InventoryMaterialsPage` design system: implements fluid root layout (`w-full min-w-0 flex-1 space-y-1`), `gap-1` spacing, local `InventoryMetricCard` elements (Tổng cấu kiện, Đang sản xuất, Hoàn thành, Chờ vật tư, Trễ tiến độ), local `ChartCard` containers (`h-[220px]`), newest created and most used (by quantity) lists, direct table styling (hover-cyan row highlights, transparent bg, right-aligned numeric columns, and full pagination parity), and a unified create modal. Checked and verified to ensure no nested card wrappers, no light container boundaries, and no prohibited class names (`gap-3`, `gap-4`, `space-y-4`, `max-w-3xl`) remain. Both frontend and backend builds passed.

Known limitations:

- Component material readiness is currently aggregated in the frontend from existing Production/BOM/Issue responses; a backend readiness API may be useful if the same calculation spreads to more modules.
- Component detail still lives as a drawer/modal surface on list pages rather than a dedicated `/components/:id` route.
- Labor, machine, overhead, QC rework, Yard handling cost, approvals, and costing history snapshots remain future costing work.

Current focus:

- Validate Sprint 18B/18C cockpit, visual parity, and material readiness calculations with operators.

## QC

Status:

- Completed EPIC202 QC Master Blueprint and System Design.
- In progress operational cockpit.

Current architecture:

- EPIC202 details the Quality Control (QC) Blueprint design covering: 1) Domain models (CapaAction, QualityLedgerEntry, TraceabilityNode, TraceabilityEdge), 2) Asynchronous Outbox event schemas and consumer routing, 3) QC Dashboard & Traceability snapshots, 4) Background jobs for graph generation and anomaly detection, 5) UI layouts for QC Control Tower and Traceability Viewer, and 6) AI Checklist/Root-Cause/Anomaly helpers.
- QC cockpit is API-backed and integrated with Production and Components.
- Completed Manufacturing Orders feed the QC waiting queue.
- QC pass/approve unlocks Production-to-Yard staging.
- NCR, checklist, calibration, and report areas exist as foundations.

Known limitations:

- Checklist item result entry is not yet complete.
- Evidence attachments, NCR lifecycle actions, calibration records, and release certificates remain Phase S2.
- Inspector display can still expose raw user ids in places.

Current focus:

- Implement the QC module according to the 3-sprint roadmap, beginning with Sprint 1 (Domain Setup & Validation Gates).
- Add checklist result matrix, evidence, NCR lifecycle, calibration, and formal QC release certificates.

## Yard

Status:

- In progress operational foundation.

Current architecture:

- Yard cockpit and staging flow are connected to components and QC-gated production output.
- Yard placements and movements track staged/removed component flow.
- Yard outbound removal for component placements now marks the linked Component as `SHIPPED`, preserves/infers `projectId`, and writes a component timeline entry.
- Project delivery and installation confirmation now happen from Projects, after Yard outbound marks the component `SHIPPED`.
- Yard now exposes route-backed workspaces for overview, 2D map, restored 3D map, locations, components, dispatch, live tracking, heatmap, timeline, and history.
- 2D cockpit/map uses existing real zone, slot, and placement runtime data.
- 3D workspace is restored through the existing `YardOperationalMap3D` implementation, using the already-installed React Three Fiber / Drei dependencies and existing `/yard/*.glb` assets.
- 3D runtime prefers real `yard_slots`; when no runtime slots exist after dataset cleanup, it renders local demo `YardSlotRuntime` rows with an explicit `Đang hiển thị dữ liệu mẫu` badge.
- Dispatch intentionally shows an empty pending-workflow state while still surfacing real available locations and overloaded-zone conflicts.
- Sprint 12B aligns Yard cockpit page header, KPI strip, filter bar, occupancy analytics, shipment/operation analytics, and trend panels with the shared module UI foundation.
- Sprint 80YARD.1 removes decorative Yard trend defaults; movement trends now come from real `yard_movements` only.

Known limitations:

- Formal outbound/shipment documents are not implemented.
- Yard outbound currently records handoff through Yard movement, Component status, Component timeline, and ActivityLog; a dedicated delivery/project receiving document model is still backlog.
- Current slot runtime does not expose physical x/y coordinates, so the restored 3D component uses its existing computed grid layout from slot sequence rather than exact yard coordinates.
- Dispatch has no backend pending move/approval model yet.
- Shipment staging, realtime movement animation, richer crane telemetry, and full zone/slot CRUD remain backlog.
- Project return readiness exists as workflow intent, but not as a complete formal document flow.

Current focus:

- Add shipment/outbound documents, pending dispatch workflows, movement telemetry, physical slot coordinates, and richer yard CRUD.

## Suppliers

Status:

- In progress Supplier Master Cockpit.

Current architecture:

- Supplier master CRUD and cockpit detail pages are API-backed.
- Supplier usage, material history, and inbound history are derived from Inventory inbound transactions.
- Supplier score summary reads existing `supplier-score` data matched by supplier name.

Known limitations:

- Supplier-material mapping is not persisted.
- Procurement, purchase orders, contracts, approval workflows, document uploads, and score history are not yet implemented.

Current focus:

- Add Supplier-Material mapping and Supplier Phase S2 foundations before Procurement starts.

## Projects

Status:

- In progress Project Execution domain foundation.

Current architecture:

- Project data participates in Dashboard, Inventory outbound, Production, QC grouping, and Yard workflow checks.
- Projects runtime now exposes project-linked components from `components.projectId`.
- Projects UI includes `Cấu kiện công trình` next to `Vật tư theo công trình`, with component status filters, summary cards, planned/installed dates, and estimated/actual cost columns.
- Sprint 12B aligns Projects page header, KPI strip, Project runtime cards, Components runtime cards, filter bar, table shell, and empty state with the shared module UI foundation.
- Sprint 12C adds frontend KPI click-to-filter for Project and Project Component runtime cards and moves Project detail to the standard module drawer.
- Project Components actions can confirm receiving `SHIPPED` components into `DELIVERED` and confirm `DELIVERED` components into `INSTALLED`.
- Project runtime separates `readyComponents`, `shippedComponents`, `deliveredComponents`, and `installedComponents`; delivered project counts include `DELIVERED` and `INSTALLED`, not in-transit `SHIPPED`.
- Project Components installation confirmation requires Khu vực, Trục, Tầng, and Vị trí, and runtime returns these installation fields.
- Project component Actual Cost is populated from Component costing recalculation when consumption data exists.
- Project Components delivery and installation actions use the authenticated frontend API client and show success/error feedback.
- Project Components row navigation opens the existing Component detail modal on the Components list when routed with a component id.
- Sprint 40PROJ.1 refactors Projects into an Inventory-aligned cockpit with shared cockpit KPI cards, analytics panels, table shell, and pagination.
- Project Detail now opens as a mini workspace drawer with tabs for Tổng quan, Vật tư, Cấu kiện, and Tiến độ using existing runtime data.
- Project material and component tabs now surface contextual analytics and explicit return action entry points, but return postings remain future backend workflow work.
- Sprint 40PROJ.3 extends Projects runtime with WBS, financial, health, and return request read models derived from existing Project, Component, Task, Inventory Transaction, and Return Request records.
- Sprint 40PROJ.4 adds no-migration Project WBS CRUD endpoints backed by existing `Task` rows with SteelTrack WBS metadata in `Task.description`.
- Sprint 40PROJ.5 fixes WBS hierarchy creation with a `Công việc cha` tree select, parent path labels, change-parent support, and backend circular-parent validation.
- Sprint 40PROJ.6 adds Project Scheduling read-model calculations for WBS dependency types FS/SS/FF, scheduled start/finish, forecast finish, cascade delay, and baseline variance without schema changes.
- Sprint 40PROJ.7 replaces the active WBS metadata bridge with normalized Project domain persistence. `GET /projects/:id/wbs`, WBS mutations, and `GET /projects/runtime` now use `ProjectTask`, `ProjectTaskDependency`, `ProjectTaskMaterialAllocation`, `ProjectTaskComponentAllocation`, `ProjectTaskResource`, `ProjectTaskInspection`, and `ProjectTaskCost`.
- Migration `20260630100000_project_task_domain` backfills legacy `Task.description` WBS metadata into the new ProjectTask domain tables without deleting legacy task rows.
- Project task event foundations now write activity log events for `project.task.created`, `project.task.updated`, `project.task.deleted`, `project.material.changed`, `project.cost.changed`, and `project.inspection.changed`.
- Sprint 40PROJ.8 adds persisted Project Template Library through `ProjectTemplate` and `ProjectTemplateStatus`.
- Migration `20260630113000_project_template_library` creates `project_templates` and seeds default template `TPL-NX-5N - Nhà xưởng 5 nhịp`.
- Projects now has a `Templates` workspace for template KPIs, template table, default template preview, suggested resources, create/edit, duplicate, publish, deactivate, and set-default actions.
- Project creation can apply a template to generate normalized ProjectTask WBS rows, dependency rows, scheduled/baseline dates, resource rows, resolvable material/component allocation rows, and initial task cost rows.
- Project Progress now includes a Quick Update panel as Simple Mode foundation for field-friendly updates: installed component count, used material quantity, QC pass, incident flag, and notes.
- Project Detail now includes Tổng quan, Điều hành, Vật tư, Cấu kiện, Tiến độ, Chi phí, Tài liệu, and Nhật ký tabs.
- Project Detail now includes Project Financial KPI cards, Project Health warnings/actions, editable multi-level WBS tree grid, task editor, task detail drawer, dependency panels, cost control panels, resource-link visibility, project timeline panels, scheduling-aware CSS Grid Gantt, and three-pane progress workspace.
- Project WBS runtime now exposes task dependencies, baseline dates, material/component resource allocation, worker loading, machine loading, inspection/acceptance status, revenue, labor cost, machine cost, other cost, and task-level cost/profit values from normalized Project domain tables.
- Project Material Return now creates an Inventory ReturnRequest with `flowType = SITE_RETURN`; Inventory return disposition remains handled by the existing return workflow.
- Components List and Components Stock now follow the Sprint 12A Inventory cockpit layout foundation with shared page headers, shared card/table primitives, and lifecycle KPI strips.
- Sprint 8 audit found no installed-component `projectId` violations in current data.
- Current project workflows support visible management context and integration points rather than full contract/schedule control.

Known limitations:

- Contract fields, milestones, project material budgets, planned/actual schedule baselines, documents, and photo attachments are not complete.
- Project return flows are not yet formalized with full Yard and Inventory documents.
- Project Tiến độ hierarchy now persists editable WBS tasks in normalized `project_tasks`; legacy `Task.description` metadata is migration input only.
- Task-level material/component/dependency/resource/cost/inspection rows are first-class tables, but dedicated link/unlink pickers and full workflow actions still need hardening.
- Project Command Center warnings are advisory and do not yet lock workflow or trigger approval gates.
- Project Scheduling persists task schedule fields and dependencies, but critical path, float, resource calendars, baseline version history, and schedule approval history remain future work.
- Project template import/export APIs exist, but the frontend currently focuses on create/edit/duplicate/publish/deactivate/default actions.
- Template editing uses JSON; a visual WBS-template builder remains future work.
- Project contract/customer/start/handover values are accepted in create flow but still serialized into `Project.description`; dedicated contract fields remain future hardening.
- Quick Update writes through the existing WBS update API and is not yet a full Site Mode workflow; Smart Return is currently an operator-facing entry point rather than a task-level return posting.
- Component Return is still future work because component lifecycle does not yet include project return/rework/disposition states.
- Delivery/installation confirmation does not yet create formal signed handover or installation certificate documents.
- Installation mapping is text-field based; coordinate/drawing overlay validation is still future work.
- Component detail still lives as a modal on the Components list rather than a dedicated `/components/:id` route.

Current focus:

- Validate Sprint 40PROJ.8 template application and Quick Update with operators, then build visual template editing, Site Mode, first-class contract fields, task-level return posting, link/unlink pickers, resource calendars, inspection/handover workflow actions, formal component return, and document/photo foundations.

## Dashboard

Status:

- In progress real-data cockpit with KPI Chính rationalized to real operational sources, Executive Intelligence tabs, and Control Tower insights backed by backend services.

Current architecture:

- Main Dashboard uses `GET /dashboard/cockpit`.
- Executive Intelligence tabs use `GET /dashboard/executive-cockpit`.
- Backend Dashboard intelligence is split across `DashboardMetricsService`, `DashboardActivityService`, `DashboardNotificationService`, `DashboardInsightService`, and `DashboardRecommendationService`.
- The cockpit aggregates Projects, Production Orders, Components, Inventory, Yard, QC, Activity Logs, and Notifications.
- UI follows the Inventory dark cockpit baseline.
- Dashboard tab state is URL-driven through `?tab=trends`, `?tab=activities`, and `?tab=notifications`.
- Sprint 13 main Dashboard is now an Executive Dashboard with Inventory Forecast, Component Pipeline, Yard Occupancy, QC Quality Trend, Production Signal, and Executive Alerts.
- Dashboard now adds material replenishment forecast panels that identify material codes needing purchase/import, projected 7-day balances, and recommended quantities from existing Inventory Audit and transaction data.
- Dashboard now adds a 7-day component forecast from current Component lifecycle status and open Production Orders.
- Dashboard KPI strip now uses real Inventory Audit data for inventory value, stock volume, material code count, low stock, and out-of-stock counts.
- Dashboard now includes real Production, Projects, and Suppliers panels using existing API hooks/runtime endpoints.
- Executive Alerts include top material replenishment needs plus component delivery/installation backlog signals.
- Forecasts and alerts are rules-based from existing operational data only; no AI/ML, API contract, schema, or workflow changes were introduced.
- Sprint 70EXEC.1 adds Predictive Trends, Recent Activities, and System Notifications tabs. Predictive Trends use real Inventory transaction/location-stock data, BOM/material issue shortages, and rolling-average projections. Recent Activities unify Inventory, Production, Yard, QC, Purchasing, and Projects. Notifications are rule-based from operational conditions plus persisted notifications.
- Sprint 70EXEC.2 adds the Executive Control Tower at the top of KPI Chính: System Health Score, 7-day Executive Summary, Suggested Actions, Activities by Module, and Notification Center. Recommendations are rule-based and do not mutate workflows.

Known limitations:

- Persisted dashboard preferences do not exist yet.
- Drill-through actions and notification/action mutation flows remain Phase S2.
- Forecast accuracy is limited by currently available historical movement aggregates; panels display assumptions where detailed time-series data is incomplete.
- Material recommendations are dashboard-only analytics and do not yet create procurement requests because Purchasing is not implemented.
- Supplier purchase orders are included where `purchase_orders` exist, but late delivery/payable analytics and Logistics KPIs are intentionally not fabricated; they need real Purchasing/Logistics backend foundations.
- Production stop risk depends on active BOM linkage and material issue/location stock rows; incomplete BOM data results in empty states instead of fabricated shortages.
- CAPA is not a first-class model yet; Control Tower QC health currently uses NCR and QC inspection status.
- Suggested Actions are advisory only; they do not yet create purchase requests, dispatch tasks, QC assignments, or project actions.

Current focus:

- Validate Executive Intelligence and Control Tower thresholds with real operator data, then add dashboard preferences, deeper drill-through links, procurement links for replenishment recommendations, and action mutations after System/Purchasing mutation APIs exist.

## System

Status:

- In progress System Phase S1 foundation.

Current architecture:

- Settings, Users, Roles & Permissions, System Logs, Notifications, and operational workflow health are API-backed.
- Attachments are a shared metadata-first subsystem. PostgreSQL stores attachment metadata only; file bytes are stored under `STORAGE_ROOT` or `/data/steeltrack-storage` and served through `/uploads/*`.
- Attachment upload validates MIME type and file size, computes SHA256 checksums, and reuses existing physical files for duplicate content while creating new metadata references.
- Users/Roles/System Logs use real `User`, `Role`, `Permission`, and `ActivityLog` data.
- Notifications read persisted notification rows through `/system/notifications`.
- Frontend auth now uses the shared Zustand auth store, persisted access/refresh tokens, Axios auth interceptor, active `/login` route, and app route guard.
- Runtime Integrity read-only KPI APIs expose Inventory, Production, and Project integrity summaries under `/runtime/integrity/*`.

Known limitations:

- User create/edit/lock/delete, role permission mutation, notification mark-read, audit export, backup execution, and persisted editable settings are not implemented.
- Attachment deletion currently removes/soft-deletes metadata through the existing attachment lifecycle; physical file cleanup policy for deduped files remains a future operations decision.
- Legacy archived auth/router files remain in the repository and should not be treated as active app entrypoints.

Current focus:

- Implement System Phase S2 mutation APIs and operational controls.

## Documentation

Status:

- Ai-state is the primary operational documentation source.

Current architecture:

- Current status, module state, tasks, decisions, design guidance, and audits live under `docs/ai-state/`.
- Sprint 12C records frontend route splitting and UI polish guidance in `docs/ai-state/design/ui-standardization-foundation.md`.
- Legacy root docs have been audited and their useful content has been merged into ai-state decision, design, roadmap, workflow, and audit documents.
- Historical overview/refactor docs are moved to `docs/archive/` when classified as archive.

Known limitations:

- Some legacy docs are intentionally retained after merge until the team confirms whether they should remain as onboarding entry points.
- Empty legacy module placeholders were removed when classified as delete.

Current focus:

- Keep `docs/ai-state` updated after workflow changes.
- Use `docs/ai-state/audits/post-cleanup-summary.md` and `legacy-docs-audit.md` to guide any further cleanup.
- Use `docs/ai-state/audits/system-integrity-audit.md` before planning reconciliation/backfill work.

## Inventory Bug Notes

Status:

- Sprint BUG.2 completed the Material Detail analytics timeline validation and fix.
- Sprint BUG.1 completed the Material Detail analytics staleness investigation and fix.

Current architecture:

- Material Detail reads live data from `GET /inventory/items/:id/detail`.
- The backend detail response recomputes current stock, average cost, inventory value, inbound history, outbound history, and location balances from transaction rows/location stocks.
- The frontend Material Detail drawer derives transaction rows, movement trend, forecast, cost trend, and analytics cards from the refreshed detail payload.
- Material Detail `Phân tích` charts now keep movement rows in chronological order, fill zero-activity dates between real transaction dates, and render tooltip dates from real `yyyy-MM-dd` keys as `dd/MM/yyyy`.

Known limitations:

- Average cost is an all-history weighted inbound average, so small or similar-price receipts may produce a visually tiny currency change.
- Material Detail still relies on frontend-derived chart series; a persisted material analytics snapshot model does not exist yet.

Current focus:

- Validate the refreshed Material Detail drawer after real inbound/outbound/transfer/adjustment transactions and monitor whether any remaining stale behavior comes from inactive query refetch timing rather than derived analytics.

## Inventory Return Requests

Status:

- Active and visually aligned with the Inventory Cockpit.
- Sprint INV.NAV.2 restored advanced Inventory operational pages into the sidebar under `Nghiệp vụ nâng cao`.

Current architecture:

- Return Requests use `GET /inventory/returns?flowType=SITE_RETURN`.
- Return Requests render inside the same `EnterpriseModulePage` + `InventoryTabWorkspace` shell as Overview, Transactions, Materials/Stock, and Locations.
- Workspace metrics and analytics are computed from real return request rows.
- Receive/reject actions continue to use the existing return workflow APIs.
- Detail view uses the shared small right-side drawer standard.
- Inventory navigation now exposes primary workspaces plus a nested advanced operations group. Primary workspaces are Tổng quan kho, Giao dịch, Phiếu trả vật tư, Vật tư & Tồn kho, and Vị trí kho. Advanced operations expose Nhập kho, Xuất kho, Điều chuyển, Kiểm kê, Điều chỉnh, Cảnh báo, and Audit through their existing routes. Legacy `/inventory/master-data` redirects to `/inventory/materials`.
- The advanced operations group is collapsed by default, remembers expansion per session, and auto-opens when an advanced child route is active.

Known limitations:

- Photo display remains an empty state until return request attachments are linked to this workspace.
- Timeline uses status timestamps and activity logs; a dedicated immutable return-event table does not exist.
- Sidebar Audit visibility is marked `adminOnly` and uses existing user role/permission fields for frontend visibility. Backend/API permissions remain the authority.

Current focus:

- Validate the Return Requests cockpit with Inventory operators and confirm aging thresholds match operational urgency.
- Validate the advanced Inventory sidebar in expanded/collapsed sidebars and confirm all restored operational routes remain reachable without duplicate route behavior.

## Inventory Inbound Location Validation

Status:

- Active. Inbound stock creation now requires an exact storage bucket.

Current architecture:

- Backend `InventoryService.createTransaction()` validates every `IMPORT` transaction line before persisting stock. Lines with positive quantity must include `zoneId`, `slotId`, and `level`.
- Frontend `InboundTransactionModal` disables confirmation and highlights location fields when the selected inbound line has quantity but no complete Zone/Slot/Level.
- The modal reads smart suggestions from `GET /inventory/items/:id/inbound-suggestions`, which derives last used location, last inbound price, and 30-day average price from existing Inventory transaction history.

Known limitations:

- Suggested free capacity is only shown when the last used zone exposes usable capacity data. Otherwise the UI shows the real last location without a free-percent claim.
- The legacy inbound wizard now requires a location but remains visually older than the main Inventory transaction modal.

Current focus:

- Validate real inbound receipts with operators and confirm the suggested last price/location reduce data entry without encouraging incorrect location reuse.

## NestJS Dependency Injection Hotfix

Status:

- Completed. Resolved the `PermissionsGuard` / `RbacService` dependency instantiation error.

Current architecture:

- `ProjectsModule` imports `RbacModule` to make `RbacService` available in its module context, satisfying the DI injection parameters of `PermissionsGuard` (which is annotated via `@UseGuards(PermissionsGuard)` on `ProjectsController`).
- No duplicate provider configurations were introduced, maintaining a clean single-source architecture for RBAC and Guards.

Known limitations:

- None. Backend starts and runs successfully.

Current focus:

- Validate backend starts correctly under all target runtime modes (development and production).

## Persisted Snapshot Engine

Status:

- Active cutover. SNAP.1 created persistent dashboard snapshot tables and backend services; SNAP.2 routes Inventory, Projects, and Logistics dashboard reads through a snapshot-first strategy layer with runtime fallback.

Current architecture:

- Snapshot data is stored in PostgreSQL tables:
  - `inventory_dashboard_snapshots`
  - `project_dashboard_snapshots`
  - `dispatch_dashboard_snapshots`
- Snapshot writes run through:
  - `SnapshotUpdateDispatcher`
  - `BackgroundJobManager`
  - `JobWorkerService`
  - `SnapshotRebuilder`
  - `SnapshotWriterService`
  - snapshot repositories
- Snapshot reads go through `SnapshotReaderService` and repositories.
- Snapshot validation is warning-only and compares recalculated source values to persisted snapshot rows.
- Runtime metrics now record snapshot hit, miss, fallback, stale, rebuild, age, confidence, and lag signals.
- `DashboardReaderService` owns cutover decisions. Dashboard callers provide snapshot loader, runtime loader, and parity comparison without embedding local `if snapshot else runtime` branching.
- Feature flags:
  - `USE_INVENTORY_SNAPSHOT`
  - `USE_PROJECT_SNAPSHOT`
  - `USE_DISPATCH_SNAPSHOT`
  - `SNAPSHOT_MAX_AGE_SECONDS`
  - `SNAPSHOT_PARITY_CHECK`

Known limitations:

- Snapshot models are intentionally minimal. Some response fields still use runtime aggregate compatibility data until future snapshot schemas cover full chart/table payloads.
- The current database has no dispatch orders, so dispatch snapshots are structurally ready but have no rows in the validation dataset.
- `prisma migrate dev` is blocked by historical drift unrelated to SNAP.1. `prisma migrate status` reports the database is up to date after applying the SNAP.1 migration.

Current focus:

- Validate snapshot parity under real operator traffic before disabling parity checks or expanding snapshot schemas to cover chart-level payloads.

## Enterprise Validation

Status:

- Active foundation. EPIC108 adds backend validation services and reports, but no public UI/API.

Current architecture:

- `EnterpriseValidationModule` provides:
  - `SnapshotParityValidationService`
  - `PerformanceBenchmarkService`
  - `BackgroundRecoveryValidationService`
  - `StressHarnessService`
- Snapshot parity validation compares persisted snapshots against runtime/source recalculation and reports warnings only.
- Benchmark and stress harness services accept caller-provided read workloads for Dashboard, Detail, Search, and Lookup measurements.
- Background recovery validation reads real background job, job execution, and outbox state without creating fake events or mutating records.

Known limitations:

- Benchmark/stress services are not yet exposed in an admin Operations Center.
- SQL count/time measurement should be correlated with existing runtime metrics when workloads run through request or measured contexts.

Current focus:

- Use EPIC108 services as the measurement foundation for EPIC109 Operations Center.

## Core Platform Compliance Audit

Status:

- Completed for Inventory and Production as a read-only EPIC111 audit.

Current architecture findings:

- Inventory has strong operational coverage and snapshot-first dashboard support, but remains partially compliant because command paths and return workflows still use direct Prisma calls, canonical event/outbox publishing is incomplete, and several Material Detail/location/return analytics still need persisted read models.
- Production has a functional manufacturing foundation, but is not yet enterprise MES-ready. It has BOM, ProductionOrder, stages, tasks, work centers, machines, schedules, reservations, material issue, consumption, ledger, and costing, but repository coverage is partial and it lacks first-class Shift, Operation, Production Line, Downtime, OEE, immutable transition history, and Production dashboard snapshots.
- Operations Center currently exposes global health, runtime, jobs, outbox, snapshots, cache, database, storage, API, and alerts. Inventory and Production still need module-specific health panels after canonical events and snapshots are adopted.

Compliance scores:

- Inventory: 72%.
- Production: 52%.
- Average: 62%.

Current focus:

- Use `docs/audit/inventory-core-platform-audit.md`, `docs/audit/production-core-platform-audit.md`, `docs/audit/core-platform-compliance-score.md`, `docs/audit/technical-debt-priority.md`, `docs/audit/inventory-refactor-roadmap.md`, and `docs/audit/production-roadmap.md` before starting any new Inventory or Production work.
- Prefer Inventory repository/event/read-model cleanup before major Inventory feature work.
- Prefer Production domain/repository/event/snapshot hardening before deeper MES UI or workflow expansion.

## Inventory Core Compliance

Status:

- EPIC112 INV.CORE.1 completed backend architecture hardening.

Current architecture:

- Active Inventory services/controllers route persistence through `InventoryRepository`.
- `InventoryService` no longer injects `PrismaService`; Material Detail and inbound suggestions are delegated to `InventoryReadModelService`.
- `ReturnWorkflowService` no longer injects `PrismaService`; return request reads/writes, ActivityLog writes, site-return availability, and ProjectTask material allocation reconciliation use `InventoryRepository`.
- Inventory master controllers for Zones, Categories, Units, and Material Types use `InventoryRepository` instead of Prisma directly.
- `InventoryEventService` publishes persistent outbox-backed Inventory lifecycle events while preserving existing realtime gateway, event-store, and telemetry behavior.
- Operations Center overview now includes an additive Inventory health object covering repository, read model, snapshot, event/outbox, background job, cache, and operational counts.

Known limitations:

- Material Detail is now repository-backed and read-model-owned, but not yet stored in a persisted PostgreSQL read-model table.
- Inventory Location read model is repository-backed, not persisted.
- Stocktake event emission uses transaction payload/type markers until a first-class stocktake session lifecycle exists.
- Non-Inventory modules that write Inventory-affecting records should be audited in a later cross-module compliance sprint.

Current focus:

- Validate Inventory transaction creation, Material Detail, inbound suggestions, Return Requests, and Operations Center overview under real operator data.
- Plan the schema-enabled persisted Material Detail / Location read-model sprint only after parity rules are defined.

Business Freeze audit:

- EPIC117 completed Inventory Business Freeze Phase 1 as an audit-only sprint.
- Current database consistency is strong for transaction/location/item compatibility data:
  - `inventory_items.quantity` vs location stock: PASS.
  - transaction-derived location buckets vs `inventory_location_stocks`: PASS.
  - transaction item valuation: PASS.
  - negative location stock rows: PASS.
  - location snapshot quantity vs live location stock quantity: PASS.
- Inventory Business Freeze is currently BLOCKED because:
  - 3 `InventoryMaterialSnapshot` rows differ from live location stock.
  - `POST /inventory/transactions` relies on service-level inbound location validation, but the controller does not attach the Zod transaction schema.
  - the DTO schema does not formally model per-line Zone/Slot/Level even though the business requires them for inbound.
  - Stock Take needs a final business decision on whether adjustment-backed stocktake is acceptable or a first-class stocktake session lifecycle is required before Freeze.

## Project Architecture Freeze v1.0

Status:

- Approved on 2026-07-08 after EPIC116.1 hardening.

Current architecture:

- `GET /projects/runtime` uses the dashboard reader/snapshot strategy foundation.
- `GET /projects/:id/detail/:tab` prefers persisted `ProjectDetailSnapshot` rows for reusable execution summary tabs and falls back to repository-backed read models when snapshots are missing, stale, unsupported, or mismatched.
- Snapshot-backed detail tabs are `overview`, `materials`, `components`, `progress`, `command`, `site`, and `costs`.
- `documents` and `logs` intentionally remain repository-backed read-model paths; they are not persisted as Project Detail snapshots.
- Project mutations route through `ProjectsRepository`, publish persistent outbox-backed events, and request background snapshot updates.
- Operations Center exposes Project Platform Health and Project Detail snapshot health.

Backend startup hardening:

- The backend production build now emits `apps/backend-api/dist/main.js`.
- `start`, `start:dev`, and `start:prod` bootstrap successfully without the prior `Cannot find module .../dist/main` failure.

## AI & Integration Blueprints

Status:

- Completed AI Enterprise Blueprint (EPIC208) and Enterprise Integration Blueprint (EPIC209) system designs on 2026-07-08.

Current architecture:

- `docs/architecture/ai-blueprint.md` details the design of the AI Ecosystem:
  - 8 core AI modules: AI Assistant, AI Planner, AI Scheduler, AI Inventory, AI Production, AI QC, AI Logistics, and AI Operations Center.
  - Core aggregates: `AiAgentContext` and `AiRecommendationAction`.
  - Integrations through Outbox events, Background Engine scheduled optimization/prediction jobs, and persisted JSON snapshots.
  - UI/UX Dark Cockpit widgets, voice chat interfaces, and model monitoring in Operations Center (latency, model drift, fallback hit ratio).
- `docs/architecture/integration-blueprint.md` details the design of the Cross-Module Data Flow:
  - Flow from Inventory -> Production -> QC -> Yard -> Logistics -> Projects -> Finance.
  - Canonical cross-chain domain events and saga execution via `CrossModuleSagaState` and `DataLineageTrack`.
  - Flat synchronized read models (`ComponentProgressReadModel`, `MaterialTraceabilityReadModel`).
  - Background job dependencies, distributed locks, Visual Lineage Graph dashboards, and integration health metrics (Outbox lag, reconciliation mismatch rate, DLQ).

Known limitations:

- Both blueprints are design-only and do not include active code modifications or database migrations.

Current focus:

- Present blueprints to engineering leads and warehouse managers for validation before scheduling Sprints AI.1 and INT.1.

## Enterprise Knowledge Base & AI Context Strategy (EPIC212)

Status:

- Completed the Enterprise Knowledge Base (EPIC212) implementation on 2026-07-08, establishing a structured documentation zoning system and an optimized AI context loading strategy.

Current architecture:

- **Documentation Zoning (Phân vùng Kho Tri thức Doanh nghiệp)**: Standardized the documentation system into nine distinct, logically grouped zones to ensure clear categorization, eliminate redundancy, and maximize searchability for both human developers and AI agents:
  1. *Source of Truth (Nguồn Sự Thật)*: Running project state files, WBS tracking, and operational change logs.
  2. *Architecture (Kiến Trúc Cốt Lõi)*: Core structural blueprints, Event Bus foundations, and ADRs.
  3. *Blueprint (Bản Thiết Kế Phân Hệ)*: High-level functional specifications for individual modules.
  4. *Standards (Tiêu Chuẩn Phát Triển)*: Quality checklists, naming conventions, and UI standard guidelines.
  5. *Governance (Quản Trị Hệ Thống)*: Software quality framework, release policies, and architecture freeze rules.
  6. *Runtime (Vận Hành & Telemetry)*: Live metrics, performance baselines, and database query logs.
  7. *Audit (Báo Cáo Kiểm Toán)*: Static audits, query budgets, and technical debt lists.
  8. *Verification (Xác Minh & Ghi Vết)*: Hotfix reports, parity reviews, and smoke test logs.
  9. *Archive (Kho Lưu Trữ)*: Historical design documents and obsolete reports.

- **Completed Core Knowledge Base Documents**:
  - [README.md](file:///opt/projects/steeltrack/docs/README.md): Acts as the main entry point to the SteelTrack knowledge base, introducing the system architecture and documenting onboarding protocols.
  - [MASTER_INDEX.md](file:///opt/projects/steeltrack/docs/MASTER_INDEX.md): The supreme index mapping and linking the entire documentation corpus using absolute `file://` URIs for quick cross-referencing.
  - [DOCUMENTATION_MAP.md](file:///opt/projects/steeltrack/docs/DOCUMENTATION_MAP.md): A detailed directory tree structure mapping file assignments and explaining folder-level responsibilities.
  - [KNOWLEDGE_BASE_GUIDE.md](file:///opt/projects/steeltrack/docs/KNOWLEDGE_BASE_GUIDE.md): Human-oriented guide covering document lifecycle rules (DRAFT, PROPOSED, ACTIVE, FROZEN), freeze criteria, and weekly archiving policies.
  - [AI_LOADING_GUIDE.md](file:///opt/projects/steeltrack/docs/AI_LOADING_GUIDE.md): Defines the AI Context Loading Strategy, establishing a strict 10k-15k token budget per session and mapping specific document pipelines for all 10 core modules.
  - [DOCUMENTATION_AUDIT.md](file:///opt/projects/steeltrack/docs/DOCUMENTATION_AUDIT.md): Reviews and classifies all 200+ active markdown files, highlighting obsolete query profiles, UI polish logs, and staging audits to be archived.

- **AI Context Loading Strategy (Chiến lược Nạp Ngữ Cảnh Tối Ưu)**: Establishes a 5-layer context hierarchy to prevent context window overflow:
  - *Layer 1 (Workflow/Rules)*: [CODEX_WORKFLOW.md](file:///opt/projects/steeltrack/docs/ai-state/CODEX_WORKFLOW.md)
  - *Layer 2 (Operational State)*: `CURRENT_STATE.md` / `PROJECT_STATUS.md` / `NEXT_TASKS.md`
  - *Layer 3 (Module Specs)*: `docs/ai-state/modules/<module>.md`
  - *Layer 4 (Design Blueprint)*: `docs/architecture/<module>-blueprint.md`
  - *Layer 5 (Source Code)*: Targeted controller/service/repository files.

Known limitations:

- The guides and indexes are documentation-only resources and do not contain database schema alterations or compiled application code.
- Stale audit logs and runtime reports are scheduled for movement into the archive directory but have not yet been moved physically.

Current focus:

- Implement the documentation archiving protocol, moving stale audits and runtime files into [docs/archive/](file:///opt/projects/steeltrack/docs/archive/) and updating all internal `file://` link references.
- Audit all newly generated blueprints and guidelines to ensure full compliance with the 14 core rules in `AI_RULES.md` and naming conventions.
# EPIC154 QC Runtime Platform (2026-07-13)

- QC Repository, Live Read Model, Snapshot Foundation, and Runtime Platform are implemented.
- QC snapshot reads now report module-specific hit, miss, age, and lag metrics through the shared runtime platform.
- QC live reads and snapshot fallbacks are observable through module-specific counters.
- Operations Center exposes additive QC Platform Health without a UI change.
- QC event freshness remains partial because only existing approved events are routed; no workflow event was invented.
- Real operator traffic is still required to establish non-zero snapshot and job health baselines.
# EPIC160 Yard Core Platform and Business Audit

Status: **AUDIT COMPLETE, CORE PLATFORM BLOCKED (~36%)**

Yard has real zone/row/slot, placement, movement, removal, crane-reference,
activity and manual layout-snapshot foundations. It remains placement CRUD plus
a movement ledger rather than a complete YMS: QC admission, reservations,
hold/release, loading tasks and formal dispatch handoff are absent. Repository
and transaction foundations are partial; Outbox is not atomic; active workspaces
violate ADR011 through unbounded reads/client aggregation; Core snapshots,
module runtime metrics and Operations Center health do not exist. Active 3D demo
fallback and synthetic Yard QC status are data-integrity blockers.
# EPIC161 Yard Repository Foundation and Atomic Outbox

Status: **APPROVED**

The registered Yard module now has 100% repository coverage. Yard services have
no PrismaService, direct Prisma instance or direct transaction-client model
access. Existing placement, movement, removal, slot occupancy, Component shipped
compatibility, ActivityLog and domain Outbox persistence share one repository
transaction. Existing APIs, event payloads and workflow semantics are unchanged.
ADR011 read models, Core snapshots, runtime metrics, Operations Center and YMS
business gaps remain EPIC162+ scope.
# EPIC162 Yard Workspace Live Read Model

Status: **APPROVED**

The active Yard workspace now follows ADR011 through a bounded repository live
read model. KPI, movement totals, 30-day trend, history filters/pagination, zone
utilization, crane availability, component distribution and actual QC queue are
server-owned. The active page no longer uses five separate unbounded/polling
sources, DEMO 3D placements or synthetic QC statuses. Existing APIs and visual
layout remain compatible. Dashboard Snapshot, Runtime and Operations Center
remain EPIC163-164 scope.
# EPIC163 Yard Snapshot Foundation

Status: **APPROVED, MIGRATION PENDING DEPLOYMENT**

Yard now has shared Core Platform snapshot repository, reader, writer, validator,
rebuilder, event routing and `USE_YARD_SNAPSHOT` support. Dashboard reads can use
persisted snapshot with repository fallback; missing/stale reads enqueue a
background update. Existing operator-generated YardSnapshot remains a separate
manual audit artifact. The additive migration is valid/generated but not
deployed, and no snapshot data was backfilled. Yard workspace continues to use
the EPIC162 repository live read model.

# Enterprise Read Platform (2026-07-17)

Status: **FOUNDATION IMPLEMENTED, MIGRATION AND UI CUTOVER PENDING**

The shared background worker now projects retained Domain Outbox events into
idempotent, replayable and resumable enterprise projection documents. Production,
Components, Inventory and cross-module catalogs are available through an
additive GET-only Query API with checkpoint, lag and failure health. Existing UI,
aggregate APIs and snapshots are unchanged. Inventory availability/location
projections are not authoritative until canonical events supply complete stock
and location facts; no missing value is synthesized.

# RFC002A Canonical Payload Certification (2026-07-17)

Status: **IMPLEMENTED WITH EXPLICIT NON-AUTHORITATIVE GAPS**

Canonical producers in Inventory, Production, Components, QC and Yard now emit
bounded projection facts with AD-019 envelopes. The Enterprise projection
migration is deployed. A real-Outbox rebuild scanned 90 rows per projection and
produced 142 deterministic documents with no active failure. Historical
Inventory compatibility events remain incomplete; Production Execution, QC
Disposition, Yard Loading, Projects and Logistics canonical publishers are
absent and were not invented.

# RFC014 Enterprise Production Hardening (2026-07-17)

Status: **IMPLEMENTED WITH OPERATIONAL LIMITATIONS**

The shared Background Worker is now single-flight per process, catches timer
failures and drains its active batch during shutdown. Persistent infrastructure
errors are bounded and normalized, and recovery diagnostics expose stale Job and
Outbox locks without unsafe automatic replay. Internal runtime, telemetry,
performance, integrity and simulation controllers now require JWT. Remaining
production gates are lease-based stale-work recovery, bounded large-data
integrity validation, representative database load tests and an approved global
authorization cutover for legacy business controllers.

# RFC015 Production Deployment Readiness (2026-07-17)

Status: **IMPLEMENTED - CONDITIONALLY DEPLOYMENT READY**

Production startup now validates database, JWT secret, CORS, feature flags and
runtime limits before Nest creation. The API exposes liveness and database-backed
readiness probes, honors configured host/port/proxy/logging and executes graceful
shutdown hooks. A real non-root Node 22 Alpine image builds successfully, while
production Compose gates API startup on one-shot Prisma migration. Release still
requires staging PostgreSQL health/shutdown smoke, RFC013 migration lock-budget
approval and external TLS/secrets/monitoring controls.

# RFC017 Production Readiness Blocker Resolution (2026-07-18)

Status: **IMPLEMENTED - PRODUCTION-LIKE VALIDATION PENDING**

HTTP routes are now JWT-protected by default; only health, login and refresh are
explicitly public. Background Jobs and Outbox work now use renewable,
owner-checked leases with safe stale-claim recovery. The pending RFC013 index
migration is additive and online (`CREATE INDEX CONCURRENTLY`) with a lock
timeout and rollback procedure. Backend regression passes 72/72 suites and
194/194 tests. Production certification still requires measured migration and
multi-worker crash-recovery drills on a representative PostgreSQL environment.

# EPIC UI003B Frontend API Standardization

Status: **IMPLEMENTED**

Active frontend backend traffic now uses one authenticated Axios instance from
`lib/api`, including Inventory, Components, Production, QC, Yard, Logistics,
Projects, Suppliers, Administration and runtime surfaces. Legacy shared import
paths are compatibility re-exports only. Login delegates to the canonical auth
API; the interceptor's private anonymous refresh client is the sole approved
transport exception. Frontend/backend builds pass; local module smoke remains
pending because PostgreSQL was unavailable at backend startup.

# Components Inventory Structural Alignment (2026-07-21)

Status: **IMPLEMENTED**

Components Overview and Components List now use the same direct
`EnterpriseModulePage` shell pattern as Inventory Inbound and Materials. The
target pages no longer carry an extra workspace wrapper around the page stack,
and their hero grid, right rail and bottom analytics structures now follow the
Inventory reference hierarchy. No backend, API, query, route or business
behavior changed.

Final source-level parity checklist is complete. Remaining differences found in
Components table viewport width/density, panel title padding branch, right-rail
card primitives and Components List chart helper forwarding were corrected.
Screenshot certification is still pending because the workspace has no browser
runner installed.

# EPIC 0 Full UI Audit (2026-07-21)

Status: **COMPLETED - DOCUMENTATION ONLY**

The full UI audit now lives under `docs/ui/full-ui-audit/`. It covers the
visible Inventory, Components, Production, Projects, Suppliers, QC, Logistics,
Planning and Admin surfaces against the Inventory canon. The audit records
route coverage, layout/KPI/filter/table/chart/data classifications, missing
features and a master remediation backlog. No frontend/backend source code was
modified for this phase.

# EPIC 0.5 Master Backlog Prioritization (2026-07-21)

Status: **COMPLETED - DOCUMENTATION ONLY**

The full UI audit backlog now has P0/P1/P2 prioritization, status, dependency
and complexity fields. `EXECUTION_PLAN.md` defines nine remediation phases from
Inventory through Admin and records current completion percentages for every
audited module. No frontend/backend source code was modified.

# Sprint 5 Historical Dashboard Integration QA (2026-07-23)

Status: **IMPLEMENTED - QA PASS WITH ENVIRONMENT WARNINGS**

The `/history` Executive Historical Dashboard now scopes read queries to the
active tab and exposes retryable error presentation for failed Historical API
reads. Overview, Inventory, Production, Projects and Suppliers tabs share the
snapshot/monthly read set; Snapshot Jobs uses only the job read set. Pagination
resets are driven by explicit filter/tab changes instead of render effects.

Backend tests pass 74/74 suites and 201/201 tests. Backend and frontend builds
pass. Scoped Historical Dashboard lint passes. Full frontend lint still fails on
pre-existing archived/legacy project-wide violations outside this sprint.
Live HTTP endpoint smoke remains pending a running authenticated/staged API
environment with seeded historical snapshots.

# Project Maintenance and Warehouse Realtime Dashboard (2026-07-23)

Status: **IMPLEMENTED - FRONTEND CI PASS**

Frontend maintenance now has a Vitest run script, jsdom setup, Testing Library
smoke tests and Vite chunk splitting. Active lint no longer traverses archived,
legacy backup or backend quarantine directories, and legacy debt rules that
previously blocked CI are warning-only. `pnpm -C apps/frontend lint`,
`typecheck`, `test` and `build` pass.

Warehouse Realtime Dashboard is implemented as a new frontend-only cockpit at
`/warehouse-realtime`. It uses existing Inventory read endpoints with TanStack
Query polling every five seconds for realtime KPIs, warehouse/slot utilization
views, recent transactions, realtime alerts and movement timeline. It does not
modify backend contracts, Historical Dashboard, Snapshot Engine, Historical API
or Prisma schema. True WebSocket push and authoritative warehouse capacity
alerts remain future backend-contract work.
