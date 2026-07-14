# Project Status

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
