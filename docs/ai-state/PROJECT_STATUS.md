# Project Status

On 2026-08-03 completed **SYSTEM.INTEGRITY.2 – SteelTrack V1 Runtime
Certification & Canonical Freeze Audit** as an audit-only sprint. No production
source, schema, migration, staging or commit action was performed. Runtime DB
evidence confirms canonical project/requirement/instance/finished-goods
foundation data exists, but current runtime data has 0 active Yard placements,
0 DispatchItems and 0 installed ComponentInstances, so the full physical chain
cannot be certified without a disposable `SYSTEM-INTEGRITY2-*` fixture.
Freeze readiness is estimated at 72%. Remaining P0s are legacy RBAC endpoint
closure, dashboard/read-model cleanup away from `Component.status` / `STOCK`,
Projects downstream dispatch read-model correction, and full end-to-end runtime
fixture certification. Created
`docs/audits/system-integrity2-v1-runtime-certification.md`.

On 2026-08-03 completed **LOGISTICS.3 – Canonical Physical Dispatch &
Delivery**. Logistics component dispatch now operates on physical
`ComponentInstance` rows staged in Yard, not engineering `Component`
definitions. `POST /logistics/dispatch-orders/suggest` reads active Yard
placements for `IN_YARD` instances; `POST /logistics/dispatch-orders` requires
`componentInstanceId`; duplicate active dispatch detection is by
`componentInstanceId`; departure, receive and completion update
`ComponentInstance` state/timestamps. The legacy `Component.status =
DELIVERED` mutation was removed from Logistics receive. Logistics UI now shows
physical instance/Yard placement data and removes fake logistics dashboard
charts. Created
`docs/audits/logistics3-canonical-componentinstance-dispatch.md`.

On 2026-08-03 completed **QC.3 – Canonical QC Module Convergence**.
Standalone QC now renders the same `CanonicalPhysicalQcWorkspace` as
Components/QC and no longer actively calculates KPI/chart/table data from
`runtime.inspections` or `runtime.metrics`. The source of truth across QC UI is
now `GET /components/foundation/instances?qcScope=true`, backed by physical
`ComponentInstance` rows with FINAL inspection, checklist, NCR and timeline
lineage. Created `docs/audits/qc3-canonical-module-convergence.md`.

On 2026-08-03 completed **COMPONENTS.QC.2 – Canonical Physical QC Workspace**.
The Components internal QC tab now operates on physical `ComponentInstance`
rows instead of legacy `Component.status` inference. Extended
`GET /components/foundation/instances` with `qcScope=true`, server-side QC
summary counts and lineage includes for FINAL inspections, checklist
items/results, NCRs and timeline. The UI now exposes a compact physical QC
table plus `ModuleDetailDrawer` tabs for Overview, Inspection, Checklist, NCR,
Disposition and History. No schema, migration, Logistics, Yard or legacy
Component status restoration was introduced. Created
`docs/audits/components-qc2-canonical-physical-workspace.md`.

On 2026-08-02 completed **LOGISTICS.2A – Physical Logistics Schema
Foundation**. Added permanent physical logistics state vocabulary to
`ComponentInstanceState`: `IN_YARD`, `IN_TRANSIT`, and `DELIVERED`. Added
nullable `DispatchItem.componentInstanceId` with an optional relation to
`ComponentInstance` and a non-unique index, while preserving
`DispatchItem.componentId` for legacy history. Migration
`20260730100000_physical_logistics_schema_foundation` was reviewed as additive,
backed up, deployed locally, and did not backfill or fabricate data. Runtime
evidence after deploy: 0 DispatchItems and 0 Yard placements, with existing
ComponentInstances left in their original states. Created
`docs/audits/logistics2a-physical-logistics-schema-foundation-report.md`.

On 2026-07-30 completed **PATCH UI.PRODUCTION.COCKPIT.1A – Restore Production Orders as Primary Workspace & Pagination**. Restored "Lệnh sản xuất" table and Search/Filter toolbar to the top of `ProductionCockpitPage.tsx` directly below Page Header & KPI strip. Restored `<InventoryPagination>` below the main table (server pagination), audited project name rendering, and moved analytical charts to support section below table. Both frontend and backend builds compile with 0 errors.

On 2026-07-30 completed **SPRINT UI.PRODUCTION.COCKPIT.1 – Production Overview Layout Density & Work Order Table Redesign**. Reorganized `ProductionCockpitPage.tsx` overview layout into a 4-level information hierarchy (Top 6 KPI Cards, Row 1 8-col Stage Workload & 4-col Status Distribution, Row 2 6-col Material Readiness & 6-col Attention POs, Row 3 12-col Production Activity Logs, Row 4 12-col High-Density "Lệnh sản xuất" Operational Table + 96vw Level 2 Workspace Modal). Both frontend and backend builds compile with 0 errors.

On 2026-07-30 completed **Production Cockpit Overview – Production Orders Table Title Update**. Renamed table header title in `ProductionCockpitPage.tsx` from `Top {N} lệnh sản xuất` to **`Lệnh sản xuất`** in the "Tổng quan sản xuất" overview tab. Both frontend and backend builds compile with 0 errors.

On 2026-07-30 completed **SPRINT UI.COMPONENTS.FG.1 – Finished Goods Warehouse Enterprise UI Redesign**. Redesigned Finished Goods Warehouse (`ComponentsStockPage.tsx`) with a 3-level information architecture (Level 1 8-column compact operational table, Level 2 `w-[96vw] max-w-[1720px] h-[88vh]` workspace modal, Level 3 `64vw` right-sliding Instance Detail Workspace with 5 tabs), 4 KPI cards, and strict physical `ComponentInstance` finished-goods semantics. Both frontend and backend builds compile with 0 errors.

On 2026-07-30 completed **SPRINT UI.COMPONENTS.DEFINITIONS.2 – Component Detail Sliding Workspace**. Redesigned Component Detail into a right-sliding detail workspace (`w-[64vw] max-w-[1280px] min-w-[820px] 100vh`) with backdrop dim/blur, compact identity header, 6-card KPI strip, 6 horizontal tabs (`Tổng quan`, `BOM`, `Nhu cầu`, `Sản xuất`, `Instances`, `Lịch sử`), and full canonical data integration. Both frontend and backend builds compile with 0 errors.

On 2026-07-30 completed **PATCH UI.COMPONENTS.DEFINITIONS.1C – Fix Actual "Chi tiết" Component Inspector Size**. Resolved root cause of large detail modal in `ModuleDetailDrawer` (removed prepended `w-screen`, added `maxHeightClass` support) and centered Level 3 Component Detail inspector in `ComponentsListPage.tsx` to `600px` max width (`w-[min(600px,calc(100vw-32px))]`) and `72vh` max height with compact inner layout. Frontend build compiles with 0 errors.

On 2026-07-30 completed **PATCH UI.COMPONENTS.DEFINITIONS.1B – Expanded Workspace & Compact Component Detail**. Expanded Level 2 "Xem tất cả" modal to a near-full workspace (`w-[96vw] max-w-[1720px] h-[88vh]`) with 12-column width redistribution. Compacted Level 3 Component detail drawer to `w-[min(660px,calc(100vw-40px))]` and `max-h-[76vh]`, replacing 4 KPI cards with a 3-column metric strip and dense 6-item info grid. Frontend build compiles with 0 errors.

On 2026-07-30 completed **PATCH UI.COMPONENTS.DEFINITIONS.1A – Expanded Actions & Compact Detail Popup**. Updated `ComponentsListPage.tsx` with real API delete action (`useDeleteComponent`), Delete Confirmation Dialog, compact Trash icon in Level 2 "Xem tất cả" workspace table, and compact Component Detail Drawer width (`780px`) with a single body scroll owner. Both frontend and backend builds compile with 0 errors.

On 2026-07-30 completed **SPRINT UI.COMPONENTS.DEFINITIONS.1 – Component Definition List Density & Detail Redesign**. Redesigned `ComponentsListPage.tsx` with a 3-level information architecture (Level 1 8-column operational table, Level 2 12-column modal view via "Xem tất cả", Level 3 Engineering detail drawer), single-line cell truncation, compact font-medium typography, right-aligned tabular nums, and strict engineering domain semantics. Both frontend and backend builds compile with 0 errors.

On 2026-07-30 completed **SPRINT UI.COMPONENTS.MATERIALS.1 – Production Material Warehouse Table Redesign**. Redesigned `ComponentsMaterialStockPage.tsx` table with a 2-level information architecture (Level 1 9-column operational table, Level 2 13-column modal view via "Xem tất cả"), single-line cell truncation, compact font-medium typography, right-aligned tabular nums, and responsive layout. Both frontend and backend builds compile with 0 errors.

On 2026-07-30 completed the audit/gate phase of **LOGISTICS.2 – Canonical
ComponentInstance Dispatch & Delivery**. Static audit found Logistics still
uses legacy component-definition dispatch identity: `DispatchItem.componentId`,
project-task component allocations, shipment domain line keys and frontend
create payloads all point at `Component`, not physical `ComponentInstance`.
Delivery receive still updates legacy `Component.status = DELIVERED`.
Implementation was intentionally stopped because `ComponentInstanceState` lacks
the required physical logistics states (`IN_YARD`, `IN_TRANSIT`,
`DELIVERED`), and the sprint forbids substituting `Component.status` or
inventing ambiguous state. Created
`docs/audits/logistics2-component-instance-dispatch-delivery-report.md`.

On 2026-07-29 completed **STABILITY.PROJECTS.3A – Canonical Yard Runtime
Certification & Legacy Handoff Closure** as a conditional certification. The
legacy ProductionOrder staging route now returns `410 Gone` and
`ProductionService.stageToYard()` also rejects internal legacy callers.
Production UI stages physical `ComponentInstance` rows through `/yard/stage`
instead of aggregate ProductionOrder quantity. Generic Yard placement rejects
new `COMPONENT` placement without `componentInstanceId`. Yard read models and
component snapshots now prefer canonical ComponentInstance lineage while keeping
legacy fallback for historical rows. Runtime read-only smoke on `PORT=3100`
passed health, admin login, no-token `401`, finished goods read, Yard slots,
Yard workspace and Projects execution. Current DB contains 2 `QC_PASSED`
ComponentInstances and 0 active Yard placements; committed `/yard/stage` write
was not executed because the safety reviewer blocked mutating real runtime
data. Created
`docs/audits/stability-projects3a-yard-runtime-certification.md`.

On 2026-07-29 completed **PROJECTS.3 – Canonical ComponentInstance -> Yard
Handoff**. Yard placement and movement history now supports canonical physical
`ComponentInstance` identity through nullable `componentInstanceId` relations.
Migration `20260729193000_component_instance_yard_handoff` was deployed locally
and adds FK indexes plus a PostgreSQL partial unique active-placement guard so
a physical instance can have many historical Yard rows but only one active
placement. Added `POST /yard/stage`, which stages only eligible Finished Goods
instances using the same eligibility service as
`GET /components/instances/finished-goods`; it writes `itemId =
ComponentInstance.id`, preserves movement identity, logs ActivityLog/outbox
events and does not mutate legacy `Component.status`. Projects execution read
model now reports Yard staged quantity and active placement identity without
changing production completion or Finished Goods percentages. Yard endpoints now
enforce existing SYSTEM.2 `yard.read/write` permissions. Local DB had 0
canonical placements and 0 legacy Component placements, so no backfill was
performed. Created
`docs/audits/projects3-component-instance-yard-handoff-report.md`.

On 2026-07-29 completed **PROJECTS.2 – Canonical Project Execution Read
Model**. Added `GET /projects/:id/execution` to expose a requirement-first
execution read model sourced from `ProjectComponentRequirement`,
`ProductionOrder` and `ComponentInstance`. The model reports required,
ordered/planned, physical instance, in-production, completed, QC pass/fail and
Finished Goods quantities without using legacy `Component.status`, remarks,
frontend reconstruction or capped transaction reads. Finished Goods counts are
delegated to Components eligibility semantics instead of duplicated in
Projects. Projects UI now shows a minimal `Canonical Execution` panel inside
the Project detail drawer. Yard and Dispatch remain explicitly non-canonical at
ComponentInstance level and are queued as follow-up work. Created
`docs/audits/projects2-canonical-execution-read-model-report.md`.

On 2026-07-29 completed **UI.SYSTEM.MASTERDATA.2A – Master Data Taxonomy + KPI
Strip + Density**. The conceptual defect around `Vật tư chính` was corrected:
`MaterialType` remains technical grouping, while `Loại vật tư` is now a real
canonical dictionary through new additive `MasterMaterialUsageType` and
nullable `InventoryItem.materialUsageTypeId`. Legacy `MaterialUsageType` enum
is preserved for compatibility. Settings Master Data now exposes five
workspaces and Material Master create/edit/filter uses
`/master-data/material-usage-types` instead of hardcoded frontend options. KPI
strips now use cockpit KPI cards sourced from real API records, the modal
header is compact, and the right rail no longer repeats top KPI values.
Migration was deployed locally and backfilled 72/72 active inventory items.
Created
`docs/audits/ui-system-masterdata2a-taxonomy-kpi-density-report.md`.

On 2026-07-29 completed **UI.SYSTEM.MASTERDATA.2 – Enterprise Master Data
Workspace Redesign** as a UI-only refinement. Settings master-data
administration now uses a wider enterprise workspace with dominant table area,
stable editor rail, compact icon actions, real summary metrics and clearer
UOM conversion semantics. Material Master presentation now communicates the
full `InventoryItem` master record surface, while `materialUsageType` remains
the canonical source for `Chính`, `Phụ`, and `Tiêu hao`. Fixed the Material
Master table column mismatch by rendering status before updated date. No
backend, schema, migration, API or business logic change was introduced.
Created
`docs/audits/ui-system-masterdata2-enterprise-workspace-redesign.md`.

On 2026-07-29 completed **STABILITY.SYSTEM.1A – Master Data Interactive CRUD
Workspaces**. Fixed the Settings defect where master-data capability rows on
Overview opened only metadata/count details. The four master-data capabilities
now open the large interactive CRUD workspace: Material Categories, Material
Master, Material Types and UOM. The UI reuses canonical entities and APIs only:
`InventoryCategory`, `InventoryItem`, `MaterialType`, `MasterUnit`,
`/master-data/material-categories`, `/inventory/items`,
`/master-data/material-types`, and `/master-data/uom`. `Vật tư chính/phụ/tiêu
hao` remains `InventoryItem.materialUsageType`, not a new dictionary. Runtime
HTTP fixture `STABILITY-SYSTEM1A` certified create/edit/deactivate for all four
workspaces and verified edited category/type/unit rows appear in Material
Master lookup sources after refetch. Added a UI interaction test proving the
Overview capability click opens the CRUD modal and calls the canonical create
API. Full Chromium browser automation remains a P1 because no browser/Playwright
CLI is installed in this environment. Created
`docs/audits/stability-system1a-masterdata-interactive-crud-report.md`.

On 2026-07-29 completed **STABILITY.SYSTEM.1 – User Creation Fix & Master Data
CRUD Workspace**. Fixed the System Users create flow by mirroring the backend
`/system/users` validation contract in the frontend and replacing raw Axios 400
copy with useful Vietnamese validation/API messages. Runtime evidence proved
the original 400 came from `password` shorter than 8 characters. Settings
Master Data CRUD was hardened for Material Categories, Material Master,
Material Types and UOM using existing authenticated APIs. Material Master
creation remains stock-neutral. Backup was hidden from current UI/navigation
without deleting source/backend placeholders. Runtime HTTP smoke certified user
create/list/detail/login/role-change/disable/re-enable, master-data 401/403,
admin CRUD and inventory material listing. Created
`docs/audits/stability-system1-user-masterdata-crud-report.md`.

On 2026-07-29 completed **SYSTEM.MASTERDATA.1 – Canonical Material Master Data
Administration**. Settings now provides operational administration for the four
approved material master-data areas: Material Categories, Material Master,
Technical Groups and UOM/Conversions. The implementation reuses existing
canonical models (`InventoryCategory`, `InventoryItem`, `MaterialType`,
`MasterUnit`) and real authenticated APIs; no parallel master-data tables or
mock records were introduced. `/master-data/*` dictionaries are now protected by
`master-data.read/write`, Material Master `unitId` binds to `MasterUnit`, and
`/inventory/items` exposes real BOM usage counts. Runtime fixture
`SYSTEM-MD1-1785309482405` certified category/type/UOM/material creation,
material visibility through Inventory, zero stock creation, zero
ComponentInstance creation and zero ProductionOrder creation. Technical
profile/specification detail remains a documented schema gate. Created
`docs/audits/system-masterdata1-canonical-material-administration-report.md`.
Verification passed: Prisma validate, migrate status, targeted tests, full
backend tests, frontend tests, backend build, frontend build and authenticated
HTTP smoke.

On 2026-07-29 completed **SYSTEM.ADMIN.V1 – Operational Administration &
Settings**. Users, Roles/Profile, Permission Matrix, Settings Catalog, UOM
integration, System Information, System Overview and Activity Log now operate
from real backend data. Added Role Administration APIs (`/system/roles`,
`/system/permissions`, `/system/roles/:id/permissions`) and made
`/system/role-matrix` service-backed from the canonical permission catalog.
Users and Roles pages now perform persisted mutations through the authenticated
API client. Settings catalog entries are interactive and explicitly classified
as real editable, real read-only, environment read-only, or not implemented.
Existing UOM data is reused from `/master-data/uom`, now guarded by SYSTEM.2
RBAC. Backup remains a controlled empty state. Created
`docs/audits/system-admin-v1-operational-ui-report.md`. Verification passed:
Prisma validate, migrate status, targeted tests, full backend tests, frontend
tests, backend build, frontend build, authenticated HTTP smoke, Vite preview
route smoke, and `git diff --check`.

On 2026-07-29 completed **SYSTEM.3 – Canonical User Administration**. System
Users now has backend write capability: create user, read detail, update
profile fields, replace roles, enable/disable accounts and reset passwords.
All write endpoints require `rbac.write`; reads require `rbac.read`. The
implementation reuses the existing canonical `User`, `Role`, `Permission`,
`UserRole`, `RolePermission`, `RefreshToken` and `ActivityLog` models. Disabled
users are now blocked at login, refresh, `/auth/me` and JWT validation for old
access tokens. Runtime fixture `SYSTEM3-1785305716894` certified 401, 403,
authorized admin operations, role persistence, disable/enable, password reset,
ActivityLog writes and no password/hash leakage. Created
`docs/audits/system3-user-administration-report.md`.

On 2026-07-29 completed **SYSTEM.2 – Canonical RBAC Enforcement**. Backend
authorization is now enforced across Inventory, Components, Production, QC,
Projects, Suppliers, Logistics and System Administration using
`JwtAuthGuard + PermissionsGuard + @RequirePermissions(...)`. Added idempotent
RBAC catalog bootstrap, added `logistics.read/write`, made `RbacModule` global
for runtime guard injection, and certified 401/403/admin access on a
working-tree runtime server. Created
`docs/audits/system2-rbac-enforcement-report.md`.

On 2026-07-29 completed **STABILITY.OPS3A2 – BOM Production Stock Picker &
Component Production Warehouse Fix**. The active operational BOM modal now
filters selectable material options to actual `PRODUCTION` warehouse balances
from `/inventory/items.locationBalances`, preventing MAIN-only Material Master
rows from being treated as production-available stock. MAIN/Kho vật tư quantity
is retained only as secondary reference. Runtime API evidence confirmed
MAIN-only rows exist, PRODUCTION rows exist, and fixture
`OPS3A1-RT-20260729030324` reconciles MAIN 60, PRODUCTION 40, reserved 20 and
available 20. Created
`docs/audits/stability-ops3a2-bom-production-stock-picker-fix.md`.

On 2026-07-29 completed **SPRINT SYSTEM.1 – System Administration Operational Audit**. Audited Users, Roles & Permissions, System Audit Log, Settings, and Backup. Created audit report `docs/audits/system-administration-operational-audit.md`. Identified P0 security finding (lack of `PermissionsGuard` on core controllers) and missing User/Role mutation APIs and Backup engine.

On 2026-07-29 completed **UI.OPS.3C – Real Operational Dataset & Dashboard
Certification**. Retained fixture `OPS3C-20260729032211` proves the canonical
runtime workflow through real APIs: Material Master, MAIN receipt, transfer to
PRODUCTION, Component Definition + Project Requirement, Engineering BOM/release,
Production Orders, reservation/issue, physical instance execution, QC PASS,
QC FAIL + NCR, and Finished Goods. `GET /components/instances/finished-goods`
is certified as the canonical finished-goods UI/dashboard source and returned
only the QC-passed physical instance. Yard handoff remains a P1 gate because the
available path is still order-level rather than clean ComponentInstance
placement. Created
`docs/audits/ui-ops3c-real-operational-dataset-dashboard-certification.md`.

On 2026-07-29 completed **SPRINT EXECUTIVE BI.8 – Redesign Inventory Analytics Charts**. Redesigned the 5 core Inventory Executive BI cards (`WarehouseCapacityCard`, `AbcAnalysisCard`, `InventoryAgingCard`, `TransactionTrendCard`, and `TopInventoryRankingCard`) in `DashboardPage.tsx` & `AnalyticsPrimitives.tsx`. Both frontend and backend builds compile with 0 errors.

On 2026-07-29 completed **STABILITY.OPS3A1.1 – Runtime Production Warehouse
Certification**. Used the healthy already-running backend on
`http://127.0.0.1:3000`, where `/health/live` and `/health/ready` passed and
readiness reported database `up`. Created controlled fixture
`OPS3A1-RT-20260729030324` entirely through authenticated HTTP APIs:
Material Master, MAIN receipt, MAIN -> PRODUCTION transfer, Production BOM,
Production Order release and Production Reservation. Runtime evidence proved
MAIN 60, PRODUCTION 40 and total 100 after transfer; `/inventory/items` exposed
both location balances; Components Production Warehouse and BOM availability
both read PRODUCTION 40 / available 40 before reservation; reservation moved
active reserved 0 -> 20 while onHand(PRODUCTION) stayed 40 and Production
readiness available moved 40 -> 20. Existing PRODUCTION stock audit found 9
materials, 11 location balances and total 4216.9, exactly matching the
`/inventory/items` API exposure. Created
`docs/audits/stability-ops3a1-runtime-production-warehouse-certification.md`.
Browser smoke was not tested. No source code, schema, migration, stage or
commit was performed.

On 2026-07-29 implemented **STEELTRACK UI.OPS.3A.1 – Production Warehouse
Source-of-Truth Fix**. The root cause was `/inventory/items` omitting
canonical `InventoryLocationStock` location balances while Components
`Kho vật tư sản xuất` and the Production BOM picker expected
`locationBalances` filtered to warehouse `PRODUCTION`. The API now returns
warehouse/zone/slot/level balances, Production BOM material selection displays
Production stock/reserved/available and Main Warehouse informational stock
separately, and Production material readiness now uses
`onHand(PRODUCTION) - activeReservations` instead of deriving stock from
historical transaction remarks or subtracting issued material twice. Created
`docs/audits/ui-ops3a1-production-warehouse-source-of-truth-report.md`.
Prisma validate, Prisma migrate status, targeted tests, full backend tests,
frontend tests, backend build, frontend build and `git diff --check` passed.
Runtime HTTP smoke remains blocked by PostgreSQL connectivity at
`localhost:5432`; no direct Prisma mutation, stage or commit was performed.

On 2026-07-28 implemented **STEELTRACK UI.OPS.3B – Operational Forms
Convergence** as a frontend-first forms sprint. Added shared operational form
primitives for primary form, assistant rail, summary and explicit suggestions.
Both Components create entry points now use one canonical
`ComponentDefinitionRequirementForm` with real Component/Project suggestions
and no hardcoded type/profile options. Production BOM authoring now presents
readonly Material Master identity, Production stock/reservation/availability
context, location evidence and explicit stock-backed suggestions without
changing BOM material-flow semantics. Production Order creation now defaults to
remaining ProjectComponentRequirement demand and blocks quantities above the
remaining requirement. Final QC physical-instance detail now exposes FINAL
checklist readiness and disables PASS/FAIL when no authoritative checklist is
available. Created
`docs/audits/ui-ops3b-operational-forms-convergence-report.md`. Frontend tests
and frontend build passed; backend was not changed.

On 2026-07-28 implemented **STEELTRACK UI.OPS.1 – Components / Production /
QC Operational UI Convergence** as a frontend-only UI/data-semantics pass.
Components material-stock is now labeled **Kho vật tư sản xuất** and uses
Inventory material `locationBalances` filtered to warehouse `PRODUCTION` for
current production stock instead of frontend transaction remark aggregation.
Components create modals no longer hardcode Beam/Column/Plate values; type and
profile suggestions come from existing component data. Production Order create
copy now aligns to the requirement-first workflow. QC touched surfaces removed
obvious demo data; NCR reads `runtime.ncrs`, while CAPA/audit/reports show
controlled empty states where no authoritative backend read-model exists.
Created `docs/audits/ui-ops1-components-production-qc-convergence-report.md`.
Frontend tests and frontend build passed. Backend was not changed.

On 2026-07-28 completed **COMPONENT DOMAIN.5G – End-to-End Operational
Certification** as a certification/stability sprint. The canonical
Components -> Production -> QC -> Finished Goods chain is conditionally
certified **YELLOW**: service-level tests, Prisma validation, migration status,
backend tests, frontend tests and builds pass, and no P0 physical identity /
Finished Goods eligibility / duplicate instance generation issue was found.
Authenticated HTTP and browser smoke could not be completed because the Nest
runtime failed during startup with `PrismaClientInitializationError: Can't
reach database server at localhost:5432`. Created
`docs/audits/component-domain5g-end-to-end-certification.md`. No source code,
schema, migration, stage or commit was performed for DOMAIN.5G.

On 2026-07-28 implemented **COMPONENT DOMAIN.5F.4 – Canonical QC Physical
Instance UI**. The `/qc/final` workspace now operates on physical
`ComponentInstance` identity from
`GET /components/foundation/instances?state=PRODUCED_WAITING_QC`, so each final
QC row is one manufactured component, not a Component definition or aggregate
ProductionOrder quantity. The final QC detail modal exposes ComponentInstance
code, Component definition, Project, ProjectComponentRequirement,
ProductionOrder, production completion date and operation evidence. Final PASS
and FAIL now call canonical QC command endpoints backed by `QcCommandService`;
PASS transitions the exact instance to `QC_PASSED`, while FAIL transitions it
to `QC_FAILED` and can create an NCR preserving `componentInstanceId`. Command
routes for rework, scrap and use-as-is dispositions were exposed for the next
NCR detail UI slice. Prisma validate, targeted QC tests, full backend tests,
frontend tests, backend build, frontend build and `git diff --check` passed.
No schema, migration, stage or commit was performed.

On 2026-07-28 implemented **COMPONENT DOMAIN.5F.3 – Production
Requirement-First & Instance Execution UI**. Production Order creation now
starts from canonical `ProjectComponentRequirement` demand instead of arbitrary
Component + legacy Production BOM selection. The create modal displays Project,
requirement, Engineering basis readiness, required quantity, allocated
Production Order quantity and remaining quantity, then calls
`POST /production/commands/orders`. The Production Order drawer now exposes
physical `ComponentInstance` rows from
`GET /components/foundation/instances?productionOrderId=...`, including
localized physical states, operation/execution evidence and QC handoff
readiness. Canonical release is available through
`POST /production/commands/orders/:id/release` using materialized BOM routing,
and the legacy manual `Tạo cấu kiện từ MO` action was removed from the main
drawer semantics. Prisma validate, backend targeted tests, frontend tests,
backend build, frontend build and `git diff --check` passed. No schema,
migration, stage or commit was performed.

On 2026-07-28 implemented **COMPONENT DOMAIN.5F.2 – Canonical Component
Definition UI**. Components `/components/list` now represents engineering
**Hồ sơ cấu kiện**, backed by read-model fields for Component lifecycle,
current revision, BOM state and ProjectComponentRequirement demand. Replaced
physical-status KPIs and filters with engineering/planning semantics; the table
now shows mã hồ sơ, công trình/yêu cầu, loại, profile, revision, BOM, số lượng
yêu cầu and trạng thái kỹ thuật. The detail drawer now presents
ProjectComponentRequirement rows with required, allocated Production Order and
remaining quantities. Legacy `Component.status=STOCK/READY` no longer drives
main definition status, and `description.quantity` is no longer canonical row
quantity. Components read-model repository test, targeted backend tests, full
backend tests, frontend tests, backend build, frontend build and
`git diff --check` passed. No schema, migration, stage or commit was performed.

On 2026-07-28 implemented **COMPONENT DOMAIN.5F.1 – Canonical Finished Goods
UI**. Converted Components `/components/stock` from legacy "Tồn kho cấu kiện"
semantics to canonical "Cấu kiện thành phẩm" backed by
`GET /components/instances/finished-goods`. The page now displays physical
`ComponentInstance` rows with Component definition, Project, Production Order,
production completion date, final QC / approved NCR evidence, physical state
and non-fabricated location. Page KPIs now come from an additive backend
summary computed by the same Finished Goods eligibility predicate. Removed
page-level use of `Component.status`, `READY`, `STOCK`, `COUNT(Component)`,
completed ProductionOrder quantity, Yard slot scans, Production BOM costs and
Inventory audit rows for physical Finished Goods presentation. Backend targeted
tests, full backend tests, frontend tests, backend build, frontend build and
`git diff --check` passed. No schema, migration, stage or commit was performed.

On 2026-07-28 completed **COMPONENT DOMAIN.5F – Canonical Components /
Production / QC UI Integration Audit**. Audited the current frontend against the
canonical DOMAIN.2 -> DOMAIN.5E backend model. Confirmed Components create is
mostly canonical, while Components list/dashboard/stock still mix engineering
definitions and physical inventory; Production still renders aggregate
ProductionOrder/stage progress instead of generated `ComponentInstance` and
`ComponentInstanceExecution` evidence; QC still targets ProductionOrder/legacy
Component in the waiting queue and quick approval path instead of exact
`componentInstanceId`. Identified the required migration path for Components
Finished Goods UI to `GET /components/instances/finished-goods`, Production
instance execution UI, and QC instance-level final inspection/disposition UI.
Created
`docs/audits/component-domain5f-canonical-ui-integration-audit.md`. No source
code, schema, migration, stage or commit was performed.

On 2026-07-28 implemented **COMPONENT DOMAIN.5D – ComponentInstanceExecution
Schema Foundation**. Added additive
`ComponentInstanceExecutionStatus` and `ComponentInstanceExecution` schema with
relations to `ComponentInstance`, `WorkOrder` and `ProductionExecution`, plus
unique `(componentInstanceId, productionExecutionId)` and focused status
indexes. Deployed migration
`20260728103000_component_domain5d_instance_execution_foundation` after backup
`/tmp/steeltrack-domain5d-before-20260728.dump`; no legacy backfill or
fabricated execution history was performed. Added repository/service/API
foundation for assigning instances to a run, marking evidence RUNNING,
COMPLETED or CANCELLED, and reading physical execution history. Runtime smoke
used DOMAIN4 PO-A with a temporary run, created 3 evidence rows, completed
instances 001/002, left 003 assigned, verified 004/005 untouched, verified zero
Inventory/QC/Yard/ComponentInstance side effects, then cleaned up the temporary
run/evidence. Prisma checks, targeted tests, full backend tests, backend build,
frontend build and migration status passed. No stage or commit was performed.

On 2026-07-28 completed **COMPONENT DOMAIN.5C – Production Instance Execution
Granularity Audit & Design**. Audited ProductionOrder, WorkOrder,
ProductionExecution, ProductionCompletion, routing/stage models and material
flow boundaries. Confirmed current Production can persist aggregate
order/work-order/execution/completed-quantity evidence, but cannot persist
which physical ComponentInstances started or completed each operation. Required
partial-production truth (`001-005=CUTTING`, `006-010=WELDING`,
`015-017=PRODUCED_WAITING_QC`, `018-020=PLANNED`) is currently not
representable. Recommended future additive `ComponentInstanceExecution` as the
permanent bridge while keeping `ProductionExecution` as batch/run header.
Created
`docs/audits/component-domain5c-production-instance-execution-design.md`.
No schema, migration, backend code, frontend code, stage or commit was
performed.

On 2026-07-28 implemented **COMPONENT DOMAIN.5B – ComponentInstance
IN_PRODUCTION State Gate**. Deployed additive migration
`20260728090000_component_domain5b_instance_in_production_state` after verified
backup `/tmp/steeltrack-domain5b-before-20260728.dump`, adding
`ComponentInstanceState.IN_PRODUCTION` without backfill or data rewrite.
Pre/post `ComponentInstance` counts remained 16 and all existing rows remained
`PLANNED`. DOMAIN.5 production/QC/Fini­shed Goods transitions were intentionally
not implemented because current Production start/completion evidence is
order/work-order/completed-quantity level and does not identify affected
physical `ComponentInstance` rows. Next required gate is Production instance
execution granularity, not another enum/schema approval. No stage or commit was
performed.

On 2026-07-27 implemented **COMPONENT DOMAIN.5A – QC Physical Instance Lineage
Foundation**. Added nullable physical lineage fields and indexes for
`QcInspection.componentInstanceId`,
`NonConformanceReport.componentInstanceId` and
`QcInspectionSnapshot.componentInstanceId`, plus Prisma relations to
`ComponentInstance`. Deployed additive migration
`20260727224000_component_domain5a_qc_instance_lineage` after verified backup
`/tmp/steeltrack-domain5a-before-20260727.dump`; pre/post row counts were
unchanged. QC services now accept and validate physical instance lineage,
derive component/project/production context from the instance when omitted,
preserve NCR identity, and include `componentInstanceId` in canonical QC,
NCR/disposition and snapshot payloads. Runtime smoke created one inspection
and one NCR for DOMAIN4 instance `cms31uquo001epvk716nvtrja` with no
ComponentInstance, InventoryTransaction, Yard placement or Finished Goods side
effects. Prisma checks, targeted QC/snapshot tests, full backend tests, backend
build and frontend build passed.

On 2026-07-27 audited **COMPONENT DOMAIN.5 – Production Completion, QC &
Finished Goods Gate** and stopped at the approved schema gate. Current
`QcInspection`/`NonConformanceReport` can reference Production Orders, stages,
legacy Components and Projects, but cannot reference physical
`ComponentInstance` rows. Because Finished Goods eligibility requires
authoritative QC decisions against physical instances, implementation would be
unsafe without an additive nullable `componentInstanceId` relation. Created
`docs/audits/component-domain5-qc-finished-goods-report.md` with the minimal
schema proposal and did not modify schema, backend code, frontend code, stage or
commit.

On 2026-07-27 implemented **COMPONENT DOMAIN.4 – Production Integration &
Physical Instance Creation**. The canonical Production command API now accepts
`componentRequirementId`, validates ProjectComponentRequirement allocation
against released Engineering basis and materialized Production BOM lineage, and
preserves requirement/revision/BOM lineage on DRAFT Production Orders. Releasing
a requirement-bound Production Order now creates one `ComponentInstance` per
integer production quantity in `PLANNED` state with server-side stable physical
codes and Component/Revision/BOM/Requirement/ProductionOrder/Project lineage.
Release replay and optimistic concurrency prevent duplicate instance creation.
Runtime fixture `DOMAIN4-1785146027125` proved 8 + 7 planned instances against a
quantity-20 requirement, rejected an over-allocating PO-C quantity 6, and
created no InventoryTransactions, QC PASS, producedAt evidence or Yard
placements. Prisma checks, backend tests/build, frontend build and runtime
smoke passed.

On 2026-07-27 implemented **COMPONENT DOMAIN.3 – Component Create & Project
Requirement Conversion**. New Components create flows now call the
canonical additive `POST /components/foundation/definition-requirements`
operation, creating one engineering Component definition in `DRAFT` and one
Project demand row in `ProjectComponentRequirement.requiredQuantity` inside one
transaction. New create no longer stores canonical type/profile/quantity in
`description` JSON and no longer creates ComponentInstances, inventory quantity
or ProductionOrders. Component identity is backend-owned and unique-guarded.
Read models prefer typed `componentType/profile` and requirement quantity with
legacy JSON fallback. Backup
`/tmp/steeltrack-domain3-before-20260727.dump` was created and verified before
deploying migration `20260727223000_component_domain3_typed_definition_fields`.
Runtime smoke through the authenticated API created one Component definition and
one ProjectComponentRequirement only, with no ComponentInstances,
ProductionOrders or InventoryTransactions. Verification passed for Prisma
migrate status/validate/generate, backend tests, backend build, frontend build
and `git diff --check`.

On 2026-07-27 completed **COMPONENT DOMAIN.2 – Canonical Schema Foundation**.
The canonical Component conversion now has an additive data foundation:
`ProjectComponentRequirement` models Project demand/planning, `ComponentInstance`
models one physical manufactured component identity, and
`ComponentInstanceTimeline` provides future instance traceability. Existing
`Component`, `ComponentRevision`, `ComponentBomDefinition`, Engineering BOM B1,
legacy Component APIs, Inventory, QC, Yard, Logistics, Historical Dashboard,
Snapshot Engine and frontend flows remain compatible. Migration
`20260727220000_component_domain2_schema_foundation` was applied after a valid
backup and destructive SQL review. Controlled DOMAIN2 runtime smoke verified
multi-project requirements for one Component, no inventory/instance creation
from requirement quantity, PLANNED instance default semantics, STABILITY7
readability and released B1 BOM lineage. Backend tests, backend build, frontend
build, Prisma migrate status/validate/generate and `git diff --check` passed.

On 2026-07-27 completed **SPRINT STABILITY.7 – B1 Runtime Integration
Certification** with decision **PASS**. A controlled fixture namespace
`STABILITY7-1785129145020` certified the runtime path Component DRAFT ->
Revision -> Engineering BOM replace/validate -> Engineering Release ->
Production Order -> Production BOM materialization -> Production Order BOM
binding. The fixture proved Sprint A release gating, invalid BOM rejection,
lineage preservation, idempotent materialization replay and historical binding
after a newer Component revision was released. No schema, migration, frontend,
Inventory workflow, Sprint C-J feature, staging or commit action was performed.
Backend tests, backend build, frontend build, Prisma migrate status, Prisma
validate and `git diff --check` passed.

On 2026-07-27 completed **SPRINT STABILITY.6 – Historical Snapshot Date
Normalization**. Resolved the STABILITY.5 `@db.Date` timezone/date mismatch by
standardizing Historical Snapshot business dates as strict `YYYY-MM-DD`
calendar dates persisted as UTC-midnight Date values. Snapshot Engine
scheduling, job identity, daily/monthly boundaries, metadata advancement and
Historical Dashboard API serialization now use the same canonical date rule.
Runtime checks under `UTC` and `Asia/Ho_Chi_Minh` passed, and a controlled
`YARD/stability6_dashboard_daily` workflow stored and read `2026-07-29`
consistently through `snapshot_jobs`, `dashboard_snapshots`,
`snapshot_metadata` and the Historical Dashboard controller/service/repository
path. Prisma validation/generation/migrate status, backend tests, backend
build, frontend build and `git diff --check` passed.

On 2026-07-27 completed **SPRINT STABILITY.5 – Full System Runtime
Certification** with decision **CERTIFIED WITH CONDITIONS**. Verified database
connectivity, Prisma migration status, Prisma validation/generation, backend
health, authenticated module APIs, frontend preview route shell, background
Snapshot Engine behavior, minimum Snapshot workflow, targeted regression suites,
backend tests/build and frontend tests/build. No P0 remains. Key condition:
Historical Snapshot date semantics needed a P1 fix because current-day snapshot
generation stored `@db.Date` rows on `2026-07-25` during Asia/Ho_Chi_Minh
runtime verification; exact historical day behavior is not production-certified
until date normalization is fixed. This condition was resolved in
STABILITY.6. B1 runtime E2E still requires a controlled fixture because the
current DB lacks released Component revisions/BOM definitions.

On 2026-07-27 completed **SPRINT STABILITY.4 – Historical Snapshot Corrective
Migration**. Created and deployed one forward-only corrective Prisma migration
for the Historical Snapshot schema drift identified in STABILITY.3. The new
migration creates the missing Historical Snapshot enums, generic snapshot
tables, inventory balance snapshots, monthly rollups, snapshot jobs/logs,
rebuild requests and snapshot metadata without dropping, renaming, truncating or
backfilling legacy snapshot data. Runtime smoke confirmed the previous
`public.snapshot_metadata does not exist` Snapshot Engine startup error is
resolved, and authenticated `/history/*` read endpoints now return controlled
empty/not-found responses instead of schema-level failures. Backend tests,
backend build, frontend build, Prisma validation/generation and git diff check
passed.

On 2026-07-27 completed **COMPONENT MANUFACTURING WORKFLOW Sprint B1 – Engineering BOM Materialization**. Released Component BOM definitions are now validated with a canonical Engineering BOM contract and materialized into the existing Production BOM/BOMItem model before Production Order creation. Component-bound Production Orders preserve Engineering lineage (`componentId`, `componentRevisionId`, `bomDefinitionId`, `engineeringContentHash`) and reject stale or non-materializable Engineering BOM input. The implementation is additive, introduces no third BOM model, and does not modify Inventory, QC, Yard, Logistics, Projects, Historical Dashboard, Snapshot Engine, Warehouse Realtime, or frontend UI. Backend tests, backend build, frontend build, and Prisma validation passed.

On 2026-07-25 completed **SPRINT EXECUTIVE BI.7 – Standardize All Executive BI Domains**. Standardized all 6 Executive BI domains (`Nhập kho`, `Xuất kho`, `Sản xuất`, `Chất lượng`, `Dự án`, `Giao nhận`) using Inventory Executive BI as the master template. Removed redundant hero headers (`AnalyticsHeader`), added domain-aware Executive Insights and Executive Alert/Recommendation panels, standardized Row 1 (60/40 ratio) and Row 2 (3-column) grid layouts across every domain. Both frontend and backend builds compile with 0 errors.

On 2026-07-25 completed **SPRINT EXECUTIVE BI.5 – Premium Enterprise UX Polish**. Refined micro UX, 150–200ms motion transitions, KPI card hover effects, chart card padding, accessibility contrast, and visual rhythm across the Executive BI Popup. Both frontend and backend builds compile with 0 errors.

On 2026-07-25 completed **SPRINT EXECUTIVE BI.4 – Executive Insights & Professional Dashboard Polish**. Transformed the Inventory Executive BI workspace in `DashboardPage.tsx` & `AnalyticsPrimitives.tsx` into a C-level decision dashboard. Added Executive Insights, Executive Alert Center (Critical, Warning, Info), Executive Recommendations, enhanced chart section headers with subtitles and timestamps, and polished empty state messaging. Both frontend and backend builds compile with 0 errors.

On 2026-07-25 completed **SPRINT EXECUTIVE BI.3 – Dashboard Layout & Analytics Composition**. Optimized the Executive BI layout in `DashboardPage.tsx` & `AnalyticsPrimitives.tsx` by upgrading Row 1 to a 60/40 grid composition (`xl:grid-cols-[1.2fr_0.8fr]`), expanding Donut chart drawing area, refining Heatmap card spacing, reducing header margins, and maximizing above-the-fold executive information density. Both frontend and backend builds compile with 0 errors.

On 2026-07-25 completed **SPRINT EXECUTIVE BI.2 – Enterprise Visual Polish & Color System**. Refined the Executive BI Popup visual design by removing KPI left stripe artifacts, implementing a semantic KPI color system (Blue/Emerald/Amber/Purple/Cyan), updating chart colors for ABC Analysis, Inventory Aging, and Top Inventory rankings, polishing typography hierarchy, and establishing visual balance. Both frontend and backend builds compile with 0 errors.

On 2026-07-25 completed **SPRINT EXECUTIVE BI.1 – Executive BI Popup UI Polish**. Polished the Executive BI Popup layout in `DashboardPage.tsx` & `AnalyticsPrimitives.tsx` keeping the 2-column grid layout intact, reducing KPI card height to `90–92px`, adjusting top chart row heights to `h-[230px]` and lower chart row heights to `h-[300px]`, eliminating purple borders/glows, and implementing smooth vertical scrolling with a sticky sidebar. Both frontend and backend builds compile with 0 errors.

On 2026-07-24 completed **SPRINT INVENTORY.3 – Inventory Audit Enterprise UI Standardization**. Standardized the Inventory Audit workspace (`/inventory/audit`) across all 6 Enterprise layout phases with global topbar actions, 6 Enterprise KPIs, 4 CockpitChartCards, compact toolbar, hero table with sticky headers & `[Xem tất cả]`, expanded portal modal, and slide-over detail drawer. Both frontend and backend builds compile with 0 errors.

On 2026-07-24 completed **SPRINT INVENTORY.2 – Inventory Transactions Enterprise UI Standardization**. Standardized the Inventory Transactions workspace (`/inventory/transactions`) across all 6 Enterprise layout phases with global topbar actions, 6 Enterprise KPIs, 4 CockpitChartCards, compact toolbar, hero table with sticky headers & `[Xem tất cả]`, expanded portal modal, and slide-over detail drawer. Both frontend and backend builds compile with 0 errors.

On 2026-07-24 completed **SPRINT DISPATCH.1 – Dispatch Overview Enterprise Workspace Standardization**. Moved primary action `+ Tạo điều xe` to global AppTopbar via `DispatchActionProvider`. Standardized Dispatch Overview (`/logistics`) across all 6 Enterprise Design System layout phases. Both frontend and backend builds compile with 0 errors.

On 2026-07-24 completed **Sprint QC.5, QC.6, QC.7, QC.8 UI Polish Sprint**. Standardized NCR, CAPA, Audit Logs, and QC Reports workspaces (`/qc/ncr`, `/qc/capa`, `/qc/logs`, `/qc/reports`) across all 6 Enterprise Design System layout phases. Both frontend and backend builds compile with 0 errors.

On 2026-07-24 completed **Sprint QC.2, QC.3, QC.4 UI Polish Sprint**. Standardized 3 QC inspection tabs (`/qc/inbound`, `/qc/production`, `/qc/final`) across all 6 Enterprise Design System layout phases. Both frontend and backend builds compile with 0 errors.

On 2026-07-24 completed **QC Overview UI Polish Sprint**. Standardized QC Overview (`/qc`) across all 6 Enterprise Design System layout phases. Moved primary action `+ Tạo phiếu kiểm tra cấu kiện` to global AppTopbar via `QCActionProvider`. Both frontend and backend builds compile with 0 errors.

On 2026-07-24 completed **Suppliers Quality, Finance, Activity & Reports UI Polish Sprint**. Standardized 4 Suppliers secondary tabs (`/suppliers/quality`, `/suppliers/payables`, `/suppliers/logs`, `/suppliers/reports`) across all 6 Enterprise Design System layout phases. Both frontend and backend builds compile with 0 errors.

On 2026-07-24 completed **Suppliers Business Tabs UI Polish Sprint**. Standardized 3 Suppliers business tabs (`/suppliers/quotes`, `/suppliers/purchase-orders`, `/suppliers/deliveries`) across all 6 Enterprise Design System layout phases. Both frontend and backend builds compile with 0 errors.

On 2026-07-24 completed **Suppliers Overview UI Polish Sprint**. Standardized Suppliers Overview (`/suppliers`) to match the Enterprise Design System and Inventory Overview layout sequence. Moved primary action `+ Thêm nhà cung cấp` to global AppTopbar using `SuppliersActionProvider` and aligned all 6 layout phases. Both frontend and backend builds compile with 0 errors.

On 2026-07-24 completed **Restore Hero Table View All Pattern Sprint**. Restored standard `[Xem tất cả]` header button and Expanded Modals in Hero Tables for both Project Components (`/projects/components`) and Project Materials (`/projects/materials`). Both frontend and backend builds compile with 0 errors.

On 2026-07-24 completed **Project Components & Materials Tabs Standardization Sprint**. Standardized both Project Components (`/projects/components`) and Project Materials (`/projects/materials`) tabs across all 6 phases (`EnterpriseKpiCard` strip, compact toolbar with search icon & dropdowns, sticky Hero Table with count pill, pagination, and side widgets). Both frontend and backend builds compile with 0 errors.

On 2026-07-24 completed **Progress Tab Standardization Sprint**. Standardized Project Progress tab (`/projects/progress`) section sequence (KPI Cards → Compact Toolbar → Hero Table → Progress Analytics & Risk Alert Widgets). Both frontend and backend builds compile with 0 errors.

On 2026-07-24 completed **Project List Tab Standardization Sprint**. Standardized Project List tab (`/projects/list`) section sequence (KPI Cards → Compact Toolbar → Hero Table → Summary Analytics Widgets). Both frontend and backend builds compile with 0 errors.

On 2026-07-24 completed **Projects Toolbar Position Fix**. Fixed Projects Overview (`/projects`) section order to position Compact Toolbar (`FilterBar`) immediately after the Analytics Dashboard and above the Hero Table, moving secondary overview widgets below the Hero Table. Both frontend and backend builds compile with 0 errors.

On 2026-07-24 completed **Restore Search Input Sprint**. Restored visual Search Input with search icon in Projects Overview (`/projects`) toolbar. Restored exact Enterprise toolbar control sequence (Search Input → Status ▼ → Customer ▼ → PM ▼ → Region/Type ▼ → `[Tìm kiếm]` → `[Làm mới]`). Both frontend and backend builds compile with 0 errors.

On 2026-07-24 completed **Projects Layout Alignment Sprint**. Re-ordered Projects Overview (`/projects`) layout to place the Compact Toolbar (`FilterBar`) immediately below the Analytics Dashboard and above the Hero Table (Header → KPI Cards → Analytics → Toolbar → Hero Table → Expanded Modal → Detail Drawer). Both frontend and backend builds compile with 0 errors.

On 2026-07-24 completed **Shared Project Form Sprint**. Consolidated all project creation and editing UI into a single `ProjectFormDialog` component supporting `mode="create"` and `mode="edit"`. Both `+ Thêm công trình` and `"Sửa công trình"` use the same dialog managed by `ProjectsActionContext`. Both frontend and backend builds compile with 0 errors.

On 2026-07-24 completed **Projects Overview UI Polish Sprint**. Primary creation action `+ Thêm công trình` moved to `AppTopbar` via `ProjectsGlobalActionBar` and `ProjectsActionProvider`. Standardized Projects Overview (`/projects`) across all 6 phases (`EnterpriseKpiCard` strip, `CockpitChartCard` analytics, compact toolbar with dropdowns for Status, Customer, Manager, Type/Region, sticky Hero Table with count pill, expanded table modal via `createPortal`, and detail drawer). Both frontend and backend builds compile with 0 errors.

On 2026-07-24 completed **Yard Module UI Polish Sprint**. Standardized all remaining 6 Yard pages (`Yard 2D Map`, `Yard 3D Map`, `Heatmap`, `Timeline`, `Movement History`, `Reports / Locations / Tracking`) across all 6 phases. Header actions strictly maintain `+ Nhập bãi` (Primary), `Xuất bãi` (Secondary), and `Khác ▼` dropdown menu via `YardActionProvider` and `YardGlobalActionBar` in `AppTopbar`. Both frontend and backend builds compile with 0 errors.

On 2026-07-24 completed **Yard Overview UI Polish Sprint**. Standardized Yard Overview (`/yard`) across all 6 phases (`EnterpriseKpiCard` strip, `CockpitChartCard` analytics, compact toolbar with dropdowns for Warehouse, Zone, Status, Project, sticky Hero Table with count pill, expanded table modal via `createPortal`, and detail drawer). Header actions moved to `AppTopbar` via `YardGlobalActionBar` and `YardActionProvider` containing `+ Nhập bãi` (Primary), `Xuất bãi` (Secondary), and `Khác ▼` dropdown menu (`Quản lý Zone`, `Quản lý Slot`, `Chuyển nội bộ`). Both frontend and backend builds compile with 0 errors.

On 2026-07-24 completed **Planning Overview Action Provider Fix Sprint**. Wrapped `OperationalShell` with `PlanningActionProvider` so `AppTopbar` has access to `PlanningActionContext`. Clicking `+ Lập kế hoạch mới` in `AppTopbar` now triggers `CreatePlanModal` mounted via `createPortal(..., document.body)`. Removed all duplicate creation buttons across local headers, hero tables, toolbars, and tab content.

On 2026-07-24 completed **Planning Overview UI Polish Sprint**. The primary creation action `+ Lập kế hoạch mới` was moved to the page header topbar via `PlanningActionContext` and `PlanningGlobalActionBar`. The Planning Overview page (`/planning`) was standardized across all 6 phases (`EnterpriseKpiCard` strip, `CockpitChartCard` analytics, compact toolbar with dropdowns for Status, Project, Customer, Month, sticky Hero Table with count pill, expanded table modal via `createPortal`, and detail drawer). Both frontend and backend builds compile with 0 errors.

On 2026-07-24 completed **Production Advanced Operations UI Polish Sprint**. All 9 low-frequency Advanced Operations pages (`/production/advanced`: Machines, Production Warehouse, Material Reservations, Material Ledger, Material Issues, Material Consumptions, Incidents/Rework, Machine Logs, Advanced Reports) have been standardized across all 6 phases (`EnterpriseKpiCard`, compact toolbar, sticky Hero Table with count pill, expanded modal via `createPortal`, and detail drawers). Both frontend and backend builds compile with 0 errors.

On 2026-07-23 started the Component Manufacturing Workflow epic and completed
Sprint A. Production Order creation is now gated by Engineering Release:
component-bound orders require an ACTIVE engineering-released Component with a
current released revision, and the canonical command API validates the released
BOM definition plus content hash before creating the order. This reuses the
existing Component aggregate/revision/BOM schema and introduces no migration,
Inventory redesign, Production UI redesign, Historical Dashboard change,
Snapshot Engine change or Warehouse Realtime change.

On 2026-07-23 completed Production Order creation and Component lifecycle
hardening. The Production create form now submits new orders as canonical
`DRAFT` orders, matching backend validation and AD-017 lifecycle rules. Legacy
Component creation now assigns canonical draft lifecycle metadata, and
Components read models no longer count draft components as finished-goods
stock. QC NCR creation accepts additive defect context fields and stores them
in existing metadata for traceability. No schema, migration, Inventory,
Historical Dashboard, Snapshot Engine or Historical API changes were made.

On 2026-07-23 completed Sprint 4 Executive Historical Dashboard UI. Added the
frontend `/history` workspace with typed Historical API client functions,
TanStack Query hooks, Overview/Inventory/Production/Projects/Suppliers/Snapshot
Jobs tabs, date range/module/warehouse/authoritative filters, KPI cards,
historical chart panels, inventory/monthly rollup tables and snapshot job
monitoring. The page uses existing Industrial Cockpit/shared UI components and
does not use mock data; unavailable datasets render standard empty states.
Backend, Prisma, Snapshot Engine, Scheduler and Job Queue were not changed.

On 2026-07-23 completed the Project Maintenance and Warehouse Realtime
Dashboard sprint. Frontend CI now has a working Vitest setup, jsdom test
environment, Historical Dashboard smoke tests, active-source lint traversal and
Vite vendor chunk splitting. Archived/backup/quarantine frontend code no
longer blocks lint. A new frontend-only `/warehouse-realtime` cockpit reads the
existing Inventory overview, material and transaction endpoints with polling
for realtime KPIs, warehouse utilization, recent movement, alerts and timeline.
No backend, schema, Historical Dashboard, Snapshot Engine or Historical API
code changed.

On 2026-07-22 completed Sprint 3 Historical Dashboard Read API. Added a
read-only `/history` backend module with controller, service, repository and
strict Zod query DTOs for dashboard snapshots, latest authoritative snapshots,
monthly rollups, inventory historical snapshots, inventory monthly rollups and
snapshot jobs. Responses are DTO-safe and serialize Date, Decimal and BigInt
values. Snapshot Engine, Scheduler, Job Queue, Prisma schema, migrations,
frontend and business behavior were not changed.

On 2026-07-22 completed Sprint 2.2 Historical Snapshot Engine Production
Hardening. The backend engine now uses `snapshotType` in job identity, atomic
advisory-lock scheduling, retry-aware failed job reuse, forward-only metadata
updates, non-authoritative marking for stale historical snapshots, one-job
lease-safe processing, expired max-attempt cleanup and cursor-batched inventory
snapshot generation. No schema, migration, API, controller, frontend,
authentication or business behavior changed.

On 2026-07-22 implemented Sprint 2 of the Historical Dashboard: the Snapshot
Engine. The backend now has a metadata-driven historical snapshot worker that
schedules daily jobs, claims `SnapshotJob` rows with leases, recovers expired
leases, retries failures up to `maxAttempts`, logs to `SnapshotJobLog`, updates
job metrics and idempotently writes dashboard, inventory balance and monthly
rollup snapshots. No schema, migration, API, controller, service contract,
frontend or business workflow changed.

On 2026-07-22 hardened the Historical Dashboard Prisma schema. Historical
Dashboard free-text lifecycle/module fields now use dedicated Prisma enums,
daily historical tables use single-column UUID primary keys for Prisma Client
stability, and inventory daily/monthly uniqueness now uses non-null bucket keys
instead of nullable location/warehouse fields. No Snapshot Engine, API,
services, frontend code or existing business tables were changed.

On 2026-07-22 implemented the Historical Dashboard Prisma Schema Foundation.
The backend Prisma schema now has additive models for the approved Historical
Executive Dashboard storage layer: dashboard snapshots, inventory balance
snapshots, monthly rollups, snapshot jobs, job logs, rebuild requests and
snapshot metadata. Existing business tables, services, APIs and frontend code
were not changed. PostgreSQL-specific partitioning, check constraints, partial
indexes, covering indexes and GIN indexes remain documented raw SQL migration
steps.

On 2026-07-22 implemented the Inventory Material Created Date input. The Add
Material drawer now shows a compact `Ngày thêm` date-time picker beside the
`Thêm vật tư mới` header, and create-material requests persist that value to
the existing `InventoryItem.createdAt` field. No schema, migration, API route
or business workflow changed.

On 2026-07-22 implemented an Executive Dashboard data availability hotfix.
Inbound/outbound KPI and chart calculations now unwrap nested API payloads,
normalize transaction direction/type values, include transaction `items[]`
amounts when header totals are absent, and anchor 30-day sparklines to the
newest backend timestamp. Production running counts now include the canonical
active states used across the app. Analytics detail panels no longer show the
heavy left-side colored strip.

On 2026-07-22 completed Login & Sidebar Brand Polish. The login page now uses
the provided factory background and TRIVIETSTEEL logo image with an animated
luminous border around the center login card. The active sidebar brand now
shows TRIVIETSTEEL / Smart Solutions, and the collapsed sidebar uses
`logo-tv.png` with the expand button moved to the bottom. No backend, API,
schema or authentication behavior changed.

On 2026-07-22 completed Executive Dashboard Business Data Polish. The dashboard
now maps inventory value by material type and material group from real
`/inventory/audit` value fields, uses `/inventory/overview` movement trend for
import/export history, and renders QC, delivery and operational alerts only
from authoritative backend data or explicit empty states. Follow-up polish
added a period-style import/export comparison chart, explicit alert count strip
and calmer Vietnamese KPI drill-down pages. The six chart panels plus
operational risk panel now have independent enlarged popups with real-data
detail tables. Latest polish removed header quick search/LIVE/refresh controls,
added custom date filtering, changed top KPI drill-downs to smaller modal
overlays, changed the main import/export card to a zig-zag trend and enlarged
the popup bar chart. No backend, API, schema or business behavior changed.

On 2026-07-22 completed the Executive Dashboard KPI reference alignment. The 8
KPI cards now use the requested reference structure: smaller icons, title text
beside the icon, compact `tỉ`/`triệu` values, green/red percent change, removed
`Tốt`/`Bình thường` badges and 30-day mini trend lines. No backend, API,
schema or business behavior changed.

On 2026-07-22 completed the Executive Dashboard final visual polish. KPI cards
now align more closely with `docs/ui-reference/kpi chinh.png` through stronger
domain-specific gradients, semantic glow, accent borders, custom icon frames
and richer sparkline treatment. Analytics panels now give charts and progress
visualizations more dominance while keeping backend/API/business logic
unchanged.

On 2026-07-22 completed the Executive Dashboard chart empty-state polish.
Repeated `Dữ liệu lịch sử chưa khả dụng` labels were removed from KPI
sparklines, trend panels now fall back to existing real ranking/distribution
data when history is unavailable, and dashboard analytics typography was
softened to medium-weight rendering. No backend, API, schema, route, permission
or business behavior changed.

On 2026-07-22 completed Executive Dashboard V4.1 Final UI Polish. Added a
shared analytics UI framework under `shared/ui/analytics`, introduced
domain-specific analytics themes and reworked the Executive BI drill-downs so
each domain has its own chart composition and operational identity. The main
KPI row now reads as eight distinct executive KPI cards rather than cloned
cards.
No backend, API, route, schema, permission or business behavior changed.

On 2026-07-22 completed EPIC 12.4 Executive BI Portal Final Redesign.
`DashboardPage.tsx` now treats the landing experience as an Executive BI
Portal with a main executive cockpit plus domain analytics pages for Inventory,
Inbound, Outbound, Production, QC, Projects and Dispatch. Hardcoded KPI values,
hardcoded month arrays and generic analytics modal content were replaced with
existing backend/read-model data or controlled `Dữ liệu chưa khả dụng` states.
Backend contracts, routes, schema, permissions and business logic were not
changed.

On 2026-07-22 completed the Executive Dashboard UI Redesign V3. Integrated gap analysis report and updated DashboardPage.tsx to match `kpi chinh.png` and `chi tiet bang.png` specification images. Fixed all layouts to fit 1920x1080 resolution without vertical scrollbars, translated 100% text to Vietnamese, and connected all drill-downs to the 95vw/92vh analytics modal with left filter sidebar and right visual analytics layouts. All builds and git checks passed.

On 2026-07-22 completed the Executive Dashboard UI Redesign (Final Design). Redesigned the entire landing page to fit exactly 1920x1080 resolution with zero scrolling. Converted text-heavy panels (insights, matrices, text overviews) into high-density visual charts, progress bars, and minimal heatmaps. Translated all terms into Vietnamese. Upgraded the 8 KPI cards and 95vw/92vh drill-down popup layout containing left side filters and right analytics blocks. All builds and git checks passed.

On 2026-07-22 completed the Executive Dashboard & KPI Drill-down Redesign (Version 2.0). Upgraded the top KPI section into exactly 8 KPI cards containing icons, delta changes, sparklines, and status badges on a single 1920x1080 screen with zero scrolling. Reconstructed all drill-down actions to trigger a beautiful fullscreen modal (95vw, 92vh) featuring a left sidebar filter panel and 6 detailed right content analytics panels (Summary, 12-Month Trend, Rankings, Distribution, Comparisons, Detail Table, and Highlights). All builds and git checks passed.

On 2026-07-22 completed the Executive Analytics Fullscreen Popup UI Redesign. Upgraded every dashboard KPI card click-action to open a beautiful fullscreen (95vw, 92vh) analytics modal workspace preserving dashboard state. Integrated 5 executive summary KPI cards with delta trends, a 12-month zoomable historical trend chart, monthly comparisons & category distributions, top 10 horizontal ranking bars, density/occupancy distribution views, a 12-row monthly detail table, and factual operational insights. All builds and git checks passed.

On 2026-07-22 EPIC 12.5 completed the Executive Business Analytics & Cross-Module Intelligence sprint. Transformed DashboardPage.tsx into an operational business cockpit. Added Cross-Module Analytics linking Inventory shortages to production risk, completed production to logistics waittimes, delayed projects to production progress, and shipments blocked by QC holds. Integrated the Executive Risk Matrix, Operational Dependency Pipeline view, Operational Heatmap, Business Flow summary, and executive decision-required action cards. All builds and git checks passed.

On 2026-07-22 EPIC 12.4 completed the Executive Dashboard Data Accuracy & Operational Analytics sprint. Audited all Executive KPIs and aligned calculations to use the exact same backend read models as their source modules (incorporating useInventoryOverview query on DashboardPage.tsx). Reconstructed all AnalyticsPage.tsx charts to represent actual operational business answers (Warehouse Occupancy, Top 10 Low Stock Materials, Inventory Category Distribution, Production status/progress, Vehicle Utilization, QC Pass Rates, Project Completion, and Executive Health Score), while maintaining a diverse mix of visual representations and clear data source descriptions. All builds and git checks passed.

On 2026-07-22 EPIC 12.3 completed the Executive Command Center sprint. Upgraded DashboardPage.tsx from a monitoring tool into an operational command center. Integrated the Quick Action Workspace containing actionable Cards for Low Stock, Production Blocked, QC failure NCRs, and Logistics cancellations with primary/secondary actions; added an Operational Work Queue grouped by time/priority; added the Personal Task and Smart Recommendations panels; and integrated the Executive Calendar schedule view. All builds and git checks passed.

On 2026-07-22 EPIC 12.2 completed the Executive Drill-down Dashboards sprint. Reconstructed AnalyticsPage.tsx into a centralized multi-tab dashboard supporting 7 domains (Inventory, Production, Logistics, QC, Projects, Planning, Admin) with real backend data mapping. Integrated click-navigation handlers on all Executive Dashboard KPI cards, trend charts, notifications, and activity logs to drill down directly into details. All builds and git checks passed.

On 2026-07-21 EPIC 12.1 completed the Executive Dashboard Analytics & Activity Center sprint. Enhanced DashboardPage.tsx with dedicated Operational Analytics panels (Production, Logistics, Project, QC), a Unified Activity Feed grouped by time periods (Today, Yesterday, Earlier) with click navigation targets, a Structured Notifications Center categorized by priority (Critical, Warning, Information), and Global Executive Filters (Time Range, Project, Warehouse). Zero fake charts, zero fake metrics. All builds and git checks passed.

On 2026-07-21 EPIC 12.0 completed the Executive Dashboard (Enterprise Command Center) sprint. The main system landing page (/ -> DashboardPage.tsx) was reconstructed to aggregate operational data from all 8 core modules using real backend contracts exclusively. Features 8 Executive CockpitKpiCards, 6 Operational Overview module cards, Trend Analytics, Quick Actions, Notifications Center, Unified Activity Feed, and System Health status. Zero fake metrics, zero fake charts. All builds and git checks passed cleanly.

On 2026-07-21 EPIC 10.0 completed the Admin Workspace Standardization sprint. All visible Admin pages and workspaces (Settings, Users, Roles, System Logs) were aligned to the SteelTrack UI Canon (KPI row, search & filter toolbar with quick chips and clear filter buttons, CockpitTableShell tables with DataTablePagination, right analytics/detail rail, and controlled empty states). Fake polyline sparklines and local CSS classes were completely removed. All builds and git checks passed cleanly.

On 2026-07-21 EPIC 9.0 completed the Planning Workspace Reconstruction sprint. All visible Planning pages and routes (/planning, /planning/overview, /planning/master, /planning/production, /planning/capacity, /planning/material, /planning/procurement, /planning/schedule, /planning/calendar, /planning/constraints, /planning/reports) were aligned to the SteelTrack UI Canon (KPI row, search/status/project toolbar, hero table with DataTablePagination & empty/loading states, right analytics rail). Real backend data is mapped from production orders, projects, material shortages, and logistics dispatch schedule. All builds and git checks passed cleanly.

On 2026-07-21 EPIC 8.0 completed the Logistics UI Reconstruction sprint. All visible Logistics pages and routes (/logistics, /planning, /vehicles, /dispatch, /loading, /tracking, /deliveries, /documents, /reports) were aligned to the SteelTrack UI Canon (KPI row, search/status/project toolbar, hero table with DataTablePagination & empty/loading states, right analytics rail). Fake data, synthetic trends, and dead toolbar actions were eliminated. All builds and git checks passed.

On 2026-07-21 EPIC 7.0 completed a documentation-only global UI consistency
audit across Inventory, Components, Production, Projects, Suppliers, QC,
Logistics, Planning and Admin. The audit produced a global difference report
and a design debt register. No frontend or backend source code changed.
Highest remaining risks are the missing authenticated screenshot harness,
Planning route visibility, Logistics Vehicles/Planning fallback behavior and
Admin pagination/primitive drift.

On 2026-07-21 EPIC 6.0 completed a QC-only UI readiness pass. QC inspection
workspaces now use page/limit read-model state, shared `DataTablePagination`,
shared cockpit table shell treatment and standard empty states. The fixed
`limit: 100` read path and inert toolbar buttons were removed, and QC KPI cards
no longer receive synthetic trend arrays. Backend, API contracts, routes,
permissions, schema, React Query contracts and business behavior are unchanged.
Browser screenshot certification remains pending because no approved
authenticated browser harness is available in the workspace.

On 2026-07-21 EPIC 3.2 finalized Production workspace readiness at source/build
level. The post-polish review found the active P0/P1 operator surfaces already
complete after EPIC 3 and EPIC 3.1, so no additional Production source changes
were required. Running, Completed and Scrap remain P2 route/model decisions
rather than UI blockers. Browser screenshot certification remains pending.

On 2026-07-21 EPIC 5.0 completed a Suppliers-only UI completion pass.
Supplier Overview/List and Quality now follow the Inventory-canon workspace
rhythm with KPI cards, compact filters, paginated hero tables, right analytics
rails and lower analytics/empty-state sections. Supplier KPI cards no longer
receive synthetic trend arrays. Capability tabs without read contracts now show
full controlled empty workspaces instead of lone placeholder cards. Backend,
API contracts, routes, permissions, schema, React Query contracts and business
behavior are unchanged. Browser screenshot certification remains pending
because no approved authenticated browser harness is available in the
workspace.

On 2026-07-21 EPIC 4.0 completed a Projects-only UI completion pass. Projects
Overview and Projects List now follow the Inventory-canon table-hero rhythm
with KPI cards, the existing global filter, right analytics rails and lower
analytics bands. The active project detail timeline now uses real WBS/phase
data or a standard empty state instead of static milestone labels. Backend,
API contracts, routes, permissions, schema, React Query contracts and business
behavior are unchanged. Browser screenshot certification remains pending
because no approved authenticated browser harness is available in the
workspace.

On 2026-07-21 EPIC 3.1 completed a Production-only UI polish pass. Production
now removes inert toolbar controls, gives the Execution Queue an Inventory-like
table hero before the kanban board, and strengthens right rails for Queue,
Consumptions and Incidents with filled real-data analytics/empty states.
Backend, API contracts, schema, permissions, React Query contracts and business
behavior are unchanged. Browser screenshot certification remains pending
because no approved authenticated browser harness is available in the
workspace.

On 2026-07-21 EPIC 3 completed Production P0/P1 source/build remediation.
Production now has a route-visible Machines workspace backed by the existing
machine endpoint, no synthetic KPI trend arrays or fake chart fallback values,
and standard pagination/empty-row treatment for Consumption, Incidents and the
major table workspaces. Backend, API contracts, schema, permissions and
business behavior are unchanged. Browser screenshot certification remains
pending because no approved authenticated browser harness is available in the
workspace.

On 2026-07-21 EPIC 2 completed the Components P0/P1 source/build remediation.
Components Overview/List remain aligned with Inventory, and the secondary
Components tabs now use Inventory-canon panels, chart cards, table hero
surfaces and pagination. Hardcoded trend arrays, synthetic chart fallback
values and non-functional History filters were removed. Backend, API, routes,
permissions, React Query contracts, schema and business behavior are unchanged.
Browser screenshot certification remains pending because no approved harness is
available in the workspace.

On 2026-07-21 Components was aligned more closely with the Inventory Golden
Reference. Components Overview now treats the component table as the primary
workspace with a compact analytics rail and lower queue section. Components
List now follows the Inventory Materials rhythm with a filter panel, dominant
table panel, stable empty rows, Inventory pagination and side analytics. This
was a frontend-only composition pass; backend, APIs, routes, permissions,
React Query contracts and business behavior are unchanged.

On 2026-07-21 EPIC 0 Full UI Audit was completed as documentation-only work.
The audit covers Inventory, Components, Production, Projects, Suppliers, QC,
Logistics, Planning and Admin against the Inventory canon, and records route
coverage, layout/KPI/filter/table/chart/data classifications, missing features
and a prioritized master backlog. No frontend/backend source code changed.

On 2026-07-21 EPIC 0.5 prioritized the UI audit backlog. The master backlog now
uses P0 Critical, P1 Production-ready and P2 Future categories with status,
dependency and complexity fields. The execution plan defines module completion
percentages and nine phases: Inventory, Components, Production, Projects,
Suppliers, QC, Logistics, Planning and Admin. No source code changed.

On 2026-07-20 COMPOSITION001 refined page composition outside Inventory.
Inventory remains the Golden Reference and was not modified. Production,
Components, QC, Suppliers, Settings and Notifications now lean harder into one
dominant workspace plus a narrower support rail instead of equal card
collections. A 1440x1100 screenshot QA pass compared the target pages with
Inventory Materials: Production table/loading/error states now keep the hero
footprint, and Settings now opens as KPI/filter/table/rail workspace. This pass
only rearranged page composition and preserved backend, APIs, routes,
permissions, authentication, database, React Query contracts, business logic,
shared tokens and shared component APIs.

On 2026-07-18 VISUAL001 applied an Enterprise Visual Composition
Transformation through shared UI primitives. Inventory remains the benchmark:
KPI stays compact, charts gain decision weight, main operational tables/queues
gain viewport dominance and right-side context stays secondary. The change was
implemented in shared cockpit/workspace primitives, not by copying Inventory
JSX or changing module business logic. Browser screenshot certification remains
pending.

On 2026-07-18 PLATFORM002 completed the Enterprise Application Completion pass.
Active menus were audited for visible unfinished/developer wording, and the
most visible source/debug labels were removed from Dashboard, Production,
Components, Inventory Locations, Command Center, Analytics and Copilot. Pages
now use more commercial ERP language while still relying only on existing data
and contracts. No backend, API, React Query, route, permission, authentication,
database or business behavior changed.

On 2026-07-18 PLATFORM001 completed the first Enterprise Platform foundation
pass. Settings now covers Organization, Security, Monitoring and Reports Center
as useful capability workspaces without creating backend/API contracts or fake
numbers. Notification Center now has real KPI cards, search, filters, list and
detail panel from existing notification data. Supplier incomplete tabs now show
controlled empty states with next-step guidance, and active Dashboard wording no
longer uses placeholder language. Backend, API, React Query, route, permission,
database and business behavior are unchanged.

On 2026-07-18 FINAL001 performed the Enterprise Workspace release-candidate
polish pass across Inventory, Production, Components, QC and shared Enterprise
UI surfaces. The pass preserved NAV001's sidebar-first model, confirmed
full-width workspace behavior and aligned QC page-level panel/input/button/table
aliases with shared module tokens. Remaining UI debt is documented for browser
visual certification, shared QC modal shells, cross-module status badges and
older Inventory local form fragments. No backend, API, React Query, route,
permission, authentication, database or business behavior changed.

On 2026-07-18 NAV001 removed duplicated workspace navigation from the active
Enterprise UI shell. Route-level module tabs, page titles, descriptions and
breadcrumbs are no longer rendered inside `EnterpriseWorkspace`; the global
left sidebar owns that navigation. Operational actions remain visible and
non-route local tabs are preserved only where they do not duplicate sidebar
routes. `EnterpriseModulePage` now uses the full available workspace width, and
Inventory Material Detail no longer shows the Inventory module tab bar inside
the record view. No backend, API, route, permission, database or business logic
changed.

On 2026-07-18 EPIC QC001 upgraded the active QC Overview into an Enterprise
Quality Command Center. QC now follows the Inventory/Production/Components
cockpit language: KPI-first scan, quality alerts, Top N inspection queue with
`Xem tất cả`, right-side MO waiting/latest-inspection decision support, and
status/project/NCR summaries from existing data. Static calibration equipment
cards were removed and replaced with a truthful no-data state because no
authoritative calibration contract exists yet. No backend, API, React Query,
route, permission, authentication, database or business behavior changed.

On 2026-07-18 EPIC BUSINESS001 aligned Production and Components with steel
structure fabrication domain language. Production now presents MO/WO,
steel issue, steel consumption, material readiness and release-ready work
orders from existing data. Components now presents lifecycle, fabrication,
QC wait, ready-to-ship, shipping and project-distribution views without
inventing NCR or missing domain facts. No backend, API, React Query, route,
permission, authentication, database or business behavior changed.

On 2026-07-18 UX Review Round 2 improved Production and Components Overview
from a business-cockpit perspective. Production now surfaces progress,
material readiness and an attention queue for delayed, shortage and low
progress orders. Components now surfaces status distribution, project
distribution, QC waiting and ready-to-ship queues. All changes use existing
read data only; no backend, API, React Query, route, permission, database or
business behavior changed.

On 2026-07-18 UX Review Round 1 applied Inventory's table-card behavior to
Production and Components. Dashboard tables now show Top N rows and expose
`Xem tất cả` only when a corresponding full workspace exists:
`/production/orders` and `/components/list`. The dedicated workspaces remain
the place for full filtering, pagination and drawer inspection. Short datasets
no longer leave as much empty table-card height. No backend, API, React Query,
route, permission or business behavior changed.

On 2026-07-18 EPIC UI005B inferred the Inventory Golden Reference design
language and applied it to Production and Components. The implementation did
not copy Inventory data/hooks/JSX; it mapped the operating philosophy: KPI
first, filters near tables, table-dominant workspace, compact side analytics,
summary strips and drawer-preserved context. Production Overview now reads as a
manufacturing cockpit with quick actions and operational status before the
order table. Components Overview/List/Reports now use denser table rhythm and
toolbar-anchored actions. No backend, API, React Query, route, permission,
authentication, database or business behavior changed.

On 2026-07-18 EPIC UI005A completed the active Production and Components
workspace cleanup against the Inventory Golden Reference. Redundant in-page
hero/navigation chrome was removed, Production Incidents and Reports now render
real operational workspaces, Components Internal QC uses live component data
instead of static rows and Components Reports has its own route target.
Backend, APIs, DTOs, React Query, routes, permissions and business behavior are
unchanged. Visual certification is not yet approved because screenshot evidence
is blocked by the missing browser harness.

On 2026-07-18 EPIC UI006 consolidated duplicated Inventory and Production UI
patterns into `shared/ui/enterprise-components` and extended the shared
Enterprise form catalog. Inventory remains the Golden Reference through a
compatibility wrapper, while Production no longer imports Inventory visual
helpers directly. Backend, API, React Query, routes, permissions, DTOs and
business behavior are unchanged. Visual/browser certification remains pending
because the current environment has no browser harness.

On 2026-07-18 EPIC UI005 standardized the Production operator workspace and
forms against the Inventory Golden Reference. Production mutations now reuse a
single Enterprise form/modal layer, browser prompts were removed, and primary
read paths expose loading/error states. All active Production routes continue
to use existing APIs and workflows; unavailable Incidents/Reports remain
truthful empty states. Frontend compilation passes and authenticated visual QA
remains pending due to the unavailable browser harness.

On 2026-07-18 BUGFIX INV001 restored Inventory Overview and Materials table
data. The exact regression was an unauthenticated frontend endpoint adapter
calling globally protected routes and receiving HTTP 401; both pages then
rendered `items ?? []`. The adapter now reuses the canonical JWT/refresh Axios
client. Runtime data confirms 25 material records and the API/UI contracts are
unchanged.

On 2026-07-18 EPIC UI003A finalized the Inventory workspace density. The
duplicated local hero was removed, compact KPI/form dimensions were applied in
Inventory scope, Materials table visibility was stabilized against viewport
height, and modal/drawer scroll ownership was clarified. Backend/frontend
builds pass and no backend/API/query/business behavior changed. Authenticated
browser screenshots remain pending because the current environment has no
browser harness or executable.

On 2026-07-18 EPIC UI003 refined Inventory as the Enterprise UI Golden
Reference. All active Inventory routes now share operational rhythm;
KPI, pagination, table-header, confirmation, modal and drawer behavior use the
canonical primitives. Frontend compilation passes and no backend/API/business
behavior changed. Runtime visual/accessibility certification remains pending
until an authenticated browser harness is available.

On 2026-07-18 RFC016 completed the Enterprise Production Certification review.
Architecture, canonical Outbox, builds, regression and Docker artifact controls
pass, but the product is **NOT READY** for production deployment. Release is
blocked by unauthenticated Inventory/QC/Projects mutations, missing lease-based
recovery for stale claimed background work and an undeployed RFC013 index
migration lacking production-size lock/WAL validation. This certification made
no code, schema, API, business or frontend change.

On 2026-07-17 RFC013 completed the database-readiness implementation pass.
Atomic `SKIP LOCKED` claims remove queue selection races, operational telemetry
no longer runs repeated exact table counts, Inventory posting removes N+1 and
historical line materialization, and replay checkpoint writes are batched.
Prisma/build/focused tests pass and the migration remains additive/pending.
Production database certification remains conditional because live PostgreSQL
and representative-scale `EXPLAIN ANALYZE` evidence are unavailable.

On 2026-07-17 RFC012 implemented the Enterprise Data Scalability Foundation.
Outbox/replay ordering is deterministic, projection replay is checkpointed and
bounded, and projection queries offer backward-compatible keyset/no-count mode.
Additive composite indexes and guarded retention/archive/partition policy are
prepared but not deployed. Current real row counts are too small to certify
hundreds of millions or billions of rows; production-like load and archive
restore drills remain mandatory.

On 2026-07-17 RFC011 added a consistent Enterprise Query API across all seven
implemented business modules. The additive GET-only facade maps module views to
shared projection documents and extends the existing registry for QC, Yard,
Logistics and Projects canonical events. Strong operator workspace reads and
all legacy routes remain unchanged; no schema, migration, command or frontend
change was introduced.

On 2026-07-17 RFC010 implemented the internal Enterprise Operator Application
Layer. Eleven operator use-cases now coordinate existing processes and owner
commands and return a common operation envelope with process/correlation IDs,
timeline and audit receipt. The layer owns no business rules or persistence and
adds no route, frontend, schema, repository, aggregate or Projection Engine
change.

On 2026-07-17 RFC009 added the internal Enterprise Process Orchestration Layer.
Material Allocation, Production Release, QC Release, Yard Release, Shipment and
Project Completion flows coordinate only exported owner command services. The
layer provides deterministic idempotency, bounded retry, compensation and
durable process receipts without owning business rules or introducing a shared
cross-domain transaction. No route, frontend, schema, repository, aggregate or
Projection Engine changed.

On 2026-07-17 EPIC UI001 implemented the Enterprise UI Foundation using
Inventory as the unchanged design canon. All requested active module roots now
share the same header, breadcrumb, actions and tab composition; Components uses
one wrapper across every active tab. Existing cockpit primitives were reused,
with no backend, API, query, workflow or business change.

On 2026-07-17 RFC003 completed the canonical Production domain by adding the
AD-017 Production Execution aggregate. Durable run state, optimistic versions,
idempotent command replay, active-run uniqueness, atomic timeline/audit/Outbox
and existing projection routing are verified. The additive migrations are
deployed. No public API, frontend, Inventory, Components or architecture
contract changed; real operator certification remains pending.


On 2026-07-17 RFC003 exposed the canonical Components aggregate through the
additive `/components/commands` namespace. JWT, strict DTOs, durable command
idempotency and optimistic aggregate versions guard all mutations. Revision and
Engineering BOM release, immutable evidence, timeline, ActivityLog, audit
Outbox and AD-019 domain Outbox remain repository-atomic. Existing Components
routes, frontend, Inventory, Production and schema remain unchanged. Operator
certification and controlled legacy-row adoption remain pending.

On 2026-07-17 EPIC188 exposed the RFC002 Production aggregate through an
additive `/production/commands` namespace. All new mutations require JWT and
`Idempotency-Key`; existing aggregate mutations validate `expectedVersion` and
return Conflict without side effects when stale. Exact retries return persisted
results without duplicate timeline, ActivityLog or Outbox. Existing Production
routes, frontend, Inventory and database schema remain unchanged. Command API
operator certification and incremental client migration are the remaining
rollout activities.

On 2026-07-17 RFC002 implemented the canonical Production aggregate as an
internal application boundary. Production Order/Work Order lifecycle,
Completion, Scrap and Rework persistence now follow AD-017 with optimistic
versions and command idempotency. AD-019 events, timeline and audit rows are
atomic; AD-018 Inventory posting receipts are retained for Issue/Return and
recoverable Scrap. Migration `20260717160000_production_domain_aggregates` is
deployed. Public API compatibility is unchanged, so additive command contract
cutover and real operator certification are the remaining rollout gates.

On 2026-07-17 the Components Aggregate implementation added the AD-015/016/019
canonical internal command boundary. Component, Revision and Engineering BOM
state machines, one-current-release swap, immutable release evidence,
optimistic concurrency, command idempotency and atomic canonical Outbox are
implemented. The public API, UI and legacy operational `ComponentStatus` path
remain compatible and unchanged. Existing rows are not automatically migrated
into canonical lifecycle state.

ADS004 on 2026-07-17 approved the canonical Cross-module Event Contract as
AD-019 and completed the architecture gate sequence AD-015 through AD-019.
Every canonical fact now has one publisher, versioned payload, subscriber
permissions, ordering key, idempotency and retry/replay policy. Duplicate names
for Component release, Production Issue/Return/Scrap, Yard items and Logistics
shipments were resolved. Existing legacy runtime names remain compatibility
debt for focused implementation, not alternate canonical facts. No code, API,
schema, migration, workflow or data changed.

ADS003.5 on 2026-07-17 approved the Production-Inventory Application Contract
as AD-018. Reservation, Issue, Consumption, Return, Completion and Scrap now
have fixed command owners, response ownership, transaction modes and projection
rules. Issue/Return/recoverable Scrap use Inventory posting atomically and store
a bounded receipt; Consumption/Completion never post stock again. Event replay
is projection-only. No code, API, schema, migration, state machine, workflow or
data changed. ADS004 is now the final architecture gate before implementation
RFCs.

ADS003 on 2026-07-17 approved the normative Production State Machine as AD-017.
Production Order, Work Order, Execution Run, Completion, Scrap and Rework now
have fixed states, transitions, commands, events and invariants. `READY` remains
canonical, Start is atomic with first execution, partial completion is
append-only, Completion does not auto-close, Scrap is separate from Consumption
and Rework creates a linked Production Order. Existing APIs/schema/data were not
changed. Implementation remains gated by ADS004 and a dedicated additive
Production implementation RFC.

ADS002 on 2026-07-17 approved the normative Component State Machine as AD-016.
Component identity, Component Revision and versioned Engineering BOM now have
fixed states, transitions, commands, events and invariants. Release is
immutable and non-rollback; correction creates a new revision, and an atomic
replacement release supersedes the prior current revision. Archive is terminal,
non-destructive and gated by downstream obligations. The current Prisma enum,
API and records were not changed and remain compatibility-only until a separate
implementation RFC after ADS003/ADS004.

ADS001 on 2026-07-17 approved the final SteelTrack Domain Ownership Matrix for
eight bounded contexts. It supersedes prior direct foreign-repository guidance
and establishes one aggregate owner, command owner, event publisher, source
query owner and forbidden-writer rule per capability. This closes the ownership
ambiguity behind the Components and Production audit blockers. Implementation
remains gated by ADS002 Component State Machine, ADS003 Production State Machine
and ADS004 versioned Cross-module Event Contracts. ADS001 changed documentation
only.

EPIC186 Components Domain Audit on 2026-07-17 completed as documentation-only.
Components Core Platform infrastructure remains compliant, but Components
Domain Foundation is **BLOCKED** on lifecycle ownership, cross-module Component
writes, incomplete canonical event coverage, missing revision/archive domains,
and the active material-return path bypassing Production material semantics.
The next gate is Components Domain Alignment; broad backend or Cockpit UI work
must not begin before its decisions are approved.

EPIC186 on 2026-07-17 completed a read-only Production Domain Completion
assessment. Existing Production lifecycle, repository, material flow, atomic
Outbox, ADR011 read models, snapshots and runtime foundations pass static audit.
Production Domain Completion remains **BLOCKED** because Work Order is not
linked to Production Order, quantitative completion/WIP ownership is undefined,
Scrap has no approved canonical command/event, and the requested event/material
semantics conflict with PROD-011/014/015. No application code, API, schema,
migration, workflow or data changed.

EPIC185 on 2026-07-14 completed the Transfer Multi-material Pending Items UX pilot. The Điều chuyển (Transfer) transaction creation modal now supports local batching of draft material movements with exact-duplicate location merging, edit/remove controls, non-destructive API error recovery, and atomic batch posting. It features transfer-specific local available source stock calculations, visual warning and button disabling on source stock exceedance, and automatic 2D visual layout focus/highlighting back on the edited item coordinates for both source and destination minimaps. All layout styles, themes, and 2D visual layouts were preserved.

EPIC184 on 2026-07-14 completed the Outbound Multi-material Pending Items UX pilot. The Xuất kho (Outbound) transaction creation modal now supports local batching of draft material movements with exact-duplicate location merging, edit/remove controls, non-destructive API error recovery, and atomic batch posting. It features outbound-specific local available stock calculations, visual warning on stock exceedance, and automatic 2D visual layout focus/highlighting back on the edited item coordinates. All layout styles, themes, and 2D visual layouts were preserved.

EPIC183 on 2026-07-14 completed the Inbound Multi-material Pending Items UX pilot. The Nhập kho (Inbound) transaction creation modal now supports local batching of draft material movements with exact-duplicate location merging, edit/remove controls, non-destructive API error recovery, and atomic batch posting. All layout styles, themes, and 2D visual layouts were preserved.

EPIC182 on 2026-07-14 approved the Multi-material Business Specification and
Operator Workflow. Gemini now has fixed rules for Pending state, exact-duplicate
merge, edit/remove, grouped totals, validation order, dirty cancellation,
single-request submit and full rollback. UI foundation work is conditionally
ready; production rollout remains gated by workflow tests, durable public
idempotency and the documented transfer/tracking limits. EPIC182 changed
documentation only.

EPIC181 on 2026-07-14 completed the Multi-material Business Foundation.
Canonical Inventory commands now aggregate duplicate stock buckets before
validation and side effects, retain all ledger lines, enforce deterministic
transfer pairs, support stable-reference idempotency, and expose line-aware
activity/report summaries. Direct Prisma access was removed from Material
Movements. Public anonymous request idempotency and multiple same-material
transfer pairs remain explicit future additive decisions. Core Platform v1.0
remains certified; no schema, migration, public API, Snapshot Engine or workflow
changed.

EPIC174 on 2026-07-13 completed the final Core Platform certification rerun.
**CORE PLATFORM v1.0 is CERTIFIED** for Inventory, Components, Production, QC
and Yard. Atomic business/audit/domain Outbox persistence, ADR011 boundaries,
snapshot-first dashboards, module Runtime naming, shared background routing,
feature flags and Operations Center health all pass. Production operator smoke
and business certification remain separate follow-up work.

EPIC173 on 2026-07-13 completed Dashboard Snapshot Cutover Certification for
Components, QC and Yard. Additive dashboard endpoints now exercise the existing
Snapshot Reader, freshness/parity checks, repository fallback and Background
Dispatcher. Operator workspaces remain live, and UI/API compatibility was
preserved. Core Platform v1.0 remains blocked only on EPIC174 and the final
certification rerun.

EPIC172 on 2026-07-13 closed the Production Cockpit ADR011 blocker. Overview,
Orders and Planning now consume a bounded repository live read model; backend
repository code owns filtering, sorting, pagination, KPI, material readiness,
progress, queue and Work Center aggregation. The existing dashboard metrics
endpoint remains snapshot-first. UI, workflow, schema, runtime and Operations
Center were unchanged. Core Platform v1.0 remains blocked pending EPIC173-174.

EPIC171 on 2026-07-13 closed the Inventory ADR011 certification blocker.
Inventory operator workspaces now read canonical repository live models, while
Overview remains snapshot-backed. API, UI, workflow, schema and business rules
were unchanged. EPIC172 has since closed the Production Cockpit follow-up.

EPIC170 on 2026-07-13 completed the five-module Core Platform certification
audit. **CORE PLATFORM v1.0 remains BLOCKED.** Repository ownership, shared
feature flags, dispatcher infrastructure and Operations Center coverage pass.
ADR011 active-path parity, dashboard snapshot cutover and atomic Outbox parity
must be remediated before certification. No application code changed.

EPIC164 on 2026-07-13 completed Yard Runtime Metrics and Operations Center
integration. Yard now follows the shared Repository -> ADR011 Live Read Model ->
Snapshot -> Runtime -> Operations Center platform path. Integration is approved;
event freshness remains partial until reservation, hold, loading and dispatch
business workflows exist. No UI or business behavior changed.

EPIC153 on 2026-07-13 completed QC Snapshot Foundation. Additive Dashboard and
Inspection snapshot tables are deployed, with shared repository, reader,
writer, validator, rebuild, event routing and feature flag integration. No fake
rows were backfilled. Event freshness remains partial because QC
create/approve/reject/update canonical events do not yet exist.

EPIC152 on 2026-07-13 completed QC Workspace Live Read Model cutover. The active
QC workspace now uses bounded server filtering/sorting/pagination and
repository-owned KPI/trend aggregation. Hardcoded QC trend points were removed.
Existing API, UI presentation, workflow, schema, Snapshot and Runtime behavior
remain compatible.

EPIC151 on 2026-07-13 completed the QC Repository Foundation. Repository
coverage inside QC services is 100%; direct Prisma access has been removed and
existing QC domain/audit/notification Outbox rows are atomic with QC mutations.
QC remains below Core Platform compliance pending ADR011 live read models,
snapshots, runtime metrics and Operations Center integration.

EPIC150 on 2026-07-13 completed the QC Core Platform audit. QC feature maturity
remains approximately 55%, while Core Platform compliance is approximately 31%.
Repository, ADR011 read-model, atomic event, snapshot, runtime and Operations
Center gaps are documented. No application code, schema, API, UI, workflow or
business behavior was changed.

Inventory       100%
Components       90%
Production       85%
Yard             90%
Projects        100%
Suppliers        55%
Organizations     0%
QC               55%
Logistics         0%
Settings         55%
Dashboard        60%
Operations Center 20%
Documentation   100%

EPIC143 on 2026-07-12 completed Components Snapshot Foundation. Additive
dashboard and reusable component-summary snapshot tables are deployed; repository,
reader, writer, validator, rebuild, feature flag and fallback paths are wired into
the shared Core Platform. No fake snapshot rows were backfilled. Existing
`component.updated` events schedule background updates; complete persistent
create/delete event coverage remains deferred. Workspaces remain ADR011 live reads.

EPIC142 on 2026-07-12 completed Components Workspace Live Read Model cutover.
List, Overview and History now use additive, paginated repository read models;
normal workspace reads no longer download the complete Components table or
aggregate business metrics in React. History now uses real ComponentTimeline
data. Existing routes, UI presentation, mutations, legacy APIs, schema,
Inventory, Production, snapshots and runtime infrastructure were unchanged.

EPIC141 on 2026-07-12 completed the Components repository foundation.
ComponentsService and ComponentCostingService now access persistence only through
focused repositories. Costing recalculation owns one repository transaction for
the costing upsert, Component summary, and ActivityLog. Repository coverage is
100% inside the Components module; API, schema, workflow, UI, Inventory and
Production were unchanged. Overall Components Core Platform compliance remains
below freeze because read models, snapshots, events, runtime, and Operations
Center integration are intentionally deferred.

EPIC140 on 2026-07-12 completed the Components Core Platform audit. Feature
maturity remains 90%, but Core Platform compliance is 28%. ComponentsService is
repository-backed; ComponentCostingService is a direct-Prisma blocker. ADR011
workspace reads are live but currently unbounded/client-aggregated; dashboard
snapshots, persistent events, Component runtime counters/jobs and Operations
Center health are absent. QC/History/Reports also use hardcoded data. No code,
schema, API, workflow or UI was changed.

EPIC137 on 2026-07-12 completed Production certification documentation and
read-only validation. Repository, lifecycle, material-flow code, canonical event
routing, snapshot/runtime foundation and Operations Center integration are
present; focused tests pass. Runtime data has no Production snapshots, canonical
Outbox rows or Production snapshot jobs, so Production remains CODE COMPLETE but
BUSINESS CERTIFICATION BLOCKED at 65% pending one designated operator smoke run.

EPIC136 on 2026-07-11 standardized the Inventory frontend presentation
foundation without redesign. Active pagination window/markup logic now has one
Inventory shared implementation, while callers preserve their existing density
classes. Canonical cockpit/module component ownership and safe extraction rules
are documented. Domain-specific status/KPI/chart compositions and unverified
legacy placeholder trees remain intentionally deferred to avoid visual and
lazy-route regressions.

EPIC135B on 2026-07-11 completed the code path for canonical Production
material events and Background snapshot routing. Reservation/Release,
Issue/Return, and Consumption now persist Production ledger and Outbox changes
atomically; Inventory stock remains exclusively owned by InventoryPostingService.
Automated coverage passes 7 suites/24 tests. Production Material Flow remains
BLOCKED only at the real-data E2E gate because no disposable Production Order,
Reservation, or Consumption fixture exists and existing business data was not
mutated.

EPIC135A on 2026-07-11 completed Production-Inventory Transaction Boundary
Alignment. Inventory is the only writer of Inventory transactions, item quantity
compatibility state, location stock, and Inventory posting Outbox rows.
Production Issue/Return, Inventory posting, Production ledger/status, and Outbox
now share one transaction context with automatic rollback. Reservation and
Consumption/Scrap semantics were clarified. Production-Inventory Boundary is
APPROVED; EPIC135B remains responsible for full canonical Production material
event emission and Material Flow verification.

EPIC134 on 2026-07-11 implemented the canonical Production Order lifecycle end
to end. Dedicated commands enforce `DRAFT -> RELEASED -> READY -> IN_PROGRESS
<-> PAUSED -> COMPLETED -> CLOSED` and `DRAFT -> CANCELLED`; compatibility
statuses have no new outgoing transitions. Order, activity, and canonical
Outbox writes are atomic in the Production repository transaction. Background
Engine snapshot routing and EPIC133 Runtime/Operations telemetry remain the
post-commit path. Production Order Lifecycle is APPROVED.

Production Blueprint Alignment on 2026-07-11 synchronized the approved MES
blueprint, Production domain/workflow/event specifications, and Prisma enum
foundation. The canonical lifecycle is now `DRAFT -> RELEASED -> READY ->
IN_PROGRESS <-> PAUSED -> COMPLETED -> CLOSED`, with cancellation only from
`DRAFT`. New lifecycle events use `production.order.*`; legacy event names and
the persisted `PLANNED`/`DELAYED` values are compatibility-only. The additive
migration adds `READY`, `PAUSED`, and `CLOSED` without rewriting existing rows.
EPIC134 lifecycle implementation is now unblocked but was not started in this
alignment sprint.

EPIC133 on 2026-07-11 completed Production Runtime Metrics and Operations
Center Integration. Production now records module-specific snapshot hit/miss,
snapshot age/lag, read-model hit, and fallback counters through the existing
Runtime Metrics service. `/production/metrics` is snapshot-reader ready through
`DashboardReaderService` with repository fallback and the same response shape.
Operations Center now exposes Production Platform Health with repository,
snapshot, feature flag, event/outbox, background job, runtime, and parity
readiness status. No Inventory, UI, workflow, API contract, repository schema,
or snapshot foundation behavior was changed. Production Runtime Platform is
APPROVED; broader Production event contracts remain future work.

EPIC132 on 2026-07-11 completed Production Snapshot Foundation. Production now
has additive persisted snapshot schema for dashboard, order, and work-center
summaries, plus `ProductionSnapshotRepository`, reader/writer/rebuilder
integration, `USE_PRODUCTION_SNAPSHOT` feature registration, and Background
Engine event registration for existing `production.*` lifecycle events. Existing
Production workspaces remain live Repository read models under ADR011. No
Inventory, UI, API contract, workflow, Operations Center UI, or business logic
behavior was changed. Production Snapshot Foundation is APPROVED; dashboard
read cutover, Production-specific Runtime Metrics, and Operations Center
Production Health remain future work.

EPIC131 on 2026-07-11 completed Production Repository Foundation. Production
now has focused repository classes for BOM, Material Issue, Consumption,
Ledger, Production Order, Reservation, Routing, Work Center, and Work Order
paths, and Production services no longer inject or call Prisma directly.
Existing API contracts, UI, Inventory, workflow logic, snapshots, Background
Engine, Runtime Metrics, and Operations Center behavior were left unchanged.
Production Repository Foundation is APPROVED, while Production Dashboard
Snapshots and Operations Center Production Health remain future work.

EPIC130 on 2026-07-11 completed the Production Core Platform Foundation audit.
Production remains business-useful but is not yet Core Platform compliant.
Current workspaces use live reads and do not violate ADR011, but repository
coverage is incomplete, Production snapshots are not implemented in active
schema/code, Production is not registered in snapshot feature flags or snapshot
event mappings, and Operations Center does not expose Production Platform
Health. No Production/Inventory/Core Platform code was changed in this sprint.
Next Production work should start with Repository Boundary completion before
dashboard snapshot implementation.

EPIC120 on 2026-07-11 completed Workspace Read Model Standardization without
changing business logic, UI, API contracts, workflow, snapshots, events, or
repositories. The new enterprise rule is documented and accepted as ADR011:
operator workspaces use Repository Live Read Models for strong read-after-write,
while dashboards/cockpits/analytics use Persisted Snapshots with safe fallback.
The audit covered Inventory, Production, Projects, QC, Yard, Logistics,
Suppliers, and Operations Center. Production pilot found no persisted-snapshot
workspace violation, so no Production code changes were required. Projects
detail workspace tabs are scheduled for Phase 5 reclassification.

EPIC118.5.1 on 2026-07-11 completed the root-cause fix for the remaining
Inventory Materials read-after-write gap. React Query keys and active refetches
were not the final failure point; `GET /inventory/materials` could refetch and
still return stale row stock because `InventoryReadModelService.toMaterialListRow`
preferred fresh-by-age `InventoryMaterialSnapshot` stock/location payloads during
Background Engine lag. Materials rows now use live repository-included
`inventory_location_stocks` for `locationBalances` and `currentStock`, without
polling, retry expansion, API contract changes, Repository changes, or workflow
changes. Operator browser smoke validation remains pending.

EPIC118.5 on 2026-07-10 completed the Inventory React Query consistency
implementation pass. Inventory stock-affecting mutations now invalidate and
actively refetch the concrete query families for Materials, Overview, Material
Detail, Material History, Transactions, Locations, Return Requests, legacy reads,
and Dashboard. This pass is superseded by EPIC118.5.1 for the Materials table
root cause: retry-based remediation was removed and the stale API payload source
was fixed. Code verification passes; final operator smoke validation remains
pending.

EPIC118.4 on 2026-07-10 completed the final Inventory read-after-write
consistency pass. Stock-affecting frontend mutations now invalidate the active
Inventory read-model, detail, transaction, location, return, and dashboard query
families. No backend, Repository, Event/Outbox, Snapshot Engine, API contract, or
database behavior changed. Inventory Overview remains snapshot-first and uses a
5-second mounted refetch to catch background snapshot completion without manual
reload.

EPIC118.3 on 2026-07-10 remediated Inventory historical Overview metrics
without redesigning the Inventory UI or changing Inventory workflows. Global
Inventory historical metrics now persist in `InventoryDashboardSnapshot` rows
with `scopeKey = 'ALL'`; old rows are not backfilled with fake values. Latest
`ALL` snapshot parity against live inventory is PASS, and the current status is
APPROVED WITH LIMITED HISTORY until more real background snapshots accumulate.

EPIC118.1 on 2026-07-09 remediated Inventory UI data binding without redesigning
the Overview or Materials workspaces. Snapshot-backed overview/material read
contracts, server-side query state, paginated material history, real movement
metrics, and lazy transaction attachments are active. Inventory UI/Data Binding
v1.0 is APPROVED WITH LIMITATIONS; Inventory Architecture and Business Freeze
remain approved.

EPIC212 hoàn thành vào ngày 2026-07-08 thiết lập Kho Tri thức Doanh nghiệp (Enterprise Knowledge Base) của SteelTrack. EPIC này chuẩn hóa và tạo mới 6 tài liệu cốt lõi giúp đồng bộ hóa thông tin và quản lý ngữ cảnh:
* Entry Point chính thức cho Human và AI: [README.md](file:///opt/projects/steeltrack/docs/README.md) giới thiệu kho tri thức và kiến trúc hệ thống.
* Kết nối toàn bộ corpus tài liệu: [MASTER_INDEX.md](file:///opt/projects/steeltrack/docs/MASTER_INDEX.md) làm mục lục tối cao kết nối các tệp tin theo nhóm logic.
* Định hình sơ đồ cây thư mục: [DOCUMENTATION_MAP.md](file:///opt/projects/steeltrack/docs/DOCUMENTATION_MAP.md) ánh xạ cấu trúc và vai trò của từng phân khu tài nguyên.
* Cẩm nang quản lý tri thức cho con người: [KNOWLEDGE_BASE_GUIDE.md](file:///opt/projects/steeltrack/docs/KNOWLEDGE_BASE_GUIDE.md) quy định vòng đời tài liệu (DRAFT, PROPOSED, ACTIVE, FROZEN) và tiêu chí đóng băng kiến trúc để ngăn chặn hiện tượng trôi lệch tài liệu (Documentation Drift).
* Chiến lược nạp ngữ cảnh tối ưu cho AI: [AI_LOADING_GUIDE.md](file:///opt/projects/steeltrack/docs/AI_LOADING_GUIDE.md) thiết lập ngân sách token (10k-15k tokens) và 5 lớp kế thừa ngữ cảnh cho AI Subagents theo từng phân hệ.
* Báo cáo kiểm toán chất lượng tài liệu: [DOCUMENTATION_AUDIT.md](file:///opt/projects/steeltrack/docs/DOCUMENTATION_AUDIT.md) rà soát, phân loại 200+ tệp markdown và lập kế hoạch dọn dẹp các báo cáo tĩnh, báo cáo polish UI cũ sang thư mục lưu trữ.


Core Platform Architecture documents (Naming Conventions, API Contracts, Domain Boundaries, Performance SLA, Versioning Policy, Module Dependency Map) completed on 2026-07-08. It defines the system naming conventions (DB, repos, events, snapshots, versioning), REST API design standards (pagination, filtering, Zod error formats), detailed module boundaries and caller permission matrices, performance targets (Dashboard < 150ms, Lookup < 80ms, Search < 300ms, Detail < 120ms, Report < 1000ms), background worker exponential backoff math, DLQ rules, snapshot freshness/lag limits, semantic versioning and double-write schema migrations, and deployment rollback protocols.

Enterprise Architecture Governance & ADRs (ADR001-ADR010) completed on 2026-07-08. It establishes the Software Architecture Quality Management process, the Architecture Guardian role guidelines, the periodic Architecture Review Board (ARB) processes, and 10 core Architectural Decision Records (ADRs) detailing design patterns (Repository, Snapshot First, Background Engine, Outbox, and more) aligning with the SteelTrack Core Platform architecture.

EPIC210 on 2026-07-08 completes the Enterprise Standards and Guidelines. It establishes the detailed architecture standards for SteelTrack, including Bounded Context maps, outbox events catalog and schemas, read-model caching strategies, persisted snapshot DB structures, repository-layer design patterns, runtime telemetry and SLO targets, background engine and DLQ queues, Operations Center health probes, and standard UI cockpit/dashboard conventions.

EPIC202 & EPIC203 on 2026-07-08 completes the Quality Control (QC) Blueprint and Logistics Master Blueprint detailed system design. The blueprints specify domain schemas (Prisma notation), aggregates, consistency rules, outbox event flows, read models, persisted snapshots, background scheduler jobs, cockpit dashboard layouts, Operations Center integration, AI integrations (checklist generator, route/load optimizer), technical risks, and phased implementation roadmaps.

EPIC201 on 2026-07-08 completes the Projects Blueprint (PMS) detailed system design. The blueprints specify hierarchical WBS tree structures, dynamic scheduling (Gantt chart), material and component allocations, outbox event flows, tab-gated read models, persisted dashboard and runtime snapshots, mobile-responsive Site Mode, inspection workflows, material returns lifecycle, technical risks, performance budgets, Operations Center telemetry, and a phased implementation roadmap.

EPIC208 & EPIC209 on 2026-07-08 completes the AI Enterprise Blueprint (AI Ecosystem) and Enterprise Integration Blueprint (Cross-Module Data Flow) detailed system design. The blueprints specify domain schemas (Prisma notation, domain models, aggregates), cross-chain domain event flows, read models, persisted snapshots, background engine jobs, Dark Cockpit UI widgets, Operations Center integrations, technical risks, and phased implementation roadmaps.


EPIC206 & EPIC207 on 2026-07-08 completes the Finance Blueprint (EPIC206) and HR Blueprint (EPIC207) detailed system designs. The blueprints specify domain schemas, aggregates, outbox event flows, read models, persisted snapshots, background scheduler jobs, financial & HR dashboard layouts, Operations Center integration, AI forecast and optimization models, technical risks, and phased implementation roadmaps.

EPIC204 & EPIC205 on 2026-07-08 completes the Yard Blueprint (YMS) and Purchasing Blueprint (Procurement) detailed system design. The blueprints specify domain schemas (Prisma notation), aggregates, consistency rules, outbox event flows, read models, persisted snapshots, background scheduler jobs, manufacturing-cockpit dashboard layouts, Operations Center integration, AI optimizers (smart stacking and bidding anomaly detection), technical risks, and phased implementation roadmaps.

EPIC114 on 2026-07-08 completes the Production (MES) Blueprint and System Design. It details the domain spec (WorkOrder, Shifts, Downtime, OEE, Rework, Scrap), asynchronous outbox event flow, cached read models, persisted snapshot strategy (rebuilder, keys, payloads), manager/operator cockpit dashboards, and operational SOP workflows. It provides a structured 8-sprint implementation roadmap to move Production to 100% completion using the Core Platform patterns (Outbox, Background Engine, snapshots, and Operations Center).

EPIC112 INV.CORE.2 on 2026-07-08 completes the Inventory Snapshot Completion and Architecture Freeze candidate pass. It adds persisted `InventoryMaterialSnapshot` and `InventoryLocationSnapshot` domain models, applies migration `20260708103000_inventory_domain_snapshots`, connects Inventory lifecycle events to Background Engine snapshot update jobs, switches Material Detail and Inventory Locations to snapshot-first readers with repository fallback, and extends Operations Center with material/location snapshot health, freshness, hit ratio, lag, and rebuild status. Inventory is now the architecture reference for future modules; Production, Purchasing, QC, Maintenance, and other modules should inherit this pattern instead of creating separate runtime/read-model/snapshot stacks.

EPIC115 on 2026-07-08 raises Projects to 95% Core Platform Compliance. It removes direct `PrismaService` usage from `ProjectsService`, routes template/WBS/component-return persistence through `ProjectsRepository`, adds persistent `project.*` outbox events and Background Engine snapshot update requests for Project mutations, exposes Project-specific runtime metrics, and adds Project Platform Health to Operations Center. Projects is now an Architecture Freeze Candidate; final freeze requires persisted Project Detail tab snapshots.

EPIC116 on 2026-07-08 completes Project Detail Snapshot Completion and marks Projects Architecture Freeze v1.0 APPROVED. It adds persisted `ProjectDetailSnapshot` rows per project/tab, applies migration `20260708143000_project_detail_snapshots`, switches `GET /projects/:id/detail/:tab` to snapshot-first reads with repository-backed fallback, adds Project Detail snapshot writer/parity/runtime metrics, and extends Operations Center with Project Detail snapshot health. Projects now follows the frozen Core Platform pattern: Repository, Snapshot, Read Model fallback, Event/Outbox, Background Engine, Runtime Metrics, Operations Center, and Snapshot Parity.

EPIC109 OPS.1 on 2026-07-08 introduced the first read-only Operations Center module. It added `/operations-center`, `GET /operations-center/overview`, system health cards, runtime/API/job/snapshot/cache/database/storage/event/performance/alert workspaces, and documentation. It does not change business workflows, existing API contracts, Prisma schema, or UI patterns outside the new system cockpit.

EPIC 106 Enterprise Background Engine Implementation on 2026-07-07 did not change module percentages. It implemented backend-only background engine plumbing: BackgroundJobManager, SnapshotUpdateDispatcher, SnapshotRebuilder acceptance path, persistent Outbox, Event Publisher, Event Consumer, Retry Policy, and idempotent snapshot job scheduling. No UI, workflow, API contract, schema, or business logic changes were introduced.

EPIC 105 Enterprise Background Engine on 2026-07-07 did not change module percentages. It designed the background snapshot architecture, snapshot update contracts, snapshot rebuilder behavior, and event bus foundation for Inventory, Projects, Logistics, and Dashboard. No UI, workflow, API contract, schema, background worker behavior, or business logic changes were introduced.

EPIC 104 Enterprise Data Engine on 2026-07-07 did not change module percentages. It added a schema-backed composite index migration for enterprise-scale Inventory, Projects, ReturnRequest, and ActivityLog query paths; captured before/after EXPLAIN plans; and documented persisted snapshot architecture. No UI, workflow, API contract, or business logic changes were introduced.

EPIC 103 Runtime Analytics Foundation on 2026-07-07 did not change module percentages. It added backend-only in-memory runtime analytics over RT.1 metrics: endpoint/query rankings, read-model effectiveness, rule-based recommendations, 5m/1h/24h windows, performance score, and architecture score. No UI, workflow, API contract, schema, or business logic changes were introduced.

EPIC 102 Runtime Instrumentation & Observability on 2026-07-07 did not change module percentages. It added backend-only runtime request metrics, Prisma query profiling, query budget warnings, slow query detection, runtime health snapshots, read-model/cache hit counters, and documentation under `docs/runtime/`. No UI, workflow, API contract, schema, or business logic changes were introduced.

EPIC 101 Enterprise Scalability Foundation on 2026-07-07 did not change module percentages. It added documentation-only performance gates, enterprise query audit, index audit, and 5-year data growth planning for partitioning, archives, persisted read models, and event contracts. No schema, UI, workflow, or API contract changes were introduced.

EPIC 100 Core Foundation on 2026-07-07 did not change module percentages. It added repository-layer boundaries for Inventory aggregate reads, Project runtime/detail source queries, and Logistics dispatch aggregates; documented persisted read-model migration paths; segmented Project Detail tab queries; and created query budget/audit reports. No schema, UI, workflow, or public API contract changes were introduced.

Epic PERF Foundation on 2026-07-07 did not change module percentages. It audited Dashboard API transaction hotspots, introduced an internal cached Inventory dashboard read model, preserved existing Dashboard API compatibility, and added tab-scoped lazy detail loading boundaries for Projects, Inventory Material Detail attachments, and Logistics dispatch detail. Backend and frontend builds passed.

Sprint UX.1 on 2026-07-02 did not change module percentages. It compacted the route-derived topbar to a 50px shell and replaced collapsed sidebar mode with a 64px icon rail plus flyout menus backed by the existing navigation tree.

Dynamic Workspace Header hotfix on 2026-07-02 did not change module percentages. The topbar now derives module and workspace titles from route metadata, removes the static `SteelTrack ERP` label, and removes Inventory breadcrumb output so Inventory pages show only two header lines.

Sprint INV.NAV.2 on 2026-07-02 did not change module percentages. It restored Inventory operational pages into the sidebar under `Nghiệp vụ nâng cao` while reusing existing routes for inbound, outbound, transfer, stock take, adjustments, alerts, and audit. The nested group is collapsed by default, remembers expansion per session, and auto-opens for active child routes.

Inventory Return Requests workspace on 2026-07-01 completed. Inventory now has `/inventory/returns` with Requested/Received/Accepted/Rejected views, return request KPIs, detail drawer, receive action, and reject action. Project Pending Return quantities link directly into this workspace with project/material filters. Reject uses existing `CANCELLED` status to avoid schema changes; receive continues to use the existing Inventory return workflow and reconciles Project material allocation. Backend and frontend builds passed.

Sprint 40PROJ.10 on 2026-07-01 increased Projects to 86%. It adds template-driven task rules, Auto WBS generation, bulk task operations, a Project Detail `Công trường` Site Mode tab, Site Mode ActivityLog writes, document category filters, and executive shortage/forecast panels in the Project Command Center. New backend endpoints are `POST /projects/:id/wbs/generate`, `PATCH /projects/:id/wbs/bulk`, and `POST /projects/:id/site-update`. Backend and frontend builds passed.

Sprint 40PROJ.9 on 2026-07-01 increased Projects to 82%. It recovered Projects usability around real runtime data: `/projects/templates` routing is now synchronized, Project Detail uses a centered execution drawer, Project edit is available through `PATCH /projects/:id`, Project Component Return clears project assignment and writes timeline/activity logs, and Projects cost/documents/logs tabs now use financial read models, Attachments, and ActivityLog data instead of placeholders. WBS task creation now defaults to Simple Mode with parent tree select, duration, smart date suggestions, and steel erection suggestions. Backend and frontend builds passed.

Projects runtime hotfix on 2026-07-01 completed. The active database was missing ProjectTask and ProjectTemplate tables because `20260630100000_project_task_domain` had failed during SQL backfill, leaving `20260630100000_project_task_domain` and `20260630113000_project_template_library` pending. The migration SQL alias issue was repaired, the failed migration was resolved as rolled back, and both migrations were deployed. `project_tasks`, ProjectTask dependency/allocation/resource/inspection/cost tables, and `project_templates` now exist. Projects service now has table-readiness guards and safe fallbacks for runtime/templates/WBS paths, and the Projects frontend avoids infinite retries with explicit empty/error states. Backend and frontend builds passed.

NestJS Dependency Injection Hotfix on 2026-06-30 completed. Resolved the `PermissionsGuard` / `RbacService` `UnknownDependenciesException` by adding `RbacModule` to the `imports` array of `ProjectsModule`. This ensures `PermissionsGuard` (which is applied via `@UseGuards(PermissionsGuard)` on `ProjectsController`) can successfully resolve the required `RbacService` in the `ProjectsModule` context. Created hotfix report at `docs/bugs/projects-rbac-di-hotfix-report.md`. Both backend and frontend builds and startups passed successfully.

Sprint 40PROJ.8 on 2026-06-30 increased Projects to 76%. It adds a persisted Project Template Library (`ProjectTemplate`) with default `Nhà xưởng 5 nhịp` seed, template CRUD/publish/default/import/export APIs, template-backed project creation that generates normalized WBS/dependencies/schedules/resources/allocations, a Projects Templates workspace, and a Quick Update panel for low-data-entry field progress updates. Backend and frontend builds passed after Prisma Client generation.
Sprint 40PROJ.7 on 2026-06-30 increased Projects to 72%. It replaces the active WBS metadata bridge with normalized Project execution persistence: `ProjectTask`, `ProjectTaskDependency`, `ProjectTaskMaterialAllocation`, `ProjectTaskComponentAllocation`, `ProjectTaskResource`, `ProjectTaskInspection`, and `ProjectTaskCost`. Existing WBS APIs keep the same frontend contract but now read/write `project_tasks`; migration `20260630100000_project_task_domain` backfills legacy `Task.description` JSON rows without deleting old task rows. Activity-log event hooks were added for project task/material/cost/inspection changes. Backend build passed after Prisma Client generation; frontend remains visually unchanged.
Sprint 40PROJ.3 on 2026-06-30 increased Projects to 65%. It added Project Execution read models to `GET /projects/runtime` for WBS, financial summaries, health warnings/actions, and return requests using existing schema only. The Project Detail workspace now includes financial KPI cards, Project Health, a WBS tree grid, and a working material return entry point through the existing Inventory Return workflow (`SITE_RETURN`). WBS CRUD and Component Return remain future schema/API work. Frontend and backend builds passed successfully.
Sprint 40PROJ.1 on 2026-06-30 increased Projects to 60%. It refactored Projects into an Inventory-aligned cockpit with shared `CockpitKpiCard`, `CockpitChartCard`, `CockpitTableShell`, `DataTablePagination`, `CockpitEmptyState`, `CockpitRecentList`, and `CockpitStatusList` primitives. Projects now has real-runtime KPI/analytics panels, an Inventory-style project table, and a Project Detail workspace drawer with Tổng quan, Vật tư, Cấu kiện, and Tiến độ tabs. No backend, API, Prisma schema, migration, or workflow changes were introduced. Frontend and backend builds passed successfully.
Sprint AUDIT.1 on 2026-06-29 did not change module percentages. It created the enterprise architecture audit pack in `docs/audit/`, including maturity matrix, workflow/costing/import/realtime/performance readiness reports, technical debt, and roadmap recommendations. The audit concluded the next highest-value sequence is Workflow Engine Binding P0, Inventory Ledger & Historical Import Readiness, and Component/Project Cost Traceability before deeper new UI/workspace expansion.
Sprint 70EXEC.2 on 2026-06-29 increased Dashboard to 60%. It extended the Executive Cockpit into a Control Tower with backend `DashboardInsightService` and `DashboardRecommendationService`. `GET /dashboard/executive-cockpit` now returns health score, 7-day executive summary, suggested actions, trends, activities, and notifications. Dashboard KPI Chính now starts with Health Score, Executive Summary, Suggested Actions, Activities by Module, and Notification Center, while Recent Activities also shows module grouping plus timeline. Frontend and backend builds passed successfully.
Sprint 70EXEC.1 on 2026-06-29 increased Dashboard to 55%. It added backend Executive Cockpit services (`DashboardMetricsService`, `DashboardActivityService`, `DashboardNotificationService`) plus `GET /dashboard/executive-cockpit`. Dashboard now has URL-driven tabs for KPI Chính, Biểu đồ xu hướng, Hoạt động gần đây, and Thông báo. Predictive trends use real Inventory transactions/location stocks, BOM/material issue data, and rolling averages; activities unify real Inventory, Production, Yard, QC, Purchasing, and Project events; notifications are generated from rule-based operational conditions and persisted notifications. Created `docs/ui/executive-cockpit-report.md`. Frontend and backend builds passed successfully.
Sprint 80YARD.1R on 2026-06-28 did not change Yard percentage. It restored the existing Yard 3D workspace by reconnecting `/yard/map-3d` to `YardOperationalMap3D`, reusing the already-present React Three Fiber/Drei dependencies and existing GLB assets. Runtime Yard slots are preferred; clean/empty datasets fall back to local demo slots with an explicit demo badge. Created `docs/ui/yard-3d-restoration-report.md`. Frontend build passed and emitted a `YardOperationalMap3D-*.js` chunk; backend build passed successfully.

Sprint 80YARD.1 on 2026-06-27 increased Yard to 72%. It expanded Yard into a route-backed advanced workspace with tabs for overview, 2D map, pseudo-3D map, locations, components, dispatch, live tracking, heatmap, timeline, and history. That sprint temporarily rendered the 3D tab with CSS pseudo-3D from real zone/slot/stack data; Sprint 80YARD.1R later restored the existing GLB/R3F implementation. Decorative Yard trends were removed; movement trends now read actual `yard_movements`. Dispatch shows real available locations and overloaded-zone conflicts while leaving pending move workflows as explicit empty states until backend support exists. Created `docs/ui/yard-advanced-workspace-report.md`. Frontend and backend builds passed successfully.

Sprint 50NAV.2 + 60UI.2 on 2026-06-27 completed. Yard and Logistics navigation now use concrete route-backed tabs synchronized across AppRouter and both sidebar configs. Yard moved from hash-based tab state to `location.pathname`, and Logistics moved from local tab state to URL-derived tab state. Dashboard KPI Chính was rationalized to real data: Inventory KPI strip now reads Inventory Audit/transactions, and Production, Projects, and Suppliers panels use existing runtime/API hooks. Hardcoded Dashboard timestamps were removed. Created `docs/ui/navigation-yard-logistics-fix-report.md` and `docs/ui/dashboard-kpi-rationalization-report.md`. Frontend and backend builds passed successfully.

Module Navigation Completion on 2026-06-27 (Sprint 50NAV.1) completed. Synchronized AppRouter, sidebar configs, and module tab state for Components, Production, Projects, Suppliers, and QC. Projects, Suppliers, and QC now derive active tabs from URL paths instead of local state, while Production and Components received missing route entries and menu alignment. Created `docs/ui/navigation-audit-report.md` and `docs/ui/navigation-completion-report.md`. Frontend and backend builds passed successfully; no backend, API, Prisma, schema, migration, or workflow changes were introduced.

KPI Typography Polish on 2026-06-27 (Sprint 20D.4B) completed. Polished typography rules for executive KPI cards: set labels using `text-[12px] font-medium text-slate-400` (removing uppercase and letter-spacing), updated card values to use `font-bold tabular-nums text-[38px] xl:text-[42px] leading-none tracking-tight` (removing font-mono), verified deltas are formatted using standard Vietnamese units (`▲ 2,4 ngày (+6,1%)`, `▲ 1 chuyền (+5,9%)`, `▲ 12K kiện (+4,8%)`, `▲ 0,6%`, `▼ 2 cảnh báo (-22%)`), and updated card shell layout spacing to use `px-5 py-4` and `gap-y-2` attributes. Both frontend and backend builds passed successfully.

Yard Cockpit Unification on 2026-06-27 (Sprint 30Y.2) completed. Re-aligned the layout configurations, spacings, tables, grids, and KPI cards in `YardPage.tsx`, `YardTabWorkspace.tsx`, `YardZoneDetailDialog.tsx`, and `YardOperationDialog.tsx` to match the WMS / Inventory design system. Replaced custom KPIs with `h-[108px]` standard `<CockpitKpiCard />` cards, integrated `<CockpitChartCard />` cards (`h-[170px]` card heights, `h-[74px]` chart body viewports), unified table shells (`border-b border-cyan-400/10` headers and row hovers), added `<DataTablePagination />` paging inside MovementTable and QCTab, and aligned drawer/detail panels to the `COCKPIT_SHELL` standard. Created audit report at `docs/ui/yard-cockpit-unification-report.md`. Both frontend and backend builds passed successfully.

Cockpit Unification Phase 2 on 2026-06-27 (Sprint 20C.9 & 20P.9A) completed. Standardized layout systems, grids, cards, tables, and drawers of both the Components and Production modules to visually align with WMS / Inventory design system. Created four new generic shared cockpit components (`CockpitSidebarStats`, `CockpitRecentList`, `CockpitStatusList`, `CockpitEmptyState`), mapped cockpit panels to `COCKPIT_SHELL`, KPI cards to standard `CockpitKpiCard` (`h-[108px]`), quick analytics to `<CockpitChartCard />` (`h-[170px]` card height, `h-[74px]` chart viewport), and standardized table cell and header paddings to `px-4 py-2.5 text-xs`. Created visual audit reports at `docs/ui/components-final-unification-report.md` and `docs/ui/production-workspace-unification-report.md`. Both frontend and backend builds passed successfully.

KPI Layout Unification on 2026-06-27 (Sprint 20D.4A) completed. Restructured the executive KPI layouts in `CockpitKpiCard.tsx` and `DashboardPage.tsx` to follow a top-to-bottom hierarchy: Label (Top), Large Value (Center), and Delta (Bottom). Upgraded typography settings to Label (11px), Large Value (38px/42px), and Delta (11px). Removed large icons, status chips, pulse indicators, extra descriptions, and duplicate labels. Re-added inline units to value displays (e.g. `42 ngày`, `18 chuyền`, `256K kiện`, `7 cảnh báo`), customized deltas to use standard `▲`/`▼` leading symbols, and set background sparkline opacity to 3% (`opacity-[0.03]`). Both frontend and backend builds passed successfully.

Dashboard Empty States & Density Optimization on 2026-06-27 (Sprint 20D.3C) completed. Added custom empty state renderers inside Forecast, Pipeline, Yard, QC, and Production panels so charts never display as empty black boxes. Optimized panel heights to make cards compact: Forecast (260px), Pipeline (260px), Yard (260px), Replenishment (260px), QC (260px), Activity (220px), and Assumptions (160px). Increased base font size readability to a minimum of 13px (for headers and rows) and 12px (for secondary metrics). Clamped activity descriptions to a maximum of 2 lines, and reduced vertical row whitespace to display more content efficiently. Both frontend and backend builds passed successfully.

Executive Dashboard Final Polish on 2026-06-27 (Sprint 20D.3B) completed. Polished the cockpit layouts: updated KPI card padding configurations to `px-4 py-4` and card value text classes to `text-[44px] xl:text-[48px]` to optimize negative space and visual weight; scaled the grouped bar chart card height to `h-[380px]` (chart body `h-[290px]`) to visually dominate the screen; reformatted alerts under a counter header `Cảnh báo (N)` using a unified `⚠` indicator, alert title (`row.code`), localized description (`Tồn X · thiếu Y SET`), and relative time (`2 phút trước`); and replaced the recent activity timeline with a compact bulleted log of actions, descriptions, operator names, and relative times. Both frontend and backend builds passed successfully.

Executive Dashboard UX Redesign on 2026-06-27 (Sprint 20D.3) completed. Completely redesigned `DashboardPage.tsx` into a 5-row Manufacturing Command Center Cockpit: removed header titles/descriptions to start immediately with KPI cards, converted status dots to static (no pulse animation), aligned Row 1 KPIs to have 48px visual weight values without units, replaced inventory forecast area chart with a grouped bar chart ("Biến động nhập - xuất - tồn kho") with legends on top and summary metrics below, constrained the alerts panel to the top 4 items with subtle borders, integrated full occupancy details to Yard occupancy, added QC line-series trends, optimized material replenishment to use horizontal bars on left and a top-5 table on right, implemented a compact recent activity timeline, and formatted the assumptions panel as a simplified checklist with a 30% height reduction. Both frontend and backend builds passed successfully.

Dashboard Text Density Reduction on 2026-06-27 (Sprint 20D.2G) completed. Reduced visual clutter and text density across the dashboard: replaced text status badges inside `CockpitKpiCard.tsx` with colored glowing dots, shortened KPI titles (`Ngày tồn`, `Sản xuất`, `QC đạt`) and panel titles (`Sử dụng bãi`, `Xu hướng QC`, `Cảnh báo`, `Sản xuất`), and emphasized raw numeric values (`42`, `18`, `256K`, `96,8%`, `7`) by relocating units to subtitle labels and trends. Both frontend and backend builds passed successfully.

Dashboard Text Simplification & Localization on 2026-06-27 (Sprint 20D.2F) completed. Simplified the dashboard header layout by replacing `ModulePageHeader` with a single `"Tổng quan"` title. Localized all 8 panel titles, translated the 5 KPI titles, simplified status chips to `'LIVE'`, `'RUN'`, `'WARN'`, and shortened trend descriptions (e.g. `+2,4 ngày`, `+1 chuyền`, `+12 nghìn tấn`). Both frontend and backend builds passed successfully.

Executive KPI Redesign on 2026-06-27 (Sprint 20D.2C) completed. Enhanced the shared `CockpitKpiCard` component (`CockpitKpiCard.tsx`) to support executive layout formats, custom state values (loading, empty, normal, alert), color-coded tones (cyan, blue, emerald, amber, red), trend text, status badge, and background sparkline charts. Updated `DashboardPage.tsx` to render the 5 redesigned KPI cards directly using the shared component, achieving horizontal rhythm alignment, responsive scaling across viewports, and clean negative space. Both frontend and backend builds passed successfully.

Executive Dashboard Implementation on 2026-06-27 (Sprint 20D.1) completed. Redesigned the Inventory Overview Page (`InventoryOverviewPage.tsx`) into a modern Manufacturing ERP Cockpit (Executive Dashboard). Reused the existing shared cockpit components (`CockpitKpiCard`, `CockpitChartCard`, `COCKPIT_HEIGHTS`) to render 5 executive KPI cards, an inventory forecast area chart, a component pipeline stages donut chart, shift-throughput pulse stats, severity-grouped exception alerts, chronological events, and circular OEE performance gauges. Further refactored by extracting child views into modular component files inside `components/dashboard/`, reducing the main page to 198 lines. Both frontend and backend builds passed successfully.

Components Theme Unification on 2026-06-27 (Sprint 20C.8) completed. Synchronized the Components cockpit page (`ComponentsListPage.tsx`) visually and behaviorally with the Inventory Materials design system: implemented fluid root layout (`w-full min-w-0 flex-1 space-y-1`), `gap-1` spacing, local `InventoryMetricCard` elements (Tổng cấu kiện, Đang sản xuất, Hoàn thành, Chờ vật tư, Trễ tiến độ), local `ChartCard` containers (`h-[220px]`), newest created and most used (by quantity) lists, direct table styling (hover-cyan row highlights, transparent bg, right-aligned numeric columns, and pagination parity), and a unified create modal. Completed a strict visual audit to remove all duplicate borders and verify zero prohibited Tailwind classes (`gap-3`, `gap-4`, `space-y-4`, `max-w-3xl`) remain. Both frontend and backend builds passed successfully.

Inventory Locations KPI Cockpit on 2026-06-26 (Sprint 20I.5F) completed. Replaced the first 5 location cards with WMS KPI Cockpit cards identical to materials/overview. Implemented 6-month historical rollback trends (totalLocationsTrend, occupiedLocationsTrend, emptyLocationsTrend, occupancyPercentTrend, totalStockTrend) and dynamic delta note formats for value, weight, percentage points, and location counts in a responsive 5-column grid. Both frontend and backend builds passed successfully.

Inventory Locations Top 5 Preview on 2026-06-26 (Sprint 20I.5E) completed. Refactored the dashboard analytics cards to render only the top 5 sorted rows in preview mode using separate sliced preview memos (`previewValueByLocation`, `previewStockByLocation`, `previewRecentInbound`, `previewRecentOutbound`, `previewTopMaterials`, `previewZoneCapacity`), while keeping source dataset memos full and unsliced for the "Xem tất cả" modal dialogs. Configured specific DESC/newest-first sorting on all data sets. Eliminated redundant calculation duplicate memos. Preserved all query hooks, APIs, and backend services. Both frontend and backend builds passed successfully.

Inventory Locations Responsive Workspace on 2026-06-26 (Sprint 20I.5D) completed. Removed all fixed width constraints, `max-w-*` limits, `mx-auto` centering wrappers, container classes, and hardcoded column/sidebar widths like `w-[1040px]` or `w-[320px]`. Configured the root layout wrapper to `w-full min-w-0 flex-1 space-y-1`. Set the main Row 1 layout to a 12-column grid (`grid-cols-12 gap-1`) where "Danh sách vị trí kho" takes `col-span-12 2xl:col-span-8` and the right sidebar takes `col-span-12 2xl:col-span-4`. Configured the bottom analytics cards (Row 2, 3, 4) to use a 12-column grid (`grid-cols-12 gap-1`) with `col-span-12 xl:col-span-6` for each of the cards, ensuring the dashboard grows and shrinks dynamically to fit all monitors and sidebar states. Preserved all original query hooks, useMemo metrics, and API/chart logic. Both frontend and backend builds passed successfully.

Inventory Locations Dashboard Usability Polish on 2026-06-26 (Sprint 20I.5C) completed. Enlarged "Danh sách vị trí kho" to `h-[560px]` with larger font sizes, detailed columns (Kho, Zone, Slot, Tầng, Khối lượng, Số vật tư, Trạng thái), and rounded-full status badges (Đang dùng, Trống, Bảo trì). Enlarged the four analytics cards to heights of `h-[320px]` and `h-[300px]`, and added a "Xem tất cả" header button on each card to trigger modal dialogs displaying full tables (values, weights, imports, and exports with transaction dates) with `fixed inset-0 bg-slate-950/75 backdrop-blur-md max-h-[70vh] overflow-auto rounded-2xl` styling. Preserved all original query hooks, useMemo metrics, and API logic. Both frontend and backend builds passed successfully.

Inventory Locations Dashboard Layout Polish on 2026-06-26 (Sprint 20I.5B) completed. Repositioned "Danh sách vị trí kho" to the left as the primary section with `h-[520px]` and responsive desktop width. Created a stacked right sidebar (width 320px, `gap-1`) with three charts (donut, vertical bar chart, pie chart). Replaced horizontal bar charts with compact top-5 Vietnamese tables (rounded-xl, border border-white/10, bg-[#08111f]/90, text-[11px] and py-1 px-2 cell spacing) for values, weights, imports, and exports. Reduced spacing to `gap-1` and `space-y-1`. Fully localized all units and labels. Running frontend and backend builds passed successfully.

Inventory Locations Dashboard redesigned on 2026-06-26 (Sprint 20I.5A) completed. Redesigned the dashboard charts layout in InventoryLocationsPage.tsx to match the MES/WMS Cockpit theme: unified card styles to use the premium translucent cockpit theme (gradients, rings, and borders), arranged cards into 5 rows with specific heights (`h-[220px]`, `h-[250px]`, `h-[280px]`), utilized `LocationsChartCard` wrapper, `CompactDonutSummary`, and `HorizontalBars` components, and replaced the old slot transfer routes chart with a new "Phân bố sức chứa theo kho" (Capacity Distribution by Warehouse/Zone) chart showing tons, occupancy percentage, and occupied slot counts. Both frontend and backend builds passed.

Inventory Materials Parity Audited and Sparklines Synchronized on 2026-06-26 (Sprint 20I.4F) completed. Audited visual and snapshot calculations for InventoryMaterialsPage.tsx. Synchronized the monthly snapshots to compute 12 end-of-month snapshots, implemented data age detection with flat line fallbacks, and fixed low stock/out stock alerts to use main warehouse stock rollbacks, ensuring complete parity with the Inventory Overview page. Preserved card heights of Phân bố tồn kho, Biến động tồn kho, and Cảnh báo tồn kho at h-[170px] with scroll containers for the original chart dimensions. Both frontend and backend builds passed.

Inventory Materials KPI cards visual/behavior parity on 2026-06-26 (Sprint 20I.4E) completed. Aligned the first 5 KPI cards in the Inventory Materials tab to be visually and behaviorally identical to the Inventory Overview KPI cards: configured `rounded-2xl`, `border-slate-800`, `bg-slate-950/60`, equal height `h-[108px]`, and `p-4` padding. Set typography hierarchy: title `text-[10px] uppercase tracking-[0.12em] text-slate-400`, value `text-2xl font-semibold text-white mt-1`, and subtitle `text-[10px] mt-1`. Formatted value metrics with Vietnamese locale decimal commas (e.g. `▲5.203,5 tấn (+48,3%)`) and count metrics (e.g. `▲3 mã`, `▼2 mã`), removing "+ mới so với tháng trước" / "Chưa có dữ liệu lịch sử" fallbacks. Note colors and tones (emerald, cyan, indigo, amber, red) are standardized. Frontend build passed.

Inventory Materials KPI value format updated on 2026-06-26 (Sprint 20I.4D) completed. Formatted the value rows of all 5 Inventory Materials dashboard cards as clean KPI values (e.g. Card 1/2: 15.970,5 tấn, Card 3: 12, Card 4: 3, Card 5: 6) and moved all descriptive/explanatory text into subtitles (e.g. 6 kho hoạt động, ▲5.203,5 tấn (+48,3%), ▲2 với tháng trước, 3 mức, Dưới định mức), maintaining the h-[64px] visual rhythm and font sizes. Frontend build passed.

Inventory Materials cards vertical rhythm aligned on 2026-06-26 (Sprint 20I.4C) completed. Restyled the header container of ChartCard to a fixed height of h-[64px] with flex flex-col justify-start layout, ensuring all chart elements align perfectly. Configured subtitles to use exact spacing (mt-1) and compact formats: 6 kho hoạt động, ▲5.203,5 tấn (+48,3%), ▲2 với tháng trước, 3 mức cảnh báo, and Dưới định mức, preserving all calculations, datasets, and grid architecture. Frontend build passed.

Inventory Materials dashboard cards visually restyled on 2026-06-26 (Sprint 20I.4A) completed. Restyled all 5 dashboard cards to visually match the Inventory Overview KPI visual guidelines: rounded-2xl containers, border-slate-800, bg-slate-950/60, equal height h-[260px], and updated card header font sizes (title: text-[10px], value: text-2xl, delta: text-[10px]). Cards 1, 2, and 3 are in the materials tab layout, while Cards 4 and 5 are restyled inside the alerts modal sidebar, preserving calculations, datasets, and grid architecture. Frontend build passed.

Inventory Overview category KPI cards typography polished on 2026-06-25 (Sprint 20I.3S) completed. Changed delta notes format from `▲999 tấn | +94,8%` to `▲999 tấn (+94,8%)`. Styled category card values with count in `text-white font-semibold` and quantity in `text-slate-400 font-normal text-[14px]`. Preserved dark cockpit, responsive grid, sparklines, colors, delta calculations, snapshot rollback logic, and equal height. Frontend and backend builds passed.

Inventory Overview category KPI cards simplified on 2026-06-25 (Sprint 20I.3R) completed. Removed `compositionText` rendering and all composition subtitles from the category cards. Ensured all 8 KPI cards maintain equal height `h-[108px]`. Preserved dark cockpit, responsive grid, sparklines, colors, and delta calculations. Frontend and backend builds passed.

Inventory Overview KPI composition progress bars removed on 2026-06-25 (Sprint 20I.3Q) completed. Replaced thin progress bars with text-only composition indicators (e.g. "12,9% tổng tồn") below values on category cards. Preserved dark cockpit, responsive grid, sparklines, colors, and delta calculations. Frontend and backend builds passed.

Inventory Overview KPI cards enhanced on 2026-06-25 (Sprint 20I.3P) completed. Added thin composition progress bars on category cards. Configured KPI delta lines to output absolute difference and relative percentage changes for inventory metrics, and absolute counts change for count metrics. Frontend build passed.

Inventory Overview historical material existence fix on 2026-06-25 (Sprint 20I.3N) completed. Changed existence check to transaction-based minimum timestamp logic. Recalculated May/June snapshots and deltas, verifying that the forced ▲100% delta notes disappeared. Frontend build passed.

Inventory Overview KPI cards compacted on 2026-06-25 (Sprint 20I.3H) completed. Changed category values from `X mã (Y tấn)` to `X (Y tấn)`. Changed note suffixes from month-specific to `với tháng trước`. Reduced note typography size to `text-[10px]` within `OverviewMetricCard`. Frontend build passed.

Inventory Overview category KPI quantity delta calculations on 2026-06-25 (Sprint 20I.3G) completed. Changed category KPI values to `X mã (Y tấn)` format and configured category delta percentage calculations to be computed from stock quantity in tons rather than item counts. Frontend build passed.

Inventory Overview snapshot numeric verification on 2026-06-25 (Sprint 20I.3F) completed. Selected material VT-NEW-00001 (Thép hình 10mm) and verified its transaction ledger records (IMPORT, EXPORT, TRANSFER, ADJUSTMENT) and stock rollback calculations at previous month, 6 months ago, and 12 months ago with 0 variance. Confirmed that historical value calculation is approximate.

Inventory Overview yearly KPI audit on 2026-06-25 (Sprint 20I.3E) completed. Conducted a complete logic verification of the historical monthly trend snapshots, dynamic data age scale detection, material creation filters, and transaction rollbacks. Verified that no semantic bugs exist and documented the findings.

Inventory Overview monthly historical KPI trends on 2026-06-25 (Sprint 20I.3D) completed. Configured 12-point end-of-month snapshots using transaction ledger rollbacks. Configured sparkline rendering to output real monthly trends when data age is >= 12 months, and flat placeholder lines when it is < 12 months. Added dynamic monthly comparison delta notes with semantic text coloring (emerald/red) indicating positive/negative changes. Frontend and backend builds passed.

Inventory KPI sparklines restore on 2026-06-25 (Sprint 20I.3C) completed. Restored all 8 KPI sparklines and delta percentages using dynamic data age detection and historical snapshot rollbacks. Enabled flat placeholder lines for age < 30 days and real recent/yearly trends for ages >= 30 and >= 365 days. Frontend and backend builds passed.

Inventory KPI semantics fix on 2026-06-25 (Sprint 20I.3B) completed. Corrected material usage cards to display unique material counts. Disabled sparklines for count metrics lacking historical data, and set their delta label fallback to "Chưa có dữ liệu lịch sử". Frontend build passed.

Inventory Overview KPI redesign on 2026-06-25 (Sprint 20I.3) completed. Replaced original 8 cards with Tổng giá trị tồn kho, Tổng khối lượng, Mã vật tư, Sắp hết hàng, Vật tư chính, Vật tư phụ, Vật tư tiêu hao, and Hết hàng. Added tones (indigo, violet, orange) and pulsing loading skeletons. Frontend build passed.

Component UI audit on 2026-06-25 (Sprint 20B.1) completed. Documented file inventory, reusable UI primitives, existing UI and chart patterns, and recommended implementation approaches. Frontend build passed.

Date-time refresh fix on 2026-06-25 did not change module percentages. It standardized frontend `datetime-local` initialization/focus behavior for Inventory transaction modals, Component production material return, and Production MO creation so forms use the current local date/time rather than UTC-derived stale values. Frontend build passed.

Database cleanup on 2026-06-24 did not change module implementation percentages. It backed up the current database to `backups/steeltrack_before_business_data_cleanup_20260624_092729.dump`, executed `scripts/sql/business-data-cleanup-20260624.sql`, and cleared business/runtime data for materials, components, projects, suppliers, vehicles, Inventory transactions/balances, Production BOM/MO/material activity, QC runtime, Yard placements/movements, attachments metadata, analytics/runtime logs, and notifications. Configuration/reference foundations remain in place: users, roles, permissions, categories, material types, units, warehouses, warehouse zones, yard layout, QC checklist templates, workflow definitions, work centers, and machines. Details are in `docs/ai-state/audits/business-data-cleanup-20260624.md`.

Sprint BUG.2 on 2026-06-30 did not change module percentages. It corrected Inventory Material Detail analytics timeline direction by removing reversed chart rows, filling zero-activity dates between real transaction dates, preserving non-negative outbound buckets, and rendering tooltips from real `dateKey` values. Details are documented in `docs/bugs/material-analytics-timeline-validation-report.md`.

Sprint BUG.1 on 2026-06-29 did not change module percentages. It fixed Inventory Material Detail analytics staleness by returning live `inventoryValue` from the backend detail endpoint, removing stale fallback precedence in the drawer, and correcting movement/cost sparkline derivation. Details are documented in `docs/bugs/material-detail-analytics-staleness-report.md`.

Latest Inventory UI polish pass completed on 2026-06-03; follow-up dark cockpit cleanup removed remaining white/light surfaces and added stock-health donut analytics. Inventory Sprint B Warehouse Locations completed on 2026-06-05 with location CRUD, row/column/level/capacity fields, active/soft-delete lifecycle, location stock statistics, and current `warehouse_zones` audit. Operational percentage remains 100%.

Dashboard increased to 45% on 2026-06-07 after replacing the placeholder overview with a real API-backed cockpit using Projects, Production, Components, Inventory, Yard, QC, Activity Logs, and Notifications data. System detail pages remain Settings 55% because mutation workflows for users, roles, settings, audit export, backup execution, and notification read-state are still Phase S2.

Production increased to 78% on 2026-06-12 after Sprint 4 added `ProductionMaterialConsumption`, consume APIs, `CONSUME` material ledger writes, and a Production Cockpit consumption tab for issued/returned/consumed/scrap/remaining quantities.

Components increased to 83% and Production increased to 80% on 2026-06-12 after Sprint 5 added persisted component costing, costing recalculation APIs, material actual cost from production consumption and Inventory average cost, and a Component detail Costing section.

Components increased to 86% and Projects increased to 55% on 2026-06-12 after Sprint 6 added `SHIPPED -> DELIVERED -> INSTALLED` lifecycle APIs, Project Components delivery/install actions, timeline rows, and delivered/installed runtime counters.

Components increased to 88% and Projects increased to 58% on 2026-06-12 after Sprint 7 added install Zone/Axis/Level/Position fields, required install mapping payloads, Project install modal, Project Components install-location columns, Component Detail install location, and runtime mapping fields.

Sprint 8 on 2026-06-12 did not add business workflow percentage. It added read-only Runtime Integrity KPI APIs and documented current reconciliation findings in `docs/ai-state/audits/system-integrity-audit.md`.

Sprint 10A on 2026-06-13 did not add business workflow percentage. It fixed the active Production Material Return path so returned unused issued material is reconciled against consumed/scrap quantities, received back into Main Warehouse, and verified with an issue 10 / consume 8 / scrap 1 / return 1 smoke test.

Sprint 10B on 2026-06-13 did not change module percentages. It connected production completion/component READY workflow to automatic ComponentCosting recalculation and verified `estimatedCost`/`actualCost` update without manual recalculate.

Sprint 10C on 2026-06-13 did not change module percentages. It fixed production reservation allocation to use active exact `inventory_location_stocks` buckets and verified reservation 8 against `A02/L1=10`, `A02/L2=5` with immediate issue success.

Sprint 11 on 2026-06-13 did not change module percentages. It added Component costing material breakdown API/UI and verified planned `VAL-MAT-100` versus actual unplanned `VAL-MAT-002` warning output.

Sprint 11A.2 / 13B.3 on 2026-06-17 did not change module percentages. It consolidated frontend numeric formatting through shared helpers, removed direct `toLocaleString('vi-VN')` / `Intl.NumberFormat` usage from frontend source, and upgraded Material Detail with image gallery readiness plus standardized analytics panels.

Sprint 14A on 2026-06-17 did not change module percentages. It added the shared attachment metadata/filesystem foundation, moved upload storage to `STORAGE_ROOT` or `/data/steeltrack-storage`, added checksum dedupe, and connected Inventory Material Detail image upload/document display to the Attachments backend.

EPIC117.1 on 2026-07-09 approved **Inventory Business Freeze v1.0**. Repository,
event/outbox, background snapshot, runtime metrics, Operations Center, and data
consistency gates pass; material snapshot parity is 100% for the active dataset.

Sprint 14B on 2026-06-18 did not change module percentages. It reused the shared Attachments foundation for Inventory transaction documents, added transaction document categories, transaction storage routing, create-form attachment upload, and a transaction detail attachment tab.

Sprint 14B.4 on 2026-06-18 did not change module percentages. It improved Inventory attachment UX discoverability with transaction/material attachment badges and overview quick panels, without backend, API, storage, database, or workflow changes.

Sprint 14B.5 on 2026-06-19 did not change module percentages. It removed attachment badges from the Inventory Materials list and moved attachment discovery into Material Detail with contextual source classification, without backend, API, storage, database, or workflow changes.

Inventory Transactions UX 2.0 on 2026-06-19 did not change module percentages. It added transaction attachment `Hồ sơ` columns and drawers to the dedicated Nhập kho, Xuất kho, Điều chuyển, and Kiểm kê pages without backend, API, storage, database, or workflow changes.

Sprint 15A on 2026-06-19 did not change module percentages. It fixed Inventory Outbound value reporting by aggregating all item lines in the frontend and computing missing outbound line values in transaction API responses from average inbound cost, with no schema or migration changes.

Sprint 15B on 2026-06-19 did not change module percentages. It fixed Inventory cost integrity at the source by persisting `unitPrice` and `totalAmount` during transaction item creation, repairing direct Production/Material Movement writers, and backfilling historical missing values without schema changes.

Sprint 16A on 2026-06-19 did not change module percentages. It enhanced the Inventory Outbound frontend with row detail drawer, outbound value today KPI, top materials by value, and top projects by outbound value using existing Inventory transaction API data only.

Sprint 16B on 2026-06-19 did not change module percentages. It enhanced the Inventory Transfer frontend with row detail drawer, transfer value KPIs, value-based top materials, top transfer routes, and source/destination location rankings using existing Inventory transaction API data only.

Sprint 16C on 2026-06-20 did not change module percentages. It enhanced the Inventory Inbound frontend with row detail drawer, all-line aggregation, inbound value/supplier KPIs, supplier/material value analytics, price monitoring, and shared filter spacing across Inbound/Outbound/Transfer using existing Inventory transaction API data only.

Sprint 16D on 2026-06-20 did not change module percentages. It enhanced the Inventory Outbound frontend with project consumption analytics, daily/monthly outbound trends, material consumption analytics, outbound-purpose distribution, today/week/month/year financial KPIs, and abnormal consumption alerts using existing Inventory transaction API data only.

Sprint 17A on 2026-06-20 did not change module percentages. It enhanced the Inventory Stock Take frontend with stocktake sessions, session detail drawer, variance KPIs, top variance material/location analytics, and adjustment preview using existing adjustment transaction API data only.

Sprint 17B on 2026-06-20 did not change module percentages. It enhanced the Inventory Locations frontend with occupancy/free/occupied slot KPIs, inventory value by location, top occupied slots with drill-down material list, and transfer movement route analytics using existing zone, audit, and transaction API data only.

Sprint 17E on 2026-06-20 did not change module percentages. It hardened Inventory document numbering by replacing `count() + 1` generation with max-suffix generation, enforcing backend-owned matching `code` / `transactionNo`, adding duplicate retry on `P2002`, and adding a diagnostic SQL report for historical mismatches.

Sprint 17F on 2026-06-20 did not change module percentages. It changed Inventory stock health presentation so Overview, Materials, and Material Detail separate `Kho chính`, `Kho SX`, and total stock; low/out-of-stock status now uses `MAIN` stock only, with frontend build passing and no backend/schema changes.

Sprint 18A on 2026-06-20 did not change module percentages. It refactored Production Cockpit UI toward the Inventory operational theme with Inventory-style KPI cards, filter bar, analytics panels, Production Orders progress/readiness/delay grid, and shared detail drawers for Production Orders, BOM detail, and Material Issues. A follow-up pass extended the same treatment to Production BOM, Reservations, Material Ledger, Material Issues, Consumptions, and Logs; frontend build passed with no backend/schema/workflow changes.

Sprint 18B on 2026-06-20 did not change module percentages. It refactored Components List into a Component Management Cockpit with Inventory-style KPI strip, operational component grid, shared detail drawer, and analytics panels. The initial material-readiness fallback was superseded by Sprint 18C; frontend build passed with no backend/schema/workflow changes.

Sprint 18C on 2026-06-20 did not change module percentages. It audited Component/BOM/Material Issue data relationships, documented the mapping in `docs/ai-state/audits/bom-intelligence-audit.md`, and replaced the Component Cockpit material-readiness fallback with a real frontend helper using BOM required quantity and Production Material Issue net issued quantity. Frontend build passed with no backend/schema/workflow changes.

Sprint 18D on 2026-06-20 did not change module percentages. It refactored `/production/orders` into a Work Order Cockpit with KPI strip, Material Ready integration from Sprint 18C, Inventory-style grid, drawer sections, and analytics panels. `READY TO RELEASE` is UI-only, and material value ranking uses required quantity as a proxy because current responses do not expose unit material cost. Frontend build passed with no backend/schema/workflow changes.

Sprint 18E on 2026-06-20 did not change module percentages. It refactored `/production/material-issues` into a Production Material Control Center with issue KPIs, Inventory-style grid, BOM/Issue readiness calculations, drawer sections, and analytics panels. Material issue value remains unavailable because current issue responses do not expose unit material cost or line total. Frontend build passed with no backend/schema/workflow changes.

Sprint 19A on 2026-06-22 did not change module percentages. It added `/production/warehouse` as a Production Warehouse Cockpit for `PRODUCTION` warehouse balances, with production-stock KPIs, material grid, shortage/readiness analytics, WO consumption analytics, and Production Zone / Slot / Level detail using existing Inventory and Production data only. Frontend build passed with no backend/schema/workflow changes.

Sprint 19B on 2026-06-22 did not change module percentages. It added `/production/execution` as a Production Execution Board Kanban with stage columns, Work Order cards, bottleneck analytics, delay detection, material readiness integration, and Work Order drawer sections using existing Production data only. Frontend build passed with no backend/schema/workflow changes.

Sprint 19C on 2026-06-22 did not change module percentages. It created `docs/ai-state/audits/mes-data-audit.md` and concluded that current MES data is stronger for Costing than deeper Shopfloor development. Production has partial shopfloor foundations (`ProductionStage`, `ProductionTask`, `ProductionLog`, `WorkCenter`, `Machine`), but lacks canonical immutable stage transition history, runtime/downtime capture, production-line queues, and labor/machine rate data. The next recommended sequence is 20A Costing Engine, 20B Component Cost Analysis, and 20C Project Cost Control.

Sprint 20A on 2026-06-22 did not change module percentages because it added backend read models rather than a new visible workflow. It added a read-only Costing Engine module with `GET /production/orders/:id/cost`, `GET /components/:id/cost`, and `GET /projects/:id/cost`. Material cost uses actual Production Material Issue inventory transaction valuation when available and falls back to weighted average Inventory cost. Three real Work Orders were verified against SQL issue transaction valuation with 0% variance. No Prisma schema change or migration was introduced.

Sprint 20A.5 on 2026-06-23 did not change module percentages. It backed up the database to `backups/steeltrack_before_sprint20a5_20260623_082210.dump`, added a transactional purge SQL script, and added a runnable Prisma demo seeder. The seeded `DEMO20A5-*` dataset creates 20 suppliers, 20 projects, 20 inventory items, 20 components, 20 BOMs, 20 production work orders, inventory stock/movement data, production reservations/issues/consumptions/ledger rows, and component costing for all components. Verification confirmed 20/20 components have costing and 20/20 work orders have full material readiness. Backend and frontend builds passed with no schema/API/migration change.

Sprint 19D on 2026-06-22 did not change module percentages. It refactored Inventory Adjustments to match the Inbound/Outbound/Transfer UX pattern, removed the inline Quick Adjustment Wizard, added a `+ Điều chỉnh tồn kho` modal, moved adjustment history into the primary table flow, added row detail drawer, KPI strip, and analytics panels. No backend, API, schema, migration, or workflow change was introduced.

Sprint 19E on 2026-06-22 did not change module percentages. It unified Inventory Adjustment with the wider Inventory workspace by adding the sidebar tab, opening the adjustment modal directly from Global Actions, moving creation into shared `AdjustmentTransactionModal`, using Material Detail `locationBalances` for exact bucket System Qty, adding a location table and `WarehouseMiniMap`, and preserving attachments/reason presets. Frontend build passed with no backend/API/schema/migration change.

Sprint 40PROJ.4 on 2026-06-30 increases Projects operational maturity but does not mark Projects complete. It adds no-migration Project WBS CRUD APIs using existing `Task` rows plus SteelTrack metadata, editable multi-level WBS tree UI, task detail drawer, cost control tab, documents/logs tabs, project timeline, and runtime-backed project dashboard analytics. Projects still needs normalized `ProjectTask`, task resource allocation tables, formal component return workflow, and Project attachment linking before it can be considered a full Project Execution Management System.

Sprint 40PROJ.5 on 2026-06-30 fixes the largest Projects execution blocker: WBS task creation now supports a true parent tree select and backend circular hierarchy protection. It adds dependency metadata, resource allocation metadata, task-level cost traceability, a Project Command Center tab, and CSS Grid Gantt visualization without schema changes. Projects remains a bridge implementation until normalized ProjectTask, dependency, allocation, cost, and document models are introduced.

Sprint 40PROJ.6 on 2026-06-30 hardens Projects scheduling and execution without schema changes. It adds baseline metadata, FS/SS/FF scheduling recalculation, cascade delay, resource loading for workers/machines, procurement readiness warnings, inspection/acceptance status, and a three-pane Progress workspace. This makes Projects more usable operationally, but the implementation still needs normalized scheduling/resource/inspection tables before it should be treated as final enterprise architecture.

Sprint 40PROJ.7 on 2026-06-30 converts Projects scheduling/resource/inspection/cost persistence from the temporary WBS metadata bridge to normalized domain tables. The active WBS APIs and `GET /projects/runtime` now use `ProjectTask` and related allocation/dependency/cost/inspection tables, while migration SQL preserves legacy metadata rows into the new model. Remaining Projects work is now workflow hardening on top of the domain model, not persistence normalization.

Sprint 50LOG.1 on 2026-07-01 adds the Logistics Dispatch MVP foundation. Logistics now has persistent DispatchOrder/DispatchItem/DispatchEvent models, real dispatch dashboard APIs, lifecycle endpoints, an API-backed Logistics cockpit, auto suggestion from ProjectTask allocations, and dispatch receive reconciliation into Project task allocations plus Inventory export transactions. Logistics remains partial until exact yard/loading source locations, attachment-backed loading proof, and Project Detail per-line dispatch summary columns are completed.

Sprint INV.BUG.5 / INV.UGX.1 on 2026-07-02 does not change module percentages. It hardens Inventory inbound stock creation by requiring Zone/Slot/Level on every positive inbound line and adds real-history inbound suggestions for last used location, last inbound price, and 30-day weighted average price. Backend and frontend builds passed with no schema or migration changes.

EPIC107 SNAP.1 on 2026-07-07 advances the Enterprise Data/Runtime foundation. It adds persisted Inventory, Project, and Dispatch dashboard snapshot models, applies a real Prisma migration, implements snapshot repositories/writer/reader/validator, and connects snapshot rebuild jobs to real database writes. Dashboard UI/API contracts are unchanged; the next step is to switch selected dashboard reads to `SnapshotReaderService` with fallback. `prisma migrate status` is clean, while `migrate dev` is still blocked by pre-existing migration drift outside this sprint.

EPIC107 SNAP.2 on 2026-07-08 completes the first snapshot read cutover without changing module percentages. Inventory dashboard, Projects runtime, and Logistics dispatch dashboard reads now go through `DashboardReaderService`, which chooses persisted snapshot or runtime aggregate based on feature flags, freshness, confidence, and parity checks. Runtime metrics now expose snapshot fallback/stale/age/confidence. No UI, workflow, API contract, schema, or migration changes were introduced.

EPIC108 Enterprise Validation on 2026-07-08 does not change module percentages. It adds backend-only validation foundations for snapshot parity, performance benchmarking, background recovery inspection, and controlled stress harness execution. Current smoke validation reports 0 parity warnings across 3 checked snapshot rows, 6 completed snapshot rebuild jobs, and healthy idempotency evidence. No UI, public API, workflow, schema, or business logic changes were introduced.

EPIC111 Core Platform Compliance Audit on 2026-07-08 does not change module percentages. It created read-only audit reports for Inventory and Production. The audit scores Inventory at approximately 72% Core Platform compliance and Production at approximately 52%. Inventory is ready for targeted repository/event/read-model cleanup; Production should first resolve domain ambiguity, repository coverage, event contracts, and Production snapshot foundations before major MES expansion.

EPIC112 INV.CORE.1 on 2026-07-08 does not change user-facing module percentages. It completes the first Inventory Core Compliance implementation pass: active Inventory services/controllers now route persistence through `InventoryRepository`, Material Detail and inbound suggestions move into `InventoryReadModelService`, Inventory lifecycle events publish through persistent outbox-backed `InventoryEventService`, and Operations Center overview exposes an additive Inventory platform-health section. UI, workflow, public API contracts, Prisma schema, and migrations were not changed.

EPIC116.1 on 2026-07-08 approves Projects Architecture Freeze v1.0 and fixes backend startup hardening. Project Detail snapshot reads are snapshot-first for summary tabs and repository-fallback for unsupported or stale tabs, while `documents` and `logs` remain read-model paths to avoid one snapshot per screen. Backend startup root cause was a TypeScript build layout mismatch caused by inherited `prisma/**/*.ts` build inputs; `tsconfig.build.json` now emits `dist/main.js`, and `start`, `start:dev`, and `start:prod` all bootstrap successfully.

EPIC117 on 2026-07-08 does not change module percentages or user-facing behavior. It completes Inventory Business Freeze Phase 1 audit. Ledger/location/item compatibility data is clean in the current database, but Inventory Business Freeze is BLOCKED by 3 material snapshot parity mismatches, non-formal controller-level transaction DTO validation, and an unresolved Stock Take lifecycle decision. No UI, API contract, Core Platform, Repository, Snapshot, Event, or Background Engine code was changed.
# EPIC144 Components Runtime Platform

Status: **APPROVED, EVENT FRESHNESS PARTIAL**

Components now has Repository, ADR011 live read models, persisted snapshots,
module runtime metrics and Operations Center Platform Health. Event-domain
coverage remains partial because only the existing `component.updated` route is
available; EPIC144 did not invent missing workflows.
# EPIC154 QC Runtime Platform

- Status: **APPROVED, EVENT FRESHNESS PARTIAL**.
- Runtime Metrics: PASS.
- Operations Center: PASS.
- Snapshot Runtime: PASS.
- Repository Fallback Monitoring: PASS.
- ADR011 Workspace Boundary: PASS.
- Business/UI/API/schema changes: NONE.
# EPIC160 Yard Audit

- Status: **AUDIT COMPLETE, FOUNDATION BLOCKED**.
- Estimated Core Platform compliance: 36%.
- Estimated YMS business completeness: 45%.
- Repository Boundary: PARTIAL.
- Live Read Model / ADR011: FAIL.
- Snapshot Platform: NOT READY.
- Runtime Metrics: NOT READY.
- Operations Center: NOT READY.
- Business Architecture: placement/movement operational; complete YMS BLOCKED.
- Application code changes: NONE.
# EPIC161 Yard Repository Foundation

- Status: **APPROVED**.
- Repository Coverage: 100% for registered Yard module.
- Repository Boundary: PASS.
- Transaction Boundary: PASS.
- Atomic Outbox: PASS for existing Yard domain events.
- Cross-module direct Prisma access from Yard services: NONE.
- UI/API/schema/workflow changes: NONE.
- Yard overall Core Platform remains incomplete pending EPIC162-164.
# EPIC162 Yard Live Read Model

- Status: **APPROVED**.
- ADR011 Workspace: PASS.
- Repository Live Read Model: PASS.
- Server KPI/Aggregation: PASS.
- Movement History Pagination: PASS.
- Real/empty 3D Map Data: PASS.
- Actual QC Queue: PASS.
- Backward-compatible APIs: PASS.
- Snapshot/Runtime/Operations Center: pending.
# EPIC163 Yard Snapshot Foundation

- Status: **APPROVED, DEPLOYED**.
- Snapshot Schema: PASS (additive migration deployed).
- Snapshot Repository: PASS.
- Snapshot Reader/Fallback: PASS.
- Snapshot Writer/Background Routing: PASS.
- Snapshot Validator: PASS, warning-only.
- Feature Flag: PASS.
- ADR011 Workspace: PASS, unchanged.
- Fake data/backfill: NONE.
- Runtime/Operations Center: PASS via EPIC164 (event coverage partial).

# Enterprise Read Platform

- Projection Engine: PASS.
- Idempotency receipts: PASS.
- Resume/rebuild replay: PASS over retained Outbox events.
- Retry/dead-letter integration: PASS.
- Projection health and lag: PASS.
- Production projection registry: PASS.
- Components projection registry: PASS.
- Inventory projection registry: CONDITIONAL on canonical payload completeness.
- Cross-module projection registry: PASS as event-fact projections.
- GET-only Query API: PASS, additive.
- Migration: CREATED/VALIDATED, NOT DEPLOYED in this sprint.
- Existing UI projection-only certification: PENDING; frontend was out of scope.

# RFC002A Canonical Event Payload Certification

- Inventory canonical producer payload: PASS for new complete-location postings; historical parity CONDITIONAL.
- Production order/work-order/completion/scrap/rework payload: PASS.
- Production material payload: PASS for facts; cumulative issue balance remains NON-AUTHORITATIVE.
- Components identity/revision/BOM payload: PASS.
- QC inspection payload: PASS; NCR codes and disposition stream NON-AUTHORITATIVE.
- Yard placement payload: PASS; complete move source and loading stream NON-AUTHORITATIVE.
- Projects/Logistics canonical publishers: NOT IMPLEMENTED, no workflow invented.
- Migration deploy: PASS.
- Real-Outbox replay/idempotency/determinism: PASS.
- Authoritative projection certification: PARTIAL, see runtime matrix.

# RFC014 Enterprise Production Hardening

- Worker single-flight and graceful drain: PASS.
- Timer error propagation/logging: PASS.
- Bounded Job/Outbox/Projection error persistence: PASS.
- Stale-lock diagnostics: PASS, warning-only.
- Internal operational endpoint authentication: PASS.
- Backend regression: PASS, 69/69 suites and 175/175 tests.
- Automatic stale-lock recovery: PENDING lease/heartbeat design.
- Large-data runtime integrity scans: NOT PRODUCTION-SCALE READY.
- Global legacy route authorization: PENDING approved compatibility cutover.
- Overall status: CONDITIONALLY PRODUCTION READY.

# RFC015 Production Deployment Readiness

- Production configuration validation: PASS.
- Secret/default-placeholder rejection: PASS.
- Liveness/readiness contracts: PASS; live DB smoke pending staging database.
- Graceful shutdown hooks and worker drain integration: PASS.
- Docker image build/non-root/healthcheck: PASS.
- Compose migration-before-API ordering: PASS.
- Kubernetes rollout: NOT APPLICABLE, no existing platform manifests.
- Pending RFC013 migration clone validation: BLOCKING RELEASE.
- Overall status: CONDITIONALLY DEPLOYMENT READY.

# RFC017 Production Readiness Blocker Resolution

- Mutation authentication boundary: PASS, global deny-by-default JWT guard.
- Explicit public-route allowlist: PASS, health/login/refresh only.
- Background Job lease reclaim/renewal/ownership: PASS.
- Outbox lease reclaim/renewal/ownership: PASS.
- Online additive migration implementation/review: PASS.
- Production-size migration WAL/lock measurement and deploy: PENDING.
- Backend regression: PASS, 72/72 suites and 194/194 tests.
- Overall status: CONDITIONALLY READY pending production-like operational
  certification.

# EPIC UI003B Frontend API Client Consolidation

- Single authenticated frontend client: PASS.
- JWT injection and 401 refresh/retry ownership: PASS, centralized.
- Active module-specific/legacy authenticated clients: NONE.
- Direct authenticated Axios/fetch/XHR bypass: NONE.
- API/UI/business/backend changes: NONE.
- Authenticated module runtime smoke: PENDING, local PostgreSQL unavailable.

# Components Inventory Structural Alignment

- Components Overview shell parity with Inventory Inbound: PASS.
- Components List shell parity with Inventory Materials: PASS.
- Double workspace wrapper on target pages: REMOVED.
- Hero grid/right rail/bottom analytics structural parity: PASS.
- Final source-level visual parity checklist: PASS.
- Backend/API/query/business changes: NONE.

# Sprint 5 Historical Dashboard Integration QA

- `/history` route load/build integration: PASS.
- Historical API DTO/client/query wiring: PASS by source audit and build.
- Active-tab TanStack Query gating: PASS; jobs tab no longer fans out to
  dashboard/inventory reads.
- Loading/empty states: PASS for visible module states; skeleton-specific polish
  remains optional UI debt.
- Error handling: PASS; active failed queries render a retryable error panel.
- Charts empty-data crash safety: PASS by source audit; empty arrays are stable.
- Tables pagination: PASS; sorting/sticky-header certification remains
  WARNING because the current read API/UI does not expose a full sortable table
  contract.
- Backend regression: PASS, 74/74 suites and 201/201 tests.
- Backend build: PASS.
- Frontend build: PASS.
- Scoped Historical Dashboard lint: PASS.
- Full frontend lint: WARNING, blocked by pre-existing archived/legacy baseline
  errors outside Historical Dashboard.
- Prisma/schema/migration changes: NONE in Sprint 5.

# COMPONENT DOMAIN.5E Physical Lifecycle and QC Handoff

- Production instance execution lifecycle: PASS.
- `PLANNED -> IN_PRODUCTION` on legitimate RUNNING execution: PASS.
- `IN_PRODUCTION -> PRODUCED_WAITING_QC` only after all ProductionOrder
  WorkOrders complete for the same ComponentInstance: PASS.
- Final QC PASS to `QC_PASSED`: PASS.
- Final QC FAIL to `QC_FAILED`: PASS.
- NCR disposition to `REWORK`, `SCRAPPED`, `USE_AS_IS`: PASS.
- Finished Goods eligibility read API: PASS.
- Schema/migration changes: NONE.
- Runtime DOMAIN5E DB smoke: PASS.
- Backend tests: PASS, 79/79 suites and 247/247 tests.
- Backend build: PASS.
- Frontend build: PASS.

# STABILITY.DOMAIN5G.2 ProductionExecution REST Command Completion

- ProductionExecution REST command surface: PASS.
- Routes added: `/production/commands/executions/start`,
  `/production/commands/executions/:executionRunId/pause`,
  `/resume`, `/complete`, `/abort`.
- Controller delegates to existing service lifecycle logic: PASS.
- Active execution guard preserved: PASS.
- Authenticated runtime HTTP E2E through QC PASS/FAIL/NCR and Finished Goods:
  PASS.
- Inventory/Yard side effects from QC PASS: PASS, zero delta.
- Backend tests: PASS, 79/79 suites and 249/249 tests.
- Backend build: PASS.
- Frontend build: PASS, existing chunk-size warning only.
- Overall DOMAIN.5G status: BACKEND GREEN, browser certification pending.

# STEELTRACK UI.OPS.2 Visual & Form Convergence

- Components create form canonical semantics: PASS.
- Production BOM Material Master lookup: PASS.
- Production Order requirement-first form layout: PASS.
- QC inspection/final-instance/NCR bounded detail surfaces: PASS.
- Backend/API/schema changes: NONE.
- Frontend build: PASS, existing chunk-size warning only.
- Screenshot certification: PENDING.

# UI.OPS.3A Production Material Flow Canonicalization

- Production Material Warehouse source of truth: PASS, current balances use
  `InventoryLocationStock` for `PRODUCTION`.
- MAIN -> PRODUCTION transfer conservation: PASS by unit coverage.
- Engineering BOM decoupled from Production stock: PASS.
- BOM material availability enrichment: PASS by source/build; browser smoke
  pending.
- Components Production stock reserved/available display: PASS by source/build.
- Historical backfill: NOT PERFORMED, no authoritative runtime audit completed.
- Runtime OPS3 fixture: BLOCKED, direct PrismaClient cannot reach
  `localhost:5432`.
- Backend tests: PASS, 81/81 suites and 252/252 tests.
- Backend build: PASS.
- Frontend test/build: PASS, existing Vite chunk-size warning only.

# COMPONENTS.PRODUCTION.2 Canonical Production Workspace

- Components Production source of truth: PASS,
  `GET /production/read-model/cockpit`.
- Legacy frontend aggregation over `/production`: REMOVED for this workspace.
- Canonical row enrichment: PASS for requirement, project, component
  definition, revision, BOM definition, physical instances, execution, QC and
  material readiness.
- Shared drawer/modal workspace: PASS, `ModuleDetailDrawer` is used for both
  `Xem tất cả` and record details.
- Schema/migration changes: NONE.
- Prisma validate/generate/migrate status: PASS.
- Backend tests: PASS, 89/89 suites and 291/291 tests.
- Frontend tests: PASS, 2/2 files and 4/4 tests.
- Backend build: PASS.
- Frontend build: PASS, existing Vite chunk-size warning only.
- Browser runtime certification: PENDING.

# SYSTEM.INTEGRITY.1 V1 Operational Readiness Audit

- Audit mode: PASS, no source implementation, schema change, migration, stage
  or commit performed.
- Overall V1 operational readiness: 72%.
- Internal staging readiness: CONDITIONALLY READY.
- V1 freeze readiness: NOT READY.
- P0 blockers:
  - Logistics dispatch/delivery write path still uses component definition
    identity instead of `ComponentInstance`.
  - Registered legacy write endpoints lack canonical RBAC permission guards.
  - Some dashboard/read-model paths still derive physical component inventory
    or completion from `Component.status`.
- Runtime count evidence captured through read-only Prisma audit:
  14 projects, 25 requirements, 29 components, 35 component instances, 29
  production orders, 117 inventory location stocks, 153 inventory transactions,
  0 active Yard placements and 0 DispatchItems.
- Report:
  `docs/audits/system-integrity1-steeltrack-v1-operational-readiness-audit.md`.
# SYSTEM.E2E.1 Full Business Workflow Certification

- Canonical REST happy path: PASS, 80 recorded calls with no harness failure.
- Material integrity: PASS; 180 received, 16 consumed, 164 remains.
- Physical identity: PASS; PO quantity 2 created exactly 2 ComponentInstances.
- QC/Finished Goods gate: PASS; PASS instance included, FAIL instance excluded.
- Yard/Logistics/Installation: PASS with P0 custody warning; active Yard
  placement remains after delivered/installed state.
- RBAC: PASS for Admin, Planner, Warehouse, QC, Project and Logistics role
  matrix; no-token 401 and cross-role 403 verified.
- Reverse flow: PARTIAL; warehouse return, rework disposition and scrap pass;
  dismantle, project surplus and supplier outbound return are missing.
- Enterprise projections: FAILED/DEGRADED due aggregate version INT4 overflow.
- Backend tests: PASS, 91 suites / 296 tests.
- Frontend tests: PASS, 2 files / 4 tests.
- Backend/frontend builds: PASS.
- Internal pilot: CONDITIONALLY READY. V1 freeze/production: NOT READY.
