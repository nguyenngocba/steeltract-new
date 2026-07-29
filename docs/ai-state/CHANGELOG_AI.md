# SteelTrack AI Changelog

## 2026-07-29 SPRINT EXECUTIVE BI.8 – Redesign Inventory Analytics Charts

Completed:

- **Task 1: Redesigned "Sức chứa và sử dụng kho" (`WarehouseCapacityCard`)**:
  - Replaced empty layout with a large Donut chart (Center text: "Tổng Sức Chứa" + Total Tonnage e.g. 1,680 Tấn), summary legend for Used (`84.5%`) and Free (`15.5%`) capacity with progress bars, and a bottom utilization trend line indicator.

- **Task 2: Redesigned "Phân tích ABC theo giá trị tồn" (`AbcAnalysisCard`)**:
  - Integrated a Pareto Donut chart alongside 3 horizontal progress cards for Category A (Emerald `#10b981`), Category B (Amber `#f59e0b`), and Category C (Red `#ef4444`) with values, percentages, and progress bars.

- **Task 3: Redesigned "Tuổi tồn kho" (`InventoryAgingCard`)**:
  - Combined an aging distribution bar chart (`0-30d`, `31-60d`, `61-90d`, `>90d`) with an executive summary strip displaying Total Inventory Value (`18.5 Tỷ`), Long-staying Stock `>90d` (`2.37 Tỷ / 12.8%`), and Average Inventory Age (`34 Ngày`).

- **Task 4: Redesigned "Biến động tồn kho theo giao dịch" (`TransactionTrendCard`)**:
  - Combined multi-line transaction trend lines with 3 KPI summary blocks: Total Inbound (`+1,840 Tấn`), Total Outbound (`-1,420 Tấn`), and Net Change (`+420 Tấn`).

- **Task 5: Redesigned "Top vật tư theo tồn" (`TopInventoryRankingCard`)**:
  - Implemented a Top 10 descending ranking list with rank badges (`#1`-`#10`), material titles, quantities, percentages, and multi-color gradient progress bars (`Blue -> Cyan -> Emerald -> Amber -> Orange -> Red -> Purple`).

- **Task 6, 7 & 8: Headers, Spacing & Visual Consistency**:
  - Enhanced headers with title, subtitle, real-time update timestamp (`Cập nhật 10m trước`), compact padding, and consistent Enterprise surface tokens (`rounded-2xl`, `border-white/10`, `bg-slate-950/40`).

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-29 STABILITY.OPS3A1.1 – Runtime Production Warehouse Certification

Completed runtime certification for the UI.OPS.3A.1 Production Warehouse
source-of-truth fix:

- Identified a healthy already-running backend on `0.0.0.0:3000`.
- Verified `/health/live` and `/health/ready`; readiness reported database
  `up`.
- Confirmed the earlier `localhost:5432` failure came from sandbox/runtime
  isolation, not from the host backend.
- Created controlled fixture `OPS3A1-RT-20260729030324` through authenticated
  HTTP APIs only.
- Certified receipt into MAIN, transfer MAIN -> PRODUCTION, quantity
  conservation, `/inventory/items.locationBalances`, Components Production
  Warehouse source, BOM production availability, MAIN isolation, reservation
  semantics and Production readiness.
- SELECT-only existing stock audit found 9 materials, 11 PRODUCTION location
  balances and total quantity 4216.9; `/inventory/items` exposed the same 11
  balances and 4216.9 total quantity.
- Created
  `docs/audits/stability-ops3a1-runtime-production-warehouse-certification.md`.

No source code, schema, migration, stage or commit was performed.

## 2026-07-29 UI.OPS.3A.1 – Production Warehouse Source-of-Truth Fix

Completed the remaining Production Warehouse source-of-truth fix:

- Exposed canonical `InventoryLocationStock` balances through
  `GET /inventory/items`.
- Kept `PRODUCTION` warehouse stock separate from `MAIN` warehouse stock:
  Production available quantity is based on `PRODUCTION` on-hand minus active
  reservations, while Main Warehouse quantity is informational only.
- Updated Production BOM material selection to use Material Master identity
  with Production stock/reserved/available enrichment, without blocking
  zero-stock Engineering BOM authoring.
- Updated Production material readiness to return on-hand, reserved, available,
  reservable, issued and shortage quantities without subtracting issued
  material from Production stock a second time.
- Added targeted tests for Inventory item location balances and Production
  material readiness source-of-truth.
- Created
  `docs/audits/ui-ops3a1-production-warehouse-source-of-truth-report.md`.

Verification:

- Prisma validate and migrate status passed.
- Targeted Inventory, BOM, reservation, material issue and Production material
  readiness tests passed.
- Full backend test suite passed.
- Backend build, frontend tests, frontend build and `git diff --check` passed.
- Runtime HTTP smoke remains blocked by PostgreSQL connectivity at
  `localhost:5432`.

## 2026-07-28 STEELTRACK UI.OPS.3B – Operational Forms Convergence

Completed frontend-first operational form convergence:

- Added shared operational form primitives:
  `EnterpriseOperationalFormLayout`, `EnterpriseAssistantPanel`,
  `EnterpriseSummaryPanel` and `EnterpriseSuggestionButton`.
- Replaced duplicated Components create modals with one canonical
  `ComponentDefinitionRequirementForm` used by both the global action context
  and Components list page.
- Component create suggestions now come from real existing Component/Project
  data and only apply safe editable type/profile fields.
- Production BOM modal keeps UI.OPS.3A material-flow semantics and now shows
  readonly Material Master identity, Production stock/reserved/available
  enrichment, Production locations and real stock-backed material suggestions.
- Production Order modal now defaults selected requirement quantity to the
  remaining requirement quantity, blocks quantity above remaining demand in the
  UI and exposes a `Dùng số lượng còn lại` suggestion.
- Final QC instance detail shows FINAL checklist context and disables PASS/FAIL
  when no authoritative FINAL checklist exists.
- Created
  `docs/audits/ui-ops3b-operational-forms-convergence-report.md`.

Verification:

- Frontend tests passed.
- Frontend build passed with existing Vite chunk-size warning.
- Backend was not changed.

## 2026-07-28 STEELTRACK UI.OPS.1 – Components / Production / QC Operational UI Convergence

Completed frontend-only convergence pass:

- Renamed Components material-stock tab from `Vật tư sử dụng` to
  `Kho vật tư sản xuất`.
- Converted Components material-stock current balance display to use Inventory
  material `locationBalances` filtered to warehouse `PRODUCTION`, instead of
  deriving current stock from `[COMPONENT_PRODUCTION]` transaction remarks and
  production issue subtraction.
- Kept transaction rows as history/recent activity context only.
- Removed hardcoded Component type options from both Components create modals;
  type/profile suggestions now come from existing backend component data, while
  users can still enter new values.
- Polished Production Order create copy around Project requirement and
  Engineering basis without changing Production commands or APIs.
- Removed obvious hardcoded/demo operational rows and chart values from touched
  QC surfaces. NCR now uses `runtime.ncrs`; CAPA, audit logs and QC reports use
  controlled empty states when no authoritative backend read-model exists.
- Created
  `docs/audits/ui-ops1-components-production-qc-convergence-report.md`.

Verification:

- Frontend tests passed.
- Frontend build passed with existing Vite chunk-size warning.
- Backend was not changed.

## 2026-07-28 COMPONENT DOMAIN.5G – End-to-End Operational Certification

Completed certification/stability review:

- Reviewed the canonical operational chain from Component Definition and
  ProjectComponentRequirement through Production Order, ComponentInstances,
  ComponentInstanceExecution, final QC, NCR disposition and Finished Goods
  eligibility.
- Verified Prisma schema and migration status.
- Verified targeted canonical tests for Production command, Production
  instance execution, QC command, Components foundation and Components read
  model.
- Verified full backend test suite, frontend tests, backend build and frontend
  build.
- Confirmed no P0 data corruption, wrong physical identity, wrong Finished
  Goods eligibility or duplicate instance generation issue was found during
  service/test certification.
- Attempted authenticated runtime path by starting the backend and probing
  health/login, but Nest startup failed with
  `PrismaClientInitializationError: Can't reach database server at
  localhost:5432`.
- Classified certification as **YELLOW** because API/browser smoke and a fresh
  `DOMAIN5G-*` fixture could not be executed safely.
- Created
  `docs/audits/component-domain5g-end-to-end-certification.md`.

Verification:

- Prisma validate passed.
- Prisma migrate status passed.
- Targeted tests passed: 6 suites / 38 tests.
- Full backend tests passed: 79 suites / 247 tests.
- Frontend tests passed: 1 file / 2 tests.
- Backend build passed.
- Frontend build passed with existing Vite warnings.

## 2026-07-28 COMPONENT DOMAIN.5F.4 – Canonical QC Physical Instance UI

Completed:

- Converted `/qc/final` to source its waiting queue from physical
  `ComponentInstance` rows in `PRODUCED_WAITING_QC`.
- Added backend read filtering for `ComponentInstance.state`.
- Exposed canonical QC command routes for final PASS, final FAIL, NCR creation
  and NCR dispositions through `QcCommandService`.
- Added frontend QC API/hooks for component-instance waiting QC, inspection
  detail, final PASS/FAIL, canonical NCR creation and disposition commands.
- Rebuilt the QC final tab so each row is one manufactured physical instance,
  with Component definition, Project, requirement, Production Order, production
  completion and operation evidence visible in the detail modal.
- Ensured final PASS transitions the exact instance to `QC_PASSED`.
- Ensured final FAIL transitions the exact instance to `QC_FAILED` and can
  create an NCR preserving `componentInstanceId`.
- Preserved legacy inbound, in-process, NCR, CAPA, report and log workflows.
- Created
  `docs/audits/component-domain5f4-qc-instance-ui-report.md`.

Verification:

- Prisma validate passed.
- QC command service targeted test passed.
- QC dashboard controller targeted test passed.
- Full backend tests passed.
- Frontend tests passed.
- Backend build passed.
- Frontend build passed with existing Vite chunk-size warning.
- `git diff --check` passed before documentation finalization.

## 2026-07-28 COMPONENT DOMAIN.5F.3 – Production Requirement-First & Instance Execution UI

Completed:

- Converted Manufacturing Order creation to start from canonical
  `ProjectComponentRequirement` demand.
- Added requirement allocation display: required, allocated Production Order
  quantity and remaining quantity.
- Wired create to `POST /production/commands/orders`.
- Added additive planned start/end support to the canonical Production command
  DTO/service without schema changes.
- Added canonical release client/action through
  `POST /production/commands/orders/:id/release`.
- Exposed generated physical `ComponentInstance` rows in the Production Order
  drawer.
- Localized physical instance state labels and showed QC handoff readiness.
- Extended foundation read API includes for Production allocation and
  `ComponentInstanceExecution` lineage.
- Removed the legacy manual `Tạo cấu kiện từ MO` action from the main drawer
  semantics.
- Created
  `docs/audits/component-domain5f3-production-instance-ui-report.md`.

Verification:

- Prisma validate passed.
- Backend targeted tests passed: production command service and component
  domain foundation.
- Frontend tests passed.
- Backend build passed.
- Frontend build passed with existing Vite chunk-size warning.
- `git diff --check` passed.

## 2026-07-28 COMPONENT DOMAIN.5F.2 – Canonical Component Definition UI

Completed:

- Converted Components `/components/list` semantics to **Hồ sơ cấu kiện**.
- Added canonical read-model fields for engineering lifecycle, current
  revision, BOM state and ProjectComponentRequirement demand.
- Replaced physical-status KPIs with engineering/planning KPIs.
- Removed UI filters for legacy physical statuses from the Component
  Definition page.
- Added requirement presentation in the detail drawer, including required,
  allocated Production Order and remaining quantities.
- Updated read-model tests so legacy `Component.status = STOCK` no longer
  becomes `Tồn kho` on the engineering definition page.
- Created
  `docs/audits/component-domain5f2-component-definition-ui-report.md`.

Verification:

- Components read-model repository test passed.
- Backend targeted domain foundation tests passed.
- Full backend tests passed.
- Frontend tests passed.
- Backend build passed.
- Frontend build passed with existing Vite warnings.

## 2026-07-28 COMPONENT DOMAIN.5F.1 – Canonical Finished Goods UI

Completed:

- Converted Components `/components/stock` from legacy "Tồn kho cấu kiện"
  semantics to canonical "Cấu kiện thành phẩm".
- Added frontend contract/API/query hook for
  `GET /components/instances/finished-goods`.
- Rebuilt the page table, KPIs, filters and detail drawer around physical
  `ComponentInstance` rows returned by the canonical backend.
- Removed page-level dependencies on `Component.status`, `READY`, `STOCK`,
  `COUNT(Component)`, completed ProductionOrder quantity, Yard slot scans,
  Production BOM cost reconstruction and Inventory audit rows for physical
  Finished Goods presentation.
- Added minimal backend read API summary counts from the same Finished Goods
  eligibility predicate.
- Created
  `docs/audits/component-domain5f1-finished-goods-ui-report.md`.

Verification:

- Backend targeted tests passed: 2 suites / 12 tests.
- Full backend tests passed: 79 suites / 247 tests.
- Frontend tests passed: 1 file / 2 tests.
- Backend build passed.
- Frontend build passed with existing Vite warnings.

## 2026-07-28 COMPONENT DOMAIN.5F – Canonical Components / Production / QC UI Integration Audit

Completed audit only:

- Audited current Components frontend screens against the canonical
  `Component` / `ProjectComponentRequirement` / `ComponentInstance` split.
- Audited Production frontend screens against canonical `ProductionOrder`,
  `ComponentInstance` and `ComponentInstanceExecution` execution evidence.
- Audited QC frontend screens against canonical final QC targeting by
  `componentInstanceId`.
- Identified legacy UI semantics still relying on `Component.status`, `STOCK`,
  `READY`, `description` JSON quantity, `COUNT(Component)`, aggregate
  ProductionOrder quantity, `/production/boms` and frontend-derived production
  material stock.
- Created
  `docs/audits/component-domain5f-canonical-ui-integration-audit.md`.

No implementation:

- No frontend source change.
- No backend source change.
- No Prisma schema change.
- No migration.
- No staging or commit.

Next:

- Migrate Components Finished Goods UI to
  `GET /components/instances/finished-goods`, then align Production instance
  execution UI and QC instance-level final inspection queue.

## 2026-07-28 COMPONENT DOMAIN.5D – ComponentInstanceExecution Schema Foundation

Completed:

- Added `ComponentInstanceExecutionStatus`.
- Added additive `ComponentInstanceExecution` model/table.
- Added relations to `ComponentInstance`, `WorkOrder` and
  `ProductionExecution`.
- Added uniqueness on `componentInstanceId + productionExecutionId`.
- Added focused status indexes for instance/run/work-order queries.
- Added `ProductionInstanceExecutionService`.
- Added repository methods for physical execution evidence.
- Added authenticated command/read foundation under `/production/commands`.
- Added targeted service tests.
- Created
  `docs/audits/component-domain5d-instance-execution-foundation-report.md`.

Migration:

- Backup: `/tmp/steeltrack-domain5d-before-20260728.dump`.
- Migration:
  `20260728103000_component_domain5d_instance_execution_foundation`.
- No destructive SQL.
- No backfill.
- No fabricated legacy execution history.

Runtime smoke:

- Used DOMAIN4 PO-A with a temporary `ProductionExecution`.
- Assigned three ComponentInstances.
- Completed operation evidence for instances 001/002.
- Left instance 003 assigned.
- Confirmed instances 004/005 had no execution evidence.
- Confirmed zero Inventory/QC/Yard/ComponentInstance side effects.
- Cleaned up the temporary run/evidence.

Verification:

- Prisma validate/generate/migrate status passed.
- Targeted tests passed: 5 suites / 31 tests.
- Full backend tests passed: 79 suites / 244 tests.
- Backend build passed.
- Frontend build passed with existing Vite chunk-size warning.

Next:

- DOMAIN.5E physical lifecycle transition and QC handoff from
  `ComponentInstanceExecution` evidence.

## 2026-07-28 COMPONENT DOMAIN.5C – Production Instance Execution Granularity Audit & Design

Completed audit/design only:

- Audited current Production schema and command runtime flow.
- Confirmed `ProductionOrder`, `WorkOrder`, `ProductionExecution` and
  `ProductionCompletion` do not persist physical ComponentInstance
  start/completion identity.
- Confirmed aggregate completed quantity cannot safely drive
  `ComponentInstance` lifecycle transitions.
- Confirmed partial production cannot currently be represented truthfully.
- Recommended future additive `ComponentInstanceExecution` as the canonical
  bridge:
  `ComponentInstance + WorkOrder + ProductionExecution + operation + status`.
- Created
  `docs/audits/component-domain5c-production-instance-execution-design.md`.

No implementation:

- No Prisma schema change.
- No migration.
- No backend/frontend code change.
- No runtime write.
- No staging or commit.

Next required sprint:

- DOMAIN.5D `ComponentInstanceExecution` schema foundation.

## 2026-07-28 COMPONENT DOMAIN.5B – ComponentInstance IN_PRODUCTION State Gate

Completed:

- Added `ComponentInstanceState.IN_PRODUCTION` to Prisma schema.
- Created additive forward-only migration
  `20260728090000_component_domain5b_instance_in_production_state`.
- Deployed migration after backup and SQL review.
- Preserved all existing `ComponentInstance` rows without backfill.
- Updated DOMAIN.5 audit/state docs to reflect that the enum gate is closed.

Verification evidence:

- Backup created: `/tmp/steeltrack-domain5b-before-20260728.dump`.
- Backup verified with `pg_restore --list`.
- Pre/post `ComponentInstance` count remained `16`.
- Pre/post state grouping remained `PLANNED=16`.
- PostgreSQL enum values now include `IN_PRODUCTION`.
- Prisma validate, migrate status and generate passed.

Important stop:

- DOMAIN.5 transitions were not implemented.
- Current Production start/completion evidence does not identify physical
  `ComponentInstance` rows. It is order/work-order/execution/completed-quantity
  level only.
- Next gate is DOMAIN.5C Production instance execution granularity.

## 2026-07-28 COMPONENT DOMAIN.5 – Resume Audit / State Model Gate

Audit completed and stopped at schema gate:

- Resumed DOMAIN.5 after DOMAIN.5A runtime certification.
- Confirmed QC physical lineage is now available.
- Confirmed `ComponentInstanceState` cannot represent the required
  `IN_PRODUCTION` physical lifecycle state.
- Determined that using `ProductionOrder.status=IN_PROGRESS` or
  `ComponentInstanceTimeline` as a substitute would violate the resumed prompt:
  Production is execution authority, while timeline is audit evidence only.
- Updated
  `docs/audits/component-domain5-qc-finished-goods-report.md`
  with the minimal additive proposal:
  `ComponentInstanceState.IN_PRODUCTION`.

No implementation:

- No Prisma schema change.
- No migration.
- No backend/frontend code change.
- No runtime fixture.
- No tests/build required for code because implementation stopped before code
  changes.
- No staging or commit.

Next required approval:

- DOMAIN.5B additive enum gate:
  `ALTER TYPE "ComponentInstanceState" ADD VALUE 'IN_PRODUCTION'`.

## 2026-07-27 COMPONENT DOMAIN.5A – QC Physical Instance Lineage Foundation

Completed:

- Added nullable `componentInstanceId` lineage to `QcInspection`,
  `NonConformanceReport` and `QcInspectionSnapshot`.
- Added Prisma relations from QC inspection/NCR to `ComponentInstance` and
  inverse relations from `ComponentInstance`.
- Added focused indexes for QC/NCR/snapshot lookup by physical instance.
- Deployed additive migration
  `20260727224000_component_domain5a_qc_instance_lineage`.
- Preserved legacy QC compatibility with nullable fields and no backfill.
- Added QC service validation for instance/component/production/project
  mismatch.
- Preserved `componentInstanceId` in QC inspection, NCR, disposition and
  snapshot payloads.
- Created `docs/audits/component-domain5a-qc-instance-lineage-report.md`.

Verification:

- Backup created and verified:
  `/tmp/steeltrack-domain5a-before-20260727.dump`.
- Pre/post row counts unchanged:
  `QcInspection=1`, `NonConformanceReport=0`,
  `QcInspectionSnapshot=0`, `ComponentInstance=16`.
- Runtime smoke created one instance-level QC inspection and one NCR with no
  ComponentInstance, InventoryTransaction, Yard placement or Finished Goods side
  effects.
- Targeted QC/snapshot tests passed: 4 suites / 13 tests.
- Backend tests passed: 78 suites / 234 tests.
- Backend build passed.
- Frontend build passed with existing Vite chunk-size warning.
- Prisma validate/generate/migrate status passed.

## 2026-07-27 COMPONENT DOMAIN.5 – Production Completion, QC & Finished Goods Gate

Audit completed and stopped at schema gate:

- Audited Production completion, QC inspection, NCR/disposition and legacy
  Component.status paths for the canonical physical ComponentInstance workflow.
- Confirmed `QcInspection` and `NonConformanceReport` cannot structurally
  reference `ComponentInstance`.
- Determined metadata-based `componentInstanceId` would not satisfy canonical
  traceability, indexing or future Finished Goods/Yard/Logistics query
  requirements.
- Documented remaining legacy `Component.status` READY/STOCK consumers and
  writers as compatibility debt.
- Created
  `docs/audits/component-domain5-qc-finished-goods-report.md`.

No implementation:

- No Prisma schema change.
- No migration.
- No backend/frontend code change.
- No runtime fixture.
- No staging or commit.

Next required approval:

- DOMAIN.5A additive nullable QC instance-lineage schema:
  `QcInspection.componentInstanceId`,
  `NonConformanceReport.componentInstanceId`,
  `QcInspectionSnapshot.componentInstanceId`, indexes and
  `ComponentInstance` relations.

## 2026-07-27 COMPONENT DOMAIN.4 – Production Integration & Physical Instance Creation

Completed:

- Added additive `componentRequirementId` support to the canonical Production
  command create DTO.
- Validated requirement-bound Production Order creation against
  ProjectComponentRequirement ownership, released Engineering basis,
  materialized Production BOM lineage and active allocation quantity.
- Persisted `ProductionOrder.componentRequirementId` for canonical requirement
  lineage.
- Created planned `ComponentInstance` rows at Production Order release for
  requirement-bound orders only.
- Generated physical instance numbers server-side from Component code,
  Production Order number and serial sequence.
- Added instance timeline rows for `component.instance.planned`.
- Preserved legacy Production Orders and legacy Component status semantics.
- Created `docs/audits/component-domain4-production-integration-report.md`.

Verification:

- `pnpm -C apps/backend-api exec prisma migrate status` passed.
- `pnpm -C apps/backend-api exec prisma validate` passed.
- `pnpm -C apps/backend-api exec prisma generate` passed.
- Targeted Production command tests passed: 9 tests.
- `pnpm -C apps/backend-api test` passed: 78 suites / 230 tests.
- `pnpm -C apps/backend-api build` passed.
- `pnpm -C apps/frontend build` passed with existing Vite chunk-size warnings.
- Runtime fixture `DOMAIN4-1785146027125` passed: requirement quantity 20,
  PO-A 8 instances, PO-B 7 instances, over-allocation rejected, no inventory,
  QC or Yard side effects.

## 2026-07-27 COMPONENT DOMAIN.3 – Component Create & Project Requirement Conversion

Completed in code:

- Added additive typed Component engineering fields:
  `componentType String?`, `profile String?`, and `@@index([componentType])`.
- Added migration SQL
  `20260727223000_component_domain3_typed_definition_fields` with only
  `ALTER TABLE ADD COLUMN` and `CREATE INDEX`; no backfill or destructive SQL.
- Added `POST /components/foundation/definition-requirements` for atomic
  Component definition + Project requirement creation.
- Backend now owns Component identity generation and retries unique collisions.
- Canonical create writes Project demand to
  `ProjectComponentRequirement.requiredQuantity` and does not create
  ComponentInstances, inventory quantity or ProductionOrders.
- Components create UI now uses engineering/planning language:
  `Tạo hồ sơ cấu kiện`, `Công trình / Dự án`, `Số lượng yêu cầu`.
- Components read models now prefer typed fields and requirement quantity, with
  legacy `description` JSON fallback for old records.
- Created `docs/audits/component-domain3-create-requirement-report.md`.

Verification:

- Pre-migration backup created and verified:
  `/tmp/steeltrack-domain3-before-20260727.dump`.
- `pnpm -C apps/backend-api exec prisma migrate deploy` passed.
- `pnpm -C apps/backend-api exec prisma migrate status` passed.
- `pnpm -C apps/backend-api exec prisma validate` passed.
- `pnpm -C apps/backend-api exec prisma generate` passed.
- `pnpm -C apps/backend-api test` passed: 78 suites / 227 tests.
- `pnpm -C apps/backend-api build` passed.
- `pnpm -C apps/frontend build` passed with existing Vite chunk-size warnings.
- Authenticated DOMAIN3 runtime smoke passed: 1 Component definition + 1
  ProjectComponentRequirement were created; 0 ComponentInstances, 0
  ProductionOrders and 0 InventoryTransactions were created.
- Existing Component row counts were preserved across migration, legacy typed
  fields remained `NULL`, and STABILITY7/B1 lineage stayed readable.

## 2026-07-27 COMPONENT DOMAIN.2 – Canonical Schema Foundation

Completed:

- Implemented the additive canonical Component schema foundation from
  `docs/audits/canonical-component-domain-architecture.md`.
- Added `ProjectComponentRequirement` for project demand/planning and
  `ComponentInstance` for physical manufactured component identity.
- Added `ComponentInstanceTimeline` for future instance-level traceability.
- Added optional `ProductionOrder.componentRequirementId` lineage for future
  Production conversion.
- Added foundation read/create API namespace under `/components/foundation`
  without changing legacy `/components`, command APIs, frontend, Inventory,
  QC, Yard, Logistics, Historical Dashboard or Snapshot Engine.
- Added unit coverage for DTO validation, lineage validation, additive route
  compatibility and non-inventory requirement semantics.
- Created `docs/audits/component-domain2-schema-foundation-report.md`.

Verification:

- Pre-migration backup created:
  `/tmp/steeltrack-domain2-before-20260727-143754.dump`.
- `pnpm -C apps/backend-api exec prisma migrate deploy` passed.
- `pnpm -C apps/backend-api exec prisma validate` passed.
- `pnpm -C apps/backend-api exec prisma generate` passed.
- `pnpm -C apps/backend-api exec prisma migrate status` passed.
- Controlled DOMAIN2 runtime DB smoke passed.
- `pnpm -C apps/backend-api test` passed: 78 suites / 223 tests.
- `pnpm -C apps/backend-api build` passed.
- `pnpm -C apps/frontend build` passed with existing Vite chunk-size warnings.
- `git diff --check` passed.

## 2026-07-27 SPRINT STABILITY.7 – B1 Runtime Integration Certification

Completed:

- Ran a controlled runtime fixture under namespace `STABILITY7-1785129145020`.
- Certified Component DRAFT creation, Revision R1 creation, Engineering BOM
  replacement, invalid BOM rejection, BOM validation, review, approval and
  release through `ComponentCommandService`.
- Certified Sprint A gate: Production Order creation is blocked until the
  Component is Engineering-released.
- Certified Production Order creation through `ProductionService` binds to the
  released Component revision and auto-materializes the Engineering BOM into
  the Production BOM model.
- Certified Production BOM lineage:
  `componentId`, `componentRevisionId`, `bomDefinitionId`,
  `engineeringContentHash`, materialized items and routing steps.
- Certified idempotent materialization replay: same Production BOM id returned,
  no duplicate BOM and no duplicate BOMItem rows.
- Certified historical binding: after releasing R2, the existing Production
  Order remained bound to R1 lineage.
- Created `docs/audits/b1-runtime-integration-certification.md`.
- Updated `docs/audits/full-system-runtime-certification.md`.

Verification:

- Runtime fixture PASS.
- `pnpm -C apps/backend-api exec prisma migrate status` passed.
- `pnpm -C apps/backend-api exec prisma validate` passed.
- `pnpm -C apps/backend-api test` passed: 76 suites / 215 tests.
- `pnpm -C apps/backend-api build` passed.
- `pnpm -C apps/frontend build` passed with existing Vite chunk-size warnings.
- `git diff --check` passed.

## 2026-07-27 SPRINT STABILITY.6 – Historical Snapshot Date Normalization

Completed:

- Added canonical Historical Snapshot business-date helpers.
- Replaced Snapshot Engine local date mutation with UTC business-date
  normalization for daily snapshots, monthly rollups and current-day checks.
- Standardized Snapshot job identity keys to use `YYYY-MM-DD` business dates.
- Updated Historical Dashboard API date parsing and serialization so business
  dates return as `YYYY-MM-DD` while technical timestamps remain ISO strings.
- Ensured initial DashboardSnapshot creation persists the generated `stale`
  state.
- Added targeted regression tests for business-date parsing, leap-day/year
  boundary handling, scheduler job identity and Historical Dashboard DTO
  serialization.
- Verified a controlled `YARD/stability6_dashboard_daily` runtime workflow
  under `Asia/Ho_Chi_Minh` persisted `snapshot_jobs`, `dashboard_snapshots` and
  `snapshot_metadata` on `2026-07-29` without timezone drift.

Verification:

- `pnpm -C apps/backend-api exec prisma validate` passed.
- `pnpm -C apps/backend-api exec prisma generate` passed.
- `pnpm -C apps/backend-api exec prisma migrate status` passed.
- `pnpm -C apps/backend-api test` passed: 76 suites / 215 tests.
- `pnpm -C apps/backend-api build` passed.
- `pnpm -C apps/frontend build` passed.
- `git diff --check` passed.

## 2026-07-27 SPRINT STABILITY.5 – Full System Runtime Certification

Completed:

- Created `docs/audits/full-system-runtime-certification.md`.
- Verified PostgreSQL identity, Prisma migrate status, Prisma validation and Prisma Client generation.
- Re-ran schema/database drift classification after STABILITY.4.
- Smoke-tested authenticated runtime APIs for Dashboard/Runtime, Inventory, Components, Production, QC, Projects, Suppliers, Logistics, Yard, UOM, Admin/System and Historical Snapshot.
- Served the frontend production build through Vite preview and verified major SPA routes return the app shell.
- Executed controlled Snapshot minimum workflow by seeding `INVENTORY/dashboard_daily` and `INVENTORY/inventory_balance_daily` metadata, scheduling and processing 2 completed jobs, and writing dashboard/inventory snapshots.
- Verified Snapshot job logs contain INFO entries and no failed jobs.
- Classified certification as **CERTIFIED WITH CONDITIONS**.

Findings:

- P0: none.
- P1: Historical Snapshot `@db.Date` timezone/date mismatch must be fixed before exact historical date semantics are production-certified.
- P1: B1 runtime E2E needs a controlled fixture because the current DB has no released Component revisions/BOM definitions.
- P1: frontend browser render certification still needs an authenticated Playwright/browser harness.

Verification:

- `pnpm -C apps/backend-api test` passed: 75 suites / 210 tests.
- `pnpm -C apps/frontend test` passed: 1 file / 2 tests.
- Targeted backend suites passed: 13 suites / 63 tests.
- `pnpm -C apps/backend-api build` passed.
- `pnpm -C apps/frontend build` passed.
- `git diff --check` passed.

## 2026-07-27 SPRINT STABILITY.4 – Historical Snapshot Corrective Migration

Completed:

- Created backup `/tmp/steeltrack-stability4-20260727-104307.dump` before database modification.
- Added migration `20260727210000_historical_snapshot_corrective_schema`.
- Created only the missing Historical Snapshot enums/tables already present in `schema.prisma`.
- Preserved legacy snapshot tables/data unchanged.
- Verified `prisma migrate deploy`, `prisma migrate status`, `prisma validate` and `prisma generate`.
- Verified Snapshot Engine runtime no longer fails on missing `public.snapshot_metadata`.
- Verified authenticated `/history/*` read endpoints return controlled empty/not-found responses, not schema-level 500s.
- Verified Inventory, Components and Production read-only smoke endpoints still return `200`.

Verification:

- `pnpm -C apps/backend-api test` passed: 75 suites / 210 tests.
- `pnpm -C apps/backend-api build` passed.
- `pnpm -C apps/frontend build` passed.
- `git diff --check` passed.

## 2026-07-27 COMPONENT MANUFACTURING WORKFLOW Sprint B1 – Engineering BOM Materialization

Completed:

- Added additive Production BOM lineage for Engineering BOM materialization:
  `componentId`, `componentRevisionId`, `bomDefinitionId`,
  `engineeringContentHash`, `source`, `materializedAt`, and `materializedBy`.
- Added a strict Engineering BOM contract parser for material lines and routing
  steps, including material identity, positive quantity, non-negative waste,
  category normalization, alternatives, and routing validation.
- Hardened Components BOM replace/validate/release paths so released
  Engineering BOM definitions are materializable before Production can consume
  them.
- Added `ProductionBomMaterializationService` to materialize the released
  Component BOM into the existing Production `BOM` / `BOMItem` model without
  introducing a third BOM model.
- Connected canonical and legacy Production Order creation to the materialized
  Production BOM while preserving engineering lineage and content hash checks.
- Added focused unit coverage for Engineering BOM materialization,
  idempotency, invalid BOM rejection, missing material rejection, stale content
  hash rejection, and concurrent unique-conflict recovery.

Verification:
- `pnpm -C apps/backend-api exec prisma validate` passed.
- `pnpm -C apps/backend-api exec prisma format` passed.
- `pnpm -C apps/backend-api exec prisma generate` passed.
- `pnpm -C apps/backend-api test` passed: 75 suites / 210 tests.
- `pnpm -C apps/backend-api build` passed.
- `pnpm -C apps/frontend build` passed with existing Vite warnings only.

## 2026-07-25 SPRINT EXECUTIVE BI.7 – Standardize All Executive BI Domains

Completed:

- **Task 1: Removed Redundant Hero Header**:
  - Removed `<AnalyticsHeader>` from `ExecutiveAnalyticsPortal` in `DashboardPage.tsx` across all domains (`inbound`, `outbound`, `production`, `qc`, `projects`, `dispatch`).
  - Eliminated duplicate title, eyebrow text, description, and timestamp banner.

- **Task 2 & 3: Adopted Inventory Executive Master Layout**:
  - Standardized all 6 non-inventory domains (`Nhập kho`, `Xuất kho`, `Sản xuất`, `Chất lượng`, `Dự án`, `Giao nhận`) to use the exact same 6-level vertical structure:
    1. KPI Strip (`AnalyticsMetricGrid` with `h-[92px]` cards)
    2. Executive Insight Panel (`ExecutiveInsightPanel` with domain-specific C-level insights)
    3. Analytics Row 1 (60/40 ratio grid `xl:grid-cols-[1.2fr_0.8fr]`)
    4. Analytics Row 2 (3-column grid `xl:grid-cols-3` with `h-[300px]` cards)
    5. Executive Alert & Recommendation Center (`ExecutiveAlertsAndRecommendations`)
    6. Operations Data Table (`AnalyticsTable`)

- **Task 4 & 5: Visual & Navigation Consistency**:
  - Ensured uniform spacing (`space-y-2.5`, `gap-2.5`), card radius (`rounded-2xl`), border styling (`border-white/10`), sticky sidebar, and back navigation.

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-25 SPRINT EXECUTIVE BI.5 – Premium Enterprise UX Polish

Completed:

- **Task 1: Premium KPI Cards**:
  - Polished KPI card micro-interactions in `AnalyticsMetricGrid` (`transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`). Added halo scaling on hover (`group-hover:scale-125`) and refined number typography (`font-bold text-lg tracking-tight`).

- **Task 2 & 3: Analytics Card & Rhythm Polish**:
  - Unified title hierarchy (`text-xs font-bold uppercase tracking-[0.14em] text-white`) and subtitle typography (`text-[10px] text-slate-400`).
  - Standardized card inner padding (`p-3.5`), equal card margins (`gap-2.5`), and visual rhythm.

- **Task 4: Executive Color Consistency**:
  - Verified semantic color enforcement: Blue (Financial), Emerald (Healthy), Amber (Warning), Red (Critical), Purple (Analysis), Cyan (Realtime).

- **Task 5, 6 & 7: Micro-Interactions, Accessibility & Final Audit**:
  - Configured 150–200ms smooth transitions across all cards, buttons, alert banners, and recommendation prompts.
  - Enhanced text contrast, icon visibility, focus outlines (`focus-visible:ring-1 focus-visible:ring-cyan-400/60`), and verified zero visual artifacts.

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-25 SPRINT EXECUTIVE BI.4 – Executive Insights & Professional Dashboard Polish

Completed:

- **Task 1: Executive Insight Panel**:
  - Mounted `<ExecutiveInsightPanel />` below the top KPI strip featuring concise business insights: Inventory Value trend (+4.2%), Category A capital allocation (78.4%), Warehouse Yard occupancy (84.5%), and Aging inventory >90D (12.8%).

- **Task 2 & 3: Executive Alert Center & Recommendation Panel**:
  - Mounted `<ExecutiveAlertsAndRecommendations />` below analytics charts.
  - **Alert Center**: Grouped into Critical (Red: low stock items), Warning (Amber: yard capacity tiệm cận 85%), and Information (Blue: audit vouchers approved).
  - **Recommendations**: Actionable C-level prompts (15t steel plate transfer to Yard, 60D aging stock issuance priority, reorder point auto-purchasing).

- **Task 4: Chart Header Improvements**:
  - Enhanced `AnalyticsSection` headers with domain titles, descriptive subtitles, real-time update timestamp badges (`Cập nhật 10m trước`), and compact action triggers.

- **Task 5 & 6: Empty State & Visual Hierarchy Polish**:
  - Refined `CockpitEmptyState` text to business-specific messages with Lucide iconography.
  - Preserved sticky navigation, 60/40 Row 1 composition, and consistent Enterprise surface tokens.

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-25 SPRINT EXECUTIVE BI.3 – Dashboard Layout & Analytics Composition

Completed:

- **Task 1: KPI Strip Optimization**:
  - Eliminated horizontal whitespace by aligning 5 KPI cards in equal `grid-cols-5 gap-2` grid proportions with `h-[92px]` height.

- **Task 2: Analytics Composition (60/40 Ratio Optimization)**:
  - Updated Row 1 grid layout from 50/50 (`xl:grid-cols-2`) to **60/40 ratio (`xl:grid-cols-[1.2fr_0.8fr]`)**.
  - Expanded `"Sức chứa và sử dụng kho"` drawing area so the Donut SVG chart and legend fit comfortably without clipping, while keeping `"Phân tích ABC theo giá trị tồn"` compact.

- **Task 3: Chart Internal Layout Optimization**:
  - Resized Donut SVG container to `h-36 w-36` and optimized inner legend item spacing.
  - Refined Heatmap cards to `h-[155px]` with clear percentage progress indicators (`text-cyan-300`).
  - Reduced `AnalyticsSection` header margin from `mb-3` to `mb-2` to maximize chart drawing height.

- **Task 4, 5 & 6: Information Density, Scroll Experience & Consistency**:
  - Increased above-the-fold information density by eliminating unused whitespace.
  - Maintained sticky sidebar (`sticky top-0 z-10`), sticky top header, and `max-h-[90vh] overflow-y-auto` main scrolling.
  - Standardized Enterprise surface tokens (`rounded-2xl`, `border-white/10`, `bg-slate-950/40`).

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-25 SPRINT EXECUTIVE BI.2 – Enterprise Visual Polish & Color System

Completed:

- **Task 1: Remove KPI Left Accent Artifact**:
  - Removed decorative left accent stripe (`span` pseudo-element) from all KPI cards in `AnalyticsMetricGrid`.
  - Replaced with a clean, unified `border border-white/10 rounded-xl` container with subtle background hover glow.

- **Task 2: Enterprise KPI Color System**:
  - Implemented semantic color mapping for Executive KPI cards:
    - **Inventory Value**: Blue (`text-blue-300`, `border-blue-500/25 bg-blue-500/10`)
    - **Inventory Quantity**: Emerald (`text-emerald-300`, `border-emerald-500/25 bg-emerald-500/10`)
    - **Warning Materials**: Amber (`text-amber-300`, `border-amber-500/25 bg-amber-500/10`)
    - **Warehouse Status**: Purple (`text-purple-300`, `border-purple-500/25 bg-purple-500/10`)
    - **Recent Transactions**: Cyan (`text-cyan-300`, `border-cyan-500/25 bg-cyan-500/10`)

- **Task 3: Chart Color Refresh**:
  - **ABC Analysis**: Mapped A to Emerald (`#10b981`), B to Amber (`#f59e0b`), C to Red (`#ef4444`).
  - **Inventory Aging**: Mapped 0-30d to Blue (`#3b82f6`), 31-60d to Cyan (`#06b6d4`), 61-90d to Amber (`#f59e0b`), >90d to Red (`#ef4444`).
  - **Dual Trend Bars**: Mapped Inbound to Emerald (`#34d399`) and Outbound to Amber (`#f59e0b`).
  - **Top Inventory Gradient Bars**: Updated `colorAt()` sequence to a semantic spectrum (`Blue -> Cyan -> Emerald -> Amber -> Orange -> Purple -> Pink -> Slate`).

- **Task 4, 5 & 6: Typography, Chart Surface & Visual Balance**:
  - Enhanced contrast with `text-white font-semibold` titles, `text-slate-400` labels, and `text-slate-500` secondary text.
  - Eliminated monochrome purple clutter across all sections.

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-25 SPRINT EXECUTIVE BI.1 – Executive BI Popup UI Polish

Completed:

- **Task 1: Reduce KPI Card Height**:
  - Standardized `AnalyticsMetricGrid` card height to `90–92px` with `p-2.5` vertical padding, compact spacing, and `text-lg font-bold` typography for dense information display.

- **Task 2: Analytics Layout & 2-Column Proportions Optimization**:
  - Kept 2-column grid layout strictly intact (`xl:grid-cols-2`).
  - Optimized target height for top row charts ("Sức chứa và sử dụng kho" & "Phân tích ABC theo giá trị tồn") to `h-[230px]` (within `220–240px`).
  - Completely removed unintended purple border / right edge glow decorations by unifying clean cyan borders (`border-cyan-300/18`).

- **Task 3: Lower Analytics Row Height Optimization**:
  - Reduced height of lower row charts ("Tuổi tồn kho", "Biến động tồn kho theo giao dịch", "Top vật tư theo tồn") to `h-[300px]` (within `280–320px`), preserving high readability while showing more information per viewport.

- **Task 4: Scrolling Experience & Fixed Navigation**:
  - Made the Left Sidebar fixed on scroll (`sticky top-0 max-h-[90vh] overflow-y-auto`).
  - Made the Main Content scrollable independently (`max-h-[90vh] overflow-y-auto scrollbar-none`) with clean header positioning.

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-24 SPRINT INVENTORY.3 – Inventory Audit Enterprise UI Standardization

Completed:

- **Task 1: Global Actions Integration**:
  - Bound audit actions (`+ Tạo phiên kiểm kê`, `Nhập kết quả`, `Đối chiếu tồn kho`, `Xuất báo cáo`, `Khóa phiên kiểm kê`) to `InventoryGlobalActionBar` mounted on AppTopbar for `/inventory` path routes.
  - Removed duplicate local action buttons from local header and toolbar.

- **Task 2: Standardize Inventory Audit Tab**:
  - Rebuilt [InventoryAuditPage.tsx](file:///opt/projects/steeltrack/apps/frontend/src/modules/inventory/pages/tabs/InventoryAuditPage.tsx) across all 6 Enterprise layout phases:
    1. **Header / Global Action**: Primary audit action `+ Tạo phiên kiểm kê` in global AppTopbar.
    2. **6 Enterprise KPI Cards**: `Phiên kiểm kê`, `Đang kiểm kê`, `Hoàn thành`, `Chênh lệch tồn`, `Chờ xử lý`, `Giá trị chênh lệch`.
    3. **Enterprise Analytics Dashboard**: 4 `CockpitChartCard` containers (`Tiến độ kiểm kê`, `Chênh lệch theo kho`, `Nguyên nhân chênh lệch`, `Hoạt động kiểm kê gần đây`).
    4. **Compact Enterprise Toolbar**: Search Input with search icon, Kho, Phiên kiểm kê, Người kiểm kê, Trạng thái, Ngày, `[Tìm kiếm]`, `[Làm mới]`.
    5. **Enterprise Hero Table**: Sticky Header, Count Badge (`{rows.length} vật tư audit`), **`[Xem tất cả]`** button opening Expanded Modal, pagination, and columns (`Mã vật tư`, `Tên vật tư`, `Kho`, `Tồn hệ thống`, `Đơn giá TB`, `Giá trị tồn`, `Phát sinh cuối`, `Trạng thái`, `Thao tác`).
    6. **Enterprise Modal + Drawer**: Full-screen Expanded Modal via `createPortal(..., document.body)` + Slide-over `ModuleDetailDrawer` displaying audit details, warehouse, team, differences, attachments, timeline.

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-24 SPRINT INVENTORY.2 – Inventory Transactions Enterprise UI Standardization

Completed:

- **Task 1: Global Actions Integration**:
  - Registered transaction actions (`+ Nhập kho`, `+ Xuất kho`, `Khác...`) in `InventoryGlobalActionBar` mounted on AppTopbar for `/inventory` path routes.
  - Removed duplicate local action buttons from local header and toolbar.

- **Task 2: Standardize Inventory Transactions Tab**:
  - Rebuilt [InventoryTransactionsPage.tsx](file:///opt/projects/steeltrack/apps/frontend/src/modules/inventory/pages/tabs/InventoryTransactionsPage.tsx) across all 6 Enterprise layout phases:
    1. **Header / Global Action**: Primary actions in global AppTopbar (`+ Nhập kho`, `+ Xuất kho`, `+ Chuyển kho`).
    2. **6 Enterprise KPI Cards**: `Tổng giao dịch`, `Nhập kho hôm nay`, `Xuất kho hôm nay`, `Chuyển kho`, `Điều chỉnh tồn`, `Tổng giá trị giao dịch`.
    3. **Enterprise Analytics Dashboard**: 4 `CockpitChartCard` containers (`Xu hướng nhập / xuất kho theo thời gian`, `Giá trị giao dịch theo loại`, `Cơ cấu giao dịch`, `Giao dịch gần đây`).
    4. **Compact Enterprise Toolbar**: Search Input with search icon, Loại GDC, Kho, NCC, Công trình, Ngày Từ - Đến, `[Tìm kiếm]`, `[Làm mới]`, `[Xuất CSV]`.
    5. **Enterprise Hero Table**: Sticky Header, Count Badge (`{rows.length} giao dịch`), **`[Xem tất cả]`** button opening Expanded Modal, pagination, and columns (`Thời gian`, `Loại GDC`, `Số chứng từ`, `Mã vật tư`, `Kho`, `Số lượng`, `Giá trị`, `Đối tượng`, `Người tạo`, `Trạng thái`, `Thao tác`).
    6. **Enterprise Modal + Drawer**: Full-screen Expanded Modal via `createPortal(..., document.body)` + Slide-over `InventoryTransactionDetailDrawer`.

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-24 SPRINT DISPATCH.1 – Dispatch Overview Enterprise Workspace Standardization

Completed:

- **Task 1: Global AppTopbar Action**:
  - Created [DispatchActionContext.tsx](file:///opt/projects/steeltrack/apps/frontend/src/modules/logistics/context/DispatchActionContext.tsx) (`DispatchActionProvider`, `DispatchGlobalActionBar` with `+ Tạo điều xe`).
  - Registered `DispatchGlobalActionBar` inside [AppTopbar.tsx](file:///opt/projects/steeltrack/apps/frontend/src/app/shell/topbar/AppTopbar.tsx) for `/logistics` routes.
  - Wrapped [OperationalShell.tsx](file:///opt/projects/steeltrack/apps/frontend/src/shared/layouts/OperationalShell.tsx) with `<DispatchActionProvider>`.
  - Removed all duplicate `+ Tạo điều xe` buttons from local page header actions, local toolbar, and hero table header.

- **Task 2: Standardize Dispatch Overview**:
  - Standardized [LogisticsPage.tsx](file:///opt/projects/steeltrack/apps/frontend/src/modules/logistics/pages/LogisticsPage.tsx) across all 6 Enterprise Design System layout phases:
    1. **Header / Global Action**: Primary action `+ Tạo điều xe` in global AppTopbar.
    2. **6 Enterprise KPI Cards**: `Chờ điều xe`, `Đã lên xe`, `Đang vận chuyển`, `Đã giao`, `Chậm giao`, `On-time Delivery`.
    3. **Enterprise Analytics Dashboard**: 4 `CockpitChartCard` containers (`Điều xe theo ngày`, `Tiến độ giao hàng`, `Cấu kiện theo trạng thái`, `Top dự án đang giao`).
    4. **Compact Enterprise Toolbar**: Search Input with search icon, Project, Customer, Vehicle, Driver, Status, Date Range dropdowns, `[Tìm kiếm]`, `[Làm mới]`.
    5. **Enterprise Hero Table**: Sticky Header, Count Badge (`{filteredOrders.length} lệnh`), **`[Xem tất cả]`** button, pagination, and columns: `Mã điều xe`, `Dự án`, `Khách hàng`, `Xe`, `Tài xế`, `Số cấu kiện`, `ETA`, `Trạng thái`, `Thao tác`.
    6. **Enterprise Modal + Drawer**: Full-screen Expanded Modal via `createPortal(..., document.body)` + Slide-over `DispatchDetailDrawer` and `CreateDispatchDrawer`.

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-24 Sprint QC.5, QC.6, QC.7, QC.8 UI Polish Sprint

Completed:

- **Sprint QC.5 – NCR Workspace (`/qc/ncr`)**:
  - Standardized tab across 6 Enterprise phases with 6 KPIs (`NCR đang mở`, `Đã đóng`, `Quá hạn`, `Đang CAPA`, `Critical NCR`, `Average Close Time`).
  - Analytics: `NCR theo nguyên nhân`, `NCR theo dự án`, `NCR theo mức độ`, `Trend đóng NCR`.
  - Toolbar: Search Input with search icon, Severity, Status, Project, Owner, Date Range, `[Tìm kiếm]`, `[Làm mới]`.
  - Hero Table: `Mã NCR`, `Dự án`, `Công đoạn`, `Mức độ`, `Chủ sở hữu`, `Deadline`, `Trạng thái`, `Thao tác`.
  - Drawer & Expanded Modal: Slide-over drawer with Summary, Root Cause, Attachments, Timeline, Activity.

- **Sprint QC.6 – CAPA Workspace (`/qc/capa`)**:
  - Standardized tab with 6 KPIs (`CAPA mở`, `Đang thực hiện`, `Hoàn thành`, `Quá hạn`, `Verification Pending`, `Effectiveness`).
  - Analytics: `CAPA Progress`, `CAPA theo Owner`, `CAPA theo Loại`, `Completion Trend`.
  - Toolbar: Search Input with search icon, Status, Owner, Priority, Department, `[Tìm kiếm]`, `[Làm mới]`.
  - Hero Table: `CAPA ID`, `Liên kết NCR`, `Owner`, `Due Date`, `Progress`, `Verification`, `Trạng thái`, `Thao tác`.
  - Drawer & Expanded Modal: Slide-over drawer with Summary, Action Plan, Verification, Timeline, Files, Comments.

- **Sprint QC.7 – Audit Log Workspace (`/qc/logs`)**:
  - Standardized tab with 6 KPIs (`Tổng hoạt động`, `Người dùng`, `Thao tác hôm nay`, `Login`, `Export`, `Critical Events`).
  - Analytics: `User Activity`, `Action Distribution`, `Login Trend`, `Top Users`.
  - Toolbar: Search Input with search icon, User, Action, Module, Date, `[Tìm kiếm]`, `[Làm mới]`.
  - Hero Table: `Thời gian`, `Người dùng`, `Module`, `Hành động`, `Đối tượng`, `IP`, `Chi tiết`, `Thao tác`.
  - Drawer & Expanded Modal: Full Audit Detail slide-over drawer.

- **Sprint QC.8 – QC Reports Enterprise Workspace (`/qc/reports`)**:
  - **Top Investment Workspace**: Standardized tab with 6 KPIs (`Tổng báo cáo`, `Pass Rate`, `NCR Rate`, `CAPA Rate`, `Rework Rate`, `Quality Score`).
  - Analytics Dashboard (6 Cockpit Cards): `Pass Rate Trend`, `Defect Pareto`, `Supplier Ranking`, `Project Quality`, `Monthly QC`, `Defect Heatmap`.
  - Toolbar: Search Input with search icon, Project, Customer, Supplier, Month, Year, Report Type, `[Tìm kiếm]`, `[Làm mới]`.
  - Hero Table: `Tên Báo cáo`, `Dự án`, `Khách hàng`, `Nhà cung cấp`, `Pass Rate`, `NCR`, `CAPA`, `Thao tác / Viewer`.
  - **Enterprise Report Viewer Modal**: Full-screen viewer modal with KPIs, Charts, Tables, and action buttons (`Export Excel`, `Export PDF`, `Print`).

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-24 Sprint QC.2, QC.3, QC.4 UI Polish Sprint

Completed:

- **Sprint QC.2 – Input Inspection (`/qc/inbound`)**:
  - Standardized tab across 6 Enterprise phases with specific KPIs (`Chờ kiểm tra`, `Đạt`, `Không đạt`, `Chờ NCR`, `Quá hạn`, `Pass Rate`).
  - Analytics: `Pass/Fail`, `Defect theo nhà cung cấp`, `Defect theo vật tư`, `Trend theo thời gian`.
  - Toolbar: Search Input with search icon, Supplier, Material, Status, Inspector, Date Range, `[Tìm kiếm]`, `[Làm mới]`.
  - Hero Table with Sticky Header, Count Badge, **`[Xem tất cả]`** button opening Expanded Modal via `createPortal`.

- **Sprint QC.3 – Production Inspection (`/qc/production`)**:
  - Standardized tab across 6 Enterprise phases with KPIs (`Chờ kiểm tra`, `Đạt`, `Không đạt`, `Chờ NCR`, `Quá hạn`, `Pass Rate`).
  - Analytics: `Defect theo công đoạn`, `Pass Rate theo Line`, `NCR theo Line`, `Rework Trend`.
  - Toolbar: Search Input with search icon, Line/Workstation, Process/Stage, Status, Inspector, `[Tìm kiếm]`, `[Làm mới]`.
  - Hero Table columns: `Mã phiếu`, `Công đoạn`, `Cấu kiện`, `Ca sản xuất`, `Người kiểm`, `Kết quả`, `NCR`, `Trạng thái`, `Thao tác`.

- **Sprint QC.4 – Outgoing Inspection (`/qc/final`)**:
  - Standardized tab across 6 Enterprise phases with KPIs (`Chờ kiểm tra`, `Đạt`, `Không đạt`, `Chờ NCR`, `Quá hạn`, `Pass Rate`).
  - Analytics: `Đạt trước giao hàng`, `Thiếu chứng từ`, `Thiếu tem`, `Defect cuối cùng`.
  - Toolbar: Search Input with search icon, Project, Customer, Status, Inspector, `[Tìm kiếm]`, `[Làm mới]`.
  - Hero Table columns: `Mã lô`, `Dự án`, `Khách hàng`, `QC`, `Trạng thái`, `Ngày xuất`, `Thao tác`.

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-24 QC Overview UI Polish Sprint

Completed:

- **Moved Primary Action to AppTopbar (Task 1)**:
  - Created `QCActionContext.tsx` with `QCActionProvider` and `QCGlobalActionBar` (`+ Tạo phiếu kiểm tra cấu kiện`).
  - Registered `QCGlobalActionBar` in `AppTopbar.tsx` for `/qc` routes and wrapped `OperationalShell.tsx` with `QCActionProvider`.
  - Removed duplicate create buttons from local toolbar, page header, and hero table header.
- **Standardized QC Overview Layout (Task 2)**:
  - Standardized QC Overview (`Overview` in `QcPage.tsx`) using the Enterprise Design System following Components Overview layout order:
    1. **6 Enterprise KPI Cards**: `Tổng phiếu QC`, `Chờ kiểm tra`, `Đạt`, `Không đạt`, `Đang xử lý NCR`, `Tỷ lệ Pass`.
    2. **Analytics Dashboard**: 4 `CockpitChartCard` containers (`Pass / Fail`, `Defect Trend`, `QC theo công đoạn`, `Top Defects`).
    3. **Compact Toolbar**: Search Input with search icon, Status dropdown, Inspection Stage dropdown, Project dropdown, Inspector dropdown, `[Tìm kiếm]`, `[Làm mới]`.
    4. **Hero Table**: Sticky Header, Count Badge (`{filteredInspections.length} phiếu QC`), **`[Xem tất cả]`** button, pagination, and side widgets.
    5. **Expanded Modal**: Full-screen table modal rendered via `createPortal(..., document.body)`.
    6. **Detail Drawer**: Slide-over drawer for inspecting QC details.

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-24 Suppliers Quality, Finance, Activity & Reports UI Polish Sprint

Completed:

- **Standardized 4 Suppliers Secondary Tabs (Quality, Payables, Logs, Reports)**:
  - **Supplier Quality Tab (`/suppliers/quality`)**: Upgraded `SupplierQualityTab` with 6 KPI cards (`Điểm chất lượng TB`, `Nhà cung cấp đạt chuẩn`, `Cảnh báo chất lượng`, `Lô bị từ chối`, `CAPA đang xử lý`, `Tỷ lệ đạt chất lượng`), Cockpit Analytics Dashboard, compact filter toolbar with search icon, Hero Table with sticky header & `[Xem tất cả]`, Expanded Modal via `createPortal`, and detail drawer.
  - **Accounts Payable Tab (`/suppliers/payables`)**: Created `SupplierPayablesTab` with 6 KPI cards (`Tổng công nợ`, `Đến hạn`, `Quá hạn`, `Đã thanh toán`, `Chờ thanh toán`, `Tuổi nợ TB`), Cockpit Analytics Dashboard, compact filter toolbar, Hero Table with sticky header & `[Xem tất cả]`, Expanded Modal, and detail drawer.
  - **Activity Log Tab (`/suppliers/logs`)**: Created `SupplierActivityLogsTab` with 6 KPI cards (`Tổng hoạt động`, `Hôm nay`, `Đơn mua mới`, `Giao hàng mới`, `Cảnh báo`, `Người dùng hoạt động`), Cockpit Analytics Dashboard, compact filter toolbar, Hero Table with sticky header & `[Xem tất cả]`, Expanded Modal, and detail drawer.
  - **Reports Tab (`/suppliers/reports`)**: Created `SupplierReportsTab` with 6 KPI cards (`Tổng báo cáo`, `Giá trị mua`, `Doanh số NCC`, `Đúng hạn`, `Chất lượng`, `Tiết kiệm chi phí`), Cockpit Analytics Dashboard, compact filter toolbar, Hero Table with sticky header & `[Xem tất cả]`, Expanded Modal, and detail drawer.

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-24 Suppliers Business Tabs UI Polish Sprint

Completed:

- **Standardized 3 Suppliers Business Tabs (Quotes, Purchase Orders, Deliveries)**:
  - **Suppliers Quotation Tab (`/suppliers/quotes`)**: Created `SupplierQuotesTab` with 6 KPI cards (`Tổng báo giá`, `Chờ phản hồi`, `Đã phản hồi`, `Đã duyệt`, `Quá hạn`, `Tổng giá trị`), Cockpit Analytics Dashboard, compact filter toolbar with search icon, Hero Table with sticky header & `[Xem tất cả]`, Expanded Modal via `createPortal`, and detail drawer.
  - **Suppliers Purchase Orders Tab (`/suppliers/purchase-orders`)**: Created `SupplierPurchaseOrdersTab` with 6 KPI cards (`Tổng PO`, `Chờ duyệt`, `Đã duyệt`, `Đang giao`, `Hoàn thành`, `Giá trị PO`), Cockpit Analytics Dashboard, compact filter toolbar, Hero Table with `[Xem tất cả]`, Expanded Modal, and PO detail drawer.
  - **Suppliers Deliveries Tab (`/suppliers/deliveries`)**: Created `SupplierDeliveriesTab` with 6 KPI cards (`Lịch giao hôm nay`, `Đang vận chuyển`, `Đã giao`, `Trễ`, `Chờ nhận`, `Tỷ lệ đúng hạn`), Cockpit Analytics Dashboard, compact filter toolbar, Hero Table with `[Xem tất cả]`, Expanded Modal, and delivery detail drawer.

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-24 Suppliers Overview UI Polish Sprint

Completed:

- **Moved Primary Action to Global AppTopbar**:
  - Created `SuppliersActionContext` and `SuppliersGlobalActionBar` in `apps/frontend/src/modules/suppliers/context/SuppliersActionContext.tsx`.
  - Registered `SuppliersGlobalActionBar` in `AppTopbar.tsx` for `/suppliers` routes and wrapped app shell with `SuppliersActionProvider` in `OperationalShell.tsx`.
  - Removed duplicate `+ Thêm nhà cung cấp` button from local page header actions.

- **Standardized Suppliers Overview Layout (Cloned Inventory Overview Layout)**:
  - Phase 1: Rendered 6 `EnterpriseKpiCard` items (`Tổng nhà cung cấp`, `Đang hoạt động`, `Tạm ngưng`, `Nhà cung cấp chiến lược`, `Đơn hàng đang xử lý`, `Điểm đánh giá TB`).
  - Phase 2: Created Cockpit Analytics Dashboard (`Phân loại nhà cung cấp`, `Chất lượng & Đánh giá`, `Hoạt động gần đây`, `Top nhà cung cấp`).
  - Phase 3: Added `SupplierFilterBar` in `EnterprisePanel` with search input with search icon, Status dropdown, Category dropdown, Region dropdown, Rating dropdown, Search button, and Refresh button.
  - Phase 4: Standardized Hero Table with sticky header, count badge, pagination, side widgets, and restored `[Xem tất cả]` button.
  - Phase 5: Integrated full-width Expanded Table Modal mounted via `createPortal(..., document.body)`.
  - Phase 6: Retained `SupplierDetailWorkspace` detail drawer.

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-24 Restore Hero Table View All Pattern Sprint

Completed:

- **Restored Standard `[Xem tất cả]` Pattern in Project Components & Materials Hero Tables (`ProjectsPage.tsx`)**:
  - Restored `[Xem tất cả]` action button in both `ProjectComponentsTab` and `MaterialsTab` Hero Table headers.
  - Wired `[Xem tất cả]` buttons to open dedicated Expanded Modals mounted via `createPortal(..., document.body)`.
  - Removed duplicate business header actions (`Trả cấu kiện`, `Trả vật tư`), retaining standard row-level actions (`"Trả"`) for individual components and materials.

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-24 Project Components & Materials Tabs Standardization Sprint

Completed:

- **Project Components Tab (`ProjectComponentsTab` in `ProjectsPage.tsx`)**:
  - Refactored KPI strip to 6 `<EnterpriseKpiCard />` items (`Tổng cấu kiện`, `READY`, `SHIPPED`, `DELIVERED`, `INSTALLED`, `Tỷ lệ lắp đặt`).
  - Added `EnterprisePanel` compact toolbar with search input (with icon), project selector, status dropdown, search & reset buttons.
  - Standardized Hero Table with sticky header, count pill badge `{filtered.length} cấu kiện`, pagination via `DataTablePagination`, and action buttons.

- **Project Materials Tab (`MaterialsTab` in `ProjectsPage.tsx`)**:
  - Refactored KPI strip to 6 `<EnterpriseKpiCard />` items (`Tổng dòng vật tư`, `Allocated`, `Pending Return`, `Returned`, `Available Return`, `Tổng giá trị`).
  - Added `EnterprisePanel` compact toolbar with search input (with icon), project selector, search & reset buttons.
  - Standardized Hero Table with sticky header, count pill badge `{filtered.length} dòng`, pagination via `DataTablePagination`, and clickable pending return links.

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-24 Progress Tab Standardization Sprint

Completed:

- **Progress Tab Standardization (`ProgressTab` in `ProjectsPage.tsx`)**:
  - Wired `filterBarNode` into `ProgressTab` (`/projects/progress`).
  - Standardized layout sequence:
    1. Phase 1: Enterprise KPI Cards (`KpiStrip`)
    2. Phase 3: Compact Toolbar (`filterBarNode`)
    3. Phase 4: Hero Table (`ProjectTable` with side widgets)
    4. Phase 2 / Analytics: Progress Timeline & Risk Alert widgets

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-24 Project List Tab Standardization Sprint

Completed:

- **Project List Tab Standardization (`ProjectListTab` in `ProjectsPage.tsx`)**:
  - Wired `filterBarNode` into `ProjectListTab` (`/projects/list`).
  - Standardized section order:
    1. Phase 1: Enterprise KPI Cards (`KpiStrip`)
    2. Phase 3: Compact Toolbar (`filterBarNode`)
    3. Phase 4: Hero Table (`ProjectTable` with side widgets)
    4. Phase 2 / Analytics: Summary Widgets (`Tiến độ theo thời gian`, `Giá trị theo thời gian`, `Công trình sắp hoàn thành`, `Công trình cần chú ý`)

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-24 Projects Toolbar Position Fix

Completed:

- **Adjusted Toolbar Position in Projects Overview (`ProjectsPage.tsx`)**:
  - Repositioned Compact Toolbar (`FilterBar`) to render **immediately after the Analytics Dashboard** and **above the Hero Table**.
  - Moved secondary overview widgets (`Công trình sắp hoàn thành`, `Công trình chậm tiến độ`, `Hoạt động gần đây`) to render **below the Hero Table**.
  - Restored exact Enterprise section order:
    1. Header (`AppTopbar` & `EnterpriseWorkspace`)
    2. Enterprise KPI Cards (`KpiStrip` with 6 `EnterpriseKpiCard` items)
    3. Analytics Dashboard (`CockpitChartCard` grid)
    4. Compact Toolbar (`FilterBar`)
    5. Hero Table (`ProjectTable` with side widgets)
    6. Secondary Overview Widgets (`Công trình sắp hoàn thành`, `Công trình chậm tiến độ`, `Hoạt động gần đây`)
    7. Expanded Modal (`expandedModalOpen` via `createPortal`)
    8. Detail Drawer (`ProjectDetailWorkspace`)

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-24 Restore Search Input Sprint

Completed:

- **Restored Search Input in Projects Overview (`ProjectsPage.tsx`)**:
  - Wrapped `query` text input in a standard relative container with `Search` icon (`lucide-react`) left-aligned (`absolute left-3`).
  - Restored exact Enterprise toolbar control ordering:
    1. Search Input (left-aligned with icon)
    2. Status ▼ (Dropdown)
    3. Customer ▼ (Dropdown)
    4. Project Manager ▼ (Dropdown)
    5. Region / Type ▼ (Dropdown)
    6. `[Tìm kiếm]` (Button)
    7. `[Làm mới]` (Button)

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-24 Projects Layout Alignment Sprint

Completed:

- **Projects Overview Layout Alignment (`ProjectsPage.tsx`)**:
  - Moved Compact Toolbar (`FilterBar`) to appear **immediately below the Analytics Dashboard** and **above the Hero Table**.
  - Aligned page layout order strictly to Enterprise Design System standard:
    1. Header (Global AppTopbar + Page Title)
    2. Enterprise KPI Cards (`KpiStrip` with 6 `EnterpriseKpiCard` items)
    3. Analytics Dashboard (`CockpitChartCard` grid)
    4. Compact Toolbar (`FilterBar` with dropdown selectors)
    5. Hero Table (`ProjectTable` with count pill, sticky header, and side widgets)
    6. Expanded Modal (`expandedModalOpen` modal via `createPortal`)
    7. Detail Drawer (`ProjectDetailWorkspace`)

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-24 Shared Project Form Sprint

Completed:

- **Unified Single Project Form (`ProjectFormDialog`)**:
  - Created `ProjectFormDialog` (`src/modules/projects/components/ProjectFormDialog.tsx`) supporting `mode="create"` and `mode="edit"`.
  - Preserved all existing validation, layout, form controls, template selector, contract value input formatting, and detail notes.
  - Eliminated duplicate dialog components (`CreateProjectDialog` & `EditProjectDialog`).
  - `+ Thêm công trình` in topbar and `"Sửa công trình"` in detail workspace both invoke the same `ProjectFormDialog` via `useProjectsActions()`.
  - Create mode initializes empty/default values; Edit mode populates existing project fields.

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-24 Projects Overview UI Polish Sprint

Completed:

- **Task 1: Page Header Action Migration**:
  - Created `ProjectsActionContext` & `ProjectsActionProvider` (`src/modules/projects/context/ProjectsActionContext.tsx`) with `CreateProjectModal` mounted via `createPortal(..., document.body)` (`z-[9999] backdrop-blur-sm`).
  - Created `ProjectsGlobalActionBar` (`src/modules/projects/components/ProjectsGlobalActionBar.tsx`) with the primary `+ Thêm công trình` button.
  - Registered `ProjectsGlobalActionBar` in `AppTopbar` (`src/app/shell/topbar/AppTopbar.tsx`) for `/projects` routes and wrapped `OperationalShell` with `ProjectsActionProvider`.
  - Removed duplicate action buttons from local page header actions (`EnterpriseWorkspace` props) so the toolbar contains **only search and filtering controls**.

- **Task 2: Standardize Projects Overview (`ProjectsPage.tsx`)**:
  - **Phase 1: Enterprise KPI Cards**: Top strip refactored to 6 `<EnterpriseKpiCard />` items (`Tổng số công trình`, `Đang triển khai`, `Hoàn thành`, `Chậm tiến độ / Rủi ro`, `Giá trị hợp đồng`, `Tỷ lệ hoàn thành TB`).
  - **Phase 2: Analytics Dashboard**: Standardized `CockpitChartCard` chart widgets for progress timeline, financial value timeline, task status breakdown, and risk alerts.
  - **Phase 3: Compact Toolbar**: Refactored `EnterprisePanel` toolbar containing search input, `status` dropdown, `customerFilter` dropdown, `managerFilter` dropdown, `type` dropdown, `Tìm kiếm` button, and `Làm mới` button.
  - **Phase 4: Hero Table**: Sticky table header (`sticky top-0 z-10 bg-[#1e293b]`), count pill badge `{rows.length} công trình`, pagination via `DataTablePagination`, and "Xem tất cả" action button.
  - **Phase 5: Expanded Modal**: Implemented full-screen table modal (`expandedModalOpen`) using `createPortal(..., document.body)` with `z-[9999] backdrop-blur-sm`.
  - **Phase 6: Detail Drawer**: Standardized `ProjectDetailDrawer` via `ModuleDetailDrawer`.

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-24 Yard Module UI Polish Sprint

Completed:

- **Standardized All 6 Yard Sub-Pages**:
  1. `Yard 2D Map` (`/yard/map-2d`)
  2. `Yard 3D Map` (`/yard/map-3d`)
  3. `Heatmap` (`/yard/heatmap`)
  4. `Timeline` (`/yard/timeline`)
  5. `Movement History` (`/yard/history`)
  6. `Reports / Tracking` (`/yard/locations`, `/yard/components`, `/yard/dispatch`, `/yard/tracking`)

- **Header Action Rules Enforced Across All Sub-Pages**:
  - Reused `YardActionProvider` and `YardGlobalActionBar` in `AppTopbar`.
  - Header actions strictly maintain `+ Nhập bãi` (Primary), `Xuất bãi` (Secondary), and `Khác ▼` dropdown menu (`Quản lý Zone`, `Quản lý Slot`, `Chuyển nội bộ`). No extra primary buttons added.

- **Phase Implementation**:
  - Phase 1: 6 `<EnterpriseKpiCard />` strip items.
  - Phase 2: Standardized `CockpitChartCard` chart cards.
  - Phase 3: Compact `EnterprisePanel` toolbar with standard dropdown selectors (`warehouseFilter`, `zoneFilter`, `statusFilter`, `projectFilter`).
  - Phase 4: Hero Table / Spatial Map Layout with sticky table headers, count pill badges, and `DataTablePagination`.
  - Phase 5: Full-screen expanded table modal via `createPortal(..., document.body)` (`z-[9999] backdrop-blur-sm`).
  - Phase 6: Standardized `YardDetailDrawer` via `ModuleDetailDrawer`.

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-24 Yard Overview UI Polish Sprint

Completed:

- **Task 1: Topbar Action Provider Integration**:
  - Created `YardActionContext` & `YardActionProvider` (`src/modules/yard/context/YardActionContext.tsx`) managing `openInbound`, `openOutbound`, `openTransfer`, `openCreateZone`, and `openCreateSlot`.
  - Created `YardGlobalActionBar` (`src/modules/yard/components/YardGlobalActionBar.tsx`) with:
    1. `+ Nhập bãi` (Primary)
    2. `Xuất bãi` (Secondary)
    3. `Khác ▼` (Dropdown menu with `Quản lý Zone`, `Quản lý Slot`, `Chuyển nội bộ`).
  - Registered `YardGlobalActionBar` in `AppTopbar` (`src/app/shell/topbar/AppTopbar.tsx`) for `/yard` routes and wrapped `OperationalShell` with `YardActionProvider`.
  - Removed all duplicate action buttons from local page header, toolbar, hero table, and tab content.

- **Task 2: Standardize Yard Overview (`YardPage.tsx`)**:
  - **Phase 1: Enterprise KPI Cards**: Top strip refactored to 6 `<EnterpriseKpiCard />` items (`Sức chứa bãi Tập kết`, `Sức chứa khả dụng`, `Cấu kiện lưu bãi`, `Giao dịch bãi hôm nay`, `Zone quá tải (>=90%)`, `Cầu trục vận hành`).
  - **Phase 2: Analytics Dashboard**: Standardized `CockpitChartCard` chart widgets for yard capacity donut, movement flow donut, and monthly mini trend.
  - **Phase 3: Compact Toolbar**: Refactored `EnterprisePanel` toolbar containing search input, `warehouseFilter` dropdown, `zoneFilter` dropdown, `statusFilter` dropdown, `projectFilter` dropdown, `Tìm kiếm` button, and `Làm mới` button. Toolbar contains **only search and filtering controls**.
  - **Phase 4: Hero Table**: Sticky table header (`sticky top-0 z-10 bg-[#1e293b]`), count pill badge `{filteredSlots.length} slot bãi`, pagination via `DataTablePagination`, and "Xem tất cả" action button.
  - **Phase 5: Expanded Modal**: Implemented full-screen table modal (`expandedModalOpen`) using `createPortal(..., document.body)` with `z-[9999] backdrop-blur-sm`.
  - **Phase 6: Detail Drawer**: Standardized `YardDetailDrawer` via `ModuleDetailDrawer`.

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-24 Planning Overview Action Provider Fix Sprint

Completed:

- **BUG 1 Fix: Single Primary Action Enforcement**:
  - Removed duplicate `+ Lập kế hoạch mới` buttons from local page header actions (`EnterpriseWorkspace` props), hero table, toolbar, and tab content.
  - Enforced that `+ Lập kế hoạch mới` exists **ONLY in the global `AppTopbar`**.

- **BUG 2 Fix: Action Chain & Provider Hierarchy**:
  - Moved `PlanningActionProvider` (and `ProductionActionProvider`) to wrap `OperationalShell` (`src/shared/layouts/OperationalShell.tsx`).
  - This ensures `AppTopbar` is rendered INSIDE `PlanningActionProvider`, allowing `PlanningGlobalActionBar` in `AppTopbar` to consume the real `PlanningActionContext` instead of a fallback dummy context.
  - Implemented `CreatePlanModal` inside `PlanningActionContext.tsx` mounted via `createPortal(..., document.body)` with high z-index (`z-[9999]`) and backdrop blur (`backdrop-blur-sm`).
  - Verified full action chain: `PlanningGlobalActionBar` -> `PlanningActionContext` -> `PlanningActionProvider` -> `createPlanOpen: true` -> `CreatePlanModal` -> `createPortal` -> visible modal.

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-24 Planning Overview UI Polish Sprint

Completed:

- **Task 1: Page Header Primary Action Migration**:
  - Created `PlanningActionContext` & `PlanningActionProvider` (`src/modules/planning/context/PlanningActionContext.tsx`).
  - Created `PlanningGlobalActionBar` (`src/modules/planning/components/PlanningGlobalActionBar.tsx`) with the primary `+ Lập kế hoạch mới` button.
  - Registered `PlanningGlobalActionBar` in `AppTopbar` (`src/app/shell/topbar/AppTopbar.tsx`) for `/planning` routes and passed it to `EnterpriseWorkspace` actions.
  - Cleared primary action buttons from the toolbar so it contains **only search and filtering controls**.

- **Task 2: Standardize Planning Overview (`PlanningPage.tsx`)**:
  - **Phase 1: Enterprise KPI Cards**: Refactored top KPI strip to 6 `<EnterpriseKpiCard />` items (`Chờ thực hiện (Planned)`, `Đang thực hiện (In Progress)`, `Điểm nghẽn / Cảnh báo`, `Hoàn thành mục tiêu`, `Tổng số kế hoạch`, `Dự án đang theo dõi`).
  - **Phase 2: Analytics Dashboard**: Standardized planning category breakdown & constraint bottleneck warning chart cards (`CockpitChartCard`).
  - **Phase 3: Compact Toolbar**: Refactored `EnterprisePanel` toolbar containing search input, `statusFilter` dropdown, `projectFilter` dropdown, `customerFilter` dropdown, `monthFilter` dropdown, `Tìm kiếm` button, and `Làm mới` button. All categorical filters use predefined dropdown selectors.
  - **Phase 4: Hero Table**: Added sticky table header (`sticky top-0 z-10 bg-[#1e293b]`), count pill badge `{filteredPlans.length} hạng mục`, typography polish, and `DataTablePagination`.
  - **Phase 5: Expanded Modal**: Implemented full-screen table modal (`expandedModalOpen`) using `createPortal(..., document.body)` with `z-[9999] backdrop-blur-sm`.
  - **Phase 6: Detail Drawer**: Standardized `PlanningDetailDrawer` via `ModuleDetailDrawer`.

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-24 Production Advanced Operations UI Polish Sprint

Completed:

- **All 9 Advanced Operations Views (`ProductionCockpitPage.tsx`) Fully Standardized**:
  - **1. Dispatching / Machines (`MachinesWorkspace`)**:
    - Phase 1: 6 `<EnterpriseKpiCard />` items (`Tổng số máy móc`, `Máy Online / Sẵn sàng`, `Máy Offline / Dừng`, `Utilization trung bình`, `Work Centers`, `Máy đang bảo trì`).
    - Phase 3: Compact `EnterprisePanel` search & status toolbar. Primary actions (`+ Lệnh SX`, `+ BOM`) elevated to Topbar (`ProductionGlobalActionBar`).
    - Phase 4: Sticky header `Hero Table` (`sticky top-0 z-10 bg-[#1e293b]`), count pill badge `{rows.length} máy`, pagination.
    - Phase 5: Full-screen expanded table modal (`expandedModalOpen`) using `createPortal(..., document.body)` with `z-[9999]`.
  - **2. Production Warehouse (`ProductionWarehouseCockpit`)**:
    - Phase 1: 6 `<EnterpriseKpiCard />` items (`Tồn kho sản xuất`, `Giá trị tồn kho SX`, `Mã vật tư có tồn`, `Nhu cầu sản xuất`, `Vật tư giữ chỗ`, `Cảnh báo thiếu hụt`).
    - Phase 3: Compact `EnterprisePanel` search & status filter toolbar.
    - Phase 4: Sticky header `Hero Table` (`sticky top-0 z-10 bg-[#1e293b]`), count pill badge `{filteredRows.length} vật tư`, pagination.
    - Phase 5: Full-screen expanded table modal (`expandedModalOpen`) via `createPortal(..., document.body)`.
  - **3. Material Reservations (`Reservations`)**:
    - Phase 1: 6 `<EnterpriseKpiCard />` items (`Tổng số Reservation`, `Đang giữ chỗ`, `Khối lượng nhu cầu VT`, `Khối lượng đã giữ chỗ`, `Khối lượng đã cấp phát`, `Giữ chỗ hết hạn/hủy`).
    - Phase 3: Compact `EnterprisePanel` toolbar with status select (`RESERVED`, `DRAFT`, `PARTIALLY_ISSUED`, `EXPIRED`) and search.
    - Phase 4: Sticky header `Hero Table` (`sticky top-0 z-10 bg-[#1e293b]`), count pill badge `{filteredRows.length} giữ chỗ`, pagination.
    - Phase 5: Full-screen expanded table modal (`expandedModalOpen`) via `createPortal(..., document.body)`.
  - **4. Material Ledger (`MaterialLedger`)**:
    - Phase 1: 6 `<EnterpriseKpiCard />` items (`Tổng dòng Ledger`, `Biến động ròng`, `KL Reserve`, `KL Release`, `KL Issue`, `KL Consume`).
    - Phase 3: Compact `EnterprisePanel` toolbar with MO select, Material select, EventType select, date filters.
    - Phase 4: Sticky header `Hero Table` (`sticky top-0 z-10 bg-[#1e293b]`), count pill badge `{rows.length} dòng`, pagination.
    - Phase 5: Full-screen expanded table modal (`expandedModalOpen`) via `createPortal(..., document.body)`.
  - **5. Material Issues (`Issues`)**:
    - Phase 1: 6 `<EnterpriseKpiCard />` items (`Tổng số phiếu cấp`, `Nhu cầu cấp phát`, `Khối lượng đã cấp`, `Khối lượng hoàn trả`, `Khối lượng còn thiếu`, `Tỷ lệ hoàn thành cấp`).
    - Phase 3: Compact `EnterprisePanel` toolbar with status filter (`COMPLETED`, `ISSUED`, `PARTIAL`) and search.
    - Phase 4: Sticky header `Hero Table` (`sticky top-0 z-10 bg-[#1e293b]`), count pill badge `{filteredIssueRows.length} phiếu cấp`, pagination.
    - Phase 5: Full-screen expanded table modal (`expandedModalOpen`) via `createPortal(..., document.body)`.
    - Phase 6: Standardized `IssueDetailDrawer`.
  - **6. Material Consumptions (`Consumptions`)**:
    - Phase 1: 6 `<EnterpriseKpiCard />` items (`Tổng dòng tiêu hao`, `Khối lượng đã cấp`, `Khối lượng hoàn trả`, `Khối lượng tiêu hao`, `Khối lượng phế phẩm`, `Còn treo tại SX`).
    - Phase 3: Compact `EnterprisePanel` toolbar with search input.
    - Phase 4: Sticky header `Hero Table` (`sticky top-0 z-10 bg-[#1e293b]`), count pill badge `{filteredRows.length} dòng`, pagination.
    - Phase 5: Full-screen expanded table modal (`expandedModalOpen`) via `createPortal(..., document.body)`.
  - **7. Incidents & Rework (`ProductionIncidentsWorkspace`)**:
    - Phase 1: 6 `<EnterpriseKpiCard />` items (`Tổng số cảnh báo/sự cố`, `Đơn hàng trễ`, `Cảnh báo Log hệ thống`, `Sự cố Order`, `Sự cố từ máy/process`, `Mức độ nghiêm trọng`).
    - Phase 3: Compact `EnterprisePanel` toolbar with source filter (`Order`, `Log`) and search input.
    - Phase 4: Sticky header `Hero Table` (`sticky top-0 z-10 bg-[#1e293b]`), count pill badge `{filteredRows.length} cảnh báo`, pagination.
    - Phase 5: Full-screen expanded table modal (`expandedModalOpen`) via `createPortal(..., document.body)`.
  - **8. Machine Logs (`Logs`)**:
    - Phase 1: 6 `<EnterpriseKpiCard />` items (`Tổng số nhật ký`, `Hoạt động hôm nay`, `Phân loại nhật ký`, `Lệnh SX liên quan`, `Công đoạn vận hành`, `Trạng thái hệ thống`).
    - Phase 3: Compact `EnterprisePanel` toolbar with log type select filter and search input.
    - Phase 4: Sticky header `Hero Table` (`sticky top-0 z-10 bg-[#1e293b]`), count pill badge `{filteredRows.length} nhật ký`, pagination.
    - Phase 5: Full-screen expanded table modal (`expandedModalOpen`) via `createPortal(..., document.body)`.
  - **9. Advanced Reports (`ProductionReportsWorkspace`)**:
    - Phase 1: 6 `<EnterpriseKpiCard />` items (`Lệnh sản xuất`, `Đang chạy xưởng`, `Đã hoàn thành`, `Khối lượng Steel Issued`, `Khối lượng Steel Consumed`, `Vật tư đang giữ chỗ`).
    - Phase 2: Refactored analytics card presentation matching Components & Production Overview.

Verification:
- `pnpm -C apps/frontend build` compiled 100% cleanly with **0 errors**.
- `pnpm -C apps/backend-api build` compiled 100% cleanly with **0 errors**.
- `git diff --check` passed cleanly with **0 format errors**.

## 2026-07-23 Production Core Workflow UI Polish Sprint

Completed:

- **PART 1: Production Planning (`ProductionCockpitPage.tsx`)**:
  - Phase 1: Standardized KPI strip with 6 `<EnterpriseKpiCard />` items (`Tổng kế hoạch`, `Kế hoạch chưa phát hành`, `Đã duyệt / Phát hành`, `Chờ cấp vật tư`, `Trễ tiến độ KH`, `Khối lượng KH`).
  - Phase 2: Refactored planning analytics dashboard & charts.
  - Phase 3: Standardized compact Search & Filter toolbar (`compactInput`, status select dropdown, `Tìm kiếm` button, `Làm mới` button).
  - Phase 4: Refactored Planning Hero Table (`h-[430px]` scroll container, `sticky top-0 z-10 bg-[#1e293b]` header, `{total} kế hoạch` count pill badge).
  - Phase 5: Standardized full-screen expanded table modal (`expandedModalOpen`) using `createPortal(..., document.body)` & `z-[9999]`.
  - Phase 6: Standardized detail drawer (`OrderWorkspace`).
- **PART 2: Production Execution (`ProductionExecutionBoard.tsx`)**:
  - Phase 1: Refactored KPI strip with 6 `<EnterpriseKpiCard />` items (`Lệnh đang thực thi`, `Chờ cấp vật tư`, `Cắt & Chuẩn bị`, `Gá & Hàn xưởng`, `Trễ tiến độ`, `Hoàn thành công đoạn`).
  - Phase 2: Standardized stage distribution and bottleneck chart cards.
  - Phase 3: Added compact Search & Filter toolbar with stage select filter (`Cutting`, `Assembly`, `Welding`, `Painting`, `Completed`).
  - Phase 4: Refactored Execution Hero Table (`h-[430px]` scroll container, `sticky top-0 z-10 bg-[#1e293b]` header, `{cards.length} lệnh thực thi` count pill badge).
  - Phase 5: Implemented full-screen expanded table modal (`expandedModalOpen`) using `createPortal(..., document.body)`.
  - Phase 6: Standardized detail drawer (`ExecutionDrawer`).
- **PART 3: BOM & Material Supply (`ProductionCockpitPage.tsx`)**:
  - Phase 1: Standardized KPI strip with 6 `<EnterpriseKpiCard />` items (`Tổng Production BOM`, `BOM đang sử dụng`, `Dòng định mức VT`, `Khối lượng ước tính`, `Dự án áp dụng`, `BOM đã lưu trữ`).
  - Phase 2: Refactored BOM analytics cards (structure type distribution & status breakdown).
  - Phase 3: Added compact Search & Filter toolbar with structure type filter select. Primary action button `+ BOM` moved to topbar via `ProductionGlobalActionBar`.
  - Phase 4: Refactored BOM Hero Table (`h-[430px]` scroll container, `sticky top-0 z-10 bg-[#1e293b]` header, `{filteredRows.length} BOM` count pill badge).
  - Phase 5: Implemented full-screen expanded table modal (`expandedModalOpen`) using `createPortal(..., document.body)`.
  - Phase 6: Standardized detail drawer (`BomWorkspace`).
- **PART 4: Production QC (`QcPage.tsx`)**:
  - Phase 1: Standardized QC KPI strip (`Pending`, `In Progress`, `Passed`, `Failed / Rework`, `NCR mở`, `MO chờ QC xuất bãi`).
  - Phase 2: Refactored QC pass rate trend and project defect analytics.
  - Phase 3: Standardized compact Search & Filter toolbar with QC status filter (`READY`, `IN_PROGRESS`, `PASSED`, `FAILED`, `REWORK_REQUIRED`).
  - Phase 4: Refactored QC Hero Table (`h-[430px]` scroll container, `sticky top-0 z-10 bg-[#1e293b]` header, `{total} phiếu QC` count pill badge).
  - Phase 5: Implemented full-screen expanded table modal (`expandedModalOpen`) using `createPortal(..., document.body)`.
  - Phase 6: Standardized detail drawer (`InspectionDetail`).
- **Verification**: `pnpm -C apps/frontend build` & `tsc -b` compile 100% cleanly with 0 errors.

## 2026-07-23 Production Navigation Architecture Refactor Sprint

Completed:

- **Sidebar Navigation Streamlining (`navigation.config.ts`)**:
  - Reorganized Production module sidebar items into 6 core workflow top-level items (`Tổng quan sản xuất`, `Lệnh sản xuất (MO)`, `Kế hoạch sản xuất`, `Thực thi sản xuất`, `BOM & Vật tư sản xuất`, `QC Sản xuất`).
  - Created a dedicated 7th top-level navigation item **Nghiệp vụ nâng cao** (`/production/advanced`) to group low-frequency feature pages as children (`Điều độ & Máy móc (OEE)`, `Kho sản xuất`, `Giữ chỗ vật tư`, `Sổ vật tư SX`, `Cấp phát vật tư`, `Tiêu hao vật tư`, `Sự cố & Rework`, `Nhật ký vận hành`, `Báo cáo nâng cao`).
- **Route & Workspace Integration (`AppRouter.tsx`, `ProductionCockpitPage.tsx`)**:
  - Added route `<Route path="/production/advanced" element={<ProductionPage />} />` preserving all URL structures, permissions, and business logic.
  - Implemented `<ProductionAdvancedWorkspace />` dashboard component inside `ProductionCockpitPage.tsx` with quick-access cards and action links to all 9 advanced operations.
- **Verification**: `pnpm -C apps/frontend build` & `tsc -b` compile 100% cleanly with 0 errors.

## 2026-07-23 Production Overview UI Consistency Fix Sprint

Completed:

- **BUG 1 – Compact Toolbar Alignment (`ProductionCockpitPage.tsx`)**:
  - Replaced uncompact fixed-column layout with compact grid layout (`xl:grid-cols-[180px_1fr_130px_120px]`).
  - Removed empty reserved grid space for unused filter controls.
  - Implemented usable Status dropdown select (`Tất cả trạng thái`, `Đang sản xuất`, `Hoàn thành`, `Trễ tiến độ`) + responsive search input (`1fr`), primary blue "Tìm kiếm" button (`130px`), and glassmorphic "Làm mới" button (`120px`) matching `Components Overview` 100%.
- **BUG 2 – "Xem tất cả" Expanded Modal Portal Fix (`ProductionCockpitPage.tsx`)**:
  - Refactored `expandedModalOpen` modal rendering to use `createPortal(..., document.body)` with `z-[9999] backdrop-blur-sm fixed inset-0 flex items-center justify-center bg-black/75`.
  - Ensured clicking "Xem tất cả" immediately mounts the full-screen expanded table modal onto `document.body` without child element clipping, unmounting, or navigation side effects.
- **Verification**: `pnpm -C apps/frontend build` & `tsc -b` compile 100% cleanly with 0 errors.

## 2026-07-23 Production Overview Layout Alignment Sprint

Completed:

- **Task 1 – Page Header Action Buttons**: Created `ProductionGlobalActionBar` and `ProductionActionProvider` (`ProductionActionContext.tsx`) to move `+ Lệnh SX` and `+ BOM` action buttons from the lower toolbar into the top header action area (`AppTopbar.tsx`), matching the exact header action layout of `Components Overview`.
- **Task 2 – Production Overview Layout Alignment (`ProductionCockpitPage.tsx`)**:
  - Matched page wrapper & container spacing (`<EnterpriseModulePage><div className="space-y-2 text-xs -mt-2">`).
  - Matched KPI grid column counts (`md:grid-cols-2 xl:grid-cols-6`), margins, and padding.
  - Aligned Search & Filter toolbar styling (`<EnterprisePanel className="rounded-xl -mt-1">`), primary blue "Tìm kiếm" button, and glassmorphic "Làm mới" button matching `Components Overview`.
  - Matched Hero Table container shell (`h-[430px] overflow-auto scrollbar-none`), sticky headers (`sticky top-0 z-10 bg-[#1e293b]`), count pill badges, and pagination.
  - Verified drawer (`OrderWorkspace`), expanded modal (`expandedModalOpen`), hover states, and empty states.
- **Verification**: `pnpm -C apps/frontend build` & `tsc -b` compile 100% cleanly with 0 errors.

## 2026-07-23 Production Overview UI Polish Sprint

Completed:

- **Production Overview UI Polish (`ProductionCockpitPage.tsx`)**:
  - Phase 1: Upgraded KPI section using 6 `<EnterpriseKpiCard />` items (`Đang sản xuất`, `Hoàn thành hôm nay`, `Chờ vật tư`, `Trễ tiến độ`, `Cấu kiện đang chạy`, `Khối lượng sản xuất`) with HSL tones, 32x32px icon badges, vector sparklines, and skeleton loading states.
  - Phase 2: Standardized analytics dashboard cards (`Tiến độ sản xuất`, `Vật tư cấp phát`, `Cần chú ý hôm nay`, `Công đoạn sản xuất`, `Cấu kiện đang sản xuất`) aligned with Components Overview.
  - Phase 3: Standardized Search & Refresh toolbar (`compactInput`, primary blue `+ Lệnh SX` & `+ BOM` buttons, status filters `IN_PROGRESS`, `COMPLETED`, `DELAYED`).
  - Phase 4: Refactored Production Orders Hero Table (`h-[430px]` scroll container, `sticky top-0 z-10 bg-[#1e293b]` header, count pill badge, pagination).
  - Phase 5: Added in-place full-screen expanded table modal (`expandedModalOpen`) for "Xem tất cả".
  - Phase 6: Standardized Production Detail Workspace Drawer (`OrderWorkspace`) with material readiness, stage execution timeline, and yard placement integration.
- **Verification**: `pnpm -C apps/frontend build` & `tsc -b` compile 100% cleanly with 0 errors.

## 2026-07-23 Components Module UI Polish Sprint (All 7 Tabs Completed: List, Production, Finished Goods, Materials Usage, Transfer, Internal QC, History & Reports)

Completed:

- **Components Global Action Bar & Context**: Created `ComponentsGlobalActionBar` and `ComponentsActionProvider` to decouple creation dialogs (`+ Cấu kiện`, `+ Lệnh SX`, `+ BOM`) from local pages and make topbar action buttons available across all Components sub-tabs.
- **Components List Tab UI Polish (`ComponentsListPage.tsx`)**:
  - Phase 1: Upgraded KPI section with `<EnterpriseKpiCard />` (sparklines, icons, deltas, loading states).
  - Phase 2: Aligned Search & Refresh toolbar to match Inventory Overview Golden Reference (`compactInput`, primary blue button, glassmorphic reset button).
  - Phase 3: Refactored "Danh sách cấu kiện" Hero Table (`h-[430px]` scroll container, `sticky top-0 z-10 bg-[#1e293b]` header, count pill badge).
  - Phase 4: Added in-place full-screen expanded modal (`expandedModalOpen`) for "Xem tất cả".
- **Components Production Tab UI Polish (`ComponentsProductionPage.tsx`)**:
  - Phase 1: Upgraded KPI strip with 6 `<EnterpriseKpiCard />` items (`Tổng lệnh SX`, `Đang sản xuất`, `Chờ sản xuất`, `Hoàn thành`, `Quá hạn`, `Tỷ lệ hoàn thành`).
  - Phase 2: Refactored analytics right rail cards.
  - Phase 3: Aligned Search & Refresh toolbar (`compactInput`, `searchDraft`, status filter).
  - Phase 4: Refactored Production Orders Hero Table (`h-[430px]` scroll container, sticky header).
  - Phase 5: Implemented in-place full-screen expanded table modal (`expandedModalOpen`).
  - Phase 6: Standardized row click interaction to open `ModuleDetailDrawer`.
- **Components Finished Goods Stock Tab UI Polish (`ComponentsStockPage.tsx`)**:
  - Phase 1: Refactored KPI section using 5 `<EnterpriseKpiCard />` items (`Tổng cấu kiện`, `READY`, `SHIPPED`, `DELIVERED`, `INSTALLED`).
  - Phase 2: Standardized analytics cards in right rail (`Thông số tồn kho`, `Phân bố vị trí`, `Cảnh báo bãi`).
  - Phase 3: Aligned Search & Refresh toolbar (`compactInput`, `searchDraft`, primary blue button, glassmorphic reset button).
  - Phase 4: Refactored Finished Goods Hero Table (`h-[430px]` scroll container, `sticky top-0 z-10 bg-[#1e293b]` header, count pill badge, pagination).
  - Phase 5: Added in-place full-screen expanded modal (`expandedModalOpen`) for "Xem tất cả".
  - Phase 6: Standardized Finished Goods Detail Drawer with direct navigation to Yard map (`/yard#map-2d`).
- **Components Materials Usage Tab UI Polish (`ComponentsMaterialStockPage.tsx`)**:
  - Phase 1: Refactored KPI strip with 6 `<EnterpriseKpiCard />` items (`Tổng mã vật tư SX`, `Giá trị tồn kho SX`, `Giao dịch SX`, `Khả dụng sản xuất`, `Cảnh báo thiếu BOM`, `Vị trí có vật tư`).
  - Phase 2: Standardized analytics cards in right rail (`Thiếu vật tư`, `Giá trị tồn kho`, `Giao dịch gần đây`, `Top vật tư khả dụng`).
  - Phase 3: Aligned Search & Refresh toolbar (`compactInput`, `searchDraft`, status filter, primary blue button, glassmorphic reset button).
  - Phase 4: Refactored Materials Usage Hero Table (`h-[430px]` scroll container, `sticky top-0 z-10 bg-[#1e293b]` header, count pill badge, pagination).
  - Phase 5: Added in-place full-screen expanded modal (`expandedModalOpen`) for "Xem tất cả".
  - Phase 6: Standardized Material Usage Detail Drawer with material transaction history & return to main warehouse form (`returnToMainWarehouse`).
- **Components Transfer Tab UI Polish (`ComponentsTransfersPage.tsx`)**:
  - Phase 1: Refactored KPI strip with 4 `<EnterpriseKpiCard />` items (`Tổng lệnh chuyển`, `Hoàn thành`, `Hôm nay`, `Gần nhất`).
  - Phase 2: Standardized analytics cards in right rail (`Điều chuyển hôm nay`, `Trạng thái thực thi`, `Gần đây`).
  - Phase 3: Aligned Search & Refresh toolbar (`compactInput`, `searchDraft`, primary blue button, glassmorphic reset button).
  - Phase 4: Refactored Transfer Hero Table (`h-[430px]` scroll container, `sticky top-0 z-10 bg-[#1e293b]` header, count pill badge, pagination).
  - Phase 5: Added in-place full-screen expanded modal (`expandedModalOpen`) for "Xem tất cả".
  - Phase 6: Standardized Transfer Detail Drawer (`ModuleDetailDrawer`) to display transfer movement metrics upon row click.
- **Components Internal QC Tab UI Polish (`ComponentsInternalQcPage.tsx`)**:
  - Phase 1: Refactored KPI strip with 6 `<EnterpriseKpiCard />` items (`Cấu kiện cần QC`, `QC đạt`, `Đang kiểm`, `Chờ dữ liệu`, `Ready to ship`, `Cập nhật gần nhất`).
  - Phase 2: Standardized analytics cards in right rail (`Phân bổ kết quả QC`, `Sự cố NCR`, `Gần đây`).
  - Phase 3: Aligned Search & Refresh toolbar (`compactInput`, `searchDraft`, status filter, primary blue button, glassmorphic reset button).
  - Phase 4: Refactored QC Hero Table (`h-[430px]` scroll container, `sticky top-0 z-10 bg-[#1e293b]` header, count pill badge, standardized QC status badges `Đạt` / `Đang kiểm` / `Chờ dữ liệu`, pagination).
  - Phase 5: Added in-place full-screen expanded modal (`expandedModalOpen`) for "Xem tất cả".
  - Phase 6: Standardized QC Detail Drawer (`ModuleDetailDrawer`) to display component QC & production progress metrics upon row click.
- **Components Processing History Tab UI Polish (`ComponentsHistoryPage.tsx`)**:
  - Phase 1: Refactored KPI strip with 6 `<EnterpriseKpiCard />` items (`Tổng cấu kiện gia công`, `Hoàn thành`, `Đang gia công`, `Chờ gia công`, `Lỗi / Làm lại`, `Kết quả đạt`).
  - Phase 2: Standardized analytics right rail cards (`Hoạt động hôm nay`, `Theo trạng thái`, `Lịch sử gần đây`).
  - Phase 3: Aligned Search & Refresh toolbar (`compactInput`, `searchDraft`, công đoạn action filter).
  - Phase 4: Refactored Processing History Hero Table (`h-[430px]` scroll container, sticky header, count pill badge, pagination).
  - Phase 5: Added in-place full-screen expanded modal (`expandedModalOpen`) for "Xem tất cả".
  - Phase 6: Standardized Processing History Detail Drawer (`ModuleDetailDrawer`) displaying stage execution details.
- **Components Reports Tab UI Polish (`ComponentsReportsPage.tsx`)**:
  - Phase 1: Refactored KPI strip with 6 `<EnterpriseKpiCard />` items (`Tổng cấu kiện`, `Đang gia công`, `Trong kho`, `Ready to ship`, `Đã xuất bãi`, `Thay đổi`).
  - Phase 2: Standardized analytics dashboard cards (`Phân bổ lifecycle`, `Biến động lifecycle`).
  - Phase 3 & 5: Aligned toolbar with search input & "Xuất Báo Cáo" export action presentation button.
  - Phase 4: Refactored Report Hero Table (`Cấu kiện báo cáo`) & quick stats strip.
  - Phase 6: Standardized Report Detail Drawer (`ModuleDetailDrawer`) displaying snapshot metrics upon row click.
- **Verification**: `pnpm -C apps/frontend build` & `tsc -b` compile 100% cleanly with 0 errors.

## 2026-07-23 Component Manufacturing Workflow Sprint A

Completed:

- Started the Component Manufacturing Workflow epic with Sprint A:
  Engineering Release gate.
- Enforced that Production Order creation requires an Engineering-released
  Component before manufacturing can begin.
- Legacy `POST /production` now rejects component-bound orders unless the
  Component has `lifecycleState=ACTIVE` and a current released revision.
- Canonical `/production/commands/orders` now validates the released
  engineering basis: Component lifecycle, current revision, released revision,
  released BOM definition and content hash all must match the command payload.
- Added unit coverage for rejecting Production Order creation before
  Engineering release.
- Reused existing Component aggregate states and released BOM/revision models;
  no Prisma schema or migration was required for Sprint A.
- Historical Dashboard, Snapshot Engine, Warehouse Realtime, Inventory module
  and Production UI were not modified.

## 2026-07-23 Production Order Creation and Component Lifecycle Hardening

Completed:

- Fixed the Production Order creation mismatch where the frontend sent legacy
  `PLANNED` status to `POST /production` while the approved Production
  lifecycle requires new orders to start as `DRAFT`.
- Kept backend Production validation intact; invalid create requests still fail
  through the existing Zod/service checks.
- Hardened legacy Component creation to assign `lifecycleState=DRAFT` and
  `aggregateVersion=1`, matching the canonical Components command side.
- Updated Components read models so draft components are labelled `Draft` and
  are not counted as finished-goods stock in the Components dashboard/project
  KPI paths.
- Added additive QC NCR defect context fields and persisted them in existing
  NCR metadata for traceability without schema changes.
- No Prisma schema, migrations, Inventory workflow, Historical Dashboard,
  Snapshot Engine or Historical API changes were made.

## 2026-07-23 Executive Historical Dashboard UI

Completed:

- Added the frontend `/history` Executive Historical Dashboard page.
- Added a typed Historical Dashboard API client using the standard
  authenticated `lib/api` request pipeline.
- Added TanStack Query hooks for historical dashboard snapshots, latest
  authoritative snapshot, monthly rollups, inventory snapshots, inventory
  monthly rollups and snapshot jobs.
- Built the Industrial Cockpit UI with existing shared components:
  `EnterpriseModulePage`, `CockpitKpiCard`, `CockpitChartCard`,
  `CockpitTableShell`, `DataTablePagination`, `InventoryPanel` and shared
  module empty/loading states.
- Added tabs for Overview, Inventory, Production, Projects, Suppliers and
  Snapshot Jobs.
- Added date/from/to/warehouse/module/authoritative filters and snapshot job
  status filtering.
- Added route and sidebar entry for `/history`.
- Kept backend, Prisma, Snapshot Engine, Scheduler and Job Queue unchanged.

## 2026-07-22 Historical Dashboard Read API

Completed:

- Added a backend read-only Historical Dashboard REST API under `/history`.
- Implemented `HistoricalDashboardModule`, controller, service and repository
  following Controller -> Service -> Repository -> Prisma.
- Exposed read endpoints for daily dashboard snapshots, latest authoritative
  dashboard snapshots, dashboard monthly rollups, inventory daily snapshots,
  inventory monthly rollups and snapshot jobs.
- Added strict Zod query DTOs for date/module/warehouse/authoritative/status
  and pagination filters.
- Returned serialized DTO responses instead of Prisma model instances,
  including safe Date, Decimal and BigInt conversion.
- Kept Snapshot Engine, Scheduler, Job Queue, Prisma schema, migrations,
  frontend and business logic unchanged.
- Added service tests for dashboard lookup, not-found handling and paginated
  job serialization.

## 2026-07-22 Historical Snapshot Engine Production Hardening

Completed:

- Hardened the Historical Snapshot Engine without changing Prisma schema,
  migrations, APIs, controllers, frontend or business workflows.
- Added `snapshotType` to deterministic job identity so different snapshot
  types for the same module/date/scope can coexist safely.
- Made scheduling atomic with a PostgreSQL advisory transaction lock around
  job identity checks and creation.
- Prevented retryable failed jobs from being recreated by the scheduler.
- Ensured snapshot metadata only advances and cannot be moved backwards by an
  older job finishing later.
- Marked non-current-day snapshot generation as stale/non-authoritative when
  the current read model cannot reconstruct historical state.
- Changed job processing to claim one job at a time and added expired
  max-attempt RUNNING cleanup.
- Reduced inventory snapshot memory pressure with cursor batching and lease
  checks between batches.

## 2026-07-22 Historical Dashboard Snapshot Engine

Completed:

- Implemented the backend-only Historical Snapshot Engine.
- Added metadata-driven daily scheduling from `SnapshotMetadata`.
- Added `SnapshotJob` queue processing with pending/running/completed/failed
  lifecycle, worker leases, expired lease recovery and retry attempts.
- Added structured `SnapshotJobLog` writes for start, completion, failure and
  snapshot write stages.
- Added idempotent upserts for `DashboardSnapshot`,
  `InventoryBalanceSnapshot`, `DashboardMonthlyRollup` and
  `InventoryMonthlyRollup`.
- Added monthly rollup generation triggered by month-change metadata.
- Stored job duration and snapshot type in existing `SnapshotJob.metadata`
  because schema is frozen.
- Added unit coverage for metadata scheduling and duplicate job suppression.

## 2026-07-22 Historical Dashboard Prisma Schema Hardening

Completed:

- Hardened the new Historical Dashboard Prisma models before business logic is
  added.
- Replaced historical free-text module/status/source/scope/granularity fields
  with dedicated Prisma enums where appropriate.
- Changed daily historical snapshot tables from composite Prisma IDs to
  single-column UUID primary keys for simpler Prisma Client usage, while
  keeping raw SQL partition caveats documented.
- Added non-null inventory bucket keys for daily and monthly inventory
  snapshots to avoid PostgreSQL nullable-unique duplicate risk.
- Updated migration notes to reflect enum-backed validation and remaining raw
  SQL requirements.

## 2026-07-22 Historical Dashboard Prisma Schema Foundation

Completed:

- Added Prisma models for the approved Historical Executive Dashboard database
  design: dashboard snapshots, inventory balance snapshots, monthly rollups,
  snapshot jobs, job logs, rebuild requests and snapshot metadata.
- Preserved existing business tables and did not add services, APIs or frontend
  code.
- Added schema TODOs for PostgreSQL features Prisma cannot express directly:
  partitioning, check constraints, partial indexes, covering indexes and GIN
  indexes.
- Created `docs/runtime/historical-dashboard-prisma-migration-plan.md` with the
  raw SQL migration notes and metadata seed plan.

## 2026-07-22 Inventory Material Created Date Input

Completed:

- Added a `Ngày thêm` date-time picker to the Add Material drawer header so the
  operator can set when a new material was added without changing the drawer
  body layout.
- Extended the create-material DTO to accept optional `createdAt` and persisted
  it to the existing `InventoryItem.createdAt` field.
- Kept edit material behavior unchanged; existing materials continue to display
  their stored created date internally but do not expose an edit-time override.
- No Prisma schema or migration was changed.

## 2026-07-22 Executive Dashboard Data Availability Hotfix

Completed:

- Fixed Executive Dashboard data mapping for `Giá trị nhập kho`, `Giá trị xuất kho`
  and `Sản xuất đang chạy`.
- Made dashboard row extraction handle nested/paginated API payloads such as
  `data`, `items`, `rows`, `transactions`, `results` and `records`.
- Normalized inbound/outbound transaction types and included transaction line
  item totals when header-level amount fields are absent.
- Anchored 30-day KPI sparklines to the newest available backend timestamp and
  added missing date fields such as `transactionDate`, `eventDate` and
  `plannedStartAt`.
- Removed the heavy left accent strip from analytics detail panels while
  keeping the cleaner panel border and glow treatment.

## 2026-07-22 Login & Sidebar Brand Polish

Completed:

- Rebuilt the login screen with `images/login-factory-bg.jpg` as the full-page
  factory background and `images/logo-bg.jpg` as the login logo.
- Added an animated luminous stroke running around the outside edge of the
  central login panel.
- Updated active sidebar branding from SteelTrack/ERP Platform to
  TRIVIETSTEEL/Smart Solutions.
- Updated collapsed sidebar to use `images/logo-tv.png` and moved the expand
  button to the bottom of the mini sidebar.
- Refined Executive Dashboard donut charts to use sharper flat-ended segments
  with subtle spacing, avoiding the previous overlapping round-cap look.

## 2026-07-22 Executive Dashboard Business Data Polish

Completed:

- Replaced the executive inventory-by-warehouse chart with inventory value by
  material type using real `/inventory/audit` value fields.
- Corrected the material group chart to use the same real inventory-value
  dataset for both donut and legend.
- Wired import/export trend to existing `/inventory/overview` movement history,
  falling back only to real transaction rows and otherwise showing an empty
  state.
- Reworked the import/export widget into a period comparison chart with
  currency axis, paired inbound/outbound bars and bottom metric table.
- Added visible operational alert counts for low-stock materials, negative
  stock, open NCR and late dispatches.
- Softened Executive KPI drill-down colors and Vietnamese section/status text.
- Added separate enlarged popups for the six dashboard chart panels and the
  operational risk panel, each with hover lift/glow and additional detail
  tables.
- Removed header quick search, LIVE badge and refresh controls to free display
  space.
- Added custom date-range filtering beside `Hôm nay`, `7 ngày` and `30 ngày`,
  with presets anchored to the newest available dashboard timestamp.
- Changed top KPI drill-downs from full-page replacement to a smaller modal
  overlay.
- Changed the main import/export card to a compact zig-zag trend and enlarged
  the popup grouped bar chart.
- Added semantic color emphasis for important values in popup detail tables.
- Tightened QC, delivery and operational-alert behavior so charts/alerts render
  only from authoritative backend data.

## 2026-07-22 Executive Dashboard KPI Reference Alignment

Completed:

- Refined the 8 Executive Dashboard KPI cards to match the provided reference:
  smaller icon frame, title placed beside the icon, compact value display,
  green/red percentage delta and 30-day mini trend line.
- Removed old `Tốt` / `Bình thường` status badges from KPI cards.
- Formatted currency KPI values into compact Vietnamese units such as `tỉ` and
  `triệu` while preserving the existing backend data source.

## 2026-07-22 Executive Dashboard Final Visual Polish

Completed:

- Improved Executive Dashboard KPI cards with stronger domain gradients,
  semantic halos, accent borders, domain-shaped icon frames, richer sparklines
  and more premium hover motion.
- Increased analytics chart dominance through taller chart canvases, larger
  donut visuals, stronger progress fills and reduced border-heavy panel feel.
- Kept all data sources unchanged and did not add fake metrics or synthetic
  values.

## 2026-07-22 Executive Dashboard Chart Empty-State Polish

Completed:

- Removed repeated `Dữ liệu lịch sử chưa khả dụng` labels from Executive
  Dashboard KPI sparklines.
- Allowed dashboard trend panels to fall back to existing real
  ranking/distribution/status data when time-series history is unavailable.
- Reduced Executive Dashboard analytics font weights from heavy black/bold
  styles to medium-weight typography for cleaner rendering.
- Preserved backend, API contracts, business logic and data integrity.

## 2026-07-22 Executive Dashboard V4.1 Final UI Polish

Completed:

- Added `shared/ui/analytics` primitives and domain themes for the Executive BI
  Portal.
- Refined dashboard KPI cards so each business domain has distinct visual
  identity through color, icon, gradient, hover treatment, domain pattern and
  sparkline.
- Reworked domain analytics drill-down pages so Inventory, Inbound, Outbound,
  Production, QC, Projects and Dispatch use different chart/layout
  compositions instead of one generic template.
- Preserved backend, API contracts, routes, permissions, schema and business
  logic.
- Kept missing authoritative data as standard empty states; no fake values or
  synthetic chart arrays were added.

## 2026-07-22 EPIC 12.4 Executive BI Portal Final Redesign

Completed:

- Rebuilt `DashboardPage.tsx` as an Executive BI Portal rather than a single
  generic dashboard page.
- Added exactly 8 executive KPI cards with domain-specific color identity,
  iconography, status badge, hover/glow interaction and real-data sparkline or
  no-history state.
- Replaced hardcoded KPI values, hardcoded month arrays and generic fullscreen
  detail content with existing backend/read-model data from Inventory,
  Production, QC, Projects and Logistics APIs.
- Added domain analytics workspaces for Inventory, Inbound, Outbound,
  Production, QC, Projects and Dispatch.
- Removed the dead Executive export action until a real export contract exists.
- Preserved backend APIs, routes, schema, authentication, permissions and
  business logic.

## 2026-07-21 EPIC 5.0 Suppliers UI Completion

Completed:

- Refined active Supplier routes against the Inventory/Components/Production/
  Projects UI canon without changing backend/API/business behavior.
- Added standard pagination and stable empty rows to the Supplier list and
  Quality evaluation table.
- Removed synthetic Supplier KPI trend arrays.
- Converted unavailable Supplier capability tabs into full controlled empty
  workspaces with KPI, filter, table, right rail and bottom analytics
  structure instead of lone placeholder cards.
- Preserved existing Supplier hooks, API contracts, routes, permissions,
  schema and workflow semantics.

## 2026-07-21 EPIC 4.0 Projects UI Completion

Completed:

- Refined active Projects routes against the Inventory/Components/Production
  UI canon without changing backend/API/business behavior.
- Moved Projects Overview and Projects List to a table-hero composition with
  KPI cards, right analytics rail and bottom analytics band.
- Replaced the active project detail milestone timeline's static label list
  with WBS/phase-derived milestones and a standard empty state when no real WBS
  data exists.
- Preserved existing Projects runtime/template/detail APIs, React Query
  contracts, routes, permissions, schema and workflow semantics.

## 2026-07-21 EPIC 3.1 Production UI Polish

Completed:

- Polished Production toolbar behavior by removing inert filter controls and
  keeping only working status filters plus creation actions.
- Added a paginated table-hero surface to Production Queue before the kanban
  lanes so the tab follows Inventory's workspace rhythm.
- Strengthened Production Queue right rail with stage distribution,
  bottleneck metrics and an attention queue using existing production data.
- Converted Consumption right rail into equal-height cockpit cards for rules,
  distribution and balance.
- Filled Incidents right rail with delayed-order, warning-log and total alert
  coverage panels.
- Preserved backend, API contracts, React Query contracts, permissions, schema
  and business behavior.

## 2026-07-21 EPIC 3 Production Completion

Completed:

- Exposed the Production Machines workspace through `/production/machines`
  using the existing authenticated machine endpoint and shared cockpit
  primitives.
- Removed Production synthetic KPI trend arrays and fake chart fallback values.
  Widgets now render real values or standard no-data states.
- Added table pagination for Production Consumptions and Incidents so the
  workspaces no longer render unbounded rows.
- Added stable empty rows to Production BOM, Warehouse, Issues, Reservations,
  Material Ledger and Logs table surfaces to preserve the Inventory table-hero
  footprint with low data volume.
- Removed hardcoded sample metrics from the unused legacy Production telemetry
  component.
- Preserved backend APIs, React Query contracts, permissions, routes outside
  the new Machines route, schema and business behavior.
- Created `docs/reports/production-completion-report.md` and updated the
  Production full UI audit status.

## 2026-07-21 EPIC 2 Components Completion

Completed:

- Remediated Components secondary tabs against the Inventory UI canon:
  Production/BOM, Stock, Material Stock, Transfers, Internal QC, History and
  Reports now use Inventory-canon page, panel, chart and pagination primitives
  for their primary workspace surfaces.
- Removed hardcoded/fabricated Components UI data paths: static KPI trend
  arrays, synthetic donut fallback values, static source labels and the
  Reports timeline index fallback were removed.
- Replaced non-functional History filter controls with the real read-model
  search/action filter contract.
- Preserved backend APIs, React Query contracts, routes, permissions, schema
  and domain behavior.
- Created `docs/reports/components-completion-report.md` and updated the
  Components full UI audit/backlog execution status.

## 2026-07-21 Components Inventory Canon Alignment

Completed:

- Used Inventory Overview and Inventory Materials as the visual composition
  reference for Components Overview and Components List.
- Components Overview now gives the component table a stronger Inventory-like
  hero footprint, keeps analytics in a compact right rail and places QC/ready
  queues in an independent full-width section below.
- Components List now uses an Inventory-style filter panel, table panel,
  stable empty rows, Inventory pagination wrapper and a fuller right analytics
  rail beside the table.
- Preserved backend, API, routes, permissions, React Query contracts, drawer
  behavior and business logic.

## 2026-07-20 COMPOSITION001 Enterprise Workspace Composition Redesign

Completed:

- Kept Inventory unchanged as the Golden Reference and applied its composition
  principles to selected non-Inventory enterprise pages.
- Performed screenshot QA against Inventory Materials at 1440x1100 and refined
  page-level layout only: Production now keeps table/loading/error as the hero,
  and Settings opens as KPI/filter/table/rail workspace instead of page-local
  navigation.
- Rebalanced Production Overview lower panels into a wider production-stage
  workspace plus an active-component/log support rail.
- Rebalanced Components Overview queue panels so QC queue is primary and
  Ready to Ship is secondary context.
- Rebalanced QC Overview analytics so trend owns the row and status/project/NCR
  summaries move into a support rail.
- Rebalanced Suppliers, Settings and Notifications so directory/catalog/feed
  surfaces dominate while detail/guidance panels stay secondary.
- Created `docs/ui/composition/` with principles, module review, before/after
  analysis, hero workspace rules and summary.
- Preserved backend, API, routes, permissions, authentication, database, React
  Query contracts, business logic, Inventory pages, shared tokens and shared
  component APIs.

## 2026-07-18 VISUAL001 Enterprise Visual Composition Transformation

Completed:

- Reverse-engineered Inventory's strongest composition pattern into shared
  cockpit/workspace primitives: compact KPI scan, stronger charts, dominant
  table workspace and secondary right context.
- Increased shared chart and table heights to give primary operational
  workspaces more visual weight.
- Strengthened large/table `CockpitChartCard` treatment and added a subtle
  `CockpitTableShell` surface/scroll owner.
- Reduced shared workspace spacing to improve information density without
  changing module data or workflows.
- Created `docs/ui/visual-composition/` analysis, rules, module comparison,
  redesign summary and remaining opportunities.
- Preserved backend, APIs, routes, permissions, authentication, database, React
  Query contracts and business logic.

## 2026-07-18 PLATFORM002 Enterprise Application Completion

Completed:

- Audited active application routes for visible unfinished or developer-oriented
  wording.
- Removed user-facing `REAL` source labels from Dashboard, Production and
  Components cockpit copy.
- Replaced Components QC `mock` wording with lifecycle-based business copy.
- Replaced Inventory location `demo` labels with data verification language.
- Reworded Command Center, Analytics and Copilot hero copy into commercial ERP
  operations language.
- Created `docs/ui/application-completion/` audit, review, empty-state,
  shared-pattern, freeze-checklist and summary documents.
- Preserved backend, APIs, routes, permissions, authentication, database, React
  Query contracts and business logic.

## 2026-07-18 PLATFORM001 Enterprise Platform Completion

Completed:

- Expanded Settings into an Enterprise Platform Hub for Organization,
  Security, Monitoring and Reports Center capabilities without creating new
  backend/API contracts.
- Added useful platform empty states and capability tables for areas that do
  not yet have authoritative read contracts.
- Upgraded Notification Center with real KPI cards, search, filters, list and
  detail panel using existing notification data.
- Replaced Supplier temporary navigation/analytics wording with useful empty
  states and next-step guidance.
- Removed visible placeholder wording from active Dashboard assumptions and an
  unused Projects placeholder helper.
- Preserved backend, APIs, routes, permissions, database, React Query contracts
  and business logic.

## 2026-07-18 FINAL001 Enterprise Workspace Polish

Completed:

- Audited Inventory, Production, Components, QC and shared Enterprise UI
  surfaces for release-candidate workspace consistency.
- Kept the NAV001 sidebar-first model intact: no duplicated module navigation
  inside `EnterpriseWorkspace`.
- Aligned QC page-level visual aliases with shared module panel, input, button
  and table tokens.
- Documented remaining UI debt for modal shells, status badges, older
  Inventory form fragments and browser visual certification.
- Preserved backend, APIs, React Query, routes, permissions, authentication,
  database and business logic.

## 2026-07-18 NAV001 Eliminate Redundant Workspace Navigation

Completed:

- Removed route-based workspace navigation, module titles, descriptions and
  breadcrumbs from the shared `EnterpriseWorkspace` content shell.
- Preserved operational action buttons and non-route local tabs that do not
  duplicate sidebar routing.
- Expanded `EnterpriseModulePage` to use the full available workspace width
  instead of applying an additional content max-width.
- Removed the Inventory module tab bar from `MaterialDetailPage` while keeping
  entity-level material detail tabs.
- Preserved backend, APIs, routes, permissions, database and business logic.

## 2026-07-18 EPIC QC001 Enterprise Quality Command Center

Completed:

- Reworked the QC overview into a quality command center using existing QC
  workspace/dashboard data only.
- Added a quality alert band for active inspections, failed/rework/NCR rows and
  production orders still waiting for QC.
- Applied the dashboard Top N rule with working `Xem tất cả` navigation to the
  full QC list/plan workspaces.
- Strengthened the right-side decision panel with MO waiting queue and latest
  inspection context.
- Replaced static calibration equipment examples with a truthful no-data state
  until an authoritative calibration contract exists.
- Preserved backend, APIs, React Query, routes, permissions, authentication,
  database and business logic.

## 2026-07-18 EPIC BUSINESS001 Steel Structure Domain Completion

Completed:

- Reframed Production reporting and order language around manufacturing-order,
  steel issue/consumption, material readiness and release-readiness decisions.
- Replaced a non-actionable Production ready-to-release placeholder with real
  work orders where material readiness is at least 100%.
- Reframed Components Overview, List, Internal QC and Reports around component
  lifecycle, fabrication, QC wait, ready-to-ship and project distribution.
- Removed placeholder-style `0 NCR` metrics where no NCR contract exists and
  replaced them with values derived from existing lifecycle data.
- Preserved backend, APIs, React Query contracts, routes, permissions,
  authentication, database and business logic.

## 2026-07-18 UX Review Round 2 Business Cockpit Alignment

Completed:

- Reworked Production Overview right-side cockpit cards around manager
  decisions: progress distribution, material readiness and an attention queue
  for delayed, shortage or low-progress orders.
- Reworked Components Overview right-side cockpit cards around status
  distribution, activity, project distribution, QC queue and ready-to-ship
  queue.
- Increased chart visual weight where Production/Components charts were reading
  as secondary decoration.
- Used only existing frontend read data; no backend, API, React Query,
  permission, route, database or business logic changed.

## 2026-07-18 UX Review Round 1 Production and Components Tables

Completed:

- Added `Xem tất cả` from Production overview order table to the full
  `/production/orders` workspace.
- Added `Xem tất cả` from Components overview table to the full
  `/components/list` workspace.
- Kept dashboard tables to Top N rows and left full filtering/pagination/drawer
  workflows in the dedicated list workspaces.
- Reduced oversized empty table feel by using smaller table card height when
  dashboard datasets are short.
- Preserved backend, APIs, React Query, routes, permissions and business logic.

## 2026-07-18 EPIC UI005B Design Language Inference

Completed:

- Documented why Inventory Overview and Materials feel like the Golden
  Reference: KPI-first hierarchy, compact filter adjacency, table-dominant
  workspace, side analytics and drawer-preserved context.
- Applied that design language to Production without copying Inventory JSX:
  Production Overview now has quick actions and operational summary cards
  before the main order table, with recent activity moved into supporting
  context.
- Applied the same philosophy to Components: Overview/List/Reports now use
  denser table rhythm, toolbar-anchored actions and compact summary strips.
- Preserved backend, APIs, DTOs, React Query contracts, routes, permissions,
  authentication, database and business behavior.

## 2026-07-18 EPIC UI005A Production & Components Workspace Completion

Completed:

- Removed redundant in-page hero/breadcrumb/tab chrome from active Production
  and Components workspace wrappers so operational content starts immediately
  under the application toolbar.
- Converted Production Incidents and Reports from placeholder navigation panels
  into real workspaces backed by existing Production read data.
- Replaced the Components Internal QC static row set with live Components data
  and truthful no-data states; added a dedicated Components Reports workspace
  route.
- Preserved backend, APIs, DTOs, React Query contracts, routes, permissions and
  business behavior.
- Browser screenshot evidence remains blocked because the current environment
  has no Chromium, Google Chrome or Playwright executable.

## 2026-07-18 EPIC UI006 Enterprise Shared Components Consolidation

Completed:

- Added `shared/ui/enterprise-components` as the shared visual catalog for
  Inventory-canon panels, chart cards, KPI aliases, pagination, table tokens,
  bars, donuts, meters, status badges and loading states.
- Converted Inventory `InventoryVisuals` into a compatibility wrapper over the
  shared catalog so existing Inventory pages keep the same imports and
  rendering.
- Removed Production's dependency on Inventory visual helpers; Production now
  delegates duplicated chart/status/meter/donut/bar implementations to shared
  components.
- Extended `shared/forms` with textarea, multi-select, checkbox, radio group,
  switch, validation summary, field hint, required label and drawer-form
  primitives.
- Preserved backend, API, React Query, routes, permissions, DTOs and business
  behavior.

## 2026-07-18 BUGFIX INV001 Inventory Table Visibility

Completed:

- Traced blank Overview/Materials table bodies to HTTP 401 responses from an
  unauthenticated Inventory endpoint adapter after RFC017 JWT enforcement.
- Switched the adapter to the existing authenticated application Axios client;
  no endpoint, query key, mapping, pagination, layout or business rule changed.
- Verified the live authenticated materials endpoint returns 25 records in the
  expected paginated contract.

## 2026-07-18 EPIC UI003A Inventory UX Polish

Completed:

- Removed the redundant Inventory breadcrumb/page hero so operational KPI
  content starts immediately below the global application toolbar.
- Reduced Inventory workspace rhythm and KPI height without changing shared
  component behavior outside Inventory.
- Made the Materials table viewport-responsive with a guaranteed visible
  height and retained its sticky header/internal horizontal scrolling.
- Reduced active transaction/material form controls to the approved compact
  density and gave modal/drawer content one bounded scroll owner.
- Preserved backend, API, routes, React Query, permissions and business logic.

## 2026-07-18 EPIC UI003 Inventory Canon Refinement

Completed:

- Restored Inventory breadcrumb, page title and description across all 12
  active routes and standardized page-level vertical rhythm.
- Consolidated Inventory KPI and pagination wrappers onto shared cockpit
  primitives and added sticky shared table headers.
- Added accessible transaction modal/detail drawer focus behavior and replaced
  active browser confirmations with an Enterprise alert dialog.
- Preserved backend, API, routes, React Query, database and business behavior.
- Frontend build and targeted new-primitive lint pass; authenticated browser
  screenshot and screen-reader certification remain pending.

## 2026-07-18 RFC016 Enterprise Production Certification

Completed:

- Certified all seven bounded contexts and shared deployment/runtime controls
  without changing application code, schema, API, business logic or frontend.
- Re-ran backend/frontend builds, 185-test backend regression, Prisma validation,
  migration status, Compose validation and Docker artifact inspection.
- Classified Enterprise Production as `NOT READY` because active Inventory, QC
  and Projects mutations lack authentication, stale claimed work has no safe
  lease recovery and one additive migration remains pending/unproven at scale.

## 2026-07-17 RFC013 Enterprise Database & Performance Readiness

Completed:

- Made Outbox and Background Job claims atomic, bounded and multi-worker safe
  with PostgreSQL `SKIP LOCKED` while preserving processing order.
- Replaced Operations Center count fan-out/full-table telemetry counts with
  grouped status queries and explicit PostgreSQL row estimates.
- Removed Inventory posting material/location N+1 reads and historical cost-line
  loading through batch reads and database aggregation.
- Reduced irrelevant replay checkpoint writes to one per batch and prepared
  additive queue/history indexes without deploying migrations.

## 2026-07-17 RFC012 Enterprise Data Scalability Foundation

Completed:

- Added additive composite indexes for high-volume transaction, Outbox,
  projection, Dispatch and Production material history query shapes.
- Added deterministic Outbox ordering, durable replay resume, bounded replay
  runs and optional projection keyset pagination without breaking page clients.
- Defined enforceable hot/warm/cold, retention, legal-hold and partition review
  policy without deleting data or applying speculative physical partitions.
- Verified projection/replay behavior while explicitly withholding billion-row
  certification because the current runtime dataset is small.

## 2026-07-17 RFC011 Enterprise Query API Adoption

Completed:

- Added one authenticated GET-only module query facade for Inventory,
  Components, Production, QC, Yard, Logistics and Projects.
- Added canonical event projections for QC, Yard, Logistics and Projects using
  the existing Projection Engine and repository.
- Preserved ADR011 live reads for operator workspaces while making dashboard,
  analytics and cross-module projection adoption consistent.
- Added module/view mapping, unknown-view validation and projection/replay
  regression coverage without schema, command, business or frontend changes.

## 2026-07-17 RFC010 Enterprise Operator Application Layer

Completed:

- Added eleven internal operator use-cases above the RFC009 orchestration and
  existing owner command services.
- Standardized operation results with process/correlation IDs, ordered timeline,
  collected results and durable audit receipt references.
- Propagated deterministic step idempotency and stable Inventory receive
  references without adding domain rules.
- Added application routing/order tests without changing routes, frontend,
  repositories, aggregates, schema or Projection Engine.

## 2026-07-17 RFC009 Enterprise Process Orchestration Layer

Completed:

- Added a backend-only saga-style application layer for six enterprise process
  families without adding routes, repositories or cross-domain business rules.
- Propagated deterministic step idempotency, correlation and causation to the
  existing Production, QC, Yard, Logistics and Projects command services.
- Added bounded transient retry, explicit owner-command compensation, durable
  process audit/Outbox receipts and failure propagation.
- Added process integration coverage without changing frontend, schema,
  aggregates, Inventory or the Projection Engine.

## 2026-07-17 EPIC UI001 Enterprise UI Foundation Rollout

Completed:

- Extracted Inventory's page hierarchy into the shared `EnterpriseWorkspace`
  composition without changing Inventory presentation.
- Standardized Components, Production, QC, Yard, Projects, Logistics,
  Suppliers and Administration root layouts and navigation.
- Added shared page-level loading, empty, permission, error and offline states.
- Replaced repeated QC, Suppliers, Users and Roles KPI markup with the existing
  `CockpitKpiCard` primitive.
- Changed no backend, API, React Query, workflow or business logic.

## 2026-07-17 RFC003 Production Aggregate and Execution Implementation

Completed:

* Added the durable AD-017 Production Execution aggregate and internal
  start/pause/resume/complete/abort command boundary.
* Added optimistic concurrency, durable idempotent replay and a database guard
  allowing at most one active run per Work Order.
* Made Order start create its first execution atomically and made Work Order /
  Order completion reject active runs.
* Published canonical V1 `production.execution.*` facts with timeline,
  ActivityLog and audit/domain Outbox in one transaction.
* Reused existing projection routing and changed no controller, route,
  frontend, Inventory, Components or Architecture Decision.

## 2026-07-17 RFC002A Canonical Event Payload Completion

Completed:

* Completed projection-oriented canonical payloads and AD-019 envelopes for
  existing Inventory, Production, Components, QC and Yard publishers.
* Added resulting stock/location facts to canonical Inventory postings without
  changing Inventory business rules or APIs.
* Replaced canonical QC/Yard Prisma graph payloads with bounded event facts.
* Deployed the additive Enterprise Read Platform migration and replayed 90 real
  retained Outbox events across all 20 projections.
* Verified 142 deterministic documents, unchanged counts on resume and zero
  active projection failures.
* Certified absent/incomplete publishers as non-authoritative instead of
  inventing Project, Logistics, Execution, Disposition or Loading workflows.

## 2026-07-17 Enterprise Read Platform Foundation

Completed:

* Added one shared, Outbox-driven projection engine with transactional receipts,
  checkpoints, failures and versioned JSON documents.
* Registered Production, Components, Inventory and cross-module projections and
  exposed a JWT-protected, GET-only paginated Query API.
* Added resumable/rebuild replay over retained Outbox history and integrated
  projection failures with the existing Outbox retry/dead-letter lifecycle.
* Added tests for projection idempotency, replay, failure propagation, GET-only
  routes and projection-before-dispatch ordering.
* Preserved existing aggregate, API, snapshot and UI behavior. UI cutover and
  Inventory canonical payload completion remain follow-up gates.

## 2026-07-17 RFC003 Components Aggregate API Rollout

Completed:

* Exposed the AD-016 Component/Revision/Engineering BOM aggregate through the
  additive authenticated `/components/commands` namespace.
* Added strict command DTOs, mandatory `Idempotency-Key`, optimistic version
  validation and AD-019 correlation/causation propagation.
* Preserved atomic Revision/BOM release, immutable release evidence, timeline,
  ActivityLog, audit Outbox and canonical domain Outbox.
* Added exact replay, conflicting-key, stale-version and legacy API
  compatibility regression coverage.
* Changed no frontend, Inventory, Production, legacy route or schema.

## 2026-07-17 EPIC188 Production Command API Rollout

Completed:

* Added the authenticated additive `/production/commands` API for Production
  Order, Work Order, Completion, Scrap and Rework commands.
* Required durable `Idempotency-Key`, positive `expectedVersion` where
  applicable, and optional correlation/causation propagation.
* Added strict Zod command DTOs, stale-version conflict coverage, exact replay
  deduplication and legacy route metadata compatibility tests.
* Hardened Rework idempotency and completed Scrap Draft/Cancel timeline writes
  without adding events outside AD-019.
* Changed no legacy route, frontend, Inventory, schema or migration.

## 2026-07-17 Components Aggregate Implementation

Completed:

* Implemented AD-016 Component, Revision and Engineering BOM state machines as
  pure domain aggregates.
* Added additive canonical persistence, optimistic aggregate versions,
  one-current-release relation and immutable release evidence.
* Added Components-owned command orchestration for metadata, deprecation,
  reactivation, revision/review/approval/release/archive and BOM validation.
* Added AD-019 canonical V1 events with idempotency, ordering metadata and
  atomic Component timeline, ActivityLog, audit Outbox and domain Outbox.
* Preserved API/frontend compatibility and left legacy `ComponentStatus` rows
  outside the canonical lifecycle until an explicit adoption policy exists.

Notes:

* No Inventory, Production, QC or Yard code changed. No commit or stage was
  created.

## 2026-07-17 ADS004 Cross-module Event Contract

Completed:

* Approved AD-019 and the canonical event catalog for Inventory, Components,
  Production, QC, Projects, Yard and Logistics.
* Defined envelope/payload version 1, publisher-subscriber matrix, aggregate
  ordering, idempotency, retry, dead-letter, replay and governance policies.
* Resolved duplicate aliases for Component release, Production Issue/Return/
  Scrap, Yard item movement and Logistics shipment lifecycle.
* Classified current broad/legacy events as compatibility or internal signals;
  no dual canonical publication was authorized.
* Enforced AD-018: event replay/projection cannot repeat Inventory stock posting.
* Changed no application code, API, schema, migration, workflow or data.

Notes:

* AD-015 through AD-019 architecture gates are complete. Implementation now
  requires bounded additive RFCs and operator/replay validation.

## 2026-07-17 ADS003.5 Production-Inventory Interaction Contract

Completed:

* Approved AD-018 for Production-to-Inventory application commands, bounded
  posting receipts, transaction modes and projection consistency.
* Fixed Reservation/Release/Consumption/Completion/non-recoverable Scrap as
  Production-local operations with no Inventory stock mutation.
* Fixed Issue, Return and recoverable Scrap receipt as Inventory-owned posting
  inside the caller's shared local transaction.
* Defined idempotency, typed posting failures, rollback behavior and the rule
  that Outbox replay never repeats stock mutation.
* Preserved Inventory, Production, Components and QC ownership decisions.
* Changed no application code, API, schema, migration, workflow or data.

Notes:

* ADS004 is the final architecture decision gate before implementation RFCs.

## 2026-07-17 ADS003 Production State Machine

Completed:

* Approved AD-017 for Production Order, Work Order, Execution Run, Completion,
  Scrap and linked Rework lifecycle ownership.
* Retained `READY` as an admission state with Start-time revalidation and fixed
  Production Start at the atomic first execution commit.
* Defined `ProductionOrder 1:N WorkOrder`, append-only partial completion,
  separate final completion/close and immutable Scrap reversal semantics.
* Fixed Rework as a linked `REWORK` Production Order initiated from a QC-owned
  request; the original Order is never rewound.
* Preserved Inventory stock ownership, Component engineering ownership and QC
  rejection/NCR ownership.
* Changed no application code, API, schema, migration, workflow or data.

Notes:

* ADS004 remains mandatory before a Production implementation RFC.

## 2026-07-17 ADS002 Component State Machine

Completed:

* Approved AD-016 for Component identity, Component Revision, Engineering BOM,
  immutable release/supersession and non-destructive archive.
* Defined canonical states, transitions, commands, domain facts, invalid
  transitions and invariants in seven architecture documents.
* Fixed one-current-release cardinality, released-revision immutability and the
  rule that post-release BOM changes require a new revision.
* Classified current `ComponentStatus` values as compatibility projections of
  foreign owner facts; no automatic mapping or migration was authorized.
* Changed no application code, API, schema, migration, workflow or data.

Notes:

* ADS003 and ADS004 remain mandatory before a Components implementation RFC.

## 2026-07-17 ADS001 SteelTrack Domain Ownership Matrix

Completed:

* Approved aggregate, command, event publisher, read-model/query and forbidden
  write ownership for Inventory, Components, Production, QC, Projects, Yard,
  Suppliers and Logistics.
* Fixed Inventory as exclusive stock/valuation owner and Production as owner of
  material intent/usage and manufacturing execution.
* Fixed Components as identity/revision/handoff owner, with Production, QC,
  Yard, Logistics and Project states represented as external facts/projections.
* Replaced direct cross-module repository permission with owner-exported command
  services; documented the constrained same-transaction modular-monolith case.
* Added seven ADS001 decision documents and marked conflicting legacy dependency
  and event guidance as superseded/non-normative.
* Changed no backend, frontend, API, schema, migration, runtime behavior or data.

## 2026-07-17 EPIC186 Components Domain Audit & Foundation

Completed:

* Audited Component aggregate, lifecycle, material flow ownership, history,
  repositories, ADR011 reads, dashboard snapshots, events, runtime, APIs and
  Production/Inventory integration.
* Confirmed Components Core Platform infrastructure remains compliant while
  domain ownership and lifecycle are not aligned.
* Identified the active Components Material Stock path as a P0 boundary issue:
  it reconstructs Production/Inventory data in React and posts generic
  Inventory returns instead of using Production material commands.
* Documented seven audit/foundation reports and an alignment-first roadmap.
* Changed no backend, frontend, API, schema, migration, workflow or data.

## 2026-07-17 EPIC186 Production Domain Completion Assessment

Completed:

* Audited Production Order lifecycle, Work Order foundation, material flow,
  completion/WIP quantities, canonical events, ADR011 read paths, repository
  boundaries and runtime certification evidence.
* Confirmed the existing canonical lifecycle and atomic Outbox implementation
  already pass and must not be replaced by the abbreviated EPIC186 sequence or
  legacy event namespace.
* Identified exact implementation blockers: disconnected Work Order model,
  undefined completion/rejected/remaining quantities, deferred Scrap contract,
  and Consumption ownership conflict with PROD-011/015.
* Created seven audit/design/runtime reports and a bounded alignment-first
  roadmap.
* Changed no backend, frontend, API, Prisma schema, migration, workflow or data.

## 2026-07-14 EPIC185 Transfer Multi-material Pending Items UX

Completed:

* Refactored `TransferTransactionModal` in `InventoryTransactionModals.tsx` to support the multi-material pending pilot.
* Implemented local state batching with "Thêm vào danh sách chờ điều chuyển" button.
* Added exact duplicate location merging (merges quantities if material ID, fromZoneId, fromSlotId, fromLevel, toZoneId, toSlotId, toLevel, and UOM match).
* Designed the Pending Header displaying total unique materials, quantity summaries grouped by UOM, total transfer count, and a toggle button for the list.
* Added a detailed Pending Panel with Edit (loads line item back into form, warns if form is dirty) and Remove actions.
* Configured atomic single-request submission (sends `items[]` array in one API payload, mapping each pending item to positive destination and negative source lines).
* Implemented local available source stock check (`availableSourceQty = sourceQty - pendingQtyAtLoc`) and displayed a visual red warning if transfer quantity exceeds available source stock, while disabling the add action.
* Configured visual 2D focus/highlight on both source and destination `WarehouseMiniMap` instances when editing an item in the pending list.
* Preserved local pending state on submission failures to prevent operator data loss (non-destructive API error handling).
* Implemented dirty cancellation confirmation warning on closing/cancelling.
* Created documentation: `docs/runtime/inventory-transfer-pending-report.md`, `docs/runtime/inventory-transfer-operator-walkthrough.md`, and `docs/runtime/inventory-transfer-ui-review.md`.

## 2026-07-14 EPIC184 Outbound Multi-material Pending Items UX

Completed:

* Refactored `OutboundTransactionModal` in `InventoryTransactionModals.tsx` to support the multi-material pending pilot.
* Implemented local state batching with "Thêm vào danh sách chờ xuất" button.
* Added exact duplicate location merging (merges quantities if material ID, zone ID, slot ID, level, UOM, and target match).
* Designed the Pending Header displaying total unique materials, quantity summaries grouped by UOM, aggregate values, and a toggle button for the list.
* Added a detailed Pending Panel with Edit (loads line item back into form, warns if form is dirty) and Remove actions.
* Configured atomic single-request submission (sends `items[]` array in one API payload, mapping COMPONENT_PRODUCTION target to positive and negative entries).
* Implemented local available stock check (`availableLocationQty = sourceLocationQty - pendingQtyAtLoc`) and displayed a visual yellow warning if total pending exceeds available stock.
* Configured visual 2D focus/highlight on `WarehouseMiniMap` when editing an item in the pending list by loading the coordinates back into the form.
* Preserved local pending state on submission failures to prevent operator data loss (non-destructive API error handling).
* Implemented dirty cancellation confirmation warning on closing/cancelling.
* Created documentation: `docs/runtime/inventory-outbound-pending-report.md`, `docs/runtime/inventory-outbound-operator-walkthrough.md`, and `docs/runtime/inventory-outbound-ui-review.md`.

## 2026-07-14 EPIC183 Inbound Multi-material Pending Items UX

Completed:

* Refactored `InboundTransactionModal` within `InventoryTransactionModals.tsx` to support the multi-material pending pilot.
* Implemented local state batching with "Thêm vào danh sách chờ nhập" button.
* Added exact duplicate location merging (merges quantities if material ID, zone ID, slot ID, level, and UOM match).
* Designed the Pending Header displaying total unique materials, quantity summaries grouped by UOM, and aggregate VAT-inclusive values.
* Added a detailed Pending Panel with Edit (loads line item back into form, warns if form is dirty) and Remove actions.
* Configured atomic single-request submission (sends `items[]` array in one API payload).
* Preserved local pending state on submission failures to prevent operator data loss (non-destructive API error handling).
* Implemented dirty cancellation confirmation warning on closing/cancelling.
* Created design and operator walkthrough documentation `docs/ui/inventory-inbound-pending-report.md`.

## 2026-07-14 EPIC182 Multi-material Business Specification

Completed:

* Froze the repeated Drawer -> 2D selection -> Add to Pending -> Confirm operator
  workflow without application changes.
* Selected automatic merge for exact duplicate material/location/business
  identities and separate entries for different buckets or attributes.
* Defined Pending edit/remove, dirty-close confirmation, grouped unit totals,
  honest unknown weight/value and a Phase 1 limit of 50 business entries.
* Defined ordered validation, advisory local stock checks, authoritative server
  validation, one mutation request and full rollback for any failed line.
* Restricted Phase 1 Transfer to one route per material and prohibited fake
  lot/batch/serial, persistent drafts, partial posting and mutation auto-retry.
* Produced five architecture specifications, two readiness/risk reports and
  synchronized RFC-001 and rollout documentation.
* No backend, frontend, API, schema, migration or data was changed.

## 2026-07-14 EPIC181 Multi-material Business Foundation

Completed:

* Aggregated duplicate material/warehouse/zone/slot/level buckets before stock
  validation, balance mutation and stock-event fan-out while retaining original
  transaction lines.
* Aggregated compatibility quantity updates once per material and hardened the
  Production-owned Inventory posting boundary for duplicate buckets.
* Added deterministic transfer validation and source-before-destination ordering
  for one pair per material without changing the API or schema.
* Added stable-reference idempotency inside the repository transaction and
  bounded retry for Serializable transaction conflicts.
* Removed direct Prisma persistence from `MaterialMovementsService` and kept its
  transaction-created Outbox record atomic.
* Made Return, dashboard activity, transaction CSV/history, location activity
  and Adjustment summaries line-aware without changing layout or styling.
* Added 3 focused suites/10 passing tests and five EPIC181 reports.

## 2026-07-13 EPIC174 Core Platform Final Certification

Completed:

* Moved Inventory Return, Components update/status and Production legacy stage
  events into their owning repository transactions.
* Removed remaining post-commit persistent EventBus paths in the five certified
  modules and added atomic audit Outbox parity where Activity Logs are written.
* Routed Inventory material/transaction events through repository-owned Outbox
  persistence and the shared Event Consumer.
* Standardized Inventory Runtime keys to the same module-level
  hit/miss/read-model/fallback/age/lag contract as Components, Production, QC
  and Yard while retaining granular compatibility counters.
* Updated Operations Center to consume Inventory-specific runtime counters.
* Reran focused atomicity/routing/metric tests: 8 suites and 19 tests passed.
* Certified SteelTrack Core Platform v1.0 across Inventory, Components,
  Production, QC and Yard.

## 2026-07-13 EPIC173 Dashboard Snapshot Cutover Certification

Completed:

* Added additive Components, QC and Yard dashboard endpoints backed by their
  existing Snapshot Read Services.
* Cut Components KPI/status/activity, QC Dashboard KPI/defect/trend and Yard
  KPI/capacity/movement dashboard bindings to persisted snapshots.
* Preserved repository fallback, stale/missing background enqueue and parity
  warnings through the shared Dashboard Reader.
* Kept component tables, QC inspections/queues and Yard maps/operator workspaces
  on repository live read models under ADR011.
* Preserved UI layout, workflow, business logic, schema, feature flags, Runtime,
  Operations Center, Inventory and Production.
* Added controller-boundary tests and reran existing snapshot-reader tests: 6
  suites and 8 tests passed.

## 2026-07-13 EPIC172 Production Cockpit ADR011 Remediation

Completed:

* Added an additive, validated Production Cockpit live read-model endpoint.
* Moved order KPI, progress, material readiness, delayed ranking, queue and Work
  Center composition from React into `ProductionRepository`.
* Added bounded server pagination/filtering/sorting for Overview, Orders and
  Planning while preserving the existing Production API.
* Updated Production React Query keys and bindings; unrelated Production arrays
  are no longer fetched on the primary Cockpit routes.
* Preserved the snapshot-first Production dashboard metrics path and all UI,
  workflow, schema, runtime and Operations Center behavior.
* Added focused repository read-model verification and four EPIC172 reports.

## 2026-07-12 EPIC143 Components Snapshot Foundation

Completed:

* Added additive `ComponentDashboardSnapshot` and reusable `ComponentSummarySnapshot` models plus migration.
* Implemented `ComponentSnapshotRepository` for live calculation, persisted reads and atomic upserts.
* Integrated Components with the shared Snapshot Reader, Writer, Validator, Rebuilder, Dispatcher and Feature Flag layers.
* Routed the existing `component.updated` event to asynchronous Components snapshot jobs without creating new workflows/events.
* Added snapshot-first dashboard/summary reader services with repository fallback and background update enqueue.
* Deployed the additive migration and confirmed no fake/backfill snapshot rows were inserted.
* Preserved Components workspace live read models, frontend, APIs, UI, business logic, Inventory, Production and QC.

## 2026-07-12 EPIC142 Components Workspace Live Read Model

Completed:

* Added additive live read-model endpoints for Components List, Overview, and History.
* Moved Components filtering, sorting, pagination, KPI, material-readiness, distribution, and timeline aggregation from React to repository/database queries.
* Cut Overview and List normal reads to bounded page payloads and replaced hardcoded History rows with real ComponentTimeline data.
* Added optional backward-compatible pagination to `GET /components/:id/timeline`; the legacy array response remains when pagination is omitted.
* Preserved all Components routes, layout, styling, workflow, permissions, mutations, Detail, Costing, schema, Snapshot and Runtime behavior.
* Added focused read-model coverage and validated additive SQL/read shapes against current real data.

## 2026-07-12 EPIC141 Components Repository Completion

Completed:

* Added a focused `ComponentCostingRepository` for all costing, consumption, BOM, valuation, and atomic costing persistence queries.
* Removed `PrismaService`, direct Prisma queries, and direct transaction model writes from `ComponentCostingService`.
* Preserved costing formulas, validation, warnings, API responses, and workflow behavior.
* Registered the repository in `ComponentsModule` and added a focused transaction-boundary test.
* Confirmed Components services contain no direct Prisma persistence access; repository coverage is 100% within the module boundary.
* No frontend, schema, migration, API, Inventory, Production, Snapshot, Runtime, Background, or Operations Center change was made.

## 2026-07-12 EPIC140 Components Core Platform Foundation Audit

Completed:

* Audited Components Controller, services, repository, DTO/API boundaries, entities, frontend workspaces, events, snapshots, runtime and Operations Center readiness.
* Confirmed ComponentsService uses ComponentsRepository, but ComponentCostingService still accesses Prisma directly.
* Classified every Components route under ADR011 and found unbounded client-side list aggregation plus hardcoded QC/History/Reports data.
* Proposed domain-level ComponentDashboardSnapshot/ComponentSnapshot foundations without changing schema.
* Audited canonical event candidates and blocked revision/release/archive events until their domain models/workflows are approved.
* Rated Components Core Platform compliance at 28% and produced five implementation-readiness reports.
* No application code, UI, API, workflow, database or business logic was changed.

## 2026-07-12 EPIC137 Production Operator Validation & Platform Certification

Completed:

* Created the Production operator checklist and complete smoke-test evidence guide.
* Audited lifecycle/material endpoints, repository boundary, canonical/legacy event routing, snapshot foundation, runtime metrics, jobs and Operations Center integration.
* Re-ran 7 focused suites/24 tests successfully.
* Collected read-only runtime evidence: one completed order and one matching Issue/Inventory EXPORT exist, but Production snapshot tables, Production Outbox rows and Production snapshot jobs are empty.
* Rated Production Platform 65% certified: code foundation is complete, while business/runtime certification remains blocked pending one designated operator test order.
* No application code, database, API, UI, workflow or architecture was changed.

## 2026-07-11 EPIC136 Inventory Frontend Foundation Standardization

Completed:

* Audited active Inventory tabs against cockpit/module shared primitives.
* Centralized six active pagination implementations in `InventoryPagination` and removed three unused pagination copies.
* Removed unused Inbound/Outbound KPI wrappers without changing rendered UI.
* Preserved each page's approved pagination density through `containerClassName`.
* Added the frontend design system, component guidelines, Inventory component audit, and shared-component roadmap.
* No API, React Query, backend, business workflow, or presentation redesign was introduced.

## 2026-07-11 EPIC135B Production Material Flow

Completed:

* Activated canonical `production.material.*` Outbox publication for Reservation, Release, Issue, Consumption, and Return.
* Kept each Production event in the same repository transaction as its domain mutation and material ledger row.
* Completed manual Issue ledger parity and kept Consumption separate from Scrap in ledger/events/snapshots.
* Routed canonical material events to Production Order snapshots; Inventory Issue/Return snapshots remain driven by Inventory-owned Outbox events.
* Added focused tests: 7 suites and 24 tests PASS.
* Real operator E2E remains blocked because the database has no disposable Reservation/Consumption fixture and existing business data was not mutated.

## 2026-07-11 EPIC-UI002 Inventory Inbound Workspace Redesign

Completed:

* Redesigned the Inbound ("Nhập kho") tab workspace page layout to inherit the Industrial Cockpit design language (from Dashboard and Outbound).
* Migrated local custom card components to the shared `<CockpitKpiCard />` component, computing actual rolling 6-month historical trends dynamically.
* Wrapped the Inbound table inside `<CockpitTableShell />`, and updated cell paddings (`px-4 py-2.5 text-xs`) and hover-neon cyan styles (`hover:bg-cyan-500/5 hover:text-cyan-300`).
* Replaced the page's search filter panel with standard `<ModuleFilterBar />`, and integrated Quick Actions (Tải lại/refetch, and Export Excel mock toast).
* Replaced custom pagination with standard `<DataTablePagination />`.
* Integrated standard `<ModuleLoadingState variant="table" />` and `<ModuleEmptyState />` for feedback consistency.
* Strictly followed the "Presentation First - UX Later" rule: made zero modifications to the inbound process, creation forms, validation warnings, or backend APIs.
* Created 3 Inbound UI documentation files under `docs/ui/`.

## 2026-07-11 EPIC-UI001 Inventory Outbound Workspace Redesign

Completed:

* Redesigned the Outbound ("Xuất kho") page header, KPI cards, table grid, and pagination to align with the Golden Design Reference.
* Migrated local custom card components to the shared `<CockpitKpiCard />` component, with actual rolling 6-month historical calculations.
* Replaced the page's search inputs with standard `<ModuleFilterBar />` sticky filters, and integrated Quick Actions (Refresh, Export Excel, and Local Drawer launcher).
* Wrapped the Outbound table inside `<CockpitTableShell />`, and updated cell paddings (`px-4 py-2.5 text-xs`) and hover-neon cyan styles (`hover:bg-cyan-500/5 hover:text-cyan-300`).
* Migrated the Outbound creation form from center modal `ModalShell` to standard split-column `<ModuleDetailDrawer size="lg" />`.
* Implemented fuzzy real-time search combobox `<SearchableMaterialSelector />` with full keyboard friendly navigation (Arrow keys, Enter, Escape).
* Resolved P1 layout horizontally-overflowing mini-map issue by stacking maps vertically inside the drawer's secondary column.
* Integrated unsaved warning confirmation prompt on drawer dismissal.
* Created 3 Outbound UI documentation files under `docs/ui/`.

## 2026-07-11 EPIC135A Production-Inventory Transaction Boundary Alignment

Completed:

* Added Inventory-owned `InventoryPostingService` and internal Issue/Return posting command types.
* Moved Production material Issue and Return stock mutation, Inventory transaction creation, valuation, and Inventory Outbox writes behind the Inventory repository boundary.
* Removed all Inventory table mutations from Production repositories and removed manual issue delete compensation.
* Standardized Draft Reservation as demand-only; `RESERVE` ledger is now written only when allocation becomes reserved.
* Separated Consumption and Scrap ledger semantics so `CONSUME` records only consumed quantity.
* Added canonical Production material command types and `production.material.*` event constants for EPIC135B.
* Created four EPIC135A runtime architecture reports.

## 2026-07-11 EPIC134 Production Order Lifecycle

Completed:

* Implemented the canonical Production Order state machine and command endpoints for release, ready, start, pause, resume, complete, close, and cancel.
* Restricted create to `DRAFT` and blocked direct Production Order status writes through generic update.
* Moved canonical lifecycle Outbox creation into the same repository transaction as order and activity mutations.
* Registered all `production.order.*` lifecycle events for Background Engine snapshot updates while retaining legacy event subscriptions for pending historical Outbox rows.
* Added state-machine tests covering valid, invalid, legacy, and terminal transitions.
* Applied Production Snapshot and Production Order lifecycle migrations successfully.
* Created the four EPIC134 runtime validation reports.

## 2026-07-11 Production Blueprint Alignment

Completed:

* Aligned the Production blueprint, domain, workflow, and event-flow documents on one canonical Production Order lifecycle.
* Standardized new lifecycle event names under `production.order.*`.
* Added `READY`, `PAUSED`, and `CLOSED` to `ProductionOrderStatus` through an additive migration while retaining `PLANNED` and `DELAYED` for compatibility.
* Recorded PROD-014: lifecycle transitions and Outbox rows must commit atomically in the repository transaction; snapshot work remains asynchronous.
* Created `docs/runtime/production-blueprint-alignment-report.md` and explicitly deferred lifecycle commands/state-machine implementation to EPIC134.

## 2026-07-11 EPIC133 Production Runtime Metrics & Operations Center Integration

Completed:

* Added Production-specific runtime counters to `PerformanceMetricsService`: snapshot hit/miss, snapshot age/lag, read-model hit, and fallback count.
* Connected Production snapshot reads in `SnapshotReaderService` to the Production runtime counters.
* Prepared `/production/metrics` for dashboard snapshot-first reads through `DashboardReaderService` with repository fallback and unchanged response shape.
* Added Production Platform Health to Operations Center overview, including repository, read model, snapshot, feature flag, event/outbox, background job, runtime, and parity readiness status.
* Extended Operations Center snapshot modules and table counts to include Production dashboard/order/work-center snapshots and core Production tables.
* Created `docs/runtime/production-runtime-metrics-report.md`, `docs/runtime/production-operations-center-report.md`, `docs/runtime/production-runtime-readiness-report.md`, and `docs/runtime/production-platform-health-report.md`.

## 2026-07-11 EPIC132 Production Snapshot Foundation

Completed:

* Added additive persisted Production snapshot schema and migration for `ProductionDashboardSnapshot`, `ProductionOrderSnapshot`, and `WorkCenterSnapshot`.
* Added `ProductionSnapshotRepository` with read, calculate, and upsert paths for dashboard, order, and work-center summaries.
* Wired Production snapshots into `SnapshotsModule`, `SnapshotReaderService`, `SnapshotWriterService`, `SnapshotRebuilder`, `SnapshotUpdateDispatcher`, and `SnapshotFeatureFlagService`.
* Registered existing `production.started`, `production.stage.completed`, `production.delayed`, and `production.completed` events for Background Engine snapshot update jobs.
* Preserved ADR011: Production workspaces remain Repository Live Read Models; only dashboard/cockpit/analytics surfaces are prepared for persisted snapshots.
* Created `docs/runtime/production-snapshot-foundation-report.md`, `docs/runtime/production-snapshot-reader-report.md`, `docs/runtime/production-snapshot-writer-report.md`, and `docs/runtime/production-snapshot-readiness.md`.

## 2026-07-11 EPIC131 Production Repository Foundation

Completed:

* Added focused Production repositories: `BomRepository`, `MaterialIssueRepository`, `ProductionConsumptionRepository`, `ProductionMaterialLedgerRepository`, `ProductionOrderRepository`, `ProductionReservationRepository`, `RoutingRepository`, `WorkCenterRepository`, and `WorkOrderRepository`.
* Expanded `ProductionRepository` for remaining ProductionService persistence paths such as component status updates, QC/Yard staging lookups, component creation, issue numbering, and production stock reads.
* Removed direct `PrismaService`, `this.prisma`, `nextOperationalCode`, and direct transaction model calls from `apps/backend-api/src/modules/production/services/*`.
* Preserved existing Production APIs, UI, workflow behavior, Inventory, Core Platform, Operations Center, snapshots, background jobs, and runtime metrics.
* Created/updated `docs/runtime/production-repository-foundation-report.md`, `docs/runtime/production-repository-boundary-report.md`, and `docs/runtime/production-read-model-foundation-report.md`.

## 2026-07-11 EPIC130 Production Core Platform Foundation

Completed:

* Audited Production against the frozen Inventory Core Platform pattern and ADR011.
* Created `docs/runtime/production-core-foundation-report.md`, `docs/runtime/production-read-model-report.md`, `docs/runtime/production-repository-boundary-report.md`, and `docs/runtime/production-runtime-readiness.md`.
* Confirmed Production workspaces currently use live runtime reads, so no persisted-snapshot workspace violation was found.
* Confirmed Production is not yet Core Platform compliant: multiple Production services still inject `PrismaService` directly, Production snapshot Prisma models/repositories/readers/writers are not implemented, `SnapshotFeatureFlagService` does not include Production, and Operations Center does not expose Production Platform Health.
* No Production code rollout was performed because the required repository/snapshot/Operations hardening is larger than a safe pilot patch and no immediate ADR011 violation required emergency remediation.

## 2026-07-11 EPIC120 Workspace Read Model Standardization

Completed:

* Promoted the Inventory EPIC118.5.1 lesson into an enterprise architecture rule: operator workspaces read Repository Live Read Models, dashboards/cockpits/analytics read Persisted Snapshots with fallback.
* Created `docs/architecture/workspace-read-model-standard.md`, `docs/architecture/dashboard-snapshot-standard.md`, and `docs/architecture/enterprise-read-model-rollout.md`.
* Added ADR011 in `docs/architecture/adr011-workspace-live-read-model.md`.
* Audited Inventory, Production, Projects, QC, Yard, Logistics, Suppliers, and Operations Center in `docs/audit/workspace-data-source-audit.md`.
* Production pilot found no persisted-snapshot workspace violation, so no Production code changes were made in this sprint.
* Deferred Projects detail-tab snapshot/workspace reclassification to rollout Phase 5.

## 2026-07-11 EPIC118.5.1 Inventory React Query Root Cause Fix

Completed:

* Traced the remaining Inventory Materials read-after-write failure from mutation success through React Query invalidation, active refetch, API response, cache update, and table render.
* Identified the exact root cause: `InventoryReadModelService.toMaterialListRow()` preferred `InventoryMaterialSnapshot.currentStock` and `locationPayload` whenever a snapshot was fresh by age, so refetched Materials responses could still contain stale stock during the snapshot lag window.
* Changed the Materials list row mapper to use repository-included live `inventory_location_stocks` for `locationBalances` and `currentStock`, while retaining snapshot valuation metadata where available.
* Removed the retry/polling-style remediation from the active read-after-write path; `invalidateInventoryReadState` now performs explicit invalidation plus active-query refetch only.
* Documented the root-cause trace and fix in `docs/audit/inventory-react-query-root-cause.md`, `docs/runtime/inventory-react-query-trace-report.md`, and `docs/runtime/inventory-read-after-write-root-fix.md`.
* Operator browser smoke testing remains pending because this CLI session does not have an authenticated UI session.

## 2026-07-10 EPIC118.5 Inventory React Query Consistency

Completed:

* Built a complete Inventory React Query dependency map for Overview, Materials, Locations, Material Detail, Material History, Inbound, Outbound, Transfer, Adjustment, Returns, and Stock Take surfaces.
* Reworked `invalidateInventoryReadState` from broad passive invalidation to explicit Inventory query-family invalidation plus active refetch.
* Added short targeted active-query retries after stock-affecting mutations to catch snapshot/read-model completion without global polling or window reload.
* Confirmed `InventoryMaterialsPage` table rows are derived from `materialsData.items`, so stale table behavior was query/refetch timing rather than retained local row state.
* Documented the final read-after-write matrix and marked manual operator smoke validation as pending.

## 2026-07-10 EPIC118.4 Inventory Read-after-Write Consistency

Completed:

* Added centralized Inventory frontend query invalidation for stock-affecting mutations.
* Aligned mutation success invalidation with the active EPIC118.1 query keys for Overview, Materials, Material Detail, Material transaction history, Locations, Return Requests, and Dashboard.
* Removed stale invalidation gaps where legacy `materials` or `zones` keys did not match active read-model queries.
* Added 5-second mounted Overview refetching so snapshot-first dashboard data is picked up after Background Engine refresh without a manual page reload.
* Documented the read-after-write audit, query invalidation matrix, refresh consistency model, and React Query behavior.

## 2026-07-10 EPIC118.3 Inventory Historical Metrics Remediation

Completed:

* Added persisted Inventory Overview historical metric support through canonical `InventoryDashboardSnapshot.scopeKey = 'ALL'` rows.
* Added nullable historical snapshot fields for out-of-stock, primary, secondary, and consumable material counts/stocks without backfilling fake history.
* Updated Inventory Overview historical KPI deltas to compare adjacent persisted snapshots and label them `so với lần ghi nhận trước`.
* Removed synthetic historical behavior from the Overview KPI trend path; insufficient history now renders as missing history instead of fabricated values.
* Verified the latest `ALL` snapshot matches live inventory using the frozen MAIN-stock rule for low/out-of-stock metrics.

## 2026-07-09 EPIC119 Inventory Inbound & Outbound UI/UX Audit

Completed:

* Conducted a comprehensive read-only UI/UX, workflow, and data binding audit of the Inbound and Outbound inventory tabs.
* Traced actual inbound and outbound transaction creation steps from React code to Zod DTO schema and repository DB transaction checks.
* Compiled a UI/UX consistency matrix showing layout, selector, pagination, and KPI card gaps between tabs.
* Formulated layout proposals (Drawer-based split layouts) and reusable component mapping for WMS operations.
* Authored 6 detailed audit reports and design specifications under `docs/audit/` and `docs/design/`.
* Updated the system state to schedule the implementation of the inbound/outbound workspace.

## 2026-07-09 EPIC118.2 Inventory Historical Chart Data Audit

Completed:

* Conducted a comprehensive read-only audit of all inventory historical charts and widgets in the Inventory Overview page.
* Identified UI binding early-returns and database schema/repository gaps that cause cards to display "Chưa có dữ liệu lịch sử".
* Traced the full data lineage from React components down to the PostgreSQL tables.
* Verified that the database business data cleanup on 2026-06-24 correctly accounts for the initial blank state.
* Confirmed the integrity of EPIC118.1 remediation work with zero synthetic data and parity preserved.
* Added documentation for the audit report, data lineage flow, and historical chart remediation plan.

## 2026-07-09 EPIC118.1 Inventory UI Data Binding Remediation

Completed:

* Replaced Inventory Overview and Materials diagnostic `/inventory/audit` reads
  with additive snapshot/read-model endpoints.
* Added server-side material search, filters, sorting, pagination, aggregate
  summary, and facets.
* Added backward-compatible paginated material transaction history.
* Removed fabricated trend data and corrected today movement/adjustment/alert
  metric bindings without redesigning the Inventory UI.
* Verified 23/23 material, location-stock, and material-snapshot parity.

## 2026-07-09 EPIC118 Inventory UI/Data Binding Audit

Completed:

* Audited Inventory Overview, Materials, and Material Detail without modifying
  application code.
* Verified real-data parity for 23 active materials across item quantity, location
  stock, and material snapshots.
* Classified UI/data binding as `BLOCKED` because of noncanonical audit reads,
  incorrect metric bindings, silent query caps, and a fabricated trend fallback.
* Added the five required EPIC118 audit and remediation reports under `docs/audit`.

## 2026-07-08 Hoàn thành Thiết kế Kho tri thức Doanh nghiệp (Enterprise Knowledge Base - EPIC212)

Completed:

* Hoàn thành thiết kế phân vùng kho tri thức doanh nghiệp và xây dựng cấu trúc thư mục tài liệu đồng bộ tại [docs/](file:///opt/projects/steeltrack/docs).
* Thiết kế chiến lược nạp ngữ cảnh tối ưu cho AI (Context Budgeting & Inheritance Hierarchy) nhằm ngăn ngừa tràn cửa sổ ngữ cảnh và tăng hiệu suất làm việc của AI Agents.
* Tạo mới tài liệu giới thiệu tổng quan kho tri thức [README.md](file:///opt/projects/steeltrack/docs/README.md) làm điểm bắt đầu (Entry Point) cho Human và AI.
* Tạo mới mục lục tối cao [MASTER_INDEX.md](file:///opt/projects/steeltrack/docs/MASTER_INDEX.md) kết nối toàn bộ hệ thống tài liệu theo các nhóm logic.
* Tạo mới sơ đồ cây thư mục chi tiết [DOCUMENTATION_MAP.md](file:///opt/projects/steeltrack/docs/DOCUMENTATION_MAP.md) mô tả chức năng của từng phân vùng tài liệu.
* Tạo mới cẩm nang hướng dẫn quản trị và cập nhật tài liệu [KNOWLEDGE_BASE_GUIDE.md](file:///opt/projects/steeltrack/docs/KNOWLEDGE_BASE_GUIDE.md) cho con người để tránh hiện tượng trôi lệch tài liệu (Documentation Drift).
* Tạo mới tài liệu hướng dẫn nạp ngữ cảnh [AI_LOADING_GUIDE.md](file:///opt/projects/steeltrack/docs/AI_LOADING_GUIDE.md) đặc tả quy trình nạp tài liệu theo 5 lớp cho AI Subagents.
* Tạo mới báo cáo kiểm toán toàn bộ tài liệu [DOCUMENTATION_AUDIT.md](file:///opt/projects/steeltrack/docs/DOCUMENTATION_AUDIT.md) phân loại, đánh giá trạng thái và lên phương án lưu trữ tài liệu lịch sử.
* Cập nhật các tài liệu trạng thái phát triển hệ thống (`CHANGELOG_AI.md`, `CURRENT_STATE.md`, `PROJECT_STATUS.md`, và `NEXT_TASKS.md`) để đồng bộ hoàn thành EPIC212.
* Không tạo mới hoặc sửa đổi code thực thi hay database migrations/prisma schema, tuân thủ nghiêm ngặt quy định đóng băng kiến trúc.

Reports:

* [README.md](file:///opt/projects/steeltrack/docs/README.md)
* [MASTER_INDEX.md](file:///opt/projects/steeltrack/docs/MASTER_INDEX.md)
* [DOCUMENTATION_MAP.md](file:///opt/projects/steeltrack/docs/DOCUMENTATION_MAP.md)
* [KNOWLEDGE_BASE_GUIDE.md](file:///opt/projects/steeltrack/docs/KNOWLEDGE_BASE_GUIDE.md)
* [AI_LOADING_GUIDE.md](file:///opt/projects/steeltrack/docs/AI_LOADING_GUIDE.md)
* [DOCUMENTATION_AUDIT.md](file:///opt/projects/steeltrack/docs/DOCUMENTATION_AUDIT.md)


## 2026-07-08 Biên soạn Tài liệu Cẩm nang tri thức và Chiến lược nạp ngữ cảnh AI

Completed:

* Soạn thảo tài liệu cẩm nang Enterprise Knowledge Base [KNOWLEDGE_BASE_GUIDE.md](file:///opt/projects/steeltrack/docs/KNOWLEDGE_BASE_GUIDE.md) hướng dẫn nguyên tắc đóng băng tài liệu, quy trình cập nhật tài liệu khi kiến trúc thay đổi, chính sách lưu trữ tài liệu cũ và kế hoạch lưu trữ các tài liệu runtime/audit báo cáo cũ.
* Soạn thảo tài liệu chiến lược nạp ngữ cảnh [AI_LOADING_GUIDE.md](file:///opt/projects/steeltrack/docs/AI_LOADING_GUIDE.md) hướng dẫn AI Agents nạp thông tin tối ưu theo phân hệ (Inventory, Projects, Production, QC, Yard, Logistics, Purchasing, Finance, HR, và AI integrations) nhằm tránh tràn cửa sổ ngữ cảnh.
* Thực hiện kiểm toán toàn bộ thư mục docs/ hiện hành trong [DOCUMENTATION_AUDIT.md](file:///opt/projects/steeltrack/docs/DOCUMENTATION_AUDIT.md), phân loại chi tiết hơn 200 tập tin markdown vào các nhóm chức năng và xác định các file cũ cần lưu trữ.
* Cập nhật các tài liệu trạng thái kỹ thuật của hệ thống trong thư mục ai-state để đồng bộ hóa kho tri thức.
* Không thay đổi bất kỳ mã nguồn thực thi hoặc file database migrations/prisma schema nào, bảo đảm tuyệt đối quy tắc đóng băng kiến trúc.

Reports:

* [KNOWLEDGE_BASE_GUIDE.md](file:///opt/projects/steeltrack/docs/KNOWLEDGE_BASE_GUIDE.md)
* [AI_LOADING_GUIDE.md](file:///opt/projects/steeltrack/docs/AI_LOADING_GUIDE.md)
* [DOCUMENTATION_AUDIT.md](file:///opt/projects/steeltrack/docs/DOCUMENTATION_AUDIT.md)

## 2026-07-08 Chuẩn Hóa Tài Liệu Kiến Thức Dự Án (README, Master Index, Doc Map)

Completed:

* Tạo tệp tài liệu tổng quan [README.md](file:///opt/projects/steeltrack/docs/README.md) giới thiệu kho tri thức, vai trò hệ thống tài liệu, các nguyên tắc tổ chức thư mục docs/ và cách sử dụng cho con người/AI Agents.
* Tạo tệp mục lục tối cao [MASTER_INDEX.md](file:///opt/projects/steeltrack/docs/MASTER_INDEX.md) phân loại toàn bộ tài liệu dự án thành các nhóm logic (Source of Truth, Core Architecture & Blueprints, Governance & Standards, Runtime/Audit/Archive) với các liên kết tuyệt đối clickable dạng file:// không chứa dấu backticks quanh link text.
* Tạo tệp bản đồ cấu trúc thư mục [DOCUMENTATION_MAP.md](file:///opt/projects/steeltrack/docs/DOCUMENTATION_MAP.md) biểu diễn cây thư mục docs/ bằng ký tự phân cấp ASCII, giải thích chi tiết chức năng từng thư mục và chỉ dẫn các phương pháp tìm kiếm tài liệu nhanh (Semble, Ripgrep, Master Index).
* Cập nhật các tài liệu trạng thái kỹ thuật của hệ thống trong thư mục ai-state để đồng bộ hóa kho tri thức.
* Không thay đổi bất kỳ mã nguồn thực thi hoặc file database migrations/prisma schema nào, bảo đảm tuyệt đối quy tắc đóng băng kiến trúc.

Reports:

* [README.md](file:///opt/projects/steeltrack/docs/README.md)
* [MASTER_INDEX.md](file:///opt/projects/steeltrack/docs/MASTER_INDEX.md)
* [DOCUMENTATION_MAP.md](file:///opt/projects/steeltrack/docs/DOCUMENTATION_MAP.md)

## 2026-07-08 EPIC116 – Project Detail Snapshot Completion & Architecture Freeze

Completed:

* Added persisted `ProjectDetailSnapshot` storage for Project Detail tab payloads with tab-level uniqueness and freshness metadata.
* Switched `GET /projects/:id/detail/:tab` to snapshot-first reads with repository-backed read-model fallback and no API/UI contract changes.
* Extended Background Snapshot Writer to rebuild Project Detail snapshots outside request transactions, including tab-scoped incremental updates such as `ProjectDetailSnapshot:materials`.
* Added Project Detail snapshot runtime metrics for hits, fallback, tab group hits, age, and lag.
* Added Project Detail snapshot parity validation and Operations Center Project Detail snapshot health.
* Applied migration `20260708143000_project_detail_snapshots` successfully.

Reports:

* `docs/runtime/project-detail-snapshot-report.md`
* `docs/runtime/project-detail-cutover-report.md`
* `docs/runtime/project-detail-parity-report.md`
* `docs/runtime/project-architecture-freeze-v1.md`

## 2026-07-08 Thiết kế Tài liệu Quy chuẩn Đặt tên, Hợp đồng API và Ranh giới Domain (EPIC210)

Completed:

* Viết chi tiết tài liệu quy chuẩn đặt tên [enterprise-naming-conventions.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-naming-conventions.md) bao gồm Database, Repositories, Events, Snapshots và Phân bản (Versioning).
* Viết chi tiết tài liệu chuẩn thiết kế API REST [enterprise-api-contracts.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-api-contracts.md) bao gồm phân trang, bộ lọc, sắp xếp, payload mẫu và định dạng lỗi Zod.
* Viết chi tiết tài liệu ranh giới domain [enterprise-domain-boundaries.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-domain-boundaries.md) bao gồm ma trận quyền gọi giữa các module và đặc tả chi tiết 8 phân hệ cốt lõi.
* Cập nhật các tài liệu trạng thái hệ thống (`CHANGELOG_AI.md`, `CURRENT_STATE.md`, `PROJECT_STATUS.md`, và `NEXT_TASKS.md`).
* Không sửa đổi code thực thi hay tạo database migration nào, tuân thủ nghiêm ngặt quy định đóng băng kiến trúc.

## 2026-07-08 Thiết kế tài liệu Kiến trúc Core Platform (Enterprise Performance, Versioning & Dependency Map)

Completed:

* Thiết kế tài liệu SLA Hiệu năng Hệ thống ([enterprise-performance-sla.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-performance-sla.md)) quy định chi tiết ngưỡng phản hồi API, luồng xử lý tác vụ nền (retry, backoff, heartbeat) và các ngưỡng cảnh báo kỹ thuật của Operations Center.
* Thiết kế tài liệu Chính sách Quản lý Phiên bản ([enterprise-versioning-policy.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-versioning-policy.md)) quy định quy chuẩn SemVer, API versioning, cơ sở dữ liệu (mô hình Expand-Contract), Event versioning, Snapshot/Read Model schema versioning và quy trình Rollback khẩn cấp khi triển khai lỗi.
* Thiết kế tài liệu Bản đồ Phụ thuộc Module ([enterprise-module-dependency-map.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-module-dependency-map.md)) thể hiện ma trận tương tác giữa các module bằng biểu đồ Mermaid kèm ràng buộc chi tiết (Allowed, Forbidden, Event-only, Snapshot-only).
* Cập nhật các tài liệu trạng thái hệ thống (`CHANGELOG_AI.md`, `CURRENT_STATE.md`, `PROJECT_STATUS.md`, và `NEXT_TASKS.md`).
* Không sửa đổi code thực thi hay tạo database migration nào, tuân thủ nghiêm ngặt quy định đóng băng kiến trúc.

Reports:

* [enterprise-performance-sla.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-performance-sla.md)
* [enterprise-versioning-policy.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-versioning-policy.md)
* [enterprise-module-dependency-map.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-module-dependency-map.md)

## 2026-07-08 EPIC211 – Thiết kế hệ thống quản trị kiến trúc (Enterprise Architecture Governance)

Completed:

* Created the Enterprise Code Review Checklist ([enterprise-code-review-checklist.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-code-review-checklist.md)) detailing the 9 mandatory review criteria for PR approval (Repository, Snapshot, Runtime Metrics, Operations Center, Read Model, Feature Flag, Background Job, Transactional Outbox, Performance Gate).
* Created the Enterprise Release Policy ([enterprise-release-policy.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-release-policy.md)) outlining the criteria for product release, zero-downtime database migration constraints, step-by-step smoke test protocol, and feature flag dynamic rollback and degradation manual runbook.
* Updated the system state files (`CHANGELOG_AI.md`, `CURRENT_STATE.md`, `PROJECT_STATUS.md`, and `NEXT_TASKS.md`) to record the completion of EPIC211.
* No source code modifications or database migrations were made, adhering to freeze rules.

Reports:

* [enterprise-code-review-checklist.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-code-review-checklist.md)
* [enterprise-release-policy.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-release-policy.md)

## 2026-07-08 Enterprise Architecture Governance & ADRs

Completed:

* Created the Enterprise Architecture Governance guide ([enterprise-governance.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-governance.md)) covering quality management processes, the role of the Architecture Guardian in AI/Humans co-development, and the Architecture Review Board (ARB) review cycle.
* Created the Enterprise Architecture Decision Records repository ([enterprise-architecture-decision-records.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-architecture-decision-records.md)) containing 10 detailed Architectural Decision Records (ADR001 to ADR010) covering Repository Pattern, Snapshot First Read, Background Engine, Operations Center Integration, Runtime Metrics, Read Model Separated Query, Feature Flags, Query Budget, Outbox Pattern, and Module Boundaries.
* No source code modifications or migrations were made, adhering to freeze rules.

Reports:

* [enterprise-governance.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-governance.md)
* [enterprise-architecture-decision-records.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-architecture-decision-records.md)

## 2026-07-08 EPIC202 & EPIC203 – QC & Logistics Blueprints

Completed:

* Designed the Quality Control (QC) Master Blueprint ([qc-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/qc-blueprint.md)) covering Incoming QC, In-process QC, Final QC, Non-Conformance Reports (NCR), Corrective and Preventive Actions (CAPA), Rework, Quality Ledger, and Traceability graph structures.
* Designed the Logistics Master Blueprint ([logistics-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/logistics-blueprint.md)) covering Dispatch, Shipment, Vehicle, Driver, Route, Proof of Delivery (POD), GPS tracking, and Dispatch Cockpit interface layouts.
* Created module documentation for Logistics ([logistics.md](file:///opt/projects/steeltrack/docs/ai-state/modules/logistics.md)) and linked QC documentation ([qc.md](file:///opt/projects/steeltrack/docs/ai-state/modules/qc.md)) to the new blueprint.
* No source code modifications or migrations were made, adhering to freeze rules.

Reports:

* [qc-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/qc-blueprint.md)
* [logistics-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/logistics-blueprint.md)

## 2026-07-08 EPIC210 – Enterprise Standards & Guidelines Design

Completed:

* Created the complete Enterprise Standards (EPIC210) matching the current SteelTrack core platform architecture.
* Created the Enterprise Domain Map and Bounded Context Boundaries ([enterprise-domain-map.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-domain-map.md)).
* Documented the Enterprise System Events and Outbox Payloads catalog ([enterprise-event-catalog.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-event-catalog.md)).
* Formulated the Enterprise Read Models and Caching strategy ([enterprise-read-model-catalog.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-read-model-catalog.md)).
* Designed the Enterprise Snapshot database tables and payload schemas ([enterprise-snapshot-catalog.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-snapshot-catalog.md)).
* Detailed the Repository layer development guidelines with a full Work Order creation code pattern ([enterprise-repository-guidelines.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-repository-guidelines.md)).
* Defined the Runtime Metrics and Performance Telemetry guidelines with SLO targets ([enterprise-runtime-guidelines.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-runtime-guidelines.md)).
* Detailed the Background Processing Engine and Retry policy guidelines ([enterprise-background-guidelines.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-background-guidelines.md)).
* Formulated the Operations Center integration, health probes, and alert thresholds ([enterprise-operations-center-guidelines.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-operations-center-guidelines.md)).
* Standardized the minimal industrial Cockpit theme, KPI cards, table pagination, and detail drawers ([enterprise-ui-guidelines.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-ui-guidelines.md)).
* Standardized the AI assistant, nesting optimizer, and work center queue advisor integration ([enterprise-ai-guidelines.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-ai-guidelines.md)).
* Created the Core Software Development Standards, naming conventions, and Git safety rules ([enterprise-development-standards.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-development-standards.md)).
* No source code modifications or migrations were made, adhering to architecture freeze rules.

Reports:

* [enterprise-domain-map.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-domain-map.md)
* [enterprise-event-catalog.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-event-catalog.md)
* [enterprise-read-model-catalog.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-read-model-catalog.md)
* [enterprise-snapshot-catalog.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-snapshot-catalog.md)
* [enterprise-repository-guidelines.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-repository-guidelines.md)
* [enterprise-runtime-guidelines.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-runtime-guidelines.md)
* [enterprise-background-guidelines.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-background-guidelines.md)
* [enterprise-operations-center-guidelines.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-operations-center-guidelines.md)
* [enterprise-ui-guidelines.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-ui-guidelines.md)
* [enterprise-ai-guidelines.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-ai-guidelines.md)
* [enterprise-development-standards.md](file:///opt/projects/steeltrack/docs/architecture/enterprise-development-standards.md)

## 2026-07-08 EPIC201 – Projects (PMS) Blueprint Design

Completed:

* Designed the complete Projects (PMS) Blueprint matching the current SteelTrack core platform architecture.
* Created the Projects overview architectural layers and integration map ([projects-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/projects-blueprint.md)).
* Created the Projects domain model specification for WBS tasks, allocations, dependencies, costs, and repository signatures ([projects-domain.md](file:///opt/projects/steeltrack/docs/architecture/projects-domain.md)).
* Documented the event-driven outbox architecture and event schemas for Projects task and allocation updates ([projects-event-flow.md](file:///opt/projects/steeltrack/docs/architecture/projects-event-flow.md)).
* Formulated the read-model caching strategy and tab-gated API boundaries ([projects-read-model.md](file:///opt/projects/steeltrack/docs/architecture/projects-read-model.md)).
* Outlined the persisted snapshot schemas, rebuild jobs, and idempotency key patterns ([projects-snapshot.md](file:///opt/projects/steeltrack/docs/architecture/projects-snapshot.md)).
* Designed WMS/Inventory-compliant Gantt chart UI, WBS tree grid, and Site Mode mobile designs ([projects-dashboard.md](file:///opt/projects/steeltrack/docs/architecture/projects-dashboard.md)).
* Detailed site workflows for Erection, inspection QC, handover, and material returns lifecycle ([projects-workflow.md](file:///opt/projects/steeltrack/docs/architecture/projects-workflow.md)).
* Formulated the 4-sprint implementation roadmap for PMS Phase.
* No source code modifications or migrations were made, adhering to architecture freeze rules.

Reports:

* [projects-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/projects-blueprint.md)
* [projects-domain.md](file:///opt/projects/steeltrack/docs/architecture/projects-domain.md)
* [projects-event-flow.md](file:///opt/projects/steeltrack/docs/architecture/projects-event-flow.md)
* [projects-read-model.md](file:///opt/projects/steeltrack/docs/architecture/projects-read-model.md)
* [projects-snapshot.md](file:///opt/projects/steeltrack/docs/architecture/projects-snapshot.md)
* [projects-dashboard.md](file:///opt/projects/steeltrack/docs/architecture/projects-dashboard.md)
* [projects-workflow.md](file:///opt/projects/steeltrack/docs/architecture/projects-workflow.md)

## 2026-07-08 EPIC206 & EPIC207 – Finance & HR Blueprints Design


Completed:

* Designed the complete Finance Blueprint (EPIC206) covering Inventory Valuation (FIFO/WAC), WIP calculation, Actual Costing, Cost Centers, Budget Control, Cashflow forecasting, dashboards, and AI integrations ([finance-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/finance-blueprint.md)).
* Designed the complete HR Blueprint (EPIC207) covering Employee Profiles, Skill Matrix, Shifts, Attendance reconciliation, Training & Certifications, Payroll integration, dashboards, and AI integrations ([hr-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/hr-blueprint.md)).

Reports:

* `docs/architecture/finance-blueprint.md`
* `docs/architecture/hr-blueprint.md`

## 2026-07-08 EPIC208 & EPIC209 – AI & Integration Blueprints

Completed:

* Designed the complete AI Enterprise Blueprint (`docs/architecture/ai-blueprint.md`) covering the 8 AI modules: AI Assistant, AI Planner, AI Scheduler, AI Inventory, AI Production, AI QC, AI Logistics, and AI Operations Center.
* Designed the complete Enterprise Integration Blueprint (`docs/architecture/integration-blueprint.md`) covering system-wide data flows, cross-chain domain events, synchronized read models, background job dependencies, visual lineage control tower, and integration monitoring.
* No source code modifications or migrations were made, adhering to freeze rules.

Reports:

* [ai-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/ai-blueprint.md)
* [integration-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/integration-blueprint.md)

## 2026-07-08 EPIC204 & EPIC205 – Yard (YMS) & Purchasing Blueprints Design

Completed:

* Designed the complete Yard Management System (YMS) Blueprint matching the current SteelTrack core platform architecture.
* Created the detailed Yard Blueprint (`docs/architecture/yard-blueprint.md`) covering Yard Map 2D/3D, Yard Zones, Slots, Stacks, Cranes, Reservations, Movements, Loading/Unloading tasks, capacity rules, Yard Cockpit specs, Operations Center metrics, AI Smart Stacking Optimizer, technical risks, and phased sprints.
* Designed the complete Purchasing & Procurement Blueprint matching the current SteelTrack core platform architecture.
* Created the detailed Purchasing Blueprint (`docs/architecture/purchasing-blueprint.md`) covering Purchase Requisitions (PR), Requests for Quotation (RFQ), Supplier Quotations, Purchase Orders (PO), Goods Receipts (GR), Supplier Performance metrics, Approval Workflows, Budgets, Purchasing Cockpit specs, Operations Center metrics, AI Smart Quotation Scorer, technical risks, and phased sprints.
* Updated related module documentation for `docs/ai-state/modules/yard.md` and `docs/ai-state/modules/suppliers.md` to reflect these blueprints.

Reports:

* `docs/architecture/yard-blueprint.md`
* `docs/architecture/purchasing-blueprint.md`

## 2026-07-08 EPIC114 – Production (MES) Blueprint Design

Completed:

* Designed the complete Production (MES) Blueprint matching the current SteelTrack core platform architecture.
* Created the production domain specification covering WorkOrder, Shifts, capacity, downtime, OEE, Rework, and Scrap models (`docs/architecture/production-domain.md`).
* Documented the event-driven outbox architecture and event consumer contracts for production transitions (`docs/architecture/production-event-flow.md`).
* Formulated the read-model caching strategy and tab-gated API endpoint boundaries (`docs/architecture/production-read-model.md`).
* Outlined the persisted snapshot schemas, rebuild jobs, and idempotency key patterns (`docs/architecture/production-snapshot.md`).
* Designed WMS/Inventory-compliant manager and operator dashboards, KPIs, and real-time WebSocket updates (`docs/architecture/production-dashboard.md`).
* Detailed Standard Operating Procedures (SOPs) for material issue, routing completion, QC gating, returns, and machine downtime/scrap handling (`docs/architecture/production-workflow.md`).
* Formulated the multi-sprint implementation roadmap from Sprint 1 to Sprint 8.

Reports:

* `docs/architecture/production-blueprint.md`
* `docs/architecture/production-domain.md`
* `docs/architecture/production-event-flow.md`
* `docs/architecture/production-read-model.md`
* `docs/architecture/production-snapshot.md`
* `docs/architecture/production-dashboard.md`
* `docs/architecture/production-workflow.md`

## 2026-07-08 EPIC112 – INV.CORE.2 Inventory Snapshot Completion

Completed:

* Added persisted domain snapshot models for Inventory Material and Inventory Location.
* Applied migration `20260708103000_inventory_domain_snapshots`.
* Extended the Inventory snapshot writer to persist dashboard, material, and location snapshots through the Background Engine.
* Material Detail now reads `InventoryMaterialSnapshot` first and falls back to the repository-backed read model when missing or stale.
* Inventory Locations now read `InventoryLocationSnapshot` first and fall back to repository-backed live composition when missing or stale.
* Inventory lifecycle events now schedule background snapshot update jobs after publishing persistent Outbox events.
* Runtime metrics now distinguish material snapshot hit/miss and location snapshot hit/miss while preserving global snapshot counters.
* Operations Center Inventory health now exposes material snapshot health, location snapshot health, freshness, hit ratio, lag, and rebuild status.
* Inventory is now an Architecture Freeze v1.0 candidate and should be treated as the reference architecture for future modules.

Reports:

* `docs/runtime/inventory-material-snapshot-report.md`
* `docs/runtime/inventory-location-snapshot-report.md`
* `docs/runtime/inventory-snapshot-cutover-report.md`
* `docs/runtime/inventory-architecture-freeze-report.md`

## 2026-07-07 EPIC 106 – Enterprise Background Engine Implementation

Completed:

* Implemented `BackgroundJobManager` as a small scheduling facade over the existing `JobSchedulerService`.
* Implemented `SnapshotUpdateDispatcher` for idempotent `snapshot.<module>.update` and `snapshot.<module>.rebuild` background jobs.
* Implemented `SnapshotRebuilder` acceptance path for snapshot jobs. It safely returns `skipped` while persisted snapshot tables are not enabled.
* Replaced the active `OutboxService` stub with Prisma-backed persistent outbox create, claim, dispatch, retry, and dead-letter behavior.
* Added `EventPublisherService` for normal and persistent domain event publishing.
* Added `EventConsumerService` to map snapshot-relevant Inventory, Project, and Logistics events into snapshot update jobs.
* Added `JobRetryPolicyService` and wired `JobWorkerService` to use it for retry/dead-letter decisions.
* Wired snapshot job handling into the existing background worker without adding standalone cron jobs.

Reports:

* `docs/runtime/background-engine-implementation-report.md`

Known limitations:

* No persisted snapshot tables exist yet.
* Snapshot jobs are accepted and executed, but write no snapshot payloads until the snapshot schema is introduced.
* Existing Dashboard/runtime APIs still read current sources; no API contract or behavior changed.

## 2026-07-07 EPIC 105 – Enterprise Background Engine

Completed:

* Designed the Background Engine architecture for moving SteelTrack from runtime aggregate reads toward background-maintained snapshots.
* Standardized the Snapshot Update Engine contract for Inventory, Projects, Logistics, and Dashboard snapshots.
* Designed Snapshot Rebuilder behavior, rebuild modes, idempotency, staleness policy, and rebuild metrics.
* Documented Event Bus Foundation for snapshot update routing using existing `EventBusService`, `JobSchedulerService`, `JobWorkerService`, and future persistent Outbox hardening.
* Documented the current limitation that `OutboxService` is present but stubbed in the active codebase, so production event-driven snapshots require outbox persistence hardening before multi-instance deployment.

Reports:

* `docs/architecture/background-engine.md`
* `docs/architecture/snapshot-update-engine.md`
* `docs/architecture/event-bus-foundation.md`
* `docs/runtime/snapshot-rebuild-report.md`

Known limitations:

* No snapshot tables were created.
* No background snapshot jobs were implemented.
* Current API behavior remains runtime/fallback based.
* Persistent Outbox must be hardened before snapshot events become production-critical.

## 2026-07-07 EPIC 104 – Enterprise Data Engine

Completed:

* Added the first real Enterprise Data Engine index foundation migration.
* Added 11 composite indexes for high-value Inventory transaction, Inventory item history, exact location stock bucket, ProjectTask hierarchy/schedule, ReturnRequest queues, and ActivityLog timelines.
* Captured `EXPLAIN ANALYZE` before and after the migration.
* Verified all new indexes exist in PostgreSQL.
* Added forced planner checks to prove index usability on the currently small dataset where PostgreSQL often correctly prefers sequential scans.
* Designed the persisted snapshot architecture for Inventory, Projects, Logistics, and Executive Dashboard without creating snapshot tables yet.

Reports:

* `docs/runtime/data-engine-index-foundation-report.md`
* `docs/runtime/de1/`
* `docs/architecture/persisted-snapshot-architecture.md`

Known limitations:

* Current data volume is too small for reliable timing improvement claims. Several normal planner runs still choose sequential scans because the active tables contain only tens or hundreds of rows.
* Dispatch indexes remain a follow-up because the before/after baseline was captured before dispatch tables were available in the active database.
* Persisted snapshots are designed only; no snapshot schema or workflow migration was introduced.

## 2026-07-07 EPIC 103 – Runtime Analytics Foundation

Completed:

* Added in-memory runtime analytics aggregation over existing RT.1 request/query metrics.
* Added sliding windows for 5 minutes, 1 hour, and 24 hours.
* Added endpoint rankings by average latency, p95 latency, and request count.
* Added query rankings by execution count, average duration, and max duration.
* Added rule-based runtime recommendations for high SQL count, latency spikes, duplicate lookups, and low read-model effectiveness.
* Added read-model effectiveness calculation using cache hits, read-model hits, fallback query signals, and snapshot miss signals.
* Added performance score and architecture score by module from observed runtime metrics.
* Added explicit 7/30/90-day trend placeholders that report persisted runtime metrics are required instead of fabricating long-range trends from process memory.

Reports:

* `docs/runtime/runtime-analytics-report.md`
* `docs/runtime/performance-score-report.md`
* `docs/runtime/runtime-recommendation-report.md`
* `docs/runtime/read-model-effectiveness-report.md`
* `docs/runtime/architecture-score-report.md`

Known limitations:

* Runtime analytics are process-local and retain at most 24 hours.
* 7/30/90-day trends require a future persisted metrics store.
* Repository coverage and index coverage remain static-documentation inputs, not runtime-measured signals yet.

## 2026-07-07 EPIC 102 – Runtime Instrumentation & Observability

Completed:

* Added a global NestJS runtime metrics interceptor for request duration, status code, Prisma query count, SQL total/longest duration, heap memory delta/peak, response size when available, timestamp, and budget class.
* Added Prisma query event profiling through `PrismaService` without logging raw SQL or parameters.
* Added query budget configuration for Dashboard, Detail, Lookup, Search, Report, and Default endpoint classes.
* Added slow query detection for SQL duration over 200 ms with sanitized runtime logging to `docs/runtime/slow-query.log` when slow queries occur.
* Added `RuntimeHealthService` and extended existing `/performance/health` and `/performance/metrics` outputs with runtime request/query/cache/read-model/memory signals.
* Added runtime duplicate-query heuristic to flag potential N+1 patterns without changing request behavior.

Reports:

* `docs/runtime/runtime-metrics-report.md`
* `docs/runtime/query-profiler-report.md`
* `docs/runtime/runtime-health-report.md`
* `docs/runtime/performance-baseline.md`
* `docs/runtime/slow-query-report.md`

Known limitations:

* Metrics are process-local and reset on restart.
* Prisma model/action is inferred from sanitized SQL shape because Prisma query events do not expose model/action directly.
* Runtime instrumentation measures live traffic only; no controlled load test was run in this sprint.

## 2026-07-07 EPIC 101 – Enterprise Scalability Foundation

Completed:

* Defined SteelTrack performance gates and query budgets for Dashboard/Cockpit, Detail, Lookup, and Search/List endpoints.
* Audited enterprise query risks across Dashboard, Inventory, Projects, Logistics, Production, Costing, and runtime controllers.
* Documented N+1/query-in-loop, over-fetching, duplicate aggregation, deep include, and unbounded read risks without changing business behavior.
* Audited existing index coverage and proposed future composite/covering index candidates for high-volume transaction, task, return, activity, dispatch, and dashboard paths.
* Created a 5-year data growth plan covering partitioning, archive policy, persisted read models, and id-based event contracts.

Reports:

* `docs/audit/enterprise-performance-gate.md`
* `docs/audit/enterprise-query-audit.md`
* `docs/audit/enterprise-index-audit.md`
* `docs/architecture/data-growth-5-year-plan.md`
* `docs/audit/enterprise-scalability-foundation-report.md`

Known limitations:

* EPIC 101 is documentation/audit only. No indexes, migrations, persisted snapshots, or instrumentation were added.
* Runtime performance budgets are target gates, not measured production SLOs yet.

## 2026-07-07 EPIC 100 – Core Foundation

Completed:

* Audited Inventory, Projects, and Logistics repository boundaries for enterprise-scale query ownership.
* Extended `InventoryRepository` with Material Detail and Dashboard read-model source queries.
* Refactored `InventoryService.getItemDetail()` and `DashboardInventoryReadModelService` to use Inventory repository methods for aggregate reads.
* Added `LogisticsRepository` and moved DispatchOrder aggregate, dispatch suggestion, allocation reconciliation, component update, and activity log persistence behind repository methods.
* Extended `ProjectsRepository` with runtime source queries and tab-specific Project Detail source queries.
* Refactored `ProjectsService.detailTab()` so Project Detail tabs no longer call `runtimeDashboard()` and slice full runtime arrays.
* Added persisted read-model migration path documentation for Inventory, Projects, and Logistics.
* Added query segmentation and query budget audit reports.

Reports:

* `docs/audit/epic-100-repository-layer-audit.md`
* `docs/architecture/persisted-read-model-foundation.md`
* `docs/audit/query-segmentation-report.md`
* `docs/audit/query-budget-audit.md`

Known limitations:

* Inventory return workflow, Project template CRUD, and ProjectTask command mutation paths still use direct Prisma calls intentionally; they need separate regression-backed repository hardening.
* No persisted snapshot tables were created in this sprint.

## 2026-07-07 Epic PERF Foundation

Completed:

* Audited Dashboard API endpoints and documented direct transaction-table hotspots in `docs/audit/dashboard-api-performance-audit.md`.
* Added `DashboardInventoryReadModelService` as an internal cached Inventory dashboard read model for stock, low-stock, recent movement, procurement, anomaly, and forecast inputs.
* Refactored Dashboard Inventory-heavy paths to use the read model while keeping existing routes and frontend DTO compatibility.
* Added tab-scoped Project Detail API `GET /projects/:id/detail/:tab` and React Query cache key `['project-detail-tab', projectId, tab]`.
* Added Logistics dispatch detail lazy query using `GET /logistics/dispatch-orders/:id`.
* Reduced Inventory Material Detail attachment queries so attachment-heavy data loads only for tabs that need it.
* Created `docs/audit/perf-foundation-report.md`.

Known limitations:

* The Inventory dashboard read model is an in-memory cached read model, not a persisted snapshot table.
* Project Detail tab API currently creates a frontend/cache boundary but still slices `runtimeDashboard()` internally; native tab-specific backend queries remain future work.
* Inventory Material Detail lazy loading currently focuses on attachment-heavy tab data; a full tab-specific material detail API remains future work.

## 2026-07-02 Hotfix – Mini Sidebar Flyout Clickability

Completed:

* Fixed collapsed mini-sidebar module icons so clicks reliably open flyout menus.
* Moved mini-sidebar flyouts from sidebar-contained absolute positioning to viewport-fixed positioning at `left: 64px` with high z-index.
* Added click-outside handling and route-change cleanup so flyouts close predictably.

## 2026-07-02 Sprint UX.1 – Compact Header and Mini Sidebar

Completed:

* Reduced the dynamic topbar height from 64px to 50px with compact module/workspace typography.
* Scaled topbar controls, search, status, icons, and user chip to preserve the 44-50px header target.
* Replaced the collapsed sidebar placeholder with a 64px mini sidebar that keeps module icons visible and clickable.
* Added collapsed-sidebar flyout menus using the existing navigation tree, including nested Inventory `Nghiệp vụ nâng cao` actions.
* Added hover tooltips for collapsed module icons and kept route highlighting in collapsed mode.

## 2026-07-02 Hotfix – Dynamic Workspace Header

Completed:

* Replaced the static topbar label `SteelTrack ERP` with route-derived module titles.
* Added route metadata helpers `getModuleTitle()` and `getWorkspaceTitle()` for current and future module workspaces.
* Removed the Inventory breadcrumb line from `InventoryTabWorkspace`, leaving the topbar as the single source for module/workspace context.
* Inventory pages now render two header lines only, e.g. `VẬT TƯ KHO` and `Tổng quan kho`.

## 2026-07-02 Sprint INV.NAV.2 – Inventory Advanced Operations Sidebar

Completed:

* Restored hidden Inventory operational pages into the sidebar under a nested `Nghiệp vụ nâng cao` group without changing routes.
* Reused existing routes for `/inventory/inbound`, `/inventory/outbound`, `/inventory/transfer`, `/inventory/stock-take`, `/inventory/adjustments`, `/inventory/alerts`, and `/inventory/audit`.
* Added nested sidebar rendering with per-session expand/collapse memory and active-route auto-open behavior.
* Added route context for advanced Inventory routes; this was later moved into the dynamic workspace header by the 2026-07-02 header hotfix.
* Marked Inventory Audit as an admin-only sidebar item using existing user role/permission fields.
* Created `docs/ui/inventory-advanced-operations-sidebar-report.md` and `docs/audit/inventory-workspace-recovery-report.md`.

## 2026-07-01 Hotfix – Inventory Returns Workspace Shell and Materials Navigation

Completed:

* Wrapped `InventoryReturnRequestsPage` with the same `EnterpriseModulePage` and `InventoryTabWorkspace` used by other Inventory workspaces, so `/inventory/returns` keeps the Inventory shell/header/sidebar context.
* Removed the redundant Inventory sidebar workspace `Vật tư`.
* Renamed the stock workspace to `Vật tư & Tồn kho`.
* Reduced Inventory navigation to the requested primary workspaces: Tổng quan kho, Giao dịch, Phiếu trả vật tư, Vật tư & Tồn kho, and Vị trí kho.
* Redirected legacy `/inventory/master-data` access to `/inventory/materials` to avoid a dead route while removing the standalone Materials workspace from navigation.

## 2026-07-01 Sprint INVRET.1 – Inventory Return Workspace UX Unification

Completed:

* Refactored Inventory Return Requests into a cockpit-aligned workspace using `CockpitKpiCard`, `CockpitChartCard`, `CockpitTableShell`, `DataTablePagination`, `CockpitEmptyState`, and `ModuleDetailDrawer`.
* Added real-data KPI row: Requested, Received Today, Rejected Today, and Pending Quantity.
* Added real-data analytics row for return status distribution, 30-day trend, top returned materials, and pending/received/rejected quantity distribution.
* Rebuilt the return request table with Inventory-style density, pagination, aging badges, and click-to-open row behavior.
* Standardized Return Request detail to `ModuleDetailDrawer size="sm"` with information, materials, timeline, photos, and logs sections.
* Added Inventory Overview `Pending Returns` KPI card linking to `/inventory/returns`.
* Reordered Inventory sidebar entries so Phiếu trả vật tư appears as a primary Inventory workspace.

## 2026-07-01 Sprint 50LOG.1 – Logistics & Dispatch MVP Foundation

Completed:

* Added persistent Logistics dispatch domain: `DispatchOrder`, `DispatchItem`, and `DispatchEvent`, with migration SQL under `20260701090000_dispatch_order_domain`.
* Added backend Logistics APIs for dispatch dashboard, order list/detail, auto suggestion, lifecycle actions, and completion/cancel.
* Replaced the Logistics mock shipment screen with real API-backed Cockpit workspaces: Tổng quan, Điều xe, Đang vận chuyển, and Lịch sử.
* Added Dispatch Detail right-side drawer using `ModuleDetailDrawer size="md"` with information, items, loading checklist, timeline, and lifecycle actions.
* Auto suggestion now reads real `ProjectTaskMaterialAllocation` and `ProjectTaskComponentAllocation` rows to suggest missing materials and assigned components.
* Dispatch receive now writes `PROJECT_DISPATCH_RECEIVED` activity logs, reconciles Project task allocations, updates component delivery state, and creates an Inventory export transaction for material dispatch lines.

Known limitations:

* Project Detail has the backend/read-model foundation for dispatch state, but a follow-up UI pass is still needed to expose per-line `Đang vận chuyển`, `Đã nhận`, and `Ngày nhận` columns in all Project material/component tables.

## 2026-07-01 Sprint 40PROJ.10B – Drawer UX Standardization

Completed:

* Added reusable `ModuleDetailDrawer` size system: `sm`, `md`, and `lg`.
* Standardized Inventory Material Detail and Project Detail on `size="lg"`.
* Standardized Inventory Return Request Detail on `size="sm"` with header badge, project/requester/date subtitle, and sections for info, materials, timeline, photos, and logs.
* Added Project Pending Return side drawer using real `ProjectsRuntime.returnRequests`; Pending Return quantities now open a small drawer instead of navigating away.
* Created `docs/ui/drawer-standardization-report.md` and `docs/ui/inventory-return-drawer-polish-report.md`.
* Frontend and backend builds passed.

## 2026-07-01 Sprint 40PROJ.10A – Project Detail and Return UX Polish

Completed:

* Project Detail now opens as a right-side drawer with Material Detail-style width constraints instead of a centered modal.
* Inventory Return Requests detail now opens as a narrower right-side drawer with Project/Material context, return summary, material lines, photos empty state, real logs, and receive/reject actions.
* Project Return receipt transactions now write business-readable `remarks` and structured JSON `note` metadata with `source = PROJECT_RETURN` and `transactionTypeCode = PROJECT_RETURN_RECEIVED`.
* Inventory transaction grid and detail drawer now render Project material returns as `Trả từ công trình` with `PROJECT RETURN` badge and project/return request context.
* Material Detail history now recognizes `RETURN` rows and special-cases Project Return rows instead of falling through to adjustment-like presentation.
* ActivityLog metadata for `PROJECT_MATERIAL_RETURN_RECEIVED` now includes a human-readable receipt message.
* Created `docs/ui/project-detail-drawer-polish-report.md`, `docs/ui/project-return-drawer-polish-report.md`, and `docs/ui/project-return-transaction-audit-report.md`.

## 2026-07-01 Sprint – Inventory Return Requests Workspace

Completed:

* Added an Inventory `Return Requests` workspace at `/inventory/returns` with Requested, Received, Accepted, and Rejected views.
* Return Request detail now shows project, task/material context when available, quantity, reason, real activity logs, and a photo empty state until attachments are linked.
* Added receive and reject actions from the Return Request workspace. Receive uses the existing Inventory return workflow to increase stock and reconcile Project material allocation; reject clears pending return state without increasing stock.
* Added backend `PATCH /inventory/returns/:id/reject`, using the existing `CANCELLED` status to represent Rejected without changing Prisma schema.
* Project material Pending Return quantities now link directly to `/inventory/returns?tab=requested&projectId=...&materialId=...` so operators can process the related requests.
* Inventory navigation now includes `Phiếu trả vật tư`.
* Backend and frontend builds passed.

## 2026-07-01 Sprint BUG.4 – Project Material Return Inventory and Project Reconciliation

Completed:

* Project material runtime rows now expose `allocatedQuantity`, `usedQuantity`, `pendingReturnQuantity`, `returnedQuantity`, and `availableReturnQuantity`.
* Open `SITE_RETURN` requests now reduce available return quantity in Projects without increasing Inventory stock.
* Receiving a project return now creates an Inventory `RETURN` transaction with `transactionTypeCode = PROJECT_RETURN_RECEIVED`.
* Receiving a project return now reconciles `ProjectTaskMaterialAllocation` by reducing `issuedQty`, increasing `returnedQty`, and reducing remaining quantity safely.
* `SITE_RETURN` disposition no longer creates a second stock-in transaction, preventing duplicate Inventory increases.
* ActivityLog now records `PROJECT_MATERIAL_RETURN_RECEIVED` and `PROJECT_MATERIAL_RETURN_ACCEPTED`.
* Project material tables now show Allocated, Used, Pending Return, Returned, and Available Return.
* Project material return buttons are disabled when no returnable quantity remains.
* Created `docs/bugs/project-material-return-reconciliation-report.md`.

## 2026-07-01 HOTFIX – Project Material Return API 404 and Sidebar Settings Key

Completed:

* Fixed `POST /inventory/returns` returning `404 Not Found` by registering `ReturnWorkflowController` in `InventoryModule.controllers`.
* Kept Projects material return on the existing Inventory Return workflow instead of creating a duplicate endpoint.
* Added ActivityLog creation for new return requests with `PROJECT_MATERIAL_RETURN_REQUESTED`.
* Updated Project material return success invalidation to refresh Projects runtime/WBS/detail and Inventory material detail caches.
* Added explicit `Vượt số lượng có thể trả` validation feedback when return quantity exceeds the returnable amount.
* Fixed duplicate React key warning for `/settings` by adding stable ids to duplicated sidebar settings entries and using `item.id` as the primary sidebar key.
* Created `docs/bugs/project-material-return-api-404-report.md`.

## 2026-07-01 Sprint 40PROJ.10 – Project Intelligence and Site Operations

Completed:

* Added template-driven Project Task rules in the existing `ProjectTemplate.structure` JSON contract without adding a migration.
* Extended Projects backend DTOs and APIs for Auto WBS generation, bulk WBS updates, and Site Mode updates:
  * `POST /projects/:id/wbs/generate`
  * `PATCH /projects/:id/wbs/bulk`
  * `POST /projects/:id/site-update`
* Project Task `Tự đề xuất` now reads template rules or template task defaults instead of hardcoded frontend suggestions.
* Added Auto WBS generation UI for span/axis/floor-driven project task creation.
* Added bulk task selection/update UI for parent/status/date/owner/checklist/resource changes.
* Added Project Detail `Công trường` tab for simple site updates: installed quantity, used quantity, QC result, issue flag, note, and photo timeline visibility.
* Site updates now write `PROJECT_SITE_UPDATE` activity-log rows and update task progress/status through the existing ProjectTask runtime path.
* Project Detail document tab now supports business category filters: Hợp đồng, Bản vẽ, Biện pháp thi công, Nghiệm thu, Biên bản, Hình ảnh, and Khác.
* Project Command Center now surfaces executive health panels for forecast finish, material shortages, component shortages, and labor/equipment shortages using real runtime data.
* Created Sprint 40PROJ.10 reports under `docs/ui/` for template rules, Auto WBS, bulk operations, Site Mode, photo timeline, return lifecycle, cost command center, document categories, activity timeline, and executive dashboard.

Verification:

* `pnpm -C apps/backend-api build` passed.
* `pnpm -C apps/frontend build` passed.

## 2026-07-01 Sprint 40PROJ.9 – Projects Usability Recovery and Real Data Integration

Completed:

* Repaired Projects Templates routing by adding `/projects/templates` to AppRouter and both sidebar navigation configs.
* Added Project edit support with `PATCH /projects/:id` and a Project Detail `Sửa công trình` dialog for master/setup fields.
* Refactored Project Detail to use a centered 90vw/1400px `ModuleDetailDrawer` placement with internal scroll instead of a full-screen-like side panel.
* Added Component Return from Project to backend and UI: returned components clear `projectId`, move back to `READY`, write `ComponentTimeline`, and write `ActivityLog`.
* Replaced top-level Projects `Chi phí`, `Tài liệu`, and `Nhật ký` placeholders with real runtime workspaces using financial read models, Attachments, and ActivityLog data.
* Extended `GET /projects/runtime` with `documents` and `logs` arrays.
* Added Simple/Advanced mode to WBS Task modal. Simple Mode asks only for name, parent task, and duration, and includes date and steel erection suggestions.
* Created sprint reports under `docs/ui/`: project return workflow, task smart suggestions, detail drawer refactor, project edit, template routing, cost real data, documents real data, and logs real data.

Verification:

* `pnpm -C apps/frontend build` passed. Existing Vite `NODE_ENV` and large chunk warnings remain.
* `pnpm -C apps/backend-api build` passed.

## 2026-07-01 HOTFIX – Restore Projects Runtime and Template APIs

Completed:

* Recovered Projects runtime from Prisma `P2021` caused by missing `project_tasks` tables.
* Repaired the failed `20260630100000_project_task_domain` migration SQL alias issue and deployed both pending Projects migrations.
* Confirmed ProjectTask domain tables and `project_templates` now exist, including default template `TPL-NX-5N`.
* Added backend compatibility guards for missing ProjectTask/ProjectTemplate tables so runtime, WBS, and templates degrade safely instead of crashing.
* Added temporary Projects debug logging for runtime, templates, create project, template build, and WBS paths.
* Updated Projects frontend queries to avoid infinite retries and show explicit empty/error states.
* Created reports:
  * `docs/bugs/projects-runtime-recovery-report.md`
  * `docs/bugs/projects-template-api-report.md`
  * `docs/bugs/projects-migration-status-report.md`

Verification:

* `pnpm --dir apps/backend-api exec prisma migrate status` passed: database schema is up to date.
* `pnpm -C apps/backend-api build` passed.
* `pnpm -C apps/frontend build` passed.
* `GET /projects/runtime`, `GET /projects`, and `GET /projects/:id/wbs` returned 200 from the running backend.
* `pnpm -C apps/backend-api start:dev` compiled successfully but could not bind because port `3000` was already in use.

## 2026-06-30 HOTFIX – Restore NestJS Runtime (PermissionsGuard / RbacService DI)

Completed:

*   Resolved `UnknownDependenciesException: Nest can't resolve dependencies of the PermissionsGuard (Reflector, ?)` where `? = RbacService`.
*   Imported `RbacModule` in `ProjectsModule` to satisfy the constructor parameters of `PermissionsGuard` applied to `ProjectsController`.
*   Created hotfix report: `docs/bugs/projects-rbac-di-hotfix-report.md`.

Verification:

*   `pnpm -C apps/backend-api build` passed.
*   `pnpm -C apps/backend-api start:dev` and `start:prod` booted successfully without runtime DI exceptions.

## 2026-06-30 Sprint 40PROJ.8 – Low Data Entry and Template System

Completed:

* Added persisted Project Template Library with `ProjectTemplate` and `ProjectTemplateStatus`.
* Added migration `20260630113000_project_template_library` and seeded default `TPL-NX-5N - Nhà xưởng 5 nhịp`.
* Added backend template APIs for list, create, update, duplicate, publish, deactivate, set default, export, and import.
* Project creation can now apply a template to generate normalized `ProjectTask` WBS rows, dependencies, scheduled/baseline dates, suggested resources, resolvable material/component allocations, and initial task cost rows.
* Added Projects `Templates` tab with template KPIs, template table, default template preview, resources preview, and template editor dialog.
* Refactored Create Project dialog toward low-data-entry creation with customer, location, start date, handover date, contract value, and template selection.
* Added Quick Update panel in Project Progress for Simple Mode-style field updates: installed components, used materials, QC pass, incident flag, and notes.
* Created sprint reports: `project-template-library-report.md`, `project-low-data-entry-report.md`, and `project-quick-update-report.md`.
* Fixed an unrelated `InventoryLocationsPage.tsx` syntax regression that was blocking frontend build verification.

Verification:

* `pnpm --dir apps/backend-api exec prisma generate` passed.
* `pnpm -C apps/backend-api build` passed.
* `pnpm -C apps/frontend build` passed. Existing Vite `NODE_ENV` and large chunk warnings remain.

## 2026-06-30 Sprint 40PROJ.3 – Project Execution Management Foundation

Completed:

* Extended `GET /projects/runtime` with derived Project Execution read models: `wbs`, `financial`, `health`, and `returnRequests`.
* Built WBS runtime rows from existing Projects, Components, component-linked Tasks, and project-linked Inventory material transactions without schema changes.
* Added Project Detail financial KPI cards for contract value, budget, actual cost, profit, and margin.
* Added Project Health panels with warnings and suggested actions derived from delayed orders, overdue component tasks, component delivery/install state, open return requests, and budget risk.
* Replaced the previous simple progress section with a WBS tree grid supporting expand/collapse and visible action entry points for future persisted ProjectTask workflows.
* Activated Project Material Return through the existing Inventory Return workflow using `POST /inventory/returns` with `flowType = SITE_RETURN`.
* Created sprint reports: `project-execution-workspace-report.md`, `project-wbs-report.md`, `project-financial-dashboard-report.md`, and `project-return-flow-report.md`.
* No Prisma schema changes, migrations, staging, or commits were made.

Verification:

* `pnpm -C apps/frontend build` passed. Existing Vite `NODE_ENV` and large chunk warnings remain.
* `pnpm -C apps/backend-api build` passed.

## 2026-06-30 Sprint 40PROJ.1 – Projects Cockpit and Detail Workspace Refactor

Completed:

* Refactored `ProjectsPage.tsx` into an Inventory-aligned cockpit using shared cockpit primitives.
* Added Projects KPI strip for total projects, active projects, completed projects, delayed projects, and actual value.
* Rebuilt Projects analytics around real runtime data: status distribution, progress by project, value by project, soon-to-complete projects, delayed projects, and recent activity.
* Reworked the Projects table to match the Inventory table shell, density, transparent surface, compact rows, and cockpit pagination.
* Converted row selection into a Project Detail Workspace drawer with tabs for Tổng quan, Vật tư, Cấu kiện, and Tiến độ.
* Added project material and component workspace views using existing `GET /projects/runtime` data only.
* Kept project return actions as explicit UI feedback because formal Project Return APIs are not available yet.
* Created `docs/ui/projects-cockpit-refactor-report.md` and `docs/ui/project-detail-workspace-report.md`.
* No backend, API, Prisma schema, migration, staging, or commit changes were made.

Verification:

* `pnpm -C apps/frontend build` passed. Existing Vite `NODE_ENV` and large chunk warnings remain.
* `pnpm -C apps/backend-api build` passed.

## 2026-06-29 Sprint AUDIT.1 – Enterprise Architecture Audit

Completed:

* Audited the full SteelTrack architecture before Workflow Engine, Costing Engine, Historical Import, and Realtime Infrastructure work.
* Created enterprise reports under `docs/audit/` covering module inventory, navigation, data model readiness, dashboard, workflow, costing, import, realtime, performance, design system maturity, technical debt, and roadmap priorities.
* Produced a 0-100 maturity matrix for Architecture, Navigation, Design System, Inventory, Components, Production, Yard, Projects, Suppliers, QC, Workflow, Costing, Historical Import, Realtime, and Dashboard.
* Identified the recommended next three sprint sequence: Workflow Engine Binding P0, Inventory Ledger & Historical Import Readiness, and Component/Project Cost Traceability.
* No business logic, API contract, Prisma schema, migration, staging, or commit changes were made.

Verification:

* `pnpm -C apps/frontend build` passed. Existing Vite `NODE_ENV` and large chunk warnings remain.
* `pnpm -C apps/backend-api build` passed.

## 2026-06-29 Sprint 70EXEC.2 – Executive Insights & Control Tower

Completed:

* Extended `GET /dashboard/executive-cockpit` with `health`, `executiveSummary`, and `recommendations`.
* Added `DashboardInsightService` for health score and 7-day executive summary rules.
* Added `DashboardRecommendationService` for suggested actions based on Inventory shortage, Production material risk, Yard occupancy, QC/NCR, Projects, and notifications.
* Added Executive Control Tower section at the top of Dashboard KPI Chính with Health Score, 7-day Summary, Suggested Actions, Activities by Module, and Notification Center.
* Upgraded Recent Activities tab to show both module-grouped activity and timeline.
* Kept all calculations rules-based from real data; no Prisma schema, migration, fake data, or workflow changes.
* Created `docs/ui/executive-insights-report.md`.

Verification:

* `pnpm -C apps/backend-api build` passed.
* `pnpm -C apps/frontend build` passed. Existing Vite `NODE_ENV` and large chunk warnings remain.

## 2026-06-29 Sprint 70EXEC.1 – Executive Cockpit Intelligence Tabs

Completed:

* Added backend Executive Cockpit services: `DashboardMetricsService`, `DashboardActivityService`, and `DashboardNotificationService`.
* Added `GET /dashboard/executive-cockpit` as a single DTO endpoint for Dashboard trend, activity, and notification tabs.
* Added URL-driven Dashboard tabs for `KPI Chính`, `Biểu đồ xu hướng`, `Hoạt động gần đây`, and `Thông báo`.
* Implemented Predictive Trends from real Inventory transaction/location stock data, BOM/material issue data, and rolling average rules.
* Implemented unified Recent Activities from Inventory transactions, Production logs, Yard movements, QC inspections, Purchase Orders, and Projects.
* Implemented executive notification rules for Inventory shortages, delayed Production, Yard capacity, QC failures, Project delays, purchase orders, and persisted notifications.
* Updated Dashboard sidebar entries so the executive tabs are directly reachable through query routes.
* Removed the legacy hardcoded Dashboard forecast `dailyRate = 10`; the old forecast endpoint now derives rate from completed/installed components in the last 30 days.
* Created `docs/ui/executive-cockpit-report.md`.

Verification:

* `pnpm -C apps/frontend build` passed. Existing Vite `NODE_ENV` and large chunk warnings remain.
* `pnpm -C apps/backend-api build` passed.
* Search verification found no `Math.random()` or `dailyRate = 10` in Dashboard frontend/backend modules.

## 2026-06-28 Sprint 80YARD.1R – Restore Existing Yard 3D Workspace

Completed:

* Reconnected `/yard/map-3d` to the existing `YardOperationalMap3D` implementation.
* Restored the GLB/R3F-based Yard 3D experience with `Canvas`, `OrbitControls`, `crane.glb`, and `cau-kien-3d.glb`.
* Added runtime-first/demo-fallback behavior inside `YardOperationalMap3D`: runtime Yard slots render when available; otherwise local demo slots render with the badge `Đang hiển thị dữ liệu mẫu`.
* Removed the active pseudo-3D render branch from `YardTabWorkspace` so the restored implementation is unambiguous.
* Created `docs/ui/yard-3d-restoration-report.md` documenting discovery, root cause, runtime/demo sources, and restoration chain.

Verification:

* `pnpm -C apps/frontend build` passed. Build output confirms `YardOperationalMap3D-*.js` is bundled again. Existing Vite `NODE_ENV` and large chunk warnings remain.
* `pnpm -C apps/backend-api build` passed.

## 2026-06-27 Sprint 80YARD.1 – Yard Advanced Workspace and 3D Reintegration

Completed:

* Expanded Yard navigation to route-backed tabs for overview, 2D map, pseudo-3D map, locations, components, dispatch, live tracking, heatmap, timeline, and history.
* Added concrete AppRouter routes and synchronized both sidebar navigation configs.
* Restored the missing Yard 3D workspace as a CSS pseudo-3D view using real zones, slots, stack levels, and placements only.
* Removed decorative Yard trend defaults and switched movement trend display to real `yard_movements`.
* Added table-first Locations, Components, Timeline, and History workspaces using shared cockpit table and pagination components.
* Added Dispatch and Heatmap workspaces using real available-slot, occupied-slot, overloaded-zone, and utilization calculations; no pending dispatch data is fabricated.
* Added History filters for component code, location/zone, movement type, and date.
* Created `docs/ui/yard-advanced-workspace-report.md`.

Verification:

* `pnpm -C apps/frontend build` passed. Existing Vite `NODE_ENV` warning remains.
* `pnpm -C apps/backend-api build` passed.

## 2026-06-27 Sprint 50NAV.2 + 60UI.2 – Yard/Logistics Navigation and Real KPI Dashboard

Completed:

* Fixed Yard navigation by replacing hash-based tabs with route-backed tabs for overview, locations, components, movements, live tracking, and history.
* Fixed Logistics navigation by adding route-backed tabs for overview, planning, vehicles, dispatch, tracking, logs, and reports.
* Synchronized `AppRouter`, both sidebar navigation configs, Yard tab config, `YardPage`, `YardTabWorkspace`, and `LogisticsPage`.
* Rationalized Dashboard KPI Chính so the top KPI strip uses real Inventory Audit data instead of decorative/static values.
* Added real Production, Projects, and Suppliers dashboard panels using existing frontend API hooks and runtime endpoints.
* Removed hardcoded Dashboard timestamps from alerts and recent activity; empty module data now renders explicit empty states instead of fake rows.
* Created `docs/ui/navigation-yard-logistics-fix-report.md` and `docs/ui/dashboard-kpi-rationalization-report.md`.

Verification:

* `pnpm -C apps/frontend build` passed. Existing Vite `NODE_ENV` and large chunk warnings remain.
* `pnpm -C apps/backend-api build` passed.

## 2026-06-27 Hotfix – Inotify Watcher Exhaustion

Completed:

* Diagnosed frontend dev server `ENOSPC` as Linux inotify watcher exhaustion, not disk space exhaustion.
* Recorded current kernel watcher limits and active watcher consumers in `docs/dev/watchers-diagnostics-report.md`.
* Created sysctl and development-process remediation guidance in `docs/dev/watchers-remediation-plan.md`.
* Added safe Vite watcher ignores for generated/cache/artifact directories in `apps/frontend/vite.config.ts`.

Verification:

* `pnpm -C apps/frontend build` passed. Existing Vite `NODE_ENV` and large chunk warnings remain.

## 2026-06-27 Sprint 50NAV.1 – Module Navigation Completion

Completed:

* Synchronized AppRouter and sidebar navigation for Components, Production, Projects, Suppliers, and QC.
* Added real frontend routes for all target sidebar tabs so direct URL access no longer falls through to Dashboard.
* Converted Projects, Suppliers, and QC module tabs from local state to URL-derived route state.
* Added Production route tabs for planning, incidents, and reports without changing APIs, schema, or workflows.
* Updated both active sidebar navigation configs and preserved legacy QC routes for existing bookmarks.
* Created `docs/ui/navigation-audit-report.md` and `docs/ui/navigation-completion-report.md`.

Verification:

* `pnpm -C apps/frontend build` passed. Existing Vite `NODE_ENV` and large chunk warnings remain.
* `pnpm -C apps/backend-api build` passed.

## 2026-06-27 Sprint 20C.9 & 20P.9A – Cockpit Unification Phase 2

Completed:

*   **Shared Cockpit Extraction**: Created four new generic shared components in `@/shared/ui/cockpit`: `CockpitSidebarStats`, `CockpitRecentList`, `CockpitStatusList`, and `CockpitEmptyState`.
*   **Components Final Unification (Sprint 20C.9)**:
    *   Refactored `ComponentsCockpitShared.tsx` to use `COCKPIT_SHELL`, `CockpitKpiCard` (`h-[108px]`), `CockpitChartCard` (`h-[170px]`), and scaled down donut/mini bars to `h-[74px]`.
    *   Unified table cell and header paddings (`px-4 py-2.5`) across all list views (List, Stock, Production, Overview, Transfers) to match WMS tables.
    *   Created parity report: `docs/ui/components-final-unification-report.md`.
*   **Production Workspace Unification (Sprint 20P.9A)**:
    *   Refactored `ProductionCockpitShared.tsx` to map panels to `COCKPIT_SHELL`, KPI cards to `CockpitKpiCard` (`h-[108px]`), panels to `CockpitChartCard` (`h-[170px]`), and scaled down donut/bars to `h-[74px]`.
    *   Unified table head and row visual class names directly inside `InventoryVisuals.tsx` so all production grids automatically render with borderless shells, hover effects, and border-cyan highlights.
    *   Updated `InfoCard` and `RankList` component widgets to standard border (`border-white/5`), background (`bg-white/[0.02]`), and padding (`p-2.5`) styles.
    *   Created parity report: `docs/ui/production-workspace-unification-report.md`.

Verification:

*   Verified frontend compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-27 Sprint 30Y.2 – Yard Cockpit Unification

Completed:

*   **Root Layout Standard**: Enforced fluid `w-full min-w-0 flex-1 space-y-1` layout on the Yard page main section, removing legacy outer container wrappers and widths.
*   **Grid spacing standard**: Unified all layout and grid spacing to use `gap-1` and `space-y-1` margins.
*   **KPI Metric Cards unification**: Replaced all 21 metric KPI cards across the Yard module and sub-tabs with standard `<CockpitKpiCard />` elements using `h-[108px]`, industrial cockpit shell gradients, cyan rings, font-mono tabular-nums numbers, and decorative sparklines.
*   **Analytics cards standard**: Converted all quick analytics cards to use standard `<CockpitChartCard />` components (`h-[170px]` card heights, `h-[74px]` chart bodies). Customized `YardDonut` and `YardMiniTrend` graphics to scale down and fit perfectly in the `h-[74px]` viewport.
*   **Table and pagination standard**: Configured table shells (`border-0 ring-0 bg-transparent`), headers (`border-b border-cyan-400/10`), hover rows, and integrated `<DataTablePagination />` paging inside MovementTable and QCTab list views.
*   **Detail drawers standard**: Standardized local detail panels (Chi tiết tầng, Cấu kiện trong vị trí, Thông tin vị trí, Chi tiết cấu kiện, Cầu trục, Hoạt động gần đây) to use unified `COCKPIT_SHELL` styling, `p-3` padding, and `gap-y-1` flex directions.
*   **Unification Report**: Generated visual parity documentation under `docs/ui/yard-cockpit-unification-report.md`.

Verification:

*   Verified frontend compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-27 Sprint 20D.4B – KPI Typography Polish

Completed:

* **Label Typography Polish**:
  - Replaced all uppercase and letter-spacing tracking modifiers.
  - Formatted labels using `text-[12px] font-medium text-slate-400`.
* **Value Typography Polish**:
  - Removed monospace representation `font-mono` from values.
  - Implemented `font-bold tabular-nums text-[38px] xl:text-[42px] leading-none tracking-tight`.
* **Delta Formatting**:
  - Synced trend/delta note values to strictly use Inventory KPI formats with appropriate Vietnamese units: `▲ 2,4 ngày (+6,1%)`, `▲ 1 chuyền (+5,9%)`, `▲ 12K kiện (+4,8%)`, `▲ 0,6%`, `▼ 2 cảnh báo (-22%)`.
* **Spacing & Sparkline**:
  - Implemented card wrapper padding constraints: `px-5 py-4 flex flex-col gap-y-2 justify-between`.
  - Confirmed sparkline opacity remains at 3% (`opacity-[0.03]`) for a clean, decorative layout.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-27 Sprint 20D.4A – KPI Layout Unification

Completed:

* **Executive KPI Layout Restructure**:
  - Restructured the executive KPI card layout to enforce the top-to-bottom hierarchy: Label (Top), Large Value (Center), and Delta (Bottom).
  - Maintained executive sizing at `h-[128px]` using `COCKPIT_HEIGHTS.KPI_EXEC`.
  - Upgraded font sizes inside `CockpitKpiCard.tsx`'s executive layout: Label (`text-[11px]`), Value (`text-[38px] xl:text-[42px]`), and Delta (`text-[11px]`).
* **Visual Density Reduction**:
  - Removed large icons, status chips, pulse indicators, extra description subtitles, and duplicate labels from the executive KPI cards.
  - Set the background sparkline opacity to a subtle 3% (`opacity-[0.03]`) to avoid competition with the primary numeric display.
* **Information & Formatting Unification**:
  - Updated card value arguments in `DashboardPage.tsx` to include units inline (e.g. `42 ngày`, `18 chuyền`, `256K kiện`, `7 cảnh báo`).
  - Synced positive trend indicators with a leading `▲` and negative with `▼`.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-27 Sprint 20D.3C – Dashboard Empty States & Density Optimization

Completed:

* **Custom Empty States**:
  - Implemented explicit empty states inside Forecast, Pipeline, Yard, QC, and Production panels so they never appear as empty black boxes.
  - Custom empty states render a panel-specific icon, descriptive title (e.g. `"Chưa có dữ liệu QC"`), and detail subtitle.
* **Density & Spacing Reductions**:
  - Reduced outer card heights inside `DashboardPage.tsx` to: Forecast (260px), Pipeline (260px), Yard (260px), Replenishment (260px), QC (260px), Activity (220px), and Assumptions (160px).
  - Scaled internal svg heights in QC trend to `h-[110px]` to guarantee the chart occupies >=70% of the active card body height.
* **Readability Upgrades**:
  - Set minimum header labels and item row labels to `text-[13px]`.
  - Set secondary metrics to `text-[12px]`.
* **Activity & Spacing Polish**:
  - Clipped recent activity descriptions to a maximum of 2 lines using `line-clamp-2`.
  - Reduced table row vertical spacing and padding parameters to maximize the number of rows displayed.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-27 Sprint 20D.3B – Executive Dashboard Final Polish

Completed:

* **KPI Cards Presentation Polish**:
  - Main values redesigned to use font sizes `text-[44px] xl:text-[48px] leading-none tracking-tight` for stronger visual weight.
  - Increased negative space by setting wrapper padding to `px-4 py-4`.
* **Inventory Movement Chart Polish**:
  - Grouped bar chart card size stretched to `h-[380px]` container height and chart body scaled to `h-[290px]` to visually dominate the viewport.
* **Alerts Panel Polish**:
  - Restructured to render header count as `Cảnh báo (N)`.
  - Staged alert rows to display a leading status icon (`⚠`), alert title (`row.code`), short message (`Tồn X · thiếu Y SET`), and relative time (`2 phút trước`).
* **Recent Activity Timeline Polish**:
  - Fully redesigned into a bullet timeline layout using status circles (`🟢`), event action headers, object descriptions, operator names, and relative times.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-27 Sprint 20D.3 – Executive Dashboard UX Redesign

Completed:

* **Header Removal**: Removed the page title `"Tổng quan"`, descriptions, subtitles, and refresh buttons from `DashboardPage.tsx`. The page starts directly with the KPI cards.
* **Static Status Dot**: Removed the pulsing animation from `CockpitKpiCard.tsx` status dots to make them clean static indicators.
* **5-Row Reorganization**:
  - **Row 1**: 5 executive KPI cards (`Ngày tồn`, `Sản xuất`, `Cấu kiện`, `QC đạt`, `Cảnh báo`) with 48px visual weight values and zero units in main numbers.
  - **Row 2**: Biến động nhập - xuất - tồn kho (grouped bar chart using SVG columns and legend on top) and Cảnh báo (top 4 critical/warning alerts with subtle borders).
  - **Row 3**: Dự báo tồn kho (days of cover metrics + sparkline), Tiến độ cấu kiện (donut and pipeline progress), and Sử dụng bãi (occupancy progress meter and inbound/outbound/moves statistics).
  - **Row 4**: Bổ sung vật tư (horizontal bars for top đề xuất + top 5 table) and Xu hướng QC (time-series QC lines + NCR/Pass rate stats).
  - **Row 5**: Hoạt động gần đây (compact timeline table) and Giả định dự báo (checklist list with 30% reduced height).

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-27 Sprint 20D.2G – Dashboard Text Density Reduction

Completed:

* **Colored Status Dots**: Replaced text-based status badges (`'LIVE'`, `'RUN'`, `'WARN'`) in `CockpitKpiCard.tsx` with glowing, pulsing status dots colored according to the card's tone. Used a small grey dot for empty state.
* **Shortened Labels**:
  - *KPI titles*: `Ngày tồn kho` → `Ngày tồn`, `Đang sản xuất` → `Sản xuất`, `Tỷ lệ đạt QC` → `QC đạt`.
  - *Panel titles*: `Mức sử dụng bãi` → `Sử dụng bãi`, `Xu hướng chất lượng` → `Xu hướng QC`, `Cảnh báo vận hành` → `Cảnh báo`, `Tín hiệu sản xuất` → `Sản xuất`.
* **Emphasized Numeric Values**: Changed KPI card primary values to display only raw numeric values (`42`, `18`, `256K`, `96,8%`, `7`) by shifting units and labels entirely into titles and trends.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-27 Sprint 20D.2F – Dashboard Text Simplification & Localization

Completed:

* **Header Simplification**: Replaced the detailed header `ModulePageHeader` in `DashboardPage.tsx` with a clean, localized title `"Tổng quan"` and removed all descriptions and paragraphs.
* **Panel Title Localization**: Translated and simplified all dashboard panel titles in `DashboardPage.tsx`:
  - `Inventory Forecast` → `Dự báo tồn kho`
  - `Component Pipeline` → `Tiến độ cấu kiện`
  - `Yard Occupancy` → `Mức sử dụng bãi`
  - `QC Quality Trend` → `Xu hướng chất lượng`
  - `Executive Alerts` → `Cảnh báo vận hành`
  - `Material Replenishment` (Dự báo cần mua / nhập vật tư) → `Bổ sung vật tư`
  - `Production Signal` → `Tín hiệu sản xuất`
  - `Component Forecast` (Dự báo cấu kiện 7 ngày) → `Dự báo cấu kiện`
* **KPI Card Localization & Simplification**: Localized the 5 KPI titles, simplified status chips to `'LIVE'`, `'RUN'`, `'WARN'`, and translated trend texts to compact Vietnamese representations (`+2,4 ngày`, `+1 chuyền`, `+12 nghìn tấn`).

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-27 Sprint 20D.2C – Executive KPI Implementation

Completed:

* **Executive KPI Presentation**: Enhanced the shared `CockpitKpiCard` component (`CockpitKpiCard.tsx`) to support executive presentation layouts when `state` is provided:
  - Supports `state` value states: `'loading'`, `'empty'`, `'normal'`, and `'alert'`.
  - Supports `tone`, `trendText`, `trendData`, and `statusText` props.
  - Implemented the vertical rhythm layout: Top (icon, status badge), Center (large 3xl/4xl value), Bottom (small uppercase title, trend text).
  - Designed loading skeleton state and empty text (`—`) state with muted opacity.
  - Styled visual rules: border opacity <= 12%, glow opacity <= 8% (`boxShadow` with custom color alpha), high negative space, and amber warning styling for alert state (critical alert uses red badge only).
  - Added new `KPI_EXEC` height token (`h-[128px]`) to `cockpit-tokens.ts`.
* **Dashboard Integration**: Redesigned `DashboardPage.tsx` to render the 5 redesigned executive KPI cards (Inventory Days, Production Active, Component Pipeline, QC Pass Rate, Open Alerts) directly using the enhanced shared `CockpitKpiCard` component.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-27 Sprint 20D.1 – Executive Dashboard Implementation

Completed:

* **ERP Executive Cockpit**: Completely redesigned the Inventory Overview Page (`InventoryOverviewPage.tsx`) into a Manufacturing ERP Cockpit (Executive Dashboard).
* **Card Re-use**: Utilized the existing shared cockpit components (`CockpitKpiCard`, `CockpitChartCard`, `COCKPIT_HEIGHTS`, and `COCKPIT_SHELL`) without duplicating tokens or creating new generic card wrapper structures.
* **Layout Grid**: Implemented the full 4-row grid structure supporting standard and ultrawide viewports:
  - *Row 1*: 5 Executive KPI Cards (Inventory Days, Production Active, Component Pipeline, QC Pass Rate, Open Alerts) mapping to color-coded cockpit tones.
  - *Row 2*: Inventory Forecast SVG Area Chart (`col-span-12 xl:col-span-8`) and Component Pipeline SVG Donut Chart (`col-span-12 xl:col-span-4`).
  - *Row 3*: Operational Pulse shift throughput metrics (`col-span-12 xl:col-span-6`) and exception registry categorized by severity (`col-span-12 xl:col-span-6`).
  - *Row 4*: Operational Timeline event flow (`col-span-12 xl:col-span-7`) and factory OEE circular rings (`col-span-12 xl:col-span-5`).
* **Real-time & Mock view models**: Implemented standard mock view models and structured time strings.
* **Component Extraction & Refactor**: Extracted sub-components into dedicated files in `modules/inventory/components/dashboard/`: `ExecutiveKpiRow.tsx`, `ForecastAreaChart.tsx`, `PipelineDonut.tsx`, `OperationalPulse.tsx`, `AlertsPanel.tsx`, `ActivityTimeline.tsx`, and `PerformanceGauge.tsx`. Reduced `InventoryOverviewPage.tsx` from ~350 lines to 198 lines total, ensuring modularity while keeping the visual layout, mock data, and business logic identical.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-27 Sprint 20C.8 – Components Theme Unification

Completed:

* **Unified Root Layout**: Changed root layout wrapper to `w-full min-w-0 flex-1 space-y-1` and replaced grid/chart gaps with a clean `gap-1` system. Removed light surfaces, center wrappers (`mx-auto`), `max-w-*` restrictions, and hardcoded widths.
* **WMS KPI Cockpit Cards**: Unified the KPI strip by defining a local `InventoryMetricCard` and `KpiSparkline` matching `InventoryMaterialsPage` exact visuals (h-[108px], rounded-2xl, border-cyan-300/15, industrial gradient, and ring-cyan-400/[0.055]). Configured the grid layout as `grid-cols-1 md:grid-cols-5 gap-1` with 5 metrics:
  1. *Tổng cấu kiện* (blue, Package)
  2. *Đang sản xuất* (cyan, Layers3)
  3. *Hoàn thành* (emerald, Warehouse)
  4. *Chờ vật tư* (amber, Warehouse)
  5. *Trễ tiến độ* (red, MapPinned)
* **Reorganized Analytics Layout**: Configured a fluid 3-row layout structure matching the locations page hierarchy:
  - *Row 1*: "Phân bố cấu kiện" (donut chart) and "Tình trạng cấu kiện" (mini bars trend) in `col-span-12 xl:col-span-6` grid.
  - *Row 2*: "Cấu kiện mới nhất" (sorted by raw creation time DESC) and "Cấu kiện sử dụng nhiều nhất" (sorted by quantity DESC) in `col-span-12 xl:col-span-6` grid.
  - *Row 3*: "Danh sách cấu kiện" table in full width.
* **Redesigned Analytics Cards**: Configured local `ChartCard` matching the Inventory card shell (height h-[220px], same gradient, same shadow, same ring, rounded-2xl, and title: `text-xs font-bold uppercase tracking-[0.12em] text-white`, subtitle: `text-[11px] text-slate-500`).
* **Direct Table Parity**: Styled the main table to match the Inventory stock list exactly:
  - Shell classes: `border-0 ring-0 bg-transparent shadow-none rounded-none overflow-auto scrollbar-none h-[520px]`
  - Table style: `w-full min-w-[1050px] text-sm table-fixed`
  - Header cells: `bg-transparent text-slate-300 border-b border-cyan-400/10`
  - Row lines: `hover:bg-cyan-400/[0.04] border-b border-white/[0.04] cursor-pointer`
  - Numeric columns (Khối lượng): `font-mono tabular-nums text-right`
* **Creation Modal Theme**: Refactored the local create modal to use the exact translucent WMS modal container, inputs, and button visual styles of the Inventory transaction forms.
* **Visual Audit & Pagination**: Performed a visual audit, resolving nested card wrappers, matching all design tokens and height constraints (`h-[108px]`, `h-[220px]`, `gap-1`), adding local frontend pagination for table parity, and replacing all prohibited classes (`gap-3`, `gap-4`, `space-y-4`, `max-w-3xl`) with safe overrides.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-26 Sprint 20I.5F – Inventory Locations KPI Cockpit

Completed:

* **WMS KPI Cockpit Cards**: Replaced the first 5 locations analytics cards with the standard WMS KPI cockpit cards, fully aligned with the unified `InventoryMetricCard` visual design:
  1. *Tổng vị trí* (blue, MapPinned)
  2. *Đang sử dụng* (emerald, Layers3)
  3. *Vị trí trống* (cyan, Package)
  4. *Hiệu suất sức chứa* (purple, Warehouse)
  5. *Tổng tồn theo vị trí* (amber, Warehouse)
* **Visual Parity**: Applied standard styles: height of `h-[108px]`, `rounded-2xl`, `border-cyan-300/15`, cockpit gradient background, and `ring-cyan-400/[0.055]`, featuring the `KpiSparkline` at the bottom.
* **6-Month Trend Rollback**: Implemented transactional rollback logic over 6 snapshot dates to compute historical location stats:
  - `totalLocationsTrend`: total locations (constant count of real storage locations)
  - `occupiedLocationsTrend`: occupied locations (active locations count with stock > 0)
  - `emptyLocationsTrend`: empty locations (active locations count with stock === 0)
  - `occupancyPercentTrend`: slot occupancy percentage (occupied slots / total slots capacity)
  - `totalStockTrend`: total stock quantity (in tons)
* **Vietnamese Delta Notes**: Configured dynamic delta notes comparing current month with the previous month:
  - Location count delta: `▲2 vị trí (+18,2%)` / `▼2 vị trí (-18,2%)`
  - Capacity percentage delta: `▲1,2% (+5,4%)`
  - Stock value delta: `▲3.790.984.762 đ (+49,2%)`
  - Stock weight delta: `▲686,5 tấn (+6,4%)`
* **Card 5 Rich Subtext**: Programmed Card 5 subtext to display both value delta and weight delta inline: `▲3.790.984.762 đ (+49,2%) · ▲686,5 tấn (+6,4%)` with color indicators.
* **Responsive Layout**: Wrapped the cockpit cards in a fluid `<div className="grid grid-cols-1 gap-1 md:grid-cols-5">` layout.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.
* Verified the backend compiles and builds successfully using `pnpm -C apps/backend-api build`.

## 2026-06-26 Sprint 20I.5D – Inventory Locations Responsive Workspace

Completed:

* **Removed Width Constraints**: Removed all fixed width constraints, `max-w-*` limits, `mx-auto` centering wrappers, container classes, and hardcoded widths like `w-[1040px]` or `w-[320px]`.
* **Root Layout Adjustment**: Updated the root layout wrapper to use `w-full min-w-0 flex-1 space-y-1`.
* **Main Row 1 Grid**: Structured Row 1 as a 12-column grid (`grid-cols-12 gap-1`) where "Danh sách vị trí kho" takes `col-span-12 2xl:col-span-8` and the stacked right sidebar takes `col-span-12 2xl:col-span-4`.
* **Analytics Bottom Grid**: Reconfigured Row 2, 3, and 4 cards to use a 12-column grid (`grid-cols-12 gap-1`) with `col-span-12 xl:col-span-6` for each of the four cards (*Giá trị tồn theo vị trí*, *Vị trí tồn kho cao nhất*, *Vật tư nhập gần nhất*, and *Vật tư xuất gần nhất*).
* **Automatic Scaling**: Ensured the dashboard grows and shrinks dynamically to fit all monitors (laptop to ultrawide) and respects both sidebar states (expanded and collapsed).
* **Preserved Core Logic**: Left all calculations, hooks, APIs, datasets, and chart logic completely unchanged.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.
* Verified the backend compiles and builds successfully using `pnpm -C apps/backend-api build`.

## 2026-06-26 Sprint 20I.5C – Inventory Locations Dashboard Usability Polish

Completed:

* **Enlarged Locations Section**: Made "Danh sách vị trí kho" card larger with a height of `h-[560px]`, text size `text-[12px]`, row cell padding `py-2.5`, and table headers `text-xs font-semibold`.
* **New Locations Columns**: Added columns `Kho`, `Zone`, `Slot`, `Tầng`, `Khối lượng`, `Số vật tư`, and `Trạng thái`.
* **Vietnamese Status Badges**: Added rounded-full status badges for locations: `Đang dùng` (cyan), `Trống` (emerald), and `Bảo trì` (amber).
* **Enlarged Analytics Cards**: Adjusted card heights:
  * *Giá trị tồn theo vị trí*: `h-[320px]`
  * *Vị trí tồn kho cao nhất*: `h-[320px]`
  * *Vật tư nhập gần nhất*: `h-[300px]`
  * *Vật tư xuất gần nhất*: `h-[300px]`
* **Xem Tất Cả Action & Modal**: Added a "Xem tất cả" action on the header of the four analytics cards. Clicking the action opens a full table modal dialog with `fixed inset-0 bg-slate-950/75 backdrop-blur-md max-h-[70vh] overflow-auto rounded-2xl` layout and localized columns (including transaction date mapping `Ngày` for imports and exports).
* **Preserved Calculations**: Left all original query hooks, useMemo metrics, and API logic completely unchanged.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.
* Verified the backend compiles and builds successfully using `pnpm -C apps/backend-api build`.

## 2026-06-26 Sprint 20I.5B – Inventory Locations Dashboard Layout Polish

Completed:

* **Primary Dashboard Section**: Made "Danh sách vị trí kho" the main left card with a height of `h-[520px]` and responsive width (approximately 1040px on standard desktop sizes).
* **Right Sidebar Layout**: Created a stacked right sidebar (`w-[320px]`, `gap-1`) containing:
  * *Hiệu suất sức chứa*: Compact donut chart using `CompactDonutSummary`.
  * *Trạng thái vị trí*: Vertical bar chart using `VerticalBarChart`.
  * *Phân bố loại vật tư*: Pie chart using `CompactPieChart`.
* **Compact Tables Replacement**: Replaced horizontal bar charts with compact tables (`rounded-xl border border-white/10 bg-[#08111f]/90 text-[11px] py-1 px-2` spacing) displaying the top 5 rows sliced:
  * *Giá trị tồn theo vị trí* (Columns: Kho | Giá trị | %)
  * *Vị trí tồn kho cao nhất* (Columns: Vị trí | Khối lượng | %)
  * *Vật tư nhập gần nhất* (Columns: Mã | Vật tư | Số lượng)
  * *Vật tư xuất gần nhất* (Columns: Mã | Vật tư | Số lượng)
* **Reduced Spacing**: Applied `gap-1` and `space-y-1` spacing across the locations cockpit page to create a dense industrial theme.
* **Fully Localized Vietnamese Labels**: Fully translated all units (such as `t` to `tấn`, table headers, status labels) and removed English chart titles.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.
* Verified the backend compiles and builds successfully using `pnpm -C apps/backend-api build`.

## 2026-06-26 Sprint 20I.5A Inventory Location Dashboard Redesign

Completed:

* **MES/WMS Cockpit Theme & Spacing**:
  * Redesigned the dashboard charts in `InventoryLocationsPage.tsx` to align with the premium dark cockpit theme (gradients, rings, cyan borders, and backdrop-blurs).
  * Removed all legacy borders/slate-950 background styles, ensuring cards look extremely premium and cohesive.
  * Standardized card padding to `p-3` and card grid gap to `gap-3` (strictly avoiding `gap-5` or `gap-6` as requested).
* **Grid Layout & Responsive Heights**:
  * Structured the dashboard into 5 rows with exact height and column configurations:
    * **Row 1**: *Top occupied slots* (Left, `h-[220px]`, top 6, horizontal progress bars) & *Hiệu suất sức chứa* (Right, `h-[220px]`, `CompactDonutSummary` showing "X% Đã sử dụng" center value and Legend: Đang dùng, Trống, Bảo trì).
    * **Row 2**: *Giá trị tồn theo vị trí* (Left, `h-[250px]`, `HorizontalBars` showing Top 8 locations sorted DESC in billions/millions VND short form) & *Top 5 vị trí có tồn cao nhất* (Right, `h-[250px]`, `HorizontalBars` in tons).
    * **Row 3**: *Top 10 vật tư nhập gần nhất* (Left, `h-[250px]`, `HorizontalBars` showing top 6 material names and quantities) & *Top 10 vật tư xuất gần nhất* (Right, `h-[250px]`, `HorizontalBars` showing top 6 material names and quantities).
    * **Row 4**: *Top 5 vật tư tồn cao nhất* (Full width, `h-[280px]`, custom detail table showing material Code, Name, Location, Stock, Value, and a percentage progress bar relative to the max stock).
    * **Row 5**: *Phân bố sức chứa theo kho* (Full width, `h-[250px]`, custom progress bar list showing zone name, tonnage, capacity utilization percentage, and active slot count).
  * Replaced the old low-value "Luồng điều chuyển theo slot" chart with the new warehouse/zone capacity distribution chart.
  * Ensured responsive columns: 2 columns on Desktop/Laptop (`lg:grid-cols-2`), 1 column on Tablet/mobile (`grid-cols-1`).
* **KPI Metric Cards**:
  * Redesigned the 5 KPI metric cards at the top of the page using the premium cockpit theme and rings to maintain 100% style consistency.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.
* Verified the backend compiles and builds successfully using `pnpm -C apps/backend-api build`.

## 2026-06-26 Sprint 20I.4F Inventory Materials Parity Audit & Visual Rhythm

Completed:

* **Parity Verification & Synchronization**:
  * Audited the snapshot engine in `InventoryMaterialsPage.tsx` and synchronized it with the 12-month transaction-based rollback logic of `InventoryOverviewPage.tsx`.
  * Updated `kpiTrend` inside `InventoryMaterialsPage.tsx` to compute 12 end-of-month snapshots instead of 6, ensuring the sparkline shapes are identical between both pages.
  * Replicated the `dateAgeInfo` logic to apply a flat placeholder sparkline when historical data age is less than 365 days.
  * Corrected the existence logic (`existed = firstTxDate && firstTxDate <= end`) and implemented main warehouse rollback filter logic for low stock/out of stock alerts to ensure absolute consistency.
  * Confirmed snapshot values match (May 2026: ~7.711.783.211 đ value / ~10.767 tons weight; June 2026: 14.168.720.116 đ value / ~15.542.5 tons weight today) and that no more +100% bug is present.
* **Visual Audit & Rhythm**:
  * Verified that the first three dashboard cards (Phân bố tồn kho, Biến động tồn kho, Cảnh báo tồn kho) are correctly styled at `h-[170px]` using dynamic `p-3` padding.
  * Confirmed that `CompactDonut` and `StockTrendChart` internals are preserved at original sizes using scroll containment viewports (`h-[82px] overflow-y-auto`) to avoid any vertical text clipping, SVG compression, or label overlapping.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.
* Verified the backend compiles and builds successfully using `pnpm -C apps/backend-api build`.

## 2026-06-26 Sprint 20I.4E (Part 2) Inventory Materials Snapshot Synchronization and Chart Height Reduction

Completed:

* **KPI Snapshot Engine Synchronization**:
  * Built `firstTransactionDateMap` in `kpiTrend` using the minimum transaction date (`transactionDate` / `createdAt`) with a fallback to `row.createdAt` for every material.
  * Replaced the record creation date checks with the Map-resolved minimum transaction dates inside the historical snapshots generator and monthly code-count filters.
  * Corrected May 2026 snapshot values to match Inventory Overview (eliminating the forced +100% delta).
* **Dashboard Chart Height Adjustment**:
  * Parameterized `ChartCard`, `CompactDonut`, and `StockTrendChart` to support custom dimensions, font sizing, and row limits.
  * Reduced the visual height of Cards 1 (Phân bố tồn kho), 2 (Biến động tồn kho), and 3 (Cảnh báo tồn kho) to `h-[170px]` (charts content set to `h-[74px]`), while preserving Cards 4 and 5 inside the alerts sidebar drawer at `h-[260px]`.
  * Configured `CompactDonut` to render a smaller circle (`h-16 w-16`) and display up to 3 segments in a condensed two-column format.
  * Configured `StockTrendChart` to render with a height of `h-[74px]`.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-26 Sprint 20I.4E Inventory Materials KPI cards visual/behavior parity

Completed:

* Aligned the first 5 KPI cards in the Inventory Materials tab to be visually and behaviorally identical to the Inventory Overview KPI cards:
  * **Card Containers**: Configured `rounded-2xl`, `border-slate-800`, `bg-slate-950/60`, equal height `h-[108px]`, and `p-4` padding.
  * **Typography**: Applied title class `text-[10px] uppercase tracking-[0.12em] text-slate-400`, value class `text-2xl font-semibold text-white mt-1`, and note class `text-[10px] font-semibold mt-1`.
  * **Delta Formatting**: Formatted value metrics with Vietnamese locale decimal commas (e.g. `▲5.203,5 tấn (+48,3%)`) and count metrics (e.g. `▲3 mã`, `▼2 mã`).
  * **Fallback Deltas**: Completely removed "+ mới so với tháng trước" / "Chưa có dữ liệu lịch sử" fallbacks.
  * **Semantic Colors**: Standardized note text color class mapping and card tones to match the Overview page exactly (emerald, cyan, indigo, amber, red).
* Spacing: Configured the metric cards grid container to use a gap spacing of `gap-1` to align with the Overview cockpit layout.
* Cleaned up unused `formatPercentDelta` helper.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-26 Sprint 20I.4D Inventory Materials KPI-Style Values

Completed:

* Restructured the visual value rows and subtitles of all 5 Inventory Materials dashboard cards to conform to the KPI-style value presentation:
  * **Phân bố tồn kho**: Renders value `15.970,5 tấn` and subtitle `6 kho hoạt động`.
  * **Biến động tồn kho**: Renders value `15.970,5 tấn` and subtitle `▲5.203,5 tấn (+48,3%)`.
  * **Cảnh báo tồn kho**: Renders value `12` and subtitle `▲2 với tháng trước` (dynamically compiled from alert difference).
  * **Theo mức độ**: Renders value `3` and subtitle `3 mức`.
  * **Top tồn thấp**: Renders value `6` and subtitle `Dưới định mức`.
* Ensured value styling matches `text-2xl font-semibold text-white mt-1` and subtitle styling matches `text-[10px] text-slate-400 mt-1`.
* Cleaned up redundant `className` prop from Card 1 `ChartCard` call.
* Preserved calculations, datasets, chart components, responsive grid architecture, and card heights.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-26 Sprint 20I.4C Align Materials Dashboard Card Vertical Rhythm

Completed:

* Redesigned the header container of `ChartCard` to a fixed height of `h-[64px]` with `flex flex-col justify-start` visual classes.
* Aligned all 5 Inventory Materials dashboard cards to begin their chart contents precisely below the same header height.
* Styled the card header values and subtitles using the exact spacing rhythm of the Overview KPI cards:
  * Main value: `mt-1 text-2xl font-semibold text-white leading-none`
  * Subtitle: `mt-1 text-[10px] text-slate-400`
* Updated subtitles for all 5 cards to use compact formats:
  * Phân bố tồn kho: `${warehouseOptions.length} kho hoạt động` (e.g. `6 kho hoạt động`).
  * Biến động tồn kho: `▲5.203,5 tấn (+48,3%)` (dynamically compiled from quantity delta calculations).
  * Cảnh báo tồn kho: `▲2 với tháng trước` (dynamically compiled from alert difference calculations).
  * Theo mức độ: `3 mức cảnh báo` (fixed string as requested).
  * Top tồn thấp: `Dưới định mức`.
* Preserved calculations, datasets, chart components, and grid layout.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-26 Sprint 20I.4A Restyle Inventory Materials Dashboard Cards

Completed:

* Restyled all 5 Inventory Materials dashboard cards to visually match the Inventory Overview KPI visual guidelines.
* Set card containers to `rounded-2xl`, `border-slate-800`, `bg-slate-950/60`, and equal height of `h-[260px]` with premium shadow tokens.
* Redesigned the card header typography:
  * Title: `text-[10px] uppercase tracking-[0.12em] text-slate-400`
  * Primary number: `text-2xl font-semibold text-white`
  * Secondary note: `text-[10px] text-slate-400`
* Styled and laid out headers for all 5 cards:
  1. **Phân bố tồn kho**: Renders title "Phân bố tồn kho", primary number `${formatQuantity(kpis.totalQty, 1)} tấn`, and secondary note `Tổng tồn · ${warehouseOptions.length} kho`, reusing existing `CompactDonut`.
  2. **Biến động tồn kho**: Renders title "Biến động tồn kho", primary number `${formatQuantity(kpis.totalQty, 1)} tấn`, and secondary note with dynamic quantity delta percentage `▲/▼ X tấn (+/- Y%)`, reusing existing `StockTrendChart`.
  3. **Cảnh báo tồn kho**: Renders title "Cảnh báo tồn kho", primary number `${alerts.length} cảnh báo`, and secondary note with alert difference, improving typography and spacing of the alert list.
  4. **Theo mức độ**: Wrapped the severity chart in `ChartCard` with title "Theo mức độ", primary number `${alerts.length} cảnh báo`, secondary note "Mức độ cảnh báo tồn", and improved typography.
  5. **Top tồn thấp**: Wrapped the low stock chart in `ChartCard` with title "Top tồn thấp", primary number `${alerts.slice(0, 6).length} vật tư gần ngưỡng`, secondary note "Vật tư dưới mức tối thiểu", and displayed quantity beside material code in the chart labels (e.g. `VT-00001 (X tấn)`).
* Restructured `AlertMiniChart` to remove internal cards/background borders and render clean progress bars directly within the unified `ChartCard` wrapper.
* Preserved all calculations, monthly trend logics, datasets, responsive grid architecture, and filter layouts.

Verification:

* Verified the frontend compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-25 Sprint 20I.3S Polish Overview Category KPI Typography

Completed:

* Refactored the `percent` helper in `kpiDeltas` calculation to display percentage changes inside parentheses instead of pipes, i.e. from `▲999 tấn | +94,8%` to `▲999 tấn (+94,8%)`.
* Changed `OverviewMetricCard` parameter type for `value` from `string` to `React.ReactNode`.
* Updated category cards (`Vật tư chính`, `Vật tư phụ`, `Vật tư tiêu hao`) to render the count as `text-white font-semibold` and the quantity as `text-slate-400 font-normal text-[14px]` inline (e.g. `6 (2.053 tấn)`).
* Preserved the dark cockpit theme, responsive layout grid, sparkline trends, colors, delta calculations, snapshot rollback logic, and equal visual card heights (`h-[108px]`).

Verification:

* Verified the frontend and backend applications build successfully using `pnpm -C apps/frontend build` and `pnpm -C apps/backend-api build`.

## 2026-06-25 Sprint 20I.3R Simplify Overview Category KPI Cards

Completed:

* Removed the `compositionText` prop and all composition subtitle rendering from the `OverviewMetricCard` component.
* Updated the category cards (`Vật tư chính`, `Vật tư phụ`, `Vật tư tiêu hao`) to remove calculations and prop passes for category composition percentages.
* Ensured all 8 KPI cards maintain equal visual height matching `h-[108px]`.
* Preserved the dark cockpit theme, responsive layout grid, sparkline trends, KPI colors, delta calculations, and real 12-month historical stock snapshots.

Verification:

* Verified the frontend and backend applications build successfully using `pnpm -C apps/frontend build` and `pnpm -C apps/backend-api build`.

## 2026-06-25 Sprint 20I.3Q Remove KPI Composition Progress Bars

Completed:

* Removed the thin composition progress bar, its wrapper, and percentage bar display elements from `OverviewMetricCard`.
* Added `compositionText` prop to the `OverviewMetricCard` component to allow rendering small helper text (e.g. `"12,9% tổng tồn"`) without progress bars.
* Configured the category KPI cards (`Vật tư chính`, `Vật tư phụ`, `Vật tư tiêu hao`) to calculate and display the exact composition percentage format `"X,X% tổng tồn"` using `formatQuantity(percentage, 1)`.
* Preserved the dark cockpit cockpit layout, responsive grid, sparkline trends, metric colors, and delta calculations.

Verification:

* Verified the frontend and backend applications build successfully using `pnpm -C apps/frontend build` and `pnpm -C apps/backend-api build`.

## 2026-06-25 Sprint 20I.3P Enhanced Overview KPI Cards

Completed:

* Enhanced OverviewMetricCard component to support rendering a thin, color-matched composition progress bar.
* Calculated and rendered compact composition progress percentages on the category KPI cards (primaryQty/totalQty, secondaryQty/totalQty, consumableQty/totalQty).
* Refactored KPI delta line presentation:
  * Percentage-based metrics (totalValue, totalQty, primaryQty, secondaryQty, consumableQty) now display absolute diff and percentage change (e.g. `▲5.203,5 tấn | +48,3%`).
  * Count-based metrics (totalItems, lowStockCount, outOfStockCount) now display absolute counts change only (e.g. `▲3 mã`, `▼2 mã`).
* Kept category value formats aligned to `X (Y tấn)` (e.g. `6 (2.053 tấn)`).
* Preserved the dark cockpit styling, responsive layout grid, and real 12-month historical snapshots.

Verification:

* Verified the frontend application compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-25 Sprint 20I.3N Historical Material Existence Fix

Completed:

* Replaced the metadata-based existence check (`material.createdAt`) in the monthly snapshot generator with a transaction-based existence check (`firstTransactionDate`).
* Calculated `firstTransactionDate` for each material as the minimum of the material's transaction transactionDate, falling back to transaction createdAt if transactionDate is absent.
* Evaluated historical material existence at each monthly snapshot date as:
  `firstTransactionDate <= snapshotDate`
* Recalculated monthly snapshot values and deltas for totalItems, totalQty, primaryQty, secondaryQty, consumableQty, lowStockCount, and outOfStockCount.
* Verified that the previous month snapshot (May 31, 2026) has non-zero quantities, causing the forced `▲100%` delta notes to disappear and show real percentage changes:
  * totalQty: `▲48.3%`
  * primaryQty: `▲94.8%`
  * secondaryQty: `▲47.7%`
  * consumableQty: `▲34.5%`

Verification:

* Verified the frontend application compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-25 Sprint 20I.3H Compact Inventory KPI Cards

Completed:

* Compacted the category cards value presentation format from `X mã (Y tấn)` to `X (Y tấn)` (e.g. `6 (2.053 tấn)`).
* Refactored the KPI note comparison suffix: changed the month-specific suffix (e.g. `so với Tháng 5/2026`) to the generic `với tháng trước` for both percentage and count delta notes.
* Reduced typography scales across the OverviewMetricCard component:
  * Title remains `text-[10px]`
  * Value remains `text-xl`
  * Note reduced from `text-[11px]` to `text-[10px]`
* Preserved the dark cockpit theme, responsive layouts, and sparkline rendering.

Verification:

* Verified the frontend application compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-25 Sprint 20I.3G Category KPI Quantity Enhancements

Completed:

* Enhanced the category KPI cards (Vật tư chính, Vật tư phụ, Vật tư tiêu hao) to show both unique material counts and total quantity in tons.
* Refactored delta calculations for category KPI cards to be calculated from quantity in tons (`Y tấn`), not from unique material count.
* Delta notes are formatted as `▲/▼ X% với tháng trước` or `▲/▼ X.X% với tháng trước` (no space after arrow for integers, e.g. `▲40%`).
* Mapped category sparkline trends to historical quantities in tons (`primaryQty`, `secondaryQty`, `consumableQty`) for visual consistency with the delta note direction.

Verification:

* Verified the frontend application compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-25 Sprint 20I.3F Inventory Overview Snapshots Numeric Verification

Completed:

* Conducted a detailed database-level numeric verification of monthly stock snapshots for `VT-NEW-00001` (Thép hình 10mm).
* Created the verification report [inventory_snapshots_numeric_verification.md](file:///root/.gemini/antigravity-cli/brain/50ac5739-b85e-404c-b2bd-897dca8ea7c0/inventory_snapshots_numeric_verification.md).
* Verified exact calculations for current stock, and snapshot stocks at previous month, 6 months ago, and 12 months ago with 0 variance.
* Audited transaction types: `IMPORT` (inbound), `EXPORT` (outbound), `TRANSFER`, and `ADJUSTMENT`.
* Audited value trend accuracy and confirmed that `historicalValue = historicalQty * currentAverageCost` is an **approximate** calculation.

## 2026-06-25 Sprint 20I.3E Inventory Overview KPI Audit

Completed:

* Audited the yearly KPI trend implementation and sparkline data logic for the Inventory Overview page.
* Created the audit report [inventory_overview_audit.md](file:///root/.gemini/antigravity-cli/brain/50ac5739-b85e-404c-b2bd-897dca8ea7c0/inventory_overview_audit.md).
* Verified data age calculations, snapshot date generation, material creation filters, and stock quantity rollbacks.

## 2026-06-25 Sprint 20I.3D Inventory Overview KPI Monthly Sparklines

Completed:

* Implemented 12-point monthly end-of-month snapshots using real transaction ledger data rollbacks and material creation dates.
* Configured the sparkline trend vectors to render only when >= 12 months history exists (otherwise showing a flat line placeholder at the current metric level with no data fabrication).
* Refactored KPI delta notes comparing current month vs previous month, in the exact format:
  * Value & Quantity: `▲/▼ X.X% so với Tháng 5/2026`
  * Unique Item Count, Primary, Secondary, Consumable: `▲/▼ X mã vật tư so với Tháng 5/2026`
  * Low Stock: `▲/▼ X mã sắp hết so với Tháng 5/2026`
  * Out of Stock: `▲/▼ X mã hết hàng so với Tháng 5/2026`
* Added dynamic semantic coloring to note containers:
  * Positive inventory metrics (value, quantity, counts) increases -> emerald, decreases -> red.
  * Low stock / out of stock increases -> red, reductions -> emerald.
  * No change -> slate-400 (neutral).
* Modified `OverviewMetricCard` component to accept a `noteClassName?: string` parameter to dynamically style the text color of the notes.

## 2026-06-25 Sprint 20I.3C Restore KPI Sparklines

Completed:

* Restored all 8 KPI sparkline trends and delta percentage logic in `InventoryOverviewPage` based on real historical data age and stock rollbacks without data fabrication.
* Added data age detection: scans oldest dates from both transaction ledger and material creation to compute age in days relative to `new Date()`.
* Implemented automatic scale switching:
  * `<30 days`: Displays flat placeholder sparklines (all points set to current value) and sets delta text to `"Chưa có dữ liệu lịch sử"`.
  * `>=30 days`: Shows real historical trends with 5-day intervals, calculating percentage delta compared to the previous period.
  * `>=365 days`: Shows real yearly line trends with 60-day intervals, calculating percentage delta compared to the previous period.
* Reconstructed historical inventory snapshots: rolls back material stocks to each snapshot date by subtracting later transaction item quantities (properly filtering for warehouse classification on low/out stock checks), computing exact metrics for total value, quantity, unique item code count, low stock, out of stock, primary, secondary, and consumable counts.

## 2026-06-25 Sprint 20I.3B Inventory KPI Semantics Fix

Completed:

* Fixed semantic value mappings in the Inventory Overview KPI strip:
  * Changed value displays for `Vật tư chính`, `Vật tư phụ`, and `Vật tư tiêu hao` from total VND value to unique material counts.
  * Replaced `primaryValue`, `secondaryValue`, and `consumableValue` with `primaryCount`, `secondaryCount`, and `consumableCount` inside `summary` calculations.
* Fixed KPI trend sparkline logic:
  * Disabled sparkline rendering (returning `undefined` trend arrays) for count-based metrics (`Mã vật tư`, `Sắp hết hàng`, `Hết hàng`, `Vật tư chính`, `Vật tư phụ`, `Vật tư tiêu hao`) since historical database records for counts are unavailable.
  * Preserved real historical line trends for `Tổng giá trị tồn kho` and `Tổng khối lượng` computed from actual transaction movements.
  * Modified `OverviewMetricCard` to make `trend` optional and conditionally render the `KpiSparkline` component only when trend data is present.
* Fixed KPI delta label logic:
  * Removed fake linear progress percentages derived from current count datasets.
  * Made deltas show `"Chưa có dữ liệu lịch sử"` for all count metrics and when transaction history does not exist.

Verification:

* Verified the frontend application compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-25 Sprint 20I.3 Inventory Overview KPI Redesign

Completed:

* Redesigned the Inventory Overview KPI strip to replace the old 8 metrics (including main/production warehouse split) with the requested 8 cards:
  1. **Tổng giá trị tồn kho** (total value, tone: `emerald`, icon: `CircleDollarSign`)
  2. **Tổng khối lượng** (total weight/quantity, tone: `cyan`, icon: `RefreshCw`)
  3. **Mã vật tư** (unique material code count, tone: `indigo`, icon: `PackageCheck`)
  4. **Sắp hết hàng** (low stock count, tone: `amber`, icon: `TriangleAlert`)
  5. **Vật tư chính** (value of primary usage materials, tone: `blue`, icon: `PackageCheck`)
  6. **Vật tư phụ** (value of secondary usage materials, tone: `violet`, icon: `Package`)
  7. **Vật tư tiêu hao** (value of consumable usage materials, tone: `orange`, icon: `Package`)
  8. **Hết hàng** (out of stock count, tone: `red`, icon: `ShieldX`)
* Added support for `indigo`, `violet`, and `orange` tones inside the `OverviewMetricCard` color dictionary.
* Implemented clean pulsing skeleton loading states when data queries are pending.
* Extended the `summary` metadata calculations to compute `primaryValue` and `secondaryValue` dynamically (using `'PRIMARY'` default usage type fallback).
* Adjusted sparkline trend and delta percentage calculations for all new KPI fields.

Verification:

* Verified the frontend application compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-25 Sprint 20B.1 Component UI Audit

Completed:

* Conducted a thorough audit of the Component module UI patterns, page hierarchy, and styles to ensure compliance with SteelTrack UI standards (dark cockpit theme, no white surfaces).
* Created a comprehensive audit report artifact [component_ui_audit.md](file:///root/.gemini/antigravity-cli/brain/50ac5739-b85e-404c-b2bd-897dca8ea7c0/component_ui_audit.md).
* Documented usage of `EnterpriseModulePage`, `RuntimePanel`, KPI card wrappers, detail drawers, and CSS conic/SVG chart primitives.
* Identified technical debt / template stubs in `src/modules/components/components/` and `charts/` subfolders.

Verification:

* Verified the frontend application compiles and builds successfully using `pnpm -C apps/frontend build`.

## 2026-06-25 Transaction Date-Time Refresh

Fixed:

* Added shared `formatLocalDateTimeInput()` helper for `datetime-local` fields so forms use local date/time instead of UTC-derived `toISOString().slice(0, 16)`.
* Inventory transaction modals now refresh `transactionDate` to the current local date/time when opened and again when the date-time input receives focus:
  * Nhập kho;
  * Xuất kho;
  * Điều chuyển;
  * Điều chỉnh tồn kho.
* Component Production Material Stock return modal refreshes return date/time when a return drawer opens and when the date-time input receives focus.
* Production Manufacturing Order modal initializes planned start with current local date/time and refreshes start/due date-time fields on focus.
* Fixed a pre-existing Material Detail build error by allowing `MetricLine` to accept an optional icon prop.

Verification:

* Frontend build passed with the existing Vite `NODE_ENV` and large chunk warnings.

## 2026-06-24 Business Data Cleanup

Executed:

* Backed up the database before cleanup:
  * `backups/steeltrack_before_business_data_cleanup_20260624_092729.dump`
* Added and executed cleanup SQL:
  * `scripts/sql/business-data-cleanup-20260624.sql`
* Added cleanup audit:
  * `docs/ai-state/audits/business-data-cleanup-20260624.md`
* Cleared business/runtime data for materials, components, projects, suppliers, vehicles, Inventory transactions/balances, Production BOM/MO/material activity, QC runtime records, Yard placements/movements/snapshots, attachments metadata, notifications, analytics/runtime logs, and workflow instances/actions.
* Preserved configuration/reference foundations: users, roles, permissions, categories, material types, units, warehouses, warehouse zones, yard layout, QC checklist templates, workflow definitions/steps, work centers, and machines.

Verification:

* Confirmed zero rows in `inventory_items`, `components`, `projects`, `Supplier`, `vehicles`, `inventory_transactions`, `inventory_location_stocks`, `BOM`, `production_orders`, `ProductionMaterialIssue`, `qc_inspections`, `yard_item_placements`, `yard_movements`, `attachments`, and `notifications`.
* Confirmed preserved rows remain in `inventory_categories`, `material_types`, `master_units`, `master_warehouses`, `warehouse_zones`, `yard_slots`, `qc_checklists`, `users`, and `roles`.
* Confirmed all 93 Yard slots are `AVAILABLE` with `currentStackLevel = 0`.

Scope:

* No Prisma schema change.
* No API change.
* No application code change.

## 2026-06-23 Sprint 20A.5 Demo Dataset Seeder

Implemented:

* Backed up the current database before seeding:
  * `backups/steeltrack_before_sprint20a5_20260623_082210.dump`
* Added transactional purge SQL:
  * `scripts/sql/sprint20a5-purge-transactional-data.sql`
* Added runnable Prisma demo seeder:
  * `apps/backend-api/prisma/seeds/sprint20a5-demo.seed.ts`
* Seeder purges transactional/operational data, resets `inventory_items.quantity` snapshot to 0, then creates a reusable `DEMO20A5-*` dataset.
* Demo dataset creates:
  * 20 suppliers;
  * 20 projects;
  * 20 inventory items;
  * 20 components;
  * 20 BOMs;
  * 20 production work orders;
  * Inventory import/transfer/production issue transactions;
  * Main and Production warehouse location stocks;
  * Production reservations, reservation lines, material issues, consumptions, and ledger rows;
  * Component costing for every seeded component.

Verification:

* Seeder verification passed:
  * suppliers: 20;
  * projects: 20;
  * inventory items: 20;
  * components: 20;
  * BOMs: 20;
  * production orders: 20;
  * component costing rows: 20;
  * work orders with full readiness: 20;
  * inventory location stock buckets: 40.
* SQL verification confirmed 20/20 work orders meet readiness from BOM required quantity versus issued quantity.
* Backend build passed.
* Frontend build passed.

Scope:

* No Prisma schema change.
* No API change.
* No migration.

## 2026-06-22 Sprint 19E Inventory Adjustment Workflow Unification

Implemented:

* Added `Điều chỉnh tồn kho` to the Inventory navigation directly below `Kiểm kê`.
* Updated Inventory Global Actions so `Khác -> Điều chỉnh tồn kho` opens the adjustment modal directly instead of routing to the page first.
* Added shared `AdjustmentTransactionModal` in `InventoryTransactionModals.tsx` alongside Inbound, Outbound, Transfer, and Stock Take modals.
* Adjustment creation now loads Material Detail `locationBalances`, shows a location-balance table, and calculates System Qty from the selected `warehouse/zone/slot/level` bucket only.
* Integrated `WarehouseMiniMap` into the adjustment modal for 2D slot/level selection synchronized with the selected bucket.
* Added reason dropdown presets and custom reason handling.
* Added realtime Difference and Variance Value display using the material average/unit cost available to the frontend.
* Adjustment detail drawer now reads new adjustment audit metadata from the existing `note` field when available, while legacy rows remain variance-only.

Scope:

* Frontend UI/UX only.
* No backend change.
* No API contract change.
* No Prisma schema change.
* No migration.

Verification:

* Frontend build passed.

## 2026-06-22 Sprint 19D Inventory Adjustment Center Refactor

Implemented:

* Refactored `InventoryAdjustmentsPage.tsx` to match the Inventory Inbound, Outbound, and Transfer UX pattern.
* Removed the inline Quick Adjustment Wizard from the page body.
* Added toolbar action `+ Điều chỉnh tồn kho` that opens an adjustment modal.
* Adjustment form now captures Material, Zone, Slot, Level, readonly System Qty, Actual Qty, auto-calculated Difference, Reason, and Attachment.
* Delta quantity is no longer directly editable in the UI.
* Adjustment numbers now use `KK` prefix in the frontend request instead of `DC`.
* Main adjustment table now sits in the primary page flow with Inventory table tokens and row-click detail drawer.
* Added adjustment detail drawer with Adjustment No, Material, Location, Difference, Variance Value, Reason, material lines, and attachment list.
* Added KPI strip for Adjustment Today, Adjustment Month, Increase Qty, Decrease Qty, Net Adjustment, and Abnormal Adjustments.
* Added analytics panels for Adjustment Trend, Top Variance Materials, Top Variance Locations, and Financial Impact.

Scope:

* Frontend UI/UX only.
* No backend change.
* No API contract change.
* No Prisma schema change.
* No migration.

Verification:

* Frontend build passed.

## 2026-06-22 Sprint 20A Costing Engine

Implemented:

* Added a read-only backend Costing Engine module at `apps/backend-api/src/modules/costing`.
* Added `CostingEngineService` for Production Order, Component, and Project cost aggregation.
* Added read-only API endpoints:
  * `GET /production/orders/:id/cost`
  * `GET /components/:id/cost`
  * `GET /projects/:id/cost`
* Production Order cost summary now returns Required Qty, Issued Qty, Returned Qty, Net Issued Qty, Consumed Qty, Scrap Qty, Material Cost, Cost Per Unit, and material-level cost rows.
* Component cost summary aggregates linked Production Orders and returns Material Cost and Cost Per Unit.
* Project cost summary aggregates project-linked Components and direct project Production Orders.

Costing rules:

* Material Cost uses actual Production Material Issue inventory transaction valuation when available.
* Fallback cost uses weighted average Inventory cost from `inventory_transaction_items.unitPrice` / `totalAmount`.
* No existing `ComponentCosting` rows are overwritten by these read models.

Verification:

* Verified 3 real Work Orders against SQL issue transaction valuation:
  * `MO-20260613-49982`: engine `85,585,910.28811619`, SQL `85,585,910.28811619`.
  * `MO-20260612-21547`: engine `16,906,102.615384612`, SQL `16,906,102.615384612`.
  * `MO-S3-1781194119`: engine `155,006.24301933107`, SQL `155,006.24301933107`.
* Error variance: 0% for the sampled Work Orders.

Scope:

* Backend read model/API only.
* No frontend UI change.
* No Prisma schema change.
* No migration.
* No workflow mutation.

## 2026-06-22 Sprint 19C MES Data Audit

Created:

* Added `docs/ai-state/audits/mes-data-audit.md`.

Findings:

* Shopfloor data foundation exists through `ProductionOrder`, `ProductionStage`, `ProductionTask`, `ProductionLog`, `WorkCenter`, and `Machine`.
* Shopfloor is not yet full MES-ready because immutable stage transition history, actual runtime/downtime, production line queues, operator rate data, and work-center costing are incomplete.
* Costing data is stronger: BOM planned material, Production Material Consumption, Inventory Transaction Item `unitPrice` / `totalAmount`, and ComponentCosting already form a usable material-costing path.
* Project cost is partially derivable from shipped/installed Components, ComponentCosting, and Inventory project transactions, but still needs a formal project cost ledger/control layer.

Decision:

* Prioritize Costing path first:
  * 20A Costing Engine
  * 20B Component Cost Analysis
  * 20C Project Cost Control
* Defer deeper Shopfloor dashboards until stage transition history and runtime/operator/machine data are canonical.

Scope:

* Documentation audit only.
* No frontend code change.
* No backend code change.
* No API, Prisma schema, migration, or workflow change.

## 2026-06-22 Sprint 19B Production Execution Board

Implemented:

* Added `/production/execution` as a new Production Execution Board tab.
* Created a separated `ProductionExecutionBoard` component for Kanban/shopfloor-style tracking.
* Added Kanban columns: Planning, Ready Material, Cutting, Assembly, Welding, Painting, and Completed.
* Work Order cards show WO No, Component, Project, Qty, Material Ready %, Progress %, Due Date, and delay badge.
* Stage mapping prefers existing active stage data and falls back to status/readiness mapping when backend stage is not canonical.
* Reused Sprint 18C material readiness logic to show `Waiting Material` versus `Ready To Release`.
* Added bottleneck analytics with per-stage counts, current bottleneck, waiting-material count, delayed count, and stage distribution donut.
* Added Work Order drawer sections for Work Order info, material status, production progress, material issue history, and reservations.

Scope:

* Frontend UI/data composition only.
* No backend API change.
* No Prisma schema change.
* No migration.
* No business workflow change.

Verification:

* Frontend build passed.

## 2026-06-22 Sprint 19A Production Warehouse

Implemented:

* Added a new `/production/warehouse` Production Warehouse Cockpit route and Production tab.
* Built a frontend-only `PRODUCTION` warehouse view from existing Inventory item `locationBalances`, Inventory audit cost, Production Orders, Reservations, and Consumption data.
* Added KPI strip for Production Stock, Materials in Production, Reserved for WO, Available for WO, Shortage Risk, and Inventory Value.
* Added material grid columns: Material, Main Stock, Production Stock, Reserved, Available, Required, Shortage, and Status.
* Status now uses Production `Available = Production Stock - Reserved`, not total stock.
* Required demand is derived from open Production Order BOM quantities with waste and MO quantity.
* Reserved quantity is derived from active reservation lines as `reservedQty - issuedQty`.
* Added analytics panels for top WO material consumption, material readiness, production locations, and shortage board.
* Added Production Zone / Slot / Level detail table and row drawer for material-level production warehouse locations.

Scope:

* Frontend UI/data composition only.
* No backend API change.
* No Prisma schema change.
* No migration.
* No business workflow change.

Verification:

* Frontend build passed.

## 2026-06-20 Sprint 18E Material Issue Dashboard

Implemented:

* Refactored `/production/material-issues` from a transaction list into a Production Material Control Center using the Inventory visual foundation.
* Added Material Issue KPI strip for issue count, issue value placeholder, issued material quantity, returned material quantity, issued Work Orders, and completion readiness rate.
* Material Issue grid now shows Issue No, Date, Work Order, Component, Required, Issued, Returned, Remaining, Readiness, Status, and Return action.
* Required/Remaining/Readiness are computed from existing Production Order BOM quantities and Production Material Issue net issued quantities.
* Material Issue drawer now has sections for issue information, material lines, warehouse source, and issue timeline.
* Added analytics panels for top issued materials, top returned materials, Work Orders missing material, readiness by Work Order, production warehouse source locations, readiness distribution, and business indicators.
* Preserved the existing material return action and validation behavior.

Notes:

* Current Material Issue API responses do not expose unit material cost or line total, so the issue value KPI is shown as unavailable instead of deriving a misleading value.

Scope:

* Frontend UI/UX only.
* No backend API change.
* No Prisma schema change.
* No migration.
* No business workflow change.

Verification:

* Frontend build passed.

## 2026-06-20 Sprint 18D Work Order Cockpit

Implemented:

* Refactored `/production/orders` from a Manufacturing Order list into a Work Order Cockpit using the Inventory visual foundation.
* Added Work Order KPI strip for Total Work Orders, Planned, Released, In Progress, Completed, and Delayed.
* Integrated Sprint 18C BOM Intelligence readiness into Work Orders, using BOM required quantity versus Production Material Issue net issued quantity.
* Work Order grid now shows WO No, Component, Project, Qty, Material Ready, Progress, Due Date, and Status.
* Material Ready uses percentage bands: 0-49 red, 50-79 amber, 80-99 cyan, and 100 emerald.
* Work Order drawer now has sections for WO information, material status, production progress, material issues, and reservations.
* Added Work Order analytics panels for material-value proxy, material shortages, upcoming due dates, production progress, and material readiness distribution.
* Added UI-only `READY TO RELEASE` warning when Material Readiness is at least 100%; no workflow lock was introduced.

Notes:

* Current Production Order / Material Issue responses do not expose unit material cost, so the "Top WO theo giá trị vật tư" panel uses required material quantity as a visible proxy and labels this limitation in the UI.

Scope:

* Frontend UI/UX only.
* No backend API change.
* No Prisma schema change.
* No migration.
* No business workflow change.

Verification:

* Frontend build passed.

## 2026-06-20 Sprint 18C BOM Intelligence

Implemented:

* Audited the real Component -> Production Order -> BOM -> BOM Item -> Production Material Issue data path.
* Added `docs/ai-state/audits/bom-intelligence-audit.md` documenting actual models, relationships, missing frontend type fields, and optional future API shape.
* Added frontend helper `calculateComponentMaterialReadiness()` to compute required, issued, remaining, and readiness percent from existing data.
* Removed the Sprint 18B `Material Ready = 100%` fallback from the Component Management Cockpit.
* Component material readiness now uses BOM required quantities and net Production Material Issue quantities (`issuedQty - returnedQty`).
* Component detail drawer material metrics now show real Required, Issued, and Remaining quantities from the same helper.
* Updated frontend production/component type definitions to include existing response fields required for readiness: `bomId`, embedded `bom`, embedded `materialIssues`, and `BOMItem.materialId`.

Scope:

* Frontend helper and type alignment only.
* No backend API change.
* No Prisma schema change.
* No migration.
* No business workflow change.

Verification:

* Frontend build passed.

## 2026-06-20 Sprint 18B Component Management Cockpit

Implemented:

* Components List is now positioned as `Trung tâm điều hành cấu kiện` instead of a plain CRUD list.
* Added Inventory-style KPI strip for total components, running components, completed components, waiting-material components, delayed components, and total component weight.
* Component table now uses the Inventory grid/table visual foundation and adds Project, Work Order, Progress, Material Ready, and Weight columns.
* Component rows open the shared `ModuleDetailDrawer` with operational sections for component information, BOM, material required/issued/remaining, related Work Orders, and production progress.
* Added Inventory-style analytics panels for top component weight, delayed components, material-shortage components, component structure mix, and creation rhythm.
* Initial Material Readiness used a safe frontend fallback; Sprint 18C superseded this with real BOM/Issue aggregation.

Scope:

* Frontend UI/UX only.
* No backend API change.
* No Prisma schema change.
* No migration.
* No business workflow change.

Verification:

* Frontend build passed.

## 2026-06-20 Sprint 18A Production UI Refactor

Implemented:

* Production Cockpit now uses the Inventory visual foundation for KPI cards, filter bar controls, analytics panels, spacing, and primary data-grid styling.
* Reworked the Production overview into an operational cockpit layout: KPI strip, Production Orders grid, and analytics panels.
* Added Production KPI cards for running orders, completed today, waiting material, delayed orders, running components, and estimated production weight.
* Production Orders grid now shows progress, status badge, material readiness, and delay warning.
* Added overview analytics panels for production progress, production stages, material issue readiness, and top running components using existing frontend data only.
* Production Order detail now opens in the shared `ModuleDetailDrawer` instead of the previous full-screen modal shell.
* Material Issue rows now open a detail drawer while preserving the existing return action behavior.
* Extended the Inventory-style treatment to Production BOM, Reservations, Material Ledger, Material Issues, Consumptions, and Logs tabs.
* BOM registry now has KPI cards and uses the shared data-grid/table shell; BOM detail now opens in a shared drawer.
* Reservation, Ledger, Issue, Consumption, and Log tables now use Inventory table tokens and shared module panels instead of local CRUD-style table shells.

Scope:

* Frontend UI/UX only.
* No backend API change.
* No Prisma schema change.
* No migration.
* No business workflow change.

Verification:

* Frontend build passed.
* Frontend build passed again after the extended tab rollout.

## 2026-06-20 Sprint 17F Main Warehouse Stock Status

Implemented:

* Inventory Overview stock status now uses `Kho chính` / `MAIN` stock from `locationBalances`, not total stock across all warehouses.
* Overview KPIs for low-stock and out-of-stock materials now derive from the `MAIN` warehouse status rule.
* Inventory Overview stock tables now show `Kho chính`, `Kho SX`, and `Tổng tồn` as separate columns.
* Inventory Materials list now uses the same `MAIN`-based status rule and shows separate main/production/total stock columns.
* Material Detail `Vị trí` tab now groups location balances into `Kho chính`, `Kho sản xuất`, and optional `Kho khác`.
* Quantity display in Inventory stock tables uses the shared locale parser/formatter and tabular numeric styling so values such as `700` are not visually truncated or rounded away.

Scope:

* Frontend only.
* No backend API change.
* No Prisma schema change.
* No migration.

Verification:

* Frontend build passed.

## 2026-06-20 Sprint 17E Inventory Document Numbering Hardening

Implemented:

* Operational code formatting now uses five-digit date-scoped sequences, for example `NK-260620-00001`.
* `nextOperationalCode` no longer uses `count() + 1`; it scans current-day prefix rows, extracts numeric suffixes, and generates `max(sequence) + 1`.
* Inventory transaction creation now ignores frontend-supplied `code` and `transactionNo`.
* Inventory transaction creation writes `code = transactionNo = generatedNo`.
* Inventory transaction creation retries up to three times on Prisma `P2002` duplicate collisions for `code` / `transactionNo`.
* Material Movement direct Inventory transaction writer now uses the same Inventory numbering prefixes.
* Production Material Issue direct Inventory transaction writers now use the same Inventory numbering prefixes.
* Added diagnostic SQL report `scripts/sql/validate-inventory-transaction-numbering.sql` for historical `code <> transactionNo` rows.

Scope:

* Backend numbering logic only.
* No Prisma schema change.
* No migration.
* Historical mismatched records are reported, not overwritten.

Verification:

* Backend build passed.

## 2026-06-20 Sprint 17B Inventory Locations & Material Movement Visualization

Implemented:

* Inventory Locations now shows occupancy percentage, free slots, occupied slots, and inventory value by location.
* Location list now includes occupancy and value columns.
* Added value-by-location analytics using existing material cost/audit data when available.
* Added Top Occupied Slots with quantity and value.
* Clicking a top occupied slot opens a material list drawer for that slot.
* Added movement route analytics for transfer transactions with source slot, destination slot, movement count, quantity, and value.

Scope:

* Frontend only.
* Reused existing Inventory zones, audit, and transaction APIs.
* No schema, migration, backend API, or workflow changes.
* Inventory value is only as complete as the available material average/unit cost data in current frontend sources.

Verification:

* Frontend build passed.

## 2026-06-20 Sprint 17A Inventory Stocktake Enhancement

Implemented:

* Inventory Stock Take rows now open a session detail drawer.
* Session detail shows stocktake header information and all material variance lines.
* Added stocktake KPIs for total sessions, pending approval, variance materials, accuracy, and variance value.
* Stocktake analytics now includes top variance materials, top variance locations, and adjustment preview.
* Detail line columns include Material, SystemQty, ActualQty, VarianceQty, UnitPrice, and VarianceValue.
* Existing adjustment transaction fields are used when available; when `SystemQty` / `ActualQty` are absent, the UI falls back to variance-only display.

Scope:

* Frontend only.
* Reused existing Inventory adjustment transaction API.
* No schema, migration, backend API, or workflow changes.

Verification:

* Frontend build passed.

## 2026-06-20 Sprint 16D Inventory Outbound Analytics Enhancement

Implemented:

* Inventory Outbound now includes project consumption analytics with document count, quantity, value, and value percentage.
* Added daily and monthly outbound trend charts.
* Added material consumption analytics with quantity, value, and issue count.
* Added outbound-purpose distribution for project, production, customer, and other.
* Added financial KPI panel for today, week, month, and year.
* Added abnormal consumption alerts based on material-level quantity/value outliers in the current filtered dataset.

Scope:

* Frontend only.
* Reused existing Inventory transaction API.
* No schema, migration, backend API, or workflow changes.

Verification:

* Frontend build passed.

## 2026-06-20 Sprint 16C Inventory Inbound Enhancement

Implemented:

* Inventory Inbound rows now open a detail drawer with inbound header info and all material lines.
* Inbound detail shows material code, material name, quantity, unit, unit price, line amount, warehouse, zone, slot, and level.
* Inbound KPI strip now includes today's inbound value, monthly inbound value, monthly inbound document count, and monthly active supplier count.
* Inbound analytics now includes top suppliers by inbound value, top suppliers by inbound quantity, value-ranked top materials, and price monitoring panels for top increases/decreases.
* Inbound calculations now aggregate all transaction item lines instead of using only `items[0]`.
* Attachment button clicks on Inbound rows now open only the attachment drawer and no longer trigger row detail.
* Inventory Inbound, Outbound, and Transfer filter bars now use the same larger spacing rhythm (`p-3`, `gap-3`) for search/dropdown controls.

Scope:

* Frontend only.
* Reused existing Inventory transaction API.
* No schema, migration, backend API, or workflow changes.

Verification:

* Frontend build passed.
* Build output includes Inventory Outbound, Inbound, and Transfer route chunks, so the reported Outbound page issue is not caused by a frontend build/lazy-route failure.

## 2026-06-19 Sprint 16B Inventory Transfer Enhancement

Implemented:

* Inventory Transfer rows now open a detail drawer with transaction info, source/destination locations, and material lines.
* Transfer detail shows warehouse, zone, slot, and level for source and destination lines.
* Added transfer KPIs for monthly transfer value, today's transfer value, and monthly transfer document count.
* Changed Top Materials ranking to sort by transfer value instead of quantity.
* Added top transfer routes with route count, quantity, and value.
* Added top source locations and top destination locations by transfer value.

Scope:

* Frontend only.
* Reused existing Inventory transaction API.
* No schema, migration, backend API, or workflow changes.

Verification:

* Frontend build passed.

## 2026-06-19 Sprint 16A Inventory Outbound Enhancement

Implemented:

* Inventory Outbound rows now open a detail drawer showing document header fields, project/receiver, actor, remarks, and item lines.
* Outbound detail item table shows material code, material name, quantity, unit, unit price, and total amount using existing Inventory transaction API data.
* Added `Giá trị xuất hôm nay` KPI to the Outbound KPI strip.
* Changed Top Materials ranking to sort by total outbound value instead of outbound quantity.
* Added Top Projects ranking aggregated by outbound value.

Scope:

* Frontend only.
* Reused existing Inventory transaction API.
* No schema, migration, backend API, or workflow changes.

Verification:

* Frontend build passed.

## 2026-06-19 Sprint 15B Inventory Cost Integrity

Fixed:

* Inventory transaction item creation now persists `unitPrice` and `totalAmount` for new IMPORT, EXPORT, TRANSFER, RETURN, and ADJUSTMENT rows.
* `InventoryService.createTransaction()` now applies material valuation before writing transaction items, using provided line values first and weighted average material cost as fallback.
* Production material issue/return direct Inventory transaction writers now persist valuation fields.
* Material Movement direct transaction writer now persists valuation fields.
* Created and executed one-time repair script `scripts/sql/backfill-inventory-transaction-item-costs.sql` to populate missing historical `unitPrice` / `totalAmount`.

Root cause:

* Transaction item normalization left valuation fields null when the client did not submit price data, especially for EXPORT rows and direct production/material movement writers.
* Sprint 15A fixed read-time display but did not repair source rows.

Verification:

* Backfill updated 67 historical rows.
* Verification SQL now reports `rows_with_amount = total_rows` and `rows_with_unit_price = total_rows` for IMPORT, EXPORT, TRANSFER, and RETURN.
* Backend build passed.

## 2026-06-19 Sprint 15A Fix Outbound Inventory Value

Fixed:

* Fixed Inventory Outbound value display so `Giá trị xuất trong tháng` and row-level `Giá trị` no longer depend on `items[0].totalAmount`.
* Inventory Outbound now sums all transaction item quantities and values for each outbound document.
* `/inventory/transactions` and `/inventory/transactions/:id` now enrich transaction item `unitPrice` / `totalAmount` from material average inbound cost when stored outbound transaction rows have missing amount fields.
* Search/filter logic on Inventory Outbound now considers all item lines in a transaction instead of only the first line.

Evidence:

* PostgreSQL local validation showed `EXPORT` transaction item rows had `unitPrice` and `totalAmount` null, while `IMPORT` rows contained priced data.
* After the service fix, `GET /inventory/transactions?type=OUTBOUND` returns computed `items.unitPrice` and `items.totalAmount`; sample `XK-260619-001` returned `totalAmount=3524043.9704058017`.

Verification:

* Backend build passed.
* Frontend build passed.

## 2026-06-19 Inventory Transactions UX 2.0

Implemented:

* Added shared Inventory transaction attachment controls for transaction-specific pages.
* `Nhập kho`, `Xuất kho`, `Điều chuyển`, and `Kiểm kê` lists now include a `Hồ sơ` column with a `📎 count` action.
* Clicking the `Hồ sơ` action opens a standard attachment drawer with header `📎 <count> tài liệu`.
* Drawer lists the transaction files using the existing `InventoryAttachmentList`, including original filename, category, size, upload date, download action, and image preview.
* Attachment matching reuses `module=inventory`, `entityType=transaction`, `entityId`, and transaction metadata such as `transactionNo`.

Scope:

* Frontend UX only.
* No backend, API, Prisma, database, storage, or workflow changes.

Verification:

* Frontend build passed.

## 2026-06-19 Sprint 14B.5 Attachment UX Refinement

Fixed:

* Removed image/document attachment badges from Inventory Materials list and expanded material list to reduce visual noise in the stock cockpit.
* Kept attachment context inside Material Detail, where users already inspect a specific material.
* Material Detail Overview now shows a subtle `Hồ sơ vật tư` summary card with `Ảnh vật tư` and `Tài liệu` counts.
* Material Detail `Nhập / Xuất` tab now includes a `Tài liệu` column for related Inventory transaction attachments.
* Material Detail `Công trình` tab now includes `Hồ sơ liên quan` based on outbound transaction attachments where available.
* Material Detail `Nhà cung cấp` tab now includes `Chứng từ` based on inbound transaction attachments where available.
* Material Detail `Tài liệu vật tư` tab now classifies documents by source, including `Master Material`, `Inbound Transaction <no>`, and `Outbound Transaction <no>`.
* Attachment chips now use subtle Module UI Foundation styling with `FileText` icon instead of emoji-heavy badges.
* Clicking a contextual attachment chip opens a standard `ModuleDetailDrawer` with the file list and download/preview actions.

Scope:

* Frontend UX only.
* No backend, API, Prisma, database, storage, or workflow changes.

Verification:

* Frontend build passed.

## 2026-06-18 Sprint 14B.4 Inventory Attachment UX Audit

Fixed:

* Improved attachment discoverability without changing backend, storage, API contracts, or upload workflow.
* Inventory Transactions list now shows an attachment badge column (`📎 count`) so users can see files before opening the detail drawer.
* Inventory transaction detail drawer now shows attachment count in the header subtitle and a quick attachment panel in the Overview tab, while keeping the dedicated `Tài liệu đính kèm` tab.
* Inventory Materials list now shows material attachment badges (`📷 photo count`, `📄 document count`) for each material row and in the expanded list.
* Material Detail drawer now shows photo/document counts in the header and an Overview attachment summary with direct shortcuts to `Hình ảnh vật tư` and `Tài liệu vật tư`.

Audit finding:

* Runtime attachment data was already persisted and served correctly, but users could not discover it easily because the transaction list had no attachment signal and transaction files were only visible inside a secondary tab.

Verification:

* Frontend build passed.
* Backend was not changed.

## 2026-06-18 Sprint 14B.3 Attachment UI Data Binding Fix

Fixed:

* Hardened Material Detail attachment binding so image URLs resolve from `currentVersion.publicUrl`, `versions[0].publicUrl`, direct `publicUrl` / `url`, `currentVersion` / `latestVersion`, or `storagePath`.
* Hardened Transaction Attachment binding with the same URL fallback.
* Material attachment query now resolves material id from `id`, `materialId`, or `inventoryItemId`, preventing empty queries while detail data is still loading.
* Added development-only console diagnostics for Material and Transaction attachment query params, API response payload, and mapped UI objects.
* Material document download now uses the same URL resolver as image rendering.

Evidence:

* Material attachment API response contains `versions[0].publicUrl=/uploads/inventory/materials/...jpg`.
* Transaction attachment API response contains `versions[0].publicUrl=/uploads/inventory/transactions/inbound/...pdf`.
* Frontend mapped URLs resolve to `http://172.168.53.116:3000/uploads/...`.
* Static file requests for both mapped URLs return `200 OK`.

Verification:

* Frontend build passed.
* Backend build passed with no backend code changes.

## 2026-06-18 Sprint 14B.1 Attachment Engine Runtime Fix

Fixed:

* Restored runtime RBAC seed data required by guarded attachment endpoints.
* Added migration `20260618094500_restore_rbac_foundation` to recreate the `admin` role, base permissions, role-permission mappings, and admin user-role mapping idempotently without changing passwords or business data.

Root cause:

* `permissions`, `roles`, `role_permissions`, and `user_roles` tables were empty, so `PermissionsGuard` rejected `/attachments` and `/attachments/upload` with 403 before `AttachmentsController` and `AttachmentsService.upload()` could run.

Evidence after fix:

* `permissions=27`, `roles=1`, `role_permissions=27`, `user_roles=1`.
* JWT login payload includes `attachments.read` and `attachments.write`.
* `GET /attachments?module=inventory&entityType=material&entityId=<materialId>` returns 200.
* `POST /attachments/upload` for `VAL-MAT-002` returned 201 and inserted a `PHOTO` attachment.
* `POST /attachments/upload` for an Inventory transaction returned 201 and inserted an `INVOICE` attachment.
* `attachments` table contains uploaded records.
* Files exist under `/data/steeltrack-storage/inventory/materials` and `/data/steeltrack-storage/inventory/transactions/inbound`.

## 2026-06-18 Sprint 14B Inventory Transaction Attachments

Implemented:

* Extended the shared Attachment Engine to Inventory transaction documents without creating a new storage engine.
* Added attachment categories for transaction documents: `INVOICE`, `DELIVERY_NOTE`, `PACKING_LIST`, and `REPORT`.
* Added migration `20260618090000_inventory_transaction_attachment_categories`.
* Inventory transaction attachments use `module=inventory`, `entityType=transaction`, and `entityId=inventoryTransactionId`.
* Backend storage routing now saves transaction files under `/data/steeltrack-storage/inventory/transactions/<type>` for inbound, outbound, transfer, stocktake, return, and adjustment.
* Added shared frontend `InventoryAttachmentPicker` and `InventoryAttachmentList`.
* Inbound, Outbound, Transfer, and Stock Take transaction modals can select attachments while creating the transaction; files upload after the transaction save succeeds.
* Inventory Transactions page now opens a transaction detail drawer by clicking transaction number.
* Transaction detail drawer includes `Tài liệu đính kèm` tab showing original filename, category, upload date, size, download action, and image preview for image files.
* Material image gallery remains filtered by `module=inventory&entityType=material&entityId=<materialId>`.

Verification:

* Prisma generate passed.
* Prisma migration deploy applied Sprint 14B migration.
* Backend build passed.
* Frontend build passed.

## 2026-06-17 Sprint 14A Attachment & Image Foundation

Implemented:

* Extended the existing Attachments foundation into a shared metadata-first attachment system for Inventory, Components, Production, Projects, Suppliers, and Assets.
* Added nullable direct metadata fields on `Attachment`: `module`, `entityType`, `entityId`, `originalName`, `storedName`, `extension`, `checksum`, `storagePath`, and `uploadedBy`.
* Added attachment indexes for module/entity/entity/checksum lookup and migration `20260617140000_attachment_foundation_metadata`.
* Moved filesystem storage out of the source tree. Runtime storage now uses `STORAGE_ROOT` or defaults to `/data/steeltrack-storage`.
* Updated local storage to support deterministic stored names such as `INV_MAT_<entityId>_<date>_<hash>.ext`.
* Added SHA256 checksum dedupe: duplicate uploads reuse the existing stored physical file and create a new metadata reference.
* Added upload validation for configurable max file size and allowed MIME types: `image/*`, PDF, DOCX, and XLSX.
* Disabled OCR preparation in the Sprint 14A upload path because OCR/AI tagging is explicitly out of scope.
* Material Detail `Hình ảnh vật tư` now uploads images through `/attachments/upload`, refreshes the gallery, preserves original filenames, and renders backend-served images.
* Material Detail now includes `Tài liệu vật tư` for non-photo attachments with filename, size, upload date, and download link.

Follow-up fix:

* Fixed Material Detail `Hình ảnh vật tư` tab so its upload button calls the same image upload handler as the Overview gallery.
* Fixed `/attachments` listing to pass `entityType` into repository filters so uploaded material photos are returned for `module=inventory&entityType=material&entityId=<materialId>`.
* Backend storage now initializes the standard `/data/steeltrack-storage` folder tree on service startup when permissions allow.

Storage:

* Files are served from `/uploads/*` backed by `STORAGE_ROOT`, not `apps/frontend/public`, repo `uploads`, or source-code folders.
* Initial folder routing covers inventory/materials, inventory transaction folders, components, production, projects, suppliers, and assets.

Verification:

* Prisma generate passed.
* Prisma migration deploy reported no pending migrations.
* Backend build passed.
* Frontend build passed.

## 2026-06-17 Quantity Input Thousand Separator Bug Fix

Fixed:

* Changed `formatQuantityInput()` to behave as an edit-mode sanitizer instead of inserting thousands separators while typing.
* Quantity inputs now preserve raw editable values while focused, for example `1000`, `10000`, `100000`, `1,5`, and `1000,5`.
* Quantity inputs format with `formatQuantity()` on blur, for example `1000 -> 1.000` and `1000,5 -> 1.000,5`.
* Added focus/blur handling to audited Inventory transaction forms, Inbound/Outbound wizard quantity fields, Material Master minimum stock, warehouse capacity, Inventory adjustment quantity, Production BOM quantity fields, Manufacturing Order quantity, Production yard staging quantity/weight, and Components material return quantity.
* VND currency input formatting remains separate and unchanged.

Verification:

* Helper verification passed for `1000`, `10000`, `100000`, `1,5`, `1000,5`, plus smart paste cases `1,250.5`, `1.250,5`, `1250.5`, and `1250,5`.
* Frontend build passed.

## 2026-06-17 Sprint 11A.2 Numeric Formatting Consolidation + Sprint 13B.3 Material Visual Analytics

Implemented:

* Consolidated frontend quantity/currency/date display away from ad-hoc `toLocaleString('vi-VN')` and `Intl.NumberFormat` usage.
* Updated shared number utilities with smart locale parsing for `1,250.5`, `1.250,5`, `1250.5`, and `1250,5`.
* VND currency display now uses whole dong formatting through `formatCurrencyVnd`, for example `128.571.428 đ`.
* Quantity display/input uses shared `formatQuantity`, `formatQuantityInput`, and `parseLocaleNumber` helpers.
* Replaced scattered numeric formatting in Inventory, Production, Components, Dashboard, Yard, Projects, QC, Suppliers, System, and adjacent frontend pages.
* Added Material Detail image gallery support that reads future `imageUrl`/`photoUrl`/`thumbnailUrl` fields and shows an empty state when no image exists.
* Added Material Master image upload preview UI without changing payload/API/schema.
* Reworked Material Detail Analytics into a Module UI Foundation cockpit with Inbound Trend, Outbound Trend, Inventory Trend, Forecast 7 Days, and Inventory Turnover panels.

Constraints honored:

* No API contract changes.
* No backend changes.
* No Prisma schema changes.
* No database changes.
* No workflow/business logic changes.

Verification:

* `rg "toLocaleString\\('vi-VN'\\)|Intl\\.NumberFormat" apps/frontend/src` returned no results.
* Frontend build passed.

## 2026-06-15 Inventory Numeric Input Formatting Fix

Fixed:

* Split currency input formatting from quantity input formatting.
* Currency fields now accept digits only and format with Vietnamese thousand separators, e.g. `1111 -> 1.111`.
* Quantity fields still support decimal values with comma decimal separator, e.g. `1,5`, `0,125`.
* Updated Inventory inbound unit price inputs to use the currency formatter.
* Updated locale number parsing so `.` is always treated as a thousands separator and `,` is the decimal separator.

Verification:

* Frontend build passed.

## 2026-06-15 Inventory Stock KPI Sparkline Cards

Implemented:

* Updated the five top KPI cards on Inventory Material Stock to use fixed-height compact metric cards.
* Added icon badges and bottom monthly sparkline charts for inventory value, quantity, material codes, low-stock items, and out-of-stock items.
* Kept existing frontend filters and data sources; KPI status cards still filter the current list client-side.
* Exposed `createdAt` and `updatedAt` from `/inventory/audit` so new material code counts are based on real material creation dates.
* Replaced decorative KPI trends with monthly snapshots derived from real Inventory audit rows and transaction item movement history.
* KPI helper text now shows month-over-month deltas for value, quantity, low-stock, and out-of-stock metrics; material code helper text shows real new codes in the current month.

Constraints honored:

* API response was extended with existing material timestamps only.
* No Prisma schema changes.
* No database changes.
* No workflow changes.

Verification:

* Backend build passed.
* Frontend build passed.

## 2026-06-15 Operational Code Numbering Standardization

Implemented:

* Standardized new user-facing operational codes to `PREFIX-YYMMDD-###`.
* Added frontend shared helpers `compactDate`, `nextCodeFromCount`, and `nextLocalCode`.
* Added backend shared helpers `compactCodeDate`, `formatOperationalCode`, and `nextOperationalCode`.
* Updated active frontend generators for:
  Inventory inbound/outbound/transfer/stock take/adjustment, Production BOM, Manufacturing Order, Components, and Projects.
* Updated backend fallback generators for:
  Inventory transactions, Return Requests, Production BOM, Work Orders, Production Reservations, Material Issues, Component creation from Production, QC Inspection, NCR, Material Movements, and Purchase Receiving.
* Documented the decision in `docs/ai-state/decisions/code-numbering-decisions.md`.

Constraints:

* Existing historical records were not rewritten.
* No Prisma schema changes.
* No database migration changes.

Verification:

* Backend build passed.
* Frontend build passed.

## 2026-06-15 Sprint 13B.2 Theme Consistency Audit

Implemented:

* Audited Material Detail Drawer against Dashboard, Inventory Stock, and Production Cockpit theme patterns.
* Added shared `ModuleTabs` to the Module UI Foundation.
* Replaced the Material Detail custom horizontal tab shell with shared `ModuleTabs`.
* Updated Material Detail tables to use shared `moduleTableHead` and `moduleTableRow` tokens.
* Replaced the focused 2D location preview custom modal shell with `ModuleDetailDrawer` and `ModuleAnalyticsPanel`.

Audit findings fixed:

* Tab spacing/color/active state did not match Production Cockpit.
* Table header/row styling was duplicated locally instead of using shared module tokens.
* Focused 2D preview used a custom modal surface instead of the standard drawer surface.

Constraints honored:

* No API changes.
* No backend changes.
* No Prisma schema changes.
* No database changes.
* No workflow or business logic changes.

Verification:

* Frontend build passed.

## 2026-06-15 Sprint 13B.1 Material Detail Redesign

Implemented:

* Redesigned the Inventory Material Detail drawer using the Sprint 12A-12C Module UI Foundation.
* Added a header KPI strip for Current Stock, Average Cost, Inventory Value, and Storage Locations.
* Replaced the left-side detail menu with horizontal tabs.
* Added colored transaction type badges for Inbound, Outbound, Transfer, and Adjustment.
* Reworked the Location tab with a donut distribution and location table.
* Added Analytics tab content for movement trend and a frontend forecast panel.
* Added Project tab usage summary and top project usage table.
* Added Supplier tab purchase summary and top supplier table.

Constraints honored:

* No API changes.
* No backend changes.
* No Prisma schema changes.
* No database changes.
* No workflow changes.

Verification:

* Frontend build passed.

## 2026-06-13 Sprint 13 Dashboard Forecast Enhancement

Implemented:

* Added material replenishment forecasting to the Executive Dashboard.
* Dashboard now estimates projected 7-day material balance from Inventory Audit rows and recent outbound Inventory transactions.
* Dashboard highlights material codes that need urgent purchase or replenishment, including recommended quantity and action label.
* Added 7-day component forecast using current Component lifecycle status and open Production Orders.
* Executive Alerts now include top material purchase/replenishment needs and component delivery/installation backlog signals.

Constraints honored:

* No Prisma schema changes.
* No migration changes.
* No database changes.
* No API contract changes.
* No workflow changes.
* No AI or machine learning was added.

Verification:

* Frontend build passed.

## 2026-06-13 Sprint 13 Executive Dashboard

Implemented:

* Reworked the main Dashboard into an Executive Dashboard focused on:
  Inventory Forecast, Component Pipeline, Yard Occupancy, QC Quality Trend, Production Signal, and Executive Alerts.
* Inventory Forecast uses existing inventory audit rows, inventory transactions, and dashboard movement trend data.
* Component Pipeline uses existing `components` lifecycle statuses and Production Order records.
* Yard Occupancy uses existing Yard runtime metrics and Yard movements.
* QC Quality Trend uses existing QC cockpit aggregate metrics.
* Executive Alerts are rules-based from existing cockpit/operational data; no AI or machine learning was added.
* Dashboard panels show assumptions when detailed historical data is missing.

Constraints honored:

* No Prisma schema changes.
* No migration changes.
* No database changes.
* No API contract changes.
* No workflow changes.

Verification:

* Frontend build passed.

## 2026-06-13 Sprint 12C UI Polish, UX Consistency & Frontend Performance

Implemented:

* Shared module UI foundation now supports sticky `ModuleFilterBar`, clickable/active `ModuleKpiCard`, icon/CTA `ModuleEmptyState`, KPI/table/analytics loading skeleton variants, and `ModuleDetailDrawer`.
* Inventory Stock KPI cards can filter frontend stock status for all/low/out-of-stock rows.
* Components List lifecycle KPI cards filter by raw lifecycle status: `READY`, `SHIPPED`, `DELIVERED`, and `INSTALLED`.
* Components Stock lifecycle KPI cards filter by lifecycle status and use shared empty/loading states.
* Components List and Components Stock detail views now use `ModuleDetailDrawer` for consistent width, header, close action, and scroll behavior.
* Production Cockpit KPI cards filter frontend Manufacturing Orders by status.
* Projects Overview KPI cards filter project status, and Project Components KPI cards filter component lifecycle status.
* Project detail view now uses `ModuleDetailDrawer`.
* App router now uses `React.lazy`/`Suspense` route splitting for active module pages.
* Yard 2D/3D operational maps are lazy-loaded inside Yard workspace.

Bundle audit:

* Main application chunk reduced from approximately `2,040 kB` before route splitting to approximately `380 kB`.
* `YardPage` route chunk reduced to approximately `56 kB`.
* Remaining Vite large chunk warning is isolated to lazy `YardOperationalMap3D` at approximately `969 kB`, loaded only when the 3D yard map is opened.

Constraints honored:

* No Prisma schema changes.
* No migration changes.
* No API contract changes.
* No business workflow changes.

Verification:

* Frontend build passed.

## 2026-06-13 Sprint 12B Production + Projects + Yard UI Rollout

Implemented:

* Production Cockpit now uses shared module UI foundation for page header, KPI strip, filter bar, analytics panels, and the primary Manufacturing Order data grid.
* Projects cockpit now uses shared module UI foundation for page header, filter bar, KPI strip, Project runtime cards, Components runtime cards, table shell, and empty state.
* Yard active cockpit now uses shared module UI foundation for page header, KPI strip, filter bar, occupancy analytics, shipment/operation analytics, and yard trend analytics panels.
* Extended `ModuleKpiCard` with an optional icon prop so modules can keep operational icon cues while using the shared card rhythm.

Constraints honored:

* No Prisma schema changes.
* No migration changes.
* No API contract changes.
* No business workflow changes.

Verification:

* Frontend build passed.

## 2026-06-13 Sprint 12A UI Standardization Foundation

Implemented:

* Added shared module UI primitives under `apps/frontend/src/shared/ui/modules`.
* Created generic presentation components:
  `ModulePageHeader`, `ModuleKpiStrip`, `ModuleKpiCard`, `ModuleFilterBar`, `ModuleAnalyticsPanel`, `ModuleDataGrid`, `ModuleEmptyState`, and `ModuleLoadingState`.
* Inventory visual wrappers now delegate to the shared module UI foundation while preserving existing behavior.
* Inventory Stock compact KPI cards now use the shared module KPI card.
* Components shared cockpit wrappers now delegate to shared module UI constants/components.
* Components List and Components Stock now use Inventory-style page headers and lifecycle KPI strips:
  `Tổng cấu kiện`, `READY`, `SHIPPED`, `DELIVERED`, `INSTALLED`.
* Documented the Inventory UI pattern audit in `docs/ai-state/design/ui-standardization-foundation.md`.

Constraints honored:

* No Prisma schema changes.
* No migration changes.
* No API contract changes.
* No business workflow changes.

Verification:

* Frontend build passed.

## 2026-06-13 Sprint 11A Decimal Quantity & Currency Formatting

Fixed:

* Added shared frontend number helpers for `vi-VN` decimal quantity input and VND currency display.
* Inventory transaction modals now accept and display decimal quantities/unit prices using locale formatting while preserving up to 3 decimal digits.
* Inventory inbound/outbound legacy wizards, stock adjustment, stock-take, Material Master minimum stock, and warehouse location capacity now parse decimal values consistently.
* Production BOM, Manufacturing Order, production return/consume prompts, and Yard staging now support decimal quantities such as `0,001`, `1,5`, and `1.234.567,125`.
* Components production material return uses the same decimal parser and VND currency formatter.
* Backend Inventory and Production DTOs now tolerate locale-formatted numeric strings in quantity-related fields.

Database audit:

* No migration required for the audited operational quantity/cost fields; current Prisma models use `Float` for Inventory, BOM, Production, Yard quantity, and Component costing values.

Verification:

* Frontend build passed.
* Backend build passed.

## 2026-06-13 Sprint 11 Component Costing Breakdown

Implemented:

* Added `GET /components/:id/costing/breakdown`.
* Breakdown response includes component id/code, production order id, estimated material rows, actual material rows, summary material costs, and warnings.
* Estimated material rows use BOM quantities, waste percent, production order quantity, and Inventory average material cost.
* Actual material rows use `ProductionMaterialConsumption.consumedQty + scrapQty` and Inventory average material cost.
* Added warning engine:
  `BOM_MATERIAL_NOT_CONSUMED`;
  `UNPLANNED_MATERIAL`;
  `QUANTITY_VARIANCE`.
* Quantity variance threshold is configurable with `COMPONENT_COSTING_QTY_VARIANCE_THRESHOLD_PERCENT` and defaults to 10%.
* Component Detail UI now has a `Cost Breakdown` tab with KPI cards, Estimated Materials table, Actual Materials table, and Warnings section.

Root cause:

* `ComponentCosting` stored summary totals but did not expose the material rows used to create those totals.
* Users could see estimated, actual, and variance cost but could not tell which BOM materials or actual consumed materials drove the numbers.

Verification:

* Test case created BOM material `VAL-MAT-100` quantity `100` and consumed unplanned `VAL-MAT-002` quantity `9`.
* `GET /components/:id/costing/breakdown` returned:
  estimated material cost `128,571,428.57142857`;
  actual material cost `2,442,627.7427184465`;
  warnings `BOM_MATERIAL_NOT_CONSUMED` and `UNPLANNED_MATERIAL`.
* Backend build passed.
* Frontend build passed.

## 2026-06-13 Sprint 10C Reservation Allocation Integrity

Fixed:

* Production reservation preview/allocation now reads active `inventory_location_stocks` buckets directly instead of reconstructing availability from historical Inventory transactions and issue rows.
* Reservation allocation only considers production warehouse buckets where `inventory_location_stocks.quantity > 0`.
* Bucket selection is exact by:
  `inventoryItemId + warehouseId + zoneId + slotId + level`.
* Active reservations are deducted by exact bucket, so one occupied slot/level no longer reduces a different slot/level.
* Runtime production integrity summary now reports `invalidReservationBuckets` for active reservation lines whose exact bucket has no positive current stock.

Root cause:

* Reservation allocation used transaction history tagged `[COMPONENT_PRODUCTION]` and manual issue deduction.
* Historical production buckets could remain in the derived availability map after their active `inventory_location_stocks` row was consumed or removed.
* Reservation could succeed against that historical bucket, then issue-from-reservation failed during exact stock mutation with negative/insufficient stock validation.

Verification:

* Smoke setup created active production stock for a new material:
  `A02/L1 = 10`, `A02/L2 = 5`.
* Reservation requirement `8` previewed and allocated only from active bucket `A02/L1`.
* Issue from reservation succeeded immediately.
* Verified final stock:
  `A02/L1 = 2`, `A02/L2 = 5`.
* Backend build passed.
* Frontend build passed.

Remaining data state:

* Runtime integrity summary still reports `invalidReservationBuckets = 1` from a historical reservation created before this fix. No silent data backfill was performed.

## 2026-06-13 Sprint 10B Automatic Component Costing

Fixed:

* Production completion now automatically recalculates Component costing for the linked component.
* `POST /production/:id/component` also triggers automatic costing after creating or marking a component `READY`.
* Automatic costing calls the existing ComponentCosting upsert path, so an existing `ComponentCosting` row is updated and a missing row is created.
* Costing failures are caught and logged with `Logger.warn`; production completion remains successful.
* Automatic costing writes ActivityLog action `AUTO_RECALCULATE_COSTING` with `componentId` and `productionOrderId` metadata.
* Manual `POST /components/:id/costing/recalculate` remains unchanged and continues to write `RECALCULATE_COSTING`.

Root cause:

* Component costing existed only behind the manual Components API action.
* Production completion and production-output component creation updated Component status to `READY` but never called the costing service, leaving `components.estimatedCost` and `components.actualCost` at zero until a user pressed Recalculate.

Verification:

* Smoke flow created component `S10B-20260613103402-COMP`, transferred material to production, issued `10`, consumed `8`, scrapped `1`, and completed the production stage.
* Without calling manual recalculate, verified:
  `ComponentCosting` row exists;
  `components.estimatedCost = 2,714,030.825242719`;
  `components.actualCost = 2,442,627.742718447`.
* Verified ActivityLog:
  `AUTO_RECALCULATE_COSTING` with component and production order metadata.
* Reservation-based smoke found a separate existing defect: reservation issue allocated a historical production slot without current stock and returned `Inventory quantity cannot become negative`. This is documented as future reservation reconciliation work, not part of Sprint 10B.

## 2026-06-13 Sprint 10A.1 Return Material UI Reconciliation

Fixed:

* Production Cockpit now uses one shared returnable calculation for rendering and click handling.
* Returnable quantity is computed from `ProductionMaterialIssue.returnedQty` plus consumed/scrap aggregate:
  `issued - consumed - scrap - returned`.
* Rows with status `RETURNED` are treated as fully reconciled in the UI, so the Return action is disabled/hidden.
* Successful return mutation now updates the `['production', 'issues']` query cache immediately with the backend response before async refetch completes.
* Inventory insufficient-stock errors from stale return attempts are translated into a user-friendly reload/reconciliation message.

Root cause:

* The backend correctly wrote `ProductionMaterialLedger` `RETURN` and updated `ProductionMaterialIssue.returnedQty`, while `ProductionMaterialConsumption.returnedQty` remained a historical snapshot.
* The Cockpit depended on query invalidation/refetch timing after return. A stale issue row could keep the Return action visible long enough for a second return attempt.
* The UI needed to use `ProductionMaterialIssue.returnedQty` as the active returned source of truth and refresh it synchronously from the return mutation response.

Verification:

* Existing Sprint 10A smoke row `S10A-20260613094829-ISSUE` verifies:
  issue `10`, consume `8`, scrap `1`, return `1`.
* SQL returnable check now reports:
  `backend_formula_returnable = 0`, `ui_returnable = 0`.
* Backend build passed.
* Frontend build passed.

## 2026-06-13 Sprint 10A Material Return Reconciliation

Fixed:

* Production Material Return now validates against the real MO/material balance:
  `issued - consumed - scrap - previously returned`.
* Returning unused issued material now creates an Inventory `RETURN` transaction into `MAIN` / `Kho chính` instead of restoring the old production issue bucket.
* `inventory_location_stocks` and `inventory_items.quantity` are updated through the Inventory return transaction and exact main warehouse bucket upsert.
* `ProductionMaterialIssue.returnedQty` is incremented by the returned quantity.
* `ProductionMaterialLedger` writes a `RETURN` event at the main warehouse destination bucket.
* Legacy `PATCH /production/material-issues/:id` status changes to `RETURNED` now route through the same return validation instead of the old stock movement path.
* Production Cockpit Material Issues UI now calculates returnable quantity after consumed/scrap quantities and prompts for partial return quantity.
* Production mutations now invalidate Inventory query caches after issue/return changes.

Root cause:

* The previous return path treated returnable quantity as `issuedQty - returnedQty`, so it ignored consumed and scrap quantities.
* The previous return path restored stock to the original production issue location. That conflicted with the active workflow where issue already deducts `Kho vật tư SX`, consumption/scrap are production-side actuals, and only unused remainder should return to `Kho chính`.
* A legacy status-update path could still create the old return movement without the new reconciliation checks.

Verification:

* Smoke test completed through API using `VAL-MAT-002`:
  issue `10`, consume `8`, scrap `1`, return `1`.
* Verified balance:
  `issued = 10`, `consumed = 8`, `scrap = 1`, `returned = 1`.
* Verified Inventory transactions:
  transfer Main -> Production `-10/+10`, production issue export `-10`, return to Main `+1`.
* Verified ledger rows:
  `CONSUME = 9` at production bucket and `RETURN = 1` at main warehouse bucket.

## 2026-06-12 Sprint 9 Bug Fixes

Fixed:

* Fixed critical Inventory production-transfer stock check where top-level `warehouseId` for the receiving production warehouse was inherited by the main-warehouse source line.
* Inventory line normalization now resolves `warehouseId` from each line `zoneId` when the line has a zone, preventing source and destination warehouse IDs from being mixed in multi-line transfers.
* Inventory outbound modal now sends source line `warehouseId` explicitly from the selected source location/zone.
* Inventory transaction location synchronization now keys `inventory_location_stocks` by the full location bucket:
  `inventoryItemId + warehouseId + zoneId + slotId + level`.
* Inventory outbound validation now checks the exact selected location bucket instead of a zone-only aggregate.
* Inventory transactions now update location stock whenever any location field is present, including warehouse-only buckets.
* Production material issue transactions now pass `warehouseId`, `zoneId`, `slotId`, and `level` on transaction item lines.
* MO auto-issue planning now preserves production warehouse slot and level from production stock buckets, so issue rows and Inventory transaction items target the same 2D location.
* Project Components delivery/install API calls now use the authenticated shared API client instead of the unauthenticated `shared/http/http-client`.
* Project Components actions now show success/error feedback and invalidate both Projects runtime and Components queries.
* Project Components row navigation now opens the existing Component detail modal on the Components list when a `componentId` route state is provided.

Root causes:

* Production issue paths could create Inventory transaction items without slot/level, so `inventory_items.quantity` changed while the exact `inventory_location_stocks` bucket did not.
* Production stock planning grouped buckets by warehouse/zone only, dropping slot/level selected in the production warehouse 2D location.
* Project delivery used an Axios client without auth interceptors, causing protected `POST /components/:id/deliver` requests to return `401 Unauthorized` from the real UI path.
* Production transfer payloads used top-level `warehouseId = wh-production-steeltrack`; before the fix, the source line for `Kho chính` inherited that value and queried the wrong stock bucket.

Verification:

* Before fix data check for `VAL-MAT-001` remained `inventory_items.quantity = 80` and location stock total `90`, proving existing validation data was already inconsistent.
* Authenticated delivery verification changed `CPL-48937939` from `SHIPPED` to `DELIVERED` via `POST /components/:id/deliver` (`201`).
* Production issue/return smoke test on `VAL-MAT-001` quantity `1` changed item/location `80/50 -> 79/49 -> 80/50`, and created `EXPORT`/`RETURN` transaction item rows with the same warehouse, zone, slot, and level.
* Production transfer smoke test on `VAL-MAT-002` with legacy payload shape changed source line normalization to `wh-main-steeltrack` and completed without insufficient-stock error; reverse transfer restored the checked bucket.
* Runtime integrity APIs still report historical mismatches after the fix because existing bad rows were not backfilled in this bug-fix sprint.
* Backend build passed.
* Frontend build passed.

## 2026-06-12 Clean Dataset Plan

Completed:

* Created `docs/ai-state/audits/clean-dataset-plan.md`.
* Classified operational tables that can be cleared to isolate legacy/test data from active workflow defects.
* Classified master/reference tables that should be kept.
* Defined Scenario A clean validation workflow:
  1 material, 1 BOM, 1 MO, 1 reservation, 1 issue, 1 return, 1 consume, 1 component, 1 QC, 1 Yard placement, shipped, delivered, installed.
* Documented expected Inventory and Production balances for every validation step.

Notes:

* No production code changed.
* No database cleanup was executed.
* Existing `scripts/reset-clean-workflow.sql` is not suitable for this exact plan because it clears `projects`, while this plan keeps Projects as master/context data.

## 2026-06-12 System Audit & Hardening Sprint 8

Completed:

* Created `docs/ai-state/audits/system-integrity-audit.md`.
* Audited Inventory reconciliation across `inventory_transactions`, `inventory_transaction_items`, and `inventory_location_stocks`.
* Audited Production material reservation, issue, return, consumption, and ledger data.
* Audited Component lifecycle states `READY`, `SHIPPED`, `DELIVERED`, and `INSTALLED`.
* Audited costing balance rule:
  `issued = returned + consumed + scrap`.
* Audited Project rule that installed components must have `projectId`.
* Added read-only KPI summary APIs:
  `GET /runtime/integrity/inventory-summary`;
  `GET /runtime/integrity/production-summary`;
  `GET /runtime/integrity/project-summary`.

Findings:

* Inventory has 26 transaction-vs-location reconciliation mismatches and 2 `inventory_items.quantity` snapshot mismatches.
* Production has 1 over-issued reservation line, no consumption rows in current live data, and issue rows not fully represented by `ISSUE` ledger rows.
* Component lifecycle has 1 `READY` component without a matching `READY` timeline action.
* Costing balance has 7 rows where issued material remains unallocated to returned/consumed/scrap.
* Project installed-component `projectId` rule has no current violations.

Verification:

* Backend build passed after adding Runtime Integrity APIs.
* Frontend build passed.
* KPI endpoints were verified through an in-memory API smoke test.

## 2026-06-12 Installation Mapping Sprint 7

Completed:

* Added component installation location fields:
  `installZone`, `installAxis`, `installLevel`, `installPosition`.
* Added Prisma migration `20260612110000_component_installation_location`.
* Extended `POST /components/:id/install` payload with required installation location fields.
* Install validation now requires the component to be `DELIVERED` and requires all installation location fields.
* Installation writes the location fields to `components`, sets `installedDate`, and records the full location in the `ComponentTimeline` `INSTALLED` note.
* Project runtime now returns installation location for each project component.
* Projects -> `Cấu kiện công trình` now opens an installation modal when confirming installation and requires:
  Khu vực, Trục, Tầng, Vị trí.
* Project Components table now displays Zone, Axis, Level, and Position columns.
* Component Detail now shows the installation location.

Verification:

* Prisma migration applied successfully.
* Prisma generate passed.
* Backend build passed.
* Frontend build passed.
* In-memory API smoke test verified missing install payload returns `400`, then `SHIPPED -> DELIVERED -> INSTALLED` succeeds with install location stored on the component, returned through `/projects/runtime`, and written to timeline note. Smoke data was cleaned up.

## 2026-06-12 Delivery And Installation Sprint 6

Completed:

* Audited `ComponentStatus` and confirmed `DELIVERED` and `INSTALLED` already exist in Prisma, so no schema migration was required.
* Added lifecycle APIs:
  `POST /components/:id/deliver`;
  `POST /components/:id/install`.
* Added validation:
  `SHIPPED -> DELIVERED`;
  `DELIVERED -> INSTALLED`.
* Delivery and installation APIs update `Component.status`, set `installedDate` on install, write ActivityLog rows, emit component update events, and create `ComponentTimeline` rows with actions `DELIVERED` and `INSTALLED`.
* Updated Project runtime so `SHIPPED` remains "đã xuất bãi", while delivered counts only include `DELIVERED` and `INSTALLED`.
* Added Project runtime component counters:
  `readyComponents`, `shippedComponents`, `deliveredComponents`, and `installedComponents`.
* Added `Xác nhận nhận hàng` and `Xác nhận lắp đặt` actions in Projects -> `Cấu kiện công trình`.

Verification:

* Backend build passed.
* Frontend build passed.
* In-memory API smoke test created a temporary `SHIPPED` component, verified direct install returns `400`, then verified deliver returns `DELIVERED`, install returns `INSTALLED`, timeline contains `DELIVERED` and `INSTALLED`, and `/projects/runtime` exposes the installed component. Smoke data was cleaned up.

## 2026-06-12 Component Costing Sprint 5

Completed:

* Audited Components and Production schema and confirmed components already expose `estimatedCost` and `actualCost`, but no persisted costing breakdown existed.
* Added `ComponentCosting` Prisma model and migration.
* Added costing APIs:
  `GET /components/:id/costing`;
  `POST /components/:id/costing/recalculate`.
* Added costing service that validates a Component has a Production Order and consumption records before recalculation.
* Material costing formula:
  `(ProductionMaterialConsumption.consumedQty + scrapQty) * Inventory average cost`.
* Inventory average cost uses the same inbound transaction basis as Inventory:
  positive inbound transaction value divided by positive inbound quantity.
* Recalculate upserts `ComponentCosting`, updates `Component.estimatedCost` and `Component.actualCost`, and writes an ActivityLog row.
* Added Component detail Costing section with estimated, actual, variance, material, labor, machine, overhead, and MO fields.
* Project Components tab continues to show `Actual Cost` from the component `actualCost` field populated by costing recalculation.

Verification:

* Prisma migration `20260612100000_component_costing` applied successfully.
* Route mapping confirmed:
  `GET /components/:id/costing`;
  `POST /components/:id/costing/recalculate`.
* Smoke costing for component `CPL-98509548` created temporary production consumption, recalculated costing, confirmed Project runtime Actual Cost updated, and cleaned up smoke rows/reset component costs.
* Backend build passed.
* Frontend build passed.

## 2026-06-12 Production Consumption Sprint 4

Completed:

* Audited production issue/return workflow and confirmed issued quantities are tracked by `ProductionMaterialIssue` with returned balances and `ISSUE`/`RETURN` material ledger rows.
* Added `ProductionMaterialConsumption` Prisma model and migration.
* Added consumption APIs:
  `GET /production/consumptions`;
  `GET /production/:id/consumptions`;
  `POST /production/:id/consume`.
* Added validation so consumed quantity, scrap quantity, and returned quantity cannot exceed issued material for the same MO/material.
* Added automatic Production Material Ledger `CONSUME` writes when material consumption is posted.
* Added Production Cockpit `Tiêu hao vật tư` route/tab with Issued, Returned, Consumed, Scrap, and Remaining summaries.

Verification:

* Prisma migration `20260612090000_production_material_consumption` applied successfully.
* `GET /production/consumptions` returned an authenticated array response.
* Smoke `POST /production/:id/consume` created a `ProductionMaterialConsumption` row and a matching `CONSUME` ledger row, then smoke rows were cleaned up.
* `pnpm -C apps/backend-api exec prisma generate` passed.
* Backend build passed.
* Frontend build passed.

## 2026-06-12 Project Components Tab

Completed:

* Audited Projects UI and confirmed it exposed project lists, progress, materials, and reports but did not expose project-linked components.
* Extended `GET /projects/runtime` with a `components` collection derived from `components.projectId`.
* Added Projects tab `Cấu kiện công trình` next to `Vật tư theo công trình`.
* Added project and component status filters for `ALL`, `STOCK`, `READY`, `SHIPPED`, `DELIVERED`, and `INSTALLED`.
* Added summary cards for total components, `READY`, `SHIPPED`, `DELIVERED`, and `INSTALLED`.
* Added project component table columns: component code, name, project, status, planned date, installed date, estimated cost, and actual cost.
* Component rows navigate to the existing Components list route because no component detail route is currently active.

Verification:

* Verified `CPL-98509548` appears in `/projects/runtime.components` with project `CT-2026-4166` and status `SHIPPED`.
* Backend build passed.
* Frontend build passed.

## 2026-06-12 Yard Outbound Component Status Fix

Completed:

* Audited Yard outbound flow from `YardOperationDialog` to `yardApi.remove`, `YardController.removeItem`, and `YardService.removeItem`.
* Confirmed previous outbound only set `YardItemPlacement.removedAt`, wrote a `REMOVE` yard movement, updated slot occupancy, and logged yard activity.
* Fixed Yard outbound for component placements so removal now also updates the linked Component to `SHIPPED`, clears yard location fields, preserves/infers `projectId`, and writes a `ComponentTimeline` `SHIPPED` entry.
* Updated Yard runtime mutation invalidation to refetch Yard, Components, Projects, and Dashboard queries after outbound.
* Updated Projects runtime metrics so `SHIPPED` and `DELIVERED` components count correctly in completed/delivered project component totals.

Verification:

* Smoke outbound created a project-linked component, placed it in Yard, removed it through `POST /yard/placements/:id/remove`, and verified:
  Component status `SHIPPED`;
  placement `removedAt` set;
  projectId retained;
  one `SHIPPED` component timeline row created;
  project runtime delivered count increased while the smoke component existed.
* Smoke records were removed after verification.
* Backend build passed.
* Frontend build passed.

## 2026-06-12 Auth Route Guard Fix

Completed:

* Audited frontend auth flow: LoginPage, Zustand auth store, token storage, Axios interceptor, refresh flow, and active router/provider wiring.
* Verified backend `/auth/login` returns both camelCase and snake_case token fields:
  `accessToken`, `access_token`, `refreshToken`, `refresh_token`.
* Verified `/auth/refresh` expects `{ refreshToken }` and returns rotated access/refresh tokens.
* Fixed active app provider wiring so `AuthProvider` runs inside `QueryClientProvider`.
* Added active `/login` route and route guard so business pages no longer render unauthenticated and fire `/components` or `/production` requests without Bearer tokens.
* Updated LoginPage to persist both access and refresh tokens through the shared auth store and navigate back through React Router instead of forcing a reload.

Verification:

* `GET /components` returned `200` with 6 existing records before smoke creation.
* `GET /production` returned `200`.
* `POST /components` returned `201`.
* Frontend build passed.

## 2026-06-11 Production Execution Sprint 3

Completed:

* Audited Component creation workflow across frontend, API, backend service, repository, and database.
* Verified generic `POST /components` creation works through API smoke testing.
* Fixed the isolated UI login blocker by aligning the login default password with the current seed password `123`.
* Added Production execution component endpoint `POST /production/:id/component`, requiring issued material before creating/marking a component as `READY`.
* Added reservation-linked material issue workflow:
  `POST /production/reservations/:id/issue`.
* Added material return workflow:
  `POST /production/material-issues/:id/return`.
* Extended `ProductionMaterialIssue` with reservation/location/return tracking.
* Issue reduces exact `inventory_location_stocks`; return restores exact location stock.
* Issue and return update reservation line balances and write `ISSUE` / `RETURN` ledger events.
* Added UI actions for issuing from reservation, returning issued material, and creating/marking a component from an MO.
* Added `docs/ai-state/modules/components.md`.

Verification:

* Smoke workflow completed:
  Production Order -> Reservation -> Issue -> Create Component -> Return Excess Material.
* Smoke ledger for the MO contains `RESERVE`, `ISSUE`, and `RETURN`.

Build:

* Backend build passed after service/controller changes.
* Frontend build passed after UI/API changes.

## 2026-06-11 Production Material Ledger Sprint 2

Completed:

* Added Prisma enum `ProductionMaterialLedgerEventType` with `RESERVE`, `RELEASE`, `ISSUE`, `RETURN`, `CONSUME`, and `ADJUST`.
* Added Prisma model and migration for `ProductionMaterialLedger`.
* Added ledger read APIs:
  `GET /production/material-ledger`;
  `GET /production/material-ledger/:id`;
  `GET /production/:id/material-ledger`.
* Added automatic ledger writes for reservation create/reserve/release/expire.
* Added `/production/material-ledger` tab with filters for Production Order, Material, Event Type, and Date Range.
* Updated production module, decisions, current state, current modules, and next-phase design docs.

Build:

* `pnpm -C apps/backend-api exec prisma generate`
* `pnpm -C apps/backend-api build`
* `pnpm -C apps/frontend build`

Notes:

* Ledger currently writes reservation lifecycle events. Issue, return, consume, and adjust writers remain future sprint work.

## 2026-06-11 Production Reservation Sprint 1

Completed:

* Added Prisma models and migration for `ProductionMaterialReservation` and `ProductionMaterialReservationLine`.
* Added reservation preview, create, reserve, release, and expire backend APIs.
* Reservation preview validates BOM demand against `Kho vật tư SX` availability minus active reservations.
* Reservation lines persist production warehouse allocation by `warehouseId + zoneId + slotId + level`.
* Added `/production/reservations` frontend tab and MO detail reservation preview/create action.
* Updated production module, decisions, current state, current modules, and next-phase design docs.

Build:

* `pnpm -C apps/backend-api exec prisma generate`
* `pnpm -C apps/backend-api build`
* `pnpm -C apps/frontend build`

Notes:

* Reservation does not move Inventory stock. Material issue from reservation, returns, production ledger, and costing remain future sprint work.

## 2026-06-11 Documentation Cleanup Phase

Completed:

* Merged legacy documentation classified as MERGE into ai-state:
  `AI_CONTEXT.md`, `AI_RULES.md`, `KNOWN_ISSUES.md`, `ROADMAP.md`, `TREE_STRUCTURE.md`,
  `architecture/ARCHITECTURE_FREEZE.md`, `architecture/INVENTORY_TRANSACTION_RULES.md`,
  and `inventory/inventory-phase1-migration-plan.md`.
* Preserved the KEEP event naming standard in ai-state by creating `design/event-naming.md` while leaving `docs/architecture/EVENT_NAMING.md` in place.
* Created new ai-state documents:
  `roadmap.md`;
  `design/repo-structure.md`;
  `design/event-naming.md`;
  `audits/technical-debt-audit.md`;
  `audits/post-cleanup-summary.md`.
* Updated `CODEX_WORKFLOW.md` with merged engineering rules and removed dependency on legacy root AI docs as required reading.
* Updated architecture and inventory decision docs with merged legacy decisions and migration rationale.
* Updated `CURRENT_STATE.md` and `CURRENT_MODULES.md` with documentation cleanup state.
* Created `docs/archive/` and moved ARCHIVE documents:
  `docs/PROJECT_OVERVIEW.md` -> `docs/archive/PROJECT_OVERVIEW.md`;
  `docs/architecture/REFACTOR_MASTER_PLAN.md` -> `docs/archive/REFACTOR_MASTER_PLAN.md`.
* Deleted only documents classified as DELETE:
  `docs/modules/COMPONENTS.md`;
  `docs/modules/INVENTORY.md`;
  `docs/modules/YARD.md`.

Notes:

* Documentation-only task; no application code, database, or schema changes were made.

## 2026-06-11 Documentation Refactor

Completed:

* Normalized `docs/ai-state` structure with `audits/`, `design/`, `modules/`, and `decisions/` directories.
* Moved module docs into the normalized module directory:
  `MODULE_PRODUCTION.md` -> `modules/production.md`;
  `MODULE_QC.md` -> `modules/qc.md`;
  `MODULE_SUPPLIERS.md` -> `modules/suppliers.md`;
  `MODULE_SYSTEM.md` -> `modules/system.md`.
* Created `CURRENT_STATE.md` summarizing Inventory, Production, QC, Yard, Suppliers, Projects, Dashboard, and System by status, architecture, limitations, and current focus.
* Created decision docs:
  `decisions/architecture-decisions.md`;
  `decisions/inventory-decisions.md`;
  `decisions/production-decisions.md`.
* Created missing module docs:
  `modules/yard.md`;
  `modules/projects.md`;
  `modules/dashboard.md`.
* Updated `CODEX_WORKFLOW.md` to require reading `PROJECT_STATUS.md`, `CURRENT_STATE.md`, `NEXT_TASKS.md`, related module docs, using Semble before grep, using Context7 before framework changes, building before completion, and updating ai-state docs after workflow changes.
* Created `audits/documentation-audit.md` with missing, outdated, duplicate, and recommended cleanup notes.

Notes:

* Documentation-only task; no application code, database, or schema changes were made.

## 2026-06-11

Completed:

* Updated Inventory transfer creation:
  transfer source/destination locations are now limited to `Kho chính` and exclude production warehouse locations;
  selecting a material source location now keeps the real `fromZoneId` for the transaction while using the selected `zone/slot/level` row to auto-fill source cell and level;
  destination warehouse selection now suggests and fills the first available destination cell/level;
  removed the old transfer flow diagram panel and replaced it with separate source and destination 2D warehouse location views matching the outbound workflow.
* Fixed a frontend type mismatch in the warehouse location 2D material list by allowing `unitMaster` on generated occupancy rows.
* Improved the Inventory location create/edit modal:
  the parent warehouse selector now clearly shows `Kho chính (MAIN)` and `Kho sản xuất (PRODUCTION)` from real master warehouse data, falls back to warehouse data embedded in zones if the master-data request is empty, and requires a parent warehouse before saving a new location.

Build:

* Frontend build passed.
* Frontend still reports the existing Vite warnings for `.env NODE_ENV=production` and large bundle chunk size.

## 2026-06-07

Completed:

* Fixed Production BOM and production material consumption:
  BOM create now validates requested material quantity plus waste against real available `Kho vật tư SX` stock and blocks over-allocation;
  the BOM modal now shows `Cần / Tồn SX` per selected material and displays shortage warnings before submit;
  backend production stock calculation now counts only transaction lines that belong to the production warehouse and uses signed receipt/return quantities instead of counting main-warehouse transfer lines;
  starting a Manufacturing Order now auto-creates `ISSUED` `ProductionMaterialIssue` rows for missing BOM requirements and creates outbound inventory movements from the production warehouse location so production material stock is reduced;
  `/production/:id/requirements` now uses the corrected production-warehouse balance logic;
  Production start now plans material issues before the MO state update and creates issue rows only after the start transition succeeds, avoiding orphaned production material issues if the start action fails.
* Fixed QC quick pass workflow:
  backend QC completion now accepts `READY` inspections in addition to `IN_PROGRESS` and `REWORK_REQUIRED`, so newly created ready inspections can be marked `PASSED` and approved without getting stuck.
* Upgraded System module detail pages to use richer real runtime data:
  Users now shows real user status, assigned roles, latest activity timestamp/action/module from `ActivityLog`, cockpit KPIs, filters, table, and detail panel;
  Roles now shows real roles, user counts, permission counts, and a permission matrix derived from persisted `Permission` records;
  System Logs now shows real `ActivityLog` rows, action/module summaries, activity trend, filters, and a cockpit table.
* Added backend System support endpoints:
  `GET /system/role-matrix`;
  `GET /system/activity-summary`;
  `GET /system/notifications`.
* Rebuilt the main Dashboard/Tổng quan as an Inventory-style dark cockpit backed by `GET /dashboard/cockpit`, aggregating real Projects, Production Orders, Components, Inventory transactions/items, Yard activity, QC open work, Activity Logs, and Notifications.
* Rebuilt the Notifications/Thông báo page to read persisted `notifications` records through `/system/notifications`, with unread/priority/read filters and a selected-notification detail workspace.
* Registered the active `/notifications` route in the main app router.

Modified:

* Dashboard frontend API contract.
* System frontend API contract.
* Users, Roles, System Logs, Dashboard, and Notifications frontend pages.
* Dashboard backend controller.
* System backend controller.

Build:

* Backend build passed.
* Frontend build passed.
* Frontend still reports the existing Vite warnings for `.env NODE_ENV=production` and large bundle chunk size.

## 2026-06-06

Completed:

* Removed orphan warehouse-like zones `ST-WH-RAW` and `ST-WH-FAB` from the current database and added migration `20260606093000_remove_orphan_st_wh_zones` so they are not retained as usable or hidden locations.
* Updated the operational sample-data seeder to stop recreating `ST-WH-RAW` and `ST-WH-FAB`.
* Simplified Inventory navigation:
  removed the horizontal in-page Inventory tab strip;
  Inventory tab switching is now handled from the sidebar;
  Inventory actions `Nhập kho`, `Xuất kho`, and `Khác` now render in the global topbar on Inventory routes.
* Added persisted sidebar hide/show behavior to increase available workspace width.
* Aligned the Stock tab free-text search field with the surrounding filters.
* Frontend and backend builds pass.

## 2026-06-03

Completed:

* Completed Inventory Sprint B - Warehouse Locations:
  added Inventory tab `/inventory/locations` labeled `Vị trí kho`;
  extended `WarehouseZone` with `row`, `column`, `level`, and `capacity` fields while preserving `code`, `name`, and `active`;
  added migration `20260605063000_inventory_warehouse_location_fields` and applied it to the local database;
  expanded `GET /inventory/zones` with material count and total stock quantity statistics;
  added `GET /inventory/zones/:id` detail data with stored materials and recent transaction lines;
  added create, edit, activate, deactivate, and soft-delete APIs for warehouse locations;
  added frontend location management workspace with KPI strip, filters, location table, current `warehouse_zones` audit panel, create/edit modal, and detail drawer;
  added sidebar and Inventory tab navigation for `Vị trí kho`;
  preserved the requested boundary: no Redis, caching, performance optimization, or 2D warehouse map UI in this sprint.
* Audited current `warehouse_zones` after the clean workflow reset:
  demo records are `DEMO-WH-FAB` and `DEMO-WH-RAW`;
  warehouse-like records are `ST-WH-FAB` and `ST-WH-RAW`;
  real storage locations are `A01`, `A02`, and `B01`.
* Backend and frontend builds pass after Inventory Sprint B. Frontend still reports the existing Vite warnings for `.env NODE_ENV=production` and large bundle chunk size.
* Added Material Master v1 usage classification:
  added Prisma enum `MaterialUsageType` with `PRIMARY`, `SECONDARY`, and `CONSUMABLE`;
  added `InventoryItem.materialUsageType` with default `PRIMARY` and applied migration `20260604214339_add_material_usage_type`;
  updated Inventory item create/update/list/detail/audit flows to persist and return usage type plus clearer zone code/name fields;
  changed the MaterialDrawer `Loại vật tư` field to Vietnamese usage options `Vật tư chính`, `Vật tư phụ`, `Vật tư tiêu hao`;
  renamed the old technical type selector to `Quy cách / nhóm kỹ thuật`;
  added default warehouse zone selection to the MaterialDrawer;
  added `Loại vật tư` columns to Inventory Overview, Stock list, and Stock full-list modal;
  updated the material detail popup to show `Loại vật tư`.
* Reworked the MaterialDrawer create/edit form to match the Inventory inbound modal layout with two-column fields, summary boxes, a business note panel, full-width description, and clearer footer actions.
* Fixed material deletion by adding soft delete:
  added `InventoryItem.deletedAt` and migration `20260604224726_inventory_item_soft_delete`;
  changed Inventory repository delete to mark records deleted instead of hard-deleting rows referenced by transactions/BOM/history;
  active Inventory item queries now hide deleted materials while preserving old operational history.
* Fixed Material Detail supplier tab:
  renamed supplier column `Tổng nhập` to `Đơn giá nhập`;
  changed the displayed value to inbound unit price with average cost fallback.
* Fixed Inventory outbound material location dropdown:
  material detail now falls back to the material default zone when legacy transaction lines have stock but no zone;
  outbound modal now builds selectable source locations from balances and falls back to the material default zone/current stock when no balance rows are returned.
* Replaced secondary frontend static fallback panels with API-backed runtime data:
  Analytics charts now read Inventory transactions, Production orders, and Yard metrics.
  Notifications and Command Center alerts now read Analytics Engine alerts.
  Digital Twin machine map and heatmap now read Production machines and Yard metrics.
  Smart Search now indexes Inventory materials, Components, and Yard slots from APIs.
  Material Movements now reads real Inventory transaction items.
* Removed unused secondary operational/static data files and unused random Yard grid components.
* Cleared the lightweight Inventory Zustand store seed so it no longer injects a fake realtime transaction.
* Removed legacy unprefixed inventory material records `HB200`, `HB250`, `I200`, `PL12`, and `PL20` from the current database after confirming they had no transaction, return, BOM, or production issue references.
* Deleted the dangerous `reset-inventory-phase2-demo.ts` script so it cannot wipe operational inventory history and reseed demo data.
* Replaced active frontend `mock-data` folders for Analytics, Digital Twin, Notifications, and AI Assistant with `operational-data` folders.
* Updated remaining active hardcoded sample identifiers such as `Beam H400`, `CK-220`, and `MC-02` to operational `ST-*` identifiers.
* Replaced backend Simulation `DEMO-*` seed/scenario data with operational SteelTrack `ST-*` data for Inventory, Components, Production, QC, Yard, Projects, Suppliers, workers, cranes, and analytics.
* Ran the operational sample data bootstrap against the current database with reset enabled.
* Verified the current database has zero `DEMO` records in the main Inventory, Components, Production, and Yard tables checked.
* Separated Components production material warehouse UI from main Inventory stock by deriving visible stock from issued Production Material Issue records.
* Added source location selection to the Inventory outbound modal and dedicated Inventory > Outbound tab; outbound transactions now carry the selected `zoneId` and block export quantities that exceed the chosen location balance.
* Linked Inventory outbound transactions tagged `[COMPONENT_PRODUCTION]` into Components > Production Material Stock so "Xuất sản xuất cấu kiện" appears in the production material warehouse view.
* Preserved scroll position and expanded-group state in both runtime sidebars so sidebar clicks no longer jump back to the top.
* Locked project selection when Inventory outbound target is "Xuất sản xuất cấu kiện" so component-production issues cannot be mixed with project outbound.
* Made Inventory > Materials stock rows clickable and mapped audit rows correctly into the material drawer for view/edit.
* Added Components list delete action backed by the existing Components DELETE API.
* Added Components production material stock detail popup and a "return to main warehouse" action tagged `[COMPONENT_PRODUCTION_RETURN]`.
* Changed Production BOM material selection and Production requirements availability to use production-material warehouse stock from `[COMPONENT_PRODUCTION]` transactions instead of main Inventory stock; production material issues now reduce available SX material balance.
* Replaced Components stock and transfer tabs with runtime data from Components and Yard placements/movements so component positions match the Yard.
* Kept the Production "stage to yard" panel visible when all stages are completed, even before the order status query refreshes.
* Split Yard overview into a dashboard-style cockpit instead of reusing the full 2D spatial map tab.
* Added Yard overview panels for spatial preview, zone utilization, component distribution, inbound/outbound queues, recent activity, and overload alerts.
* Removed the reference image background from Yard 2D map, added 2D zoom controls, and changed zone clicks to update side charts instead of opening a popup.
* Added Yard zone edit/delete controls in the 2D zone cards and a guarded backend `DELETE /yard/zones/:id` endpoint that only deletes empty zones.
* Adjusted Yard 3D slot layout to scale dynamically so configured zones/slots fit inside the visible floor.
* Restricted Yard inbound workflow to completed `READY` components that are not already placed in the Yard.
* Added sidebar scroll reset when changing module routes or hash tabs.
* Removed the sidebar route/hash scroll reset after it caused sidebar clicks to jump back to the top.
* Removed the unused frontend inventory mock data file.
* Removed the unused frontend Yard mock slots file.
* Hardened sidebar click behavior again by restoring scroll with layout effect, keeping the app shell height locked to the viewport, and blurring sidebar links on focus/mousedown so the browser does not scroll the active menu item into view.
* Split Inventory > Materials stock row click from edit behavior: clicking a material now opens a read-only material detail popup, while "Sửa" opens the material drawer and "Thêm vật tư mới" stays as the create drawer.
* Added a Components production order popup so clicking a production row shows current status, active stage, dates, and routing stage progress.
* Changed Components stock to derive inventory only from completed production orders that also have a Yard placement; stock rows now show Yard zone/slot, BOM-derived material cost estimate, total amount, and a button that focuses the exact Yard position.
* Added production-material warehouse return form with return time, quantity, and note; material detail popup now shows recent issue/return history tagged with component-production markers.
* Added Yard focus handoff from Components stock into Yard 2D map, with the selected slot highlighted and surrounding placements dimmed.
* Added explicit zone detail popup buttons in Yard 2D zones and stronger selected-zone visual styling.
* Added clickable component detail cards inside the Yard zone detail popup with an "Xuất bãi" action that exports from the known current placement without asking the user to reselect a position.
* Enlarged Yard 3D crane GLB scale so the cranes render closer to zone size.
* Fixed Production-to-Yard staging rules in both Production MO popup and Yard inbound workflow:
  slots now remain selectable when they already contain lower stack levels as long as `currentStackLevel < maxStackLevel`;
  the next stack level is derived automatically instead of manually entered;
  inbound quantity is capped by completed MO quantity minus active Yard placements;
  Yard inbound now stages from completed MOs through the production `stage-to-yard` API instead of creating unlimited direct placements.
* Fixed another sidebar jump source by moving the AppSidebar scroll ref from the header to the actual scrollable menu area and persisting AppSidebar group open state.
* Completed Supplier Phase S1 Supplier Master Cockpit:
  replaced the simple CRUD supplier page with KPI strip, filter bar, main supplier table, right insight panel, and slide-over detail workspace;
  added supplier detail tabs for Overview, Materials, Inbound History, Ratings, and Files;
  added backend supplier cockpit summary/detail endpoints that derive inventory usage, inbound history, material history, and supplier-score ratings without schema changes;
  retained existing Supplier CRUD and `/suppliers` route without adding Procurement, Purchase Order, Contract, or Approval Workflow scope.
* Added two top-level Supplier module tabs matching the requested reference:
  `Danh sách nhà cung cấp` and `Đánh giá nhà cung cấp`;
  added `GET /suppliers/cockpit/evaluations` to connect Supplier Master, SupplierScore, and Inventory usage;
  added evaluation KPI strip, filters, evaluation table, selected supplier score detail panel, score trend, supplier classification, and recent evaluation cards.
* Built Projects/Công trình operational cockpit from real linked data:
  replaced the static Projects card page with five tabs: Tổng quan, Danh sách công trình, Tiến độ công trình, Vật tư theo công trình, and Báo cáo công trình;
  changed `/projects/runtime` from hardcoded project samples to data derived from Project, Component, ProductionOrder, and InventoryTransaction;
  added project KPI strips, filters, main project table, progress views, material-by-project table, report panels, and project detail popup.
* Removed a stray `production.service.ts` code fragment outside any method so backend build can pass.
* Built QC/Chất lượng operational cockpit:
  replaced the active `/qc` page with seven tabs: Tổng quan, Phiếu kiểm tra, Kế hoạch QC, Tiêu chuẩn, Không phù hợp (NCR), Hiệu chuẩn thiết bị, and Báo cáo;
  added `GET /qc/cockpit` to connect QC inspections, checklists, NCR, completed Production Orders, Components, and Projects;
  added QC KPI strip, filters, inspection table, latest inspection detail, production queue waiting for QC, checklist cards, NCR table, calibration placeholders, and report panels;
  added inspection detail and completed-MO popups so QC can create inspections and mark production/component checks as passed or rework-required;
  enforced the Yard staging gate in Production so a completed MO/component can only be staged to Yard after a linked QC inspection is `PASSED` or `APPROVED`;
  removed unused QC stub/static frontend files that could be confused with active data.
* Added operational workflow verification before System Settings work:
  added `GET /runtime/operational-workflow` to verify Supplier inbound, main Inventory stock, Project outbound, Production material outbound/return, BOM/MO, QC gate, Yard staging, Yard outbound, project return, and QC failure readiness from real database records;
  hardened Inventory outbound validation so server-side stock checks can enforce selected `zoneId` location balance, not only total item balance;
  backfilled 9 historical QC release records for active Yard component placements that existed before the QC gate was added, using current Yard placement and completed Production Order history;
  verified the current DB after backfill: supplier inbound 8, inventory items 8, project outbound 5, production outbound 4, production returns 3, BOMs 7, production orders 12, completed orders 10, approved QC 9, active Yard placements 23, removed Yard placements 15, staged components without QC 0.
* Built System cockpit foundation without adding schema duplicates:
  added `GET /system/overview`, `GET /system/users`, `GET /system/roles`, and `GET /system/activity-logs` using existing User, Role, Permission, ActivityLog, Inventory, Supplier, Project, Component, QC, and Yard tables;
  replaced Settings page with tabs matching the requested reference: Tổng quan, Cấu hình chung, Phân quyền, Danh mục, Tích hợp, Thông báo, Sao lưu & Phục hồi, and Nhật ký cấu hình;
  added workflow health panel inside Settings so the material-to-yard operational chain is visible as OK/WARN/BLOCKED;
  replaced Users, Roles, and System Logs pages with API-backed cockpit layouts and added active routes/sidebar entries for `/settings`, `/users`, `/roles`, and `/system-logs`.
* Optimized Inventory/Vật tư kho UI consistency:
  updated shared Inventory module shell, tab bar, KPI cards, section header, and runtime panels to a macOS-style glass surface with tighter typography, lighter shadows, and cleaner spacing;
  added shared Inventory visual components for KPI cards, glass panels, horizontal bar charts, mini bar charts, and consistent inputs;
  rebuilt Inventory > Tồn kho KPI/filter/table/insight panels with the new visual system, added smarter stock distribution, top inventory value, and stock health charts;
  changed the material detail popup to the same glass theme and kept row click as read-only detail while the `Sửa vật tư` action opens the edit form;
  rebuilt the material create/edit drawer in Vietnamese with the same Inventory glass visual language so editing from Tồn kho no longer feels like a different page;
  rebuilt Inventory > Audit with Vietnamese labels, macOS-style table, KPI strip, top value chart, and stock distribution mini chart;
  normalized active secondary Inventory tab panels/tables for Nhập kho, Xuất kho, Điều chuyển, Kiểm kê, Lịch sử giao dịch, and Cảnh báo tồn kho to the same glass surface treatment.
* Completed an additional Inventory dark cockpit cleanup pass:
  removed remaining light-mode/white surfaces from the Inventory module shell, tab bar, material drawer, material detail popup, Inventory > Tồn kho table, "Xem tất cả" modal, and secondary Inventory tabs;
  added a shared donut summary chart for professional stock-health composition and wired it into Inventory > Tồn kho alongside top value, location distribution, and stock rhythm visuals;
  kept add/edit material actions on the same Vietnamese cockpit drawer as the overview so Tồn kho no longer opens a mismatched material form.
* Completed Inventory Foundation Phase A UI consolidation:
  removed the duplicate create-material form and handler from Inventory Overview;
  wired the Overview "Thêm vật tư mới" action to the shared `MaterialDrawer`;
  preserved the no-schema/no-migration boundary for Phase A and did not touch the Supplier module;
  refreshed the app sidebar dark theme and active child-tab styling, including hash-aware active matching for submenu tabs.
* Completed Sprint A.5 Inventory cleanup:
  removed inbound, outbound, transfer, and stock-take modal forms from Inventory Overview;
  removed Overview transaction modal state and submit handlers;
  changed Overview quick actions to navigate to dedicated Inventory transaction pages while keeping MaterialDrawer and material detail in Overview;
  did not modify Inventory transaction pages or backend code.
* Refined Inventory > Tồn kho analytics:
  stock table pagination now defaults to a bottom-left `Hiển thị 1-10/xxx kết quả` label with centered clickable page numbers;
  warehouse/location stock distribution uses a donut chart;
  added a monthly stock movement trend chart from Inventory transactions;
  removed the older stock-health and stock-rhythm charts;
  rewired stock alerts from current stock/minimum stock thresholds;
  added a bottom quick-stat strip for today's inbound, outbound, transfer, current-month stock-take, and stock variance indicators.
* Standardized Inventory tab visuals using the Stock tab as the baseline:
  promoted shared Inventory panel/KPI/insight/pagination/table primitives;
  widened and spaced the Stock table/chart layout so analytics blocks no longer stick together;
  applied the same shell, KPI, filter, table, side-panel, and pagination treatment to Overview, Inbound, Outbound, Transfer, Stock Take, Transactions, Alerts, and Audit tabs;
  reworked the Overview main screen so its KPI strip, stock table, recent inbound/outbound lists, warehouse filter, and buttons match the rest of the Inventory cockpit;
  removed local duplicate KPI/insight helper components from the normalized tabs without changing backend, API, Prisma, or mutation logic.

Modified:

* Analytics chart data sources.
* Notifications and Command Center alert data sources.
* Digital Twin runtime panels.
* AI Assistant smart-search source.
* Material Movements backend service and frontend API client.
* Frontend operational static datasets for Analytics, Digital Twin, Notifications, and AI Assistant.
* Inventory transaction modal placeholder and lightweight runtime store seed.
* Production work-order and work-center static panels.
* Backend material movements static fallback records.
* Simulation operational sample data seeder.
* Simulation scenario runner.
* Simulation module provider wiring.
* Components material stock workspace.
* Components stock, transfer, and list workspaces.
* Production BOM modal and material requirements endpoint.
* Inventory outbound modal and dedicated outbound tab.
* Yard 2D/3D maps, tab workspace, operation dialog, API client, hooks, and backend zone endpoint.
* Application sidebar behavior.

Notes:

* Added `Danh mục / Đơn vị` management to `Hệ thống > Cài đặt`, reusing the same Inventory category/type/unit APIs used by Material Master.
* Settings now supports create/edit/deactivate for material categories, material type/specification groups, and units of measure, with active Material Master usage counters.
* Settings displays fixed material usage groups `PRIMARY`, `SECONDARY`, and `CONSUMABLE` with linked material counts; dynamic custom usage groups would require a later DB phase.
* Frontend build passes after Settings catalog/unit management.
* Applied compact section headers globally through shared `SectionHeader`, removing the large repeated `SteelTrack ERP` eyebrow and reducing module header height across tabs/modules.
* Expanded route-aware topbar titles for Inventory, Components, Production, Yard, Projects, Suppliers, QC, Logistics, Procurement, Documents, Analytics, Reporting, Notifications, Master Data, AI, Settings, Users, Roles, Logs, and Backup.
* Frontend build passes after the global module header density pass.
* Moved app quick search to the right side of the topbar next to `LIVE` and added route-aware compact module titles on the left, including `Kho vật tư`.
* Removed the duplicate large Inventory Overview header and tightened Inventory KPI/panel/table/recent-transaction spacing for a denser one-screen cockpit layout.
* Inventory Overview stock table stays capped at 10 rows and recent inbound/outbound panels stay capped at 5 transactions with smaller typography.
* Frontend build passes after the shell header and Inventory Overview density pass.
* Rebuilt Inventory master-data workspace for material categories, material type/specification groups, and units of measure with create/edit/deactivate actions and Material Master usage counts.
* Added Inventory unit CRUD on `/inventory/units` while keeping existing schema unchanged.
* Standardized steel-structure dictionary data: 8 active categories, 24 active material type/specification groups, and 14 active units; unused demo/duplicate records were deactivated instead of hard-deleted.
* Production BOM material selection now groups production-warehouse materials by `materialUsageType` and auto-derives BOM item category from the selected material.
* Backend and frontend builds pass after Inventory master-data and BOM grouping changes.
* Fixed Inventory location validation mismatch for material `001`: detail showed stock at default zone `B01` by falling back to `InventoryItem.zoneId`, while backend selected-location validation counted only line/header zone and returned zero for legacy no-zone inbound lines.
* Backend `getCurrentStockAtLocation` now counts legacy no-zone lines for the selected material default zone, matching material detail `locationBalances`.
* Inbound modal now auto-selects the selected material default zone so new normal UI inbound transactions persist a real `zoneId`.
* SQL verification for material `001`: total stock `1,567`, effective stock at `B01` `1,567`, previous strict line/header-zone stock `0`.
* Backend and frontend builds pass after the location validation fix.
* Fixed Inventory outbound and transfer modal submit locking by auto-selecting valid stock source/destination zones from material location balances or material default zone fallback.
* Fixed outbound expected issue value display to calculate from material detail average cost with material list fallback.
* Added outbound validation messages for missing source stock location and quantity exceeding selected source-zone stock.
* Frontend build passes after the Inventory outbound/transfer modal fix.
* Added transfer transaction time and moved MaterialDrawer to a portal with a cleaner modal-style layout.
* Fixed Inventory `Khác` action menu clipping by rendering the dropdown through a portal.
* Refined inbound/outbound modal layout and added side tabs to the shared material detail modal.
* Unified Inventory material detail display between Overview and Stock using a shared material detail modal.
* Improved transaction modal controls so primary create buttons and native select dropdowns are clearer in the dark UI.
* Restored Inventory transaction modal workflow for inbound, outbound, transfer, and stock-take actions from the global action bar.
* Dedicated Inventory transaction tabs now serve as history/analytics pages, while existing form and mutation logic lives in reusable modal components.
* Updated Inventory transaction page layout order to Form -> KPI -> Filter -> Table for inbound, outbound, transfer, and stock-take pages.
* Completed Inventory Global Action Bar: shared right-aligned action bar beside Inventory tabs, route-based transaction actions, and `MaterialDrawer` create action.
* Removed duplicate Inventory Overview quick actions and the Stock tab create-material filter button while preserving specialized transaction forms.
* Backend and frontend builds pass after API-backed fallback replacement.
* Remaining `Math.random` usages in active modules are for generated document/reference suffixes or randomized simulation mode, not seeded fake operational records.
* Frontend Inventory, Components, Production, and Yard surfaces now use runtime/API data for the touched workflows.
* Current database verification: zero legacy unprefixed material records for `HB200`, `HB250`, `I200`, `PL12`, `PL20`; zero `DEMO` records in the checked Inventory, Components, Production, and Yard tables.
* Active frontend module scan no longer finds `mock-data` folders under `apps/frontend/src/modules`; remaining `demo.` strings in the Simulation seeder are retained only to clean old legacy records.
* Current operational bootstrap result: 5 inventory materials, 10 inventory transactions, 12 components, 6 production orders, 6 yard zones, 72 yard slots, 2 QC checklists, 4 workers.
* Production material warehouse now includes real `[COMPONENT_PRODUCTION]` outbound transactions, but still needs a backend balance/receipt model if it must behave as a fully independent warehouse instead of an issued-material view.
* Latest verification: `pnpm -C apps/backend-api build` and `pnpm -C apps/frontend build` pass after Inventory UI optimization. Vite still reports the existing NODE_ENV and large chunk warnings.
* Yard runtime UI now fetches zones separately from slots, so zones can render on Yard Overview and the 2D map even before slot cards are populated.
* Added Yard cockpit create-zone and create-slot modals backed by the existing Yard APIs; new slots are immediately available to the production finished-goods staging dropdown when they have stack capacity.
* Moved Yard 2D zoom controls into the top location toolbar and added `+ Zone`, global `+ Slot`, and per-zone `+ Slot` actions to avoid covering the map canvas.
* Fixed the actual `/yard/slots` 500 error caused by missing `yard_item_placements.stagedQuantity` and `remainingQuantity` columns in the database; migration `20260605050000_add_yard_placement_quantities` has been applied.
* Authenticated verification now returns 75 Yard slots and 73 stack-available slots, so production finished-goods staging can select slots again.
* Production staging now surfaces backend errors inline instead of appearing unresponsive; QC gate failures are translated with the required action.
* Fixed Production-to-Yard remaining quantity calculation to count placements by `metadata.productionOrderId`, not by shared `componentId`.
* Verified successful staging for `MO-20260603-11563` into `ST-YARD-07/07-08/L1`; `/yard/slots` now returns the new placement.
* QC cockpit now includes a fast production-gate workflow: completed MOs can use `Tạo QC` or `Tạo & duyệt đạt`; the fast path creates/reuses an inspection, starts it, completes it as `PASSED`, and approves it.
* Verified QC gate end-to-end for `MO-20260605-36058`: QC inspection `QC-20260605-1780639947783` was approved, then Production staged `CPL-33167708` to `ST-YARD-C/ST-C-03/L2`.
* Database was reset for a clean end-to-end workflow test. Backup saved at `backups/steeltrack_before_clean_workflow_20260605_132345.dump`; reusable script added at `scripts/reset-clean-workflow.sql`.
* Operational data is now clean: inventory materials/transactions, returns, projects, components, BOMs, production orders, QC inspections, yard placements/movements, activity logs and outbox events are zeroed. Master dictionaries, suppliers, QC checklists, yard zones and yard slots were preserved; all yard slots are `AVAILABLE`.
* Frontend and backend builds pass after the Yard zone/slot runtime fix.

## 2026-06-29

* Sprint BUG.2 validated and corrected Inventory Material Detail analytics timeline direction. `MaterialAnalyticsCockpit` no longer reverses chronological movement rows, `buildMovementTrend()` now fills zero-activity calendar buckets between the material's first and last transaction dates, and chart tooltips now use real `yyyy-MM-dd` date keys rendered as `dd/MM/yyyy`.
* Sprint BUG.1 fixed Material Detail analytics staleness in Inventory. The backend material detail response now includes live `inventoryValue`, and the frontend Material Detail drawer now uses live detail/computed values instead of stale list-row fallback for inventory value. Movement sparklines now sort date buckets chronologically, keep the latest buckets, use absolute outbound quantities, and cost sparklines are based on recent inbound unit prices.
* Created `docs/bugs/material-detail-analytics-staleness-report.md` with the transaction-to-detail sequence, rejected hypotheses, root cause, and verification steps.
* Created `docs/bugs/material-analytics-timeline-validation-report.md` documenting the timeline direction root cause, before/after behavior, validation cases, and affected trend/tooltip behavior.

## 2026-06-30

* Sprint 40PROJ.7 replaces the active Projects WBS metadata bridge with normalized persistence. Added Prisma models and migration for `ProjectTask`, task dependencies, material allocations, component allocations, worker/machine resources, inspections, and task costs.
* Project WBS APIs and `GET /projects/runtime` now read/write `ProjectTask` domain rows while preserving the existing frontend response shape; legacy `Task.description` JSON is migration input only.
* Added Project event foundation activity logs for task/material/cost/inspection changes and created architecture docs for Project task domain, migration, scheduling, resource, cost, inspection, and realtime foundations.
* Sprint 40PROJ.4 upgraded the Projects module toward an execution workspace. Project Detail now includes Overview, Materials, Components, Progress, Cost, Documents, and Logs tabs.
* Added no-migration Project WBS CRUD endpoints backed by existing `Task` records with SteelTrack Project WBS metadata in `Task.description`.
* Added editable multi-level WBS tree grid, task editor, task detail drawer, resource-link visibility, move parent/up/down controls, and recursive delete behavior.
* Added Project list dashboard analytics for progress trend, value trend, work status, and risk alerts using runtime data or empty states.
* Added Project cost control and timeline panels using existing financial, WBS, project progress, and return request read models.
* Created Project execution reports under `docs/ui/project-execution-workspace-v2-report.md`, `project-wbs-crud-report.md`, `project-task-resource-linking-report.md`, `project-cost-control-report.md`, and `project-timeline-report.md`.
* Sprint 40PROJ.5 completed the WBS hierarchy blocker by adding a `Công việc cha` tree select, parent path labels, frontend descendant filtering, and backend circular-parent validation.
* Added Project Detail `Điều hành` command center with execution KPIs, trend panels, dependency warnings, CSS Grid Gantt, upcoming work, and field-photo empty state.
* Extended the WBS metadata bridge with task dependency, material/component resource allocation, task revenue, labor cost, machine cost, other cost, and task-level profit/cost traceability fields.
* Added Task Detail dependency, resource allocation, and task financial sections.
* Created Project reports for command center, hierarchy, dependencies, Gantt, resource allocation, and cost traceability.
* Sprint 40PROJ.6 adds a no-migration Project Scheduling read model for WBS dependencies. Backend responses now calculate scheduled start/finish, forecast finish, cascade delay, and baseline variance from WBS metadata.
* Extended WBS task metadata with baseline dates, worker loading, machine loading, and inspection/acceptance status.
* Refactored Project Detail `Tiến độ` into a three-pane workspace: WBS tree, task scheduling/detail pane, and action/resource/risk pane.
* Project Command Center now surfaces cascade delay, resource shortages, procurement readiness warnings, and inspection/handover counters from WBS metadata.
* Created Project scheduling, baseline, resource loading, procurement readiness, inspection/handover, and detail layout refactor reports.

## 2026-07-02

* Sprint INV.BUG.5 hardened inbound inventory creation. Backend `POST /inventory/transactions` now rejects `IMPORT`/`INBOUND` lines with positive quantity unless `zoneId`, `slotId`, and `level` are supplied, returning the Vietnamese validation message required by warehouse operations.
* Sprint INV.UGX.1 added inbound smart suggestions from real transaction history. The Inventory inbound modal now requests last inbound location, last inbound price, and 30-day weighted average price; it auto-fills the last price when available, allows override, and warns when the new price differs by more than 30%.
* The active inbound modal and legacy inbound wizard now block submit when a storage location is missing. The inbound modal highlights location fields and shows the missing-location summary before submission.

## 2026-07-07

* EPIC107 SNAP.1 added persisted snapshot tables for Inventory, Projects, and Logistics dispatch dashboards.
* Added snapshot repositories, writer, reader, validator, and rebuilder integration under the backend runtime foundation.
* Background snapshot rebuild jobs now write real persisted snapshots instead of returning `skipped`.
* Runtime metrics now track snapshot hit, miss, rebuild, and lag counters.
* Verified the background path writes real Inventory and Project snapshot rows. Dispatch snapshot rows remain empty in the current validation database because no dispatch orders exist.
* `prisma migrate deploy` / `migrate status` are clean for the SNAP.1 migration. `migrate dev` remains blocked by pre-existing migration drift in `20260630100000_project_task_domain` and the unmanaged `inventory_location_stocks_backup` table; no destructive reset was run.

## 2026-07-08

* EPIC115 completed Project Core Compliance hardening without UI, route, workflow, business-logic, or public API contract changes.
* `ProjectsService` no longer injects or calls `PrismaService` directly; Project template, WBS, component return, table readiness, and ProjectTask relation persistence now route through `ProjectsRepository`.
* Project mutations now publish persistent `project.*` outbox events and request Background Engine snapshot updates instead of relying only on activity-log rows.
* Runtime Metrics now expose Project-specific snapshot/read-model counters: `projectSnapshotHit`, `projectSnapshotMiss`, `projectReadModelHit`, and `projectFallbackCount`.
* Operations Center overview now includes an additive `projects` platform-health section covering repository, read model, snapshot, event/outbox, background job, runtime, and Project counts.
* Project is now a Core Platform Architecture Freeze Candidate at approximately 95% compliance. Final freeze remains blocked until Project Detail tab payloads have persisted snapshot coverage.
* EPIC107 SNAP.2 added a backend `DashboardReaderService` strategy layer with `SnapshotReaderStrategy`, `RuntimeAggregateStrategy`, and module feature flags.
* Inventory cockpit dashboard reads now prefer persisted `InventoryDashboardSnapshot` rows and transparently fall back to runtime aggregate when disabled, missing, stale, or mismatched.
* Projects runtime dashboard reads now prefer persisted `ProjectDashboardSnapshot` rows for project progress/delay values with runtime fallback and parity warnings.
* Logistics dispatch dashboard reads now prefer persisted `DispatchDashboardSnapshot` rows when dispatch snapshots exist; the current dataset has no dispatch orders, so fallback is expected.
* Runtime metrics now track snapshot fallback, stale count, snapshot age, and snapshot confidence in addition to hit/miss/rebuild/lag.
* EPIC108 added backend-only enterprise validation services for snapshot parity, benchmark execution, background recovery inspection, and controlled stress harnesses. No public API, UI, workflow, or business logic behavior changed.
* EPIC109 OPS.1 added the first read-only Operations Center at `/operations-center`.
* Added `GET /operations-center/overview` to aggregate runtime metrics, background jobs, outbox events, snapshot freshness, cache/read-model effectiveness, database size, storage usage, API ranking, query ranking, performance score, architecture score, and rule-based system alerts.
* Operations Center uses existing cockpit UI primitives and does not change business workflows, existing API contracts, Prisma schema, or runtime behavior.
* EPIC111 completed a read-only Core Platform Compliance Audit for Inventory and Production.
* Created Inventory and Production compliance reports, module scorecard, technical debt priority list, and separate refactor roadmaps under `docs/audit/`.
* Audit conclusion: Inventory is approximately 72% Core Platform compliant and ready for targeted repository/event/read-model cleanup; Production is approximately 52% compliant and should not receive major MES expansion before domain, repository, event, and snapshot foundations are hardened.
* EPIC112 INV.CORE.1 completed Inventory Core Compliance hardening without changing UI, workflow, Prisma schema, or public API contracts.
* Inventory active services/controllers now route persistence through `InventoryRepository`; direct Prisma usage in `apps/backend-api/src/modules/inventory` is confined to the repository.
* Added `InventoryReadModelService` for Material Detail and inbound suggestion composition, plus `InventoryEventService` for persistent outbox-backed Inventory lifecycle events.
* Operations Center overview now includes an additive `inventory` platform-health section for repository, read model, snapshot, event/outbox, jobs, cache, and Inventory operational counts.
* EPIC116.1 completed Projects Architecture Freeze v1.0 hardening and backend startup repair.
* Project Detail snapshots are now limited to reusable execution summary tabs (`overview`, `materials`, `components`, `progress`, `command`, `site`, `costs`); `documents` and `logs` remain repository read-model fallback paths to avoid per-screen snapshot sprawl.
* Backend startup root cause was fixed in `apps/backend-api/tsconfig.build.json`: production builds now compile only `src/**/*.ts` with `rootDir: ./src` and emit `dist/main.js`, matching `node dist/main`.
* Verified `pnpm -C apps/backend-api start`, `start:dev`, and `start:prod` all reach `Nest application successfully started`; test runs were timeout-terminated because the server commands are long-running.
* EPIC117 completed a read-only Inventory Business Completion audit without changing UI, API contracts, Core Platform, Repository, Snapshot, Event, or Background Engine code.
* Inventory ledger/location/item snapshot data is internally consistent in the current database: 0 item quantity mismatches, 0 location bucket mismatches, 0 negative location stocks, and 0 missing/zero transaction valuations.
* Inventory Business Freeze is BLOCKED because 3 `InventoryMaterialSnapshot` rows differ from live location stock, controller-level transaction DTO validation is not yet formalized, and Stock Take still needs a final first-class lifecycle decision.
* EPIC117.1 completed Inventory Business P0 remediation and approved Inventory Business Freeze v1.0.
* Corrected `InventoryMaterialSnapshot.currentStock` to use canonical live location balances instead of incomplete historical transaction reconstruction.
* Reconciled the three reported material snapshots through persistent outbox events and Background Engine jobs; 23/23 active materials now match live stock.
* Added typed Zod validation for Inventory transaction/item, material master, category, unit, and material-type write endpoints; no `@Body() any` remains in the Inventory module.
* Completed transaction-line validation for warehouse, zone, slot, level, unit price, and total amount while retaining legacy request compatibility.
* Retained adjustment-backed Stock Take for v1.0 and documented a first-class session/approval architecture for Phase 2.

## 2026-06-02

Completed:

* Added transaction-driven Inventory runtime and operational workspace.
* Added Components operational pages for structure stock, transfers, internal QC, and fabrication history.
* Added Production BOM foundation, routing, Manufacturing Orders, material issues, and production logs.
* Linked Manufacturing Orders to Components.
* Added production execution actions for starting, completing, and staging finished structures to Yard.
* Replaced Yard demo slots with runtime API data and polling-based operational refresh.
* Applied the production foundation Prisma migration.
* Added real Production BOM creation from Components and Production workspaces.
* Removed embedded BOM material drafting from component creation; components now store only structure master data.
* Required Manufacturing Orders to select a BOM belonging to the selected component.
* Generated Manufacturing Order execution stages from the selected BOM routing.
* Added working BOM clone and archive actions in the Production BOM registry.
* Added Yard operational cockpit with realtime KPI strip, operational tabs, slot drill-down, level occupancy, structure details, crane status, and movement feed.
* Added Yard 2D spatial layout from real zone/slot placements.
* Added top-down React Three Fiber Yard viewer using the supplied crane and structure GLB assets.
* Added Yard submenu navigation for overview, 2D, 3D, inbound, outbound, internal transfer, internal QC, and history.
* Added deterministic Yard cockpit demo data with six operational zones, 72 slots, 12 staged structures, two cranes, stacked placements, and movement history.
* Added legacy Yard slot cleanup during simulation bootstrap so repeated demo bootstraps keep spatial metrics stable.
* Added working Yard inbound, outbound, and internal-transfer operator workflows backed by the existing placement APIs.
* Added a shared industrial Yard workflow dialog with component selection, crane coordination, destination slot suggestion, operational summary, and occupancy preview.
* Replaced the flat Yard slot grid with a color-coded zone cockpit over the supplied Yard reference image.
* Added zone drill-down popup with slot occupancy, horizontal stack-level cross-section, and structure detail list.
* Enlarged the Yard 3D digital twin and rendered structures across the active Yard slots with more visible crane assets.
* Verified Yard placement lifecycle with a real `place -> move -> remove` API smoke test and confirmed source and destination occupancy return to zero.

Modified:

* Sidebar navigation for Components and Production workspaces.
* Production frontend routes and operational pages.
* Production backend controllers, services, repositories, DTOs, and Prisma schema.
* Yard runtime frontend integration.
* AI state documentation structure.

Notes:

* Inventory operational foundation is complete.
* Components is approximately 70% complete.
* Production is approximately 65% complete.
* Yard is approximately 60% complete with configured demo zones, working operator workflows, zone drill-down, and enlarged 3D spatial viewer.
# 2026-07-13 - EPIC144 Components Runtime Platform

* Added Components-specific snapshot hit/miss/age/lag, fallback, and live
  read-model counters to the shared Runtime Metrics service.
* Instrumented Components snapshot reads and repository fallback without
  changing read semantics, API contracts, or business logic.
* Added additive Components Platform Health to Operations Center for repository,
  read model, snapshots, feature flag, jobs, Outbox, parity, and runtime status.
* Kept event freshness scoped to the existing `component.updated` route; no
  missing workflow or canonical event was invented.
# 2026-07-13 - EPIC150 QC Core Platform Audit

* Audited QC repository ownership, transaction boundaries, ADR011 read paths,
  snapshots, runtime metrics, Operations Center, events and workflows.
* Identified direct Prisma access, capped/unbounded Cockpit aggregation,
  client-side business filtering, synthetic trends, non-atomic Outbox events and
  incomplete inspection/NCR transition controls.
* Assessed QC at approximately 31% Core Platform compliance and documented the
  EPIC151-154 remediation sequence.
* Made no application, UI, API, workflow, business, schema or migration change.
# 2026-07-13 - EPIC151 QC Repository Foundation

* Removed direct Prisma access from `QcService`; QC service repository coverage
  is now 100%.
* Moved operational code generation and existing Cockpit source queries behind
  QC repositories without changing query or response semantics.
* Made QC mutation, ActivityLog and existing audit/domain/notification Outbox
  records atomic through the same repository transaction client.
* Added focused transaction-boundary coverage and changed no UI, API, workflow,
  business rule, schema, snapshot, runtime or Operations Center behavior.
# 2026-07-13 - EPIC152 QC Workspace Live Read Model

* Added additive QC repository live read-model endpoints for workspace, detail,
  paginated history and NCR summary.
* Moved QC filtering, sorting, pagination, KPI/NCR/queue aggregation and trend
  calculation from React/runtime arrays to `QcReadModelRepository`.
* Cut the active QC workspace over to a parameterized TanStack Query family
  without changing layout, styling, actions or mutation contracts.
* Removed synthetic QC trend dates/values; empty history now renders an explicit
  no-data state.
# 2026-07-13 - EPIC153 QC Snapshot Foundation

* Added additive `QcDashboardSnapshot` and `QcInspectionSnapshot` persisted
  domain models and deployed their migration without backfill.
* Added QC snapshot repository, reader, writer, validator, rebuilder, dispatcher
  and `USE_QC_SNAPSHOT` integration using the shared Core Platform.
* Routed the five existing QC domain events to background snapshot updates and
  added safe repository fallback for missing/stale snapshots.
* Added focused snapshot tests and changed no UI, workspace read model,
  workflow, business logic, Runtime Metrics or Operations Center UI.
# 2026-07-13 - EPIC154 QC Runtime Metrics and Operations Center

- Added QC snapshot hit/miss/age/lag, repository fallback, and live read-model counters to the shared `PerformanceMetricsService`.
- Instrumented QC snapshot and live read paths without changing read behavior or API contracts.
- Added additive QC Platform Health data to Operations Center for repository, read model, snapshot, feature flag, jobs, outbox, parity, and runtime state.
- Added focused QC runtime tests and five EPIC154 runtime reports.
- Preserved ADR011: QC workspace remains live read model; dashboard remains snapshot-first with repository fallback.
# 2026-07-13 - EPIC160 Yard Core Platform and Business Audit

- Audited Yard business architecture, repository boundary, ADR011 read paths, snapshot/runtime/Operations Center readiness, event flow, workflow, and active UI data sources.
- Confirmed real zone/slot/placement/movement foundations but identified missing reservation, QC receipt, hold/release, loading-task, and dispatch handoff workflows.
- Identified non-atomic domain Outbox, service-level cross-module Prisma access, unbounded workspace reads, partial 12-row history aggregation, active 3D demo fallback, and synthetic QC statuses.
- Added ten Yard audit reports and an EPIC161-164 remediation roadmap.
- No application code, API, schema, migration, workflow, or data changed.
# 2026-07-13 - EPIC161 Yard Repository Foundation and Atomic Outbox

- Removed EventBus post-commit persistence and all direct transaction-client Prisma model access from `YardService`.
- Added repository-owned Component/Production compatibility persistence and atomic Outbox upsert methods.
- Moved existing Yard audit and domain Outbox rows into the same transaction as business mutations and ActivityLog.
- Preserved existing event names, payloads, idempotency semantics, API contracts and business behavior.
- Added focused atomic transaction tests and four EPIC161 reports.
- No frontend, schema, migration, Inventory, Components, Production or QC source changes.
# 2026-07-13 - EPIC162 Yard Workspace Live Read Model

- Added bounded `YardReadModelRepository` and additive `/yard/read-model/workspace` API.
- Moved Yard KPI, movement totals/trend/history, component distribution, crane availability, zone utilization and QC queue classification to repository reads.
- Cut active Yard page from five runtime queries to one live workspace query while preserving mutation invalidation and presentation.
- Added server-side movement item/location/date/type filtering and independent pagination.
- Removed active 3D demo data and synthetic row-index QC statuses.
- Preserved legacy endpoints, API workflows, styling, schema, Snapshot and Runtime layers.
# 2026-07-13 - EPIC163 Yard Snapshot Foundation

- Added additive `YardDashboardSnapshot` and `YardWorkspaceSnapshot` Prisma models and migration without deploying or backfilling data.
- Added `YardSnapshotRepository` with calculation, persisted read and atomic upsert paths.
- Integrated Yard with shared Snapshot Reader, Writer, Validator, Rebuilder, Dispatcher scope, feature flag and module registration.
- Routed all existing Yard domain events to background snapshot updates without creating new workflows/events.
- Added `YardSnapshotReadService` with repository live fallback and missing/stale background enqueue; operator workspace remains ADR011 live.
- Added repository/writer/reader tests and verified existing Components/QC writer regression suites.
# 2026-07-13 - EPIC164 Yard Runtime Metrics and Operations Center

- Added Yard snapshot hit/miss/age/lag, fallback and live-read counters to the shared Runtime Platform.
- Instrumented Yard snapshot-first and ADR011 live read paths without changing read semantics.
- Added additive Yard Platform Health and Yard snapshot rows to the existing Operations Center response.
- Added focused Yard runtime tests and five EPIC164 runtime reports.
- Changed no frontend, UI, workflow, repository, read model, snapshot schema or business logic.
# 2026-07-13 - EPIC170 Core Platform Certification Audit

- Audited Inventory, Components, Production, QC and Yard against Repository,
  ADR011, Snapshot, Runtime, Operations Center, Feature Flag, Background,
  Outbox and Audit standards.
- Confirmed repository ownership, shared feature flags, dispatcher reuse and
  Operations Center coverage across all five modules.
- Blocked Core Platform v1.0 certification on active ADR011 violations,
  incomplete dashboard snapshot cutovers and non-atomic event paths.
- Added five certification/gap/roadmap reports; changed no application code.
# 2026-07-13 - EPIC171 Inventory ADR011 Remediation

- Replaced Inventory Materials snapshot-first list reads with bounded repository
  live queries while preserving API and UI contracts.
- Cut Material Detail and Locations to canonical live location/transaction read
  models; Material History and Transactions remain paginated live reads.
- Kept Inventory Overview snapshot-backed and changed no dashboard code.
- Added focused ADR011 regression tests and four certification reports.
# 2026-07-17 - RFC002 Production Aggregate Implementation

- Added canonical Production Order, Work Order, Completion, Scrap and Rework
  aggregate persistence with an additive deployed migration.
- Added AD-017 state validation, optimistic concurrency and durable command
  idempotency in the internal Production command boundary.
- Persisted timeline, ActivityLog, audit Outbox and AD-019 V1 domain facts in
  the same Production repository transaction.
- Preserved AD-018: Issue/Return/recoverable Scrap use Inventory-owned posting;
  Consumption and Completion do not mutate stock.
- Added focused aggregate, command atomicity and material event contract tests;
  public API and UI remain unchanged.

# 2026-07-17 - RFC014 Enterprise Production Hardening

- Prevented overlapping Background Worker timer ticks and made shutdown await
  the active batch.
- Added bounded safe error persistence for Jobs, Outbox and Projection failures,
  plus warning-only stale-lock diagnostics.
- Added JWT protection to internal runtime events, metrics, telemetry, integrity
  and simulation endpoints without changing authenticated response contracts.
- Repaired two stale test harnesses and restored a clean full backend regression
  result of 69/69 suites and 175/175 tests.
- Added focused hardening regression coverage; no schema, migration, business,
  event-contract or frontend behavior changed.

# 2026-07-17 - RFC015 Production Deployment Readiness

- Added strict production startup configuration and secret/feature-flag
  validation, controlled CORS, dynamic host/port and graceful shutdown hooks.
- Added liveness and database-backed readiness probes and removed JWT payload
  console logging.
- Added a reproducible non-root backend Docker image, production Compose
  migration gate, deployment environment template and exact pnpm toolchain pin.
- Built and inspected the real image and validated Prisma inside it; no frontend,
  schema, migration, business, CQRS, Projection or Aggregate behavior changed.

# 2026-07-18 - RFC017 Production Readiness Blocker Resolution

- Applied a global deny-by-default JWT guard with an explicit allowlist limited
  to health, login and token refresh routes.
- Added owner-checked lease renewal, stale claim recovery and compare-and-set
  completion/failure handling for Background Jobs and Outbox dispatch.
- Converted the pending RFC013 indexes to online concurrent creation with a
  bounded lock timeout and automated migration-safety validation.
- Preserved business behavior, public response contracts, frontend and schema;
  the migration remains pending production-like clone measurement and deploy.

# 2026-07-18 - EPIC UI003B Frontend API Client Consolidation

- Consolidated all active authenticated frontend requests on `lib/api`.
- Removed Inventory's module-specific Axios instance and direct global Axios
  calls from runtime overview, telemetry and event-history reads.
- Converted both legacy shared clients into compatibility re-exports with no
  independent base URL, interceptor or authentication behavior.
- Preserved API contracts, query keys, hooks, DTOs, routes and business logic.

# 2026-07-18 - EPIC UI005 Production Workspace and Enterprise Forms

- Standardized active Production routes on the Inventory-derived Enterprise
  workspace with explicit primary loading, empty and error presentation.
- Added one shared Enterprise form/control/action layer and migrated
  Manufacturing Order, BOM, Material Return, Consumption and Yard staging.
- Removed Production browser-prompt mutations and custom modal shells; shared
  dialogs now own viewport scroll, focus containment, Escape and restoration.
- Preserved backend, API contracts, query keys, DTOs, routes, permissions and
  business behavior; no mock data was added.

# 2026-07-21 - Components Inventory Structural Alignment

- Compared Components Overview/List against Inventory Inbound/Materials by JSX
  hierarchy, wrapper ownership and grid section structure.
- Removed the double workspace wrapper from the two target Components pages and
  aligned hero grids, right rails and bottom analytics with the Inventory canon.
- Preserved backend, API, query hooks, routes and business behavior.
- Completed a source-level final UI parity checklist and fixed remaining
  visual differences in Components table width/density, panel title branch,
  right-rail card primitives and chart helper contracts.

# 2026-07-21 - EPIC 0 Full UI Audit

- Created an audit-only UI inventory for Inventory, Components, Production,
  Projects, Suppliers, QC, Logistics, Planning and Admin.
- Classified visible routes, data sources, empty/placeholder surfaces and
  missing UI capabilities against the Inventory canon.
- Added a master UI backlog without modifying frontend/backend source code.

# 2026-07-21 - EPIC 0.5 Master Backlog Prioritization

- Reclassified full UI audit findings into P0 Critical, P1 Production-ready and
  P2 Future backlog groups.
- Added module completion percentages and a nine-phase execution plan from
  Inventory through Admin.
- Kept the work documentation-only; no frontend/backend source code changed.

# 2026-07-23 - Sprint 5 Historical Dashboard Integration QA

- Audited the `/history` Executive Historical Dashboard frontend integration
  against the read-only Historical API surface.
- Gated TanStack Query calls by active tab so Snapshot Jobs no longer triggers
  dashboard/inventory/monthly reads, and non-job tabs no longer fetch jobs.
- Added a visible Historical Dashboard error panel with retry for active failed
  queries, covering 404/500/offline/network failures without changing API
  contracts.
- Removed scoped lint issues in the Historical Dashboard page by moving
  pagination reset behavior into filter/tab event handlers and stabilizing empty
  row fallbacks.
- Preserved Prisma schema, Snapshot Engine, Historical API architecture,
  backend behavior and UI design.

# 2026-07-23 - Project Maintenance and Warehouse Realtime Dashboard

- Removed archived/backup/quarantine frontend folders from active ESLint
  traversal and converted legacy-only strict rules into warnings so CI lint can
  run against active source without being blocked by old debt.
- Added Vitest, jsdom and Testing Library setup, plus smoke coverage for the
  Historical Dashboard route without modifying Historical Dashboard behavior.
- Split Vite vendor chunks by package/manual groups to reduce the previous
  oversized monolithic vendor output.
- Added the frontend-only `/warehouse-realtime` operational cockpit under
  Inventory navigation, using existing Inventory overview/material/transaction
  endpoints with TanStack Query polling.
- No backend, schema, migration, Historical Dashboard, Snapshot Engine or
  Historical API code changed.

# 2026-07-28 - COMPONENT DOMAIN.5E Physical Lifecycle and QC Handoff

- Connected `ComponentInstanceExecution` evidence to canonical physical state:
  start moves instances to `IN_PRODUCTION`, and completion moves to
  `PRODUCED_WAITING_QC` only after every ProductionOrder WorkOrder is completed
  for that same ComponentInstance.
- Connected final QC inspection and NCR disposition to physical instance states
  `QC_PASSED`, `QC_FAILED`, `REWORK`, `SCRAPPED` and `USE_AS_IS`.
- Added authenticated finished-goods eligibility read API at
  `GET /components/instances/finished-goods` without creating inventory, yard
  placement, schema or dashboard side effects.
- Added targeted lifecycle/QC tests and runtime DB smoke for DOMAIN5E fixture.

# 2026-07-28 - STABILITY.DOMAIN5G.2 ProductionExecution REST Commands

- Exposed existing `ProductionCommandService` ProductionExecution lifecycle
  commands through REST under `/production/commands/executions/...`.
- Added additive DTO validation for execution start/versioned/reasoned
  commands and controller tests for execution command context forwarding.
- Certified authenticated HTTP runtime flow from Component Definition through
  ProductionExecution completion, WorkOrder completion, QC PASS/FAIL, NCR and
  Finished Goods eligibility without schema, migration, Inventory or Yard
  changes.

# 2026-07-28 - STEELTRACK UI.OPS.2 Visual & Form Convergence

- Tightened Components create-component modals around canonical project
  requirement semantics: project context, component definition, note and summary
  sections.
- Converted Production BOM UI away from production-stock dependent selection and
  toward real Material Master lookup for Engineering BOM authoring.
- Reorganized Production Order creation into requirement, engineering basis,
  quantity, planning and summary sections without changing backend contracts.
- Refined QC inspection, final physical-instance QC and NCR detail surfaces into
  bounded Inventory-style modal/drawer shells with compact headers, internal
  scrolling and consistent footer actions.

# 2026-07-28 - UI.OPS.3A Production Material Flow Canonicalization

- Replaced legacy Production material availability helpers that derived stock
  from `[COMPONENT_PRODUCTION]` transaction remarks with canonical
  `InventoryLocationStock` reads for warehouse `PRODUCTION`.
- Decoupled Engineering BOM creation from current Production stock; BOM now
  stores Material Master requirements and no longer blocks zero-stock materials.
- Enriched the BOM picker with Production stock, reserved quantity, available
  quantity and Production locations while preserving Material Master identity.
- Updated Components Production Material Warehouse availability to subtract
  active reservation quantities and detect recent/history transactions through
  PRODUCTION transaction lines, not remarks.
- Added tests for MAIN -> PRODUCTION transfer conservation, BOM no inventory
  side effects and Production availability from canonical balances.
