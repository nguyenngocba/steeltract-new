# Components Module

## COMPONENT DOMAIN.5D - ComponentInstanceExecution Schema Foundation

Implemented on 2026-07-28.

Status: **IMPLEMENTED - MIGRATION/TEST/BUILD/RUNTIME PASS**

- Added physical execution evidence table `ComponentInstanceExecution`.
- One row represents one physical ComponentInstance participating in one
  WorkOrder / ProductionExecution run.
- Added statuses: `ASSIGNED`, `RUNNING`, `COMPLETED`, `CANCELLED`.
- Added repository/service/API foundation for assign/start/complete/cancel and
  instance execution history.
- No `ComponentInstance.state` transition is automatic yet.
- No QC, Inventory, Yard or Finished Goods side effects were created.
- Runtime smoke verified partial physical operation evidence and cleanup.
- Deliverable:
  `docs/audits/component-domain5d-instance-execution-foundation-report.md`.

## COMPONENT DOMAIN.5C - Production Instance Execution Granularity Audit & Design

Completed on 2026-07-28.

Status: **DESIGN COMPLETE - AWAITING DOMAIN.5D SCHEMA FOUNDATION**

- Confirmed current Production execution evidence is order/work-order/run and
  aggregate quantity level only.
- Confirmed the system cannot identify which physical `ComponentInstance`
  rows started/completed each operation.
- Confirmed partial production cannot be represented truthfully today.
- Recommended additive `ComponentInstanceExecution` as the physical
  per-instance operation ledger.
- Deliverable:
  `docs/audits/component-domain5c-production-instance-execution-design.md`.

## COMPONENT DOMAIN.5A - QC Physical Instance Lineage Foundation

Implemented on 2026-07-27.

Status: **IMPLEMENTED - MIGRATION/TEST/BUILD/RUNTIME PASS**

- QC can now structurally reference canonical `ComponentInstance` rows through
  nullable `componentInstanceId` lineage on inspections, NCRs and QC
  inspection snapshots.
- Legacy QC rows remain readable with `componentInstanceId = NULL`.
- NCRs created from instance-level inspections preserve the same physical
  instance identity.
- Runtime smoke verified one DOMAIN4 instance-level QC inspection and NCR with
  no ComponentInstance, Inventory, Yard or Finished Goods side effects.
- DOMAIN.5 Finished Goods gating can now resume.

## COMPONENT DOMAIN.5B - ComponentInstance IN_PRODUCTION State Gate

Implemented on 2026-07-28.

Status: **IMPLEMENTED - DOMAIN.5 BLOCKED BY PRODUCTION GRANULARITY**

- Added additive enum value `ComponentInstanceState.IN_PRODUCTION`.
- Deployed migration
  `20260728090000_component_domain5b_instance_in_production_state` after backup
  `/tmp/steeltrack-domain5b-before-20260728.dump`.
- Existing `ComponentInstance` rows were not backfilled; all 16 existing rows
  remained `PLANNED`.
- No Production/QC/Finished Goods transition code was implemented because
  current Production execution evidence does not identify physical instance
  IDs or serial ranges.

## COMPONENT DOMAIN.5 - Production Completion, QC & Finished Goods Gate

Audited on 2026-07-27 and resumed on 2026-07-28.

Status: **BLOCKED BY PRODUCTION INSTANCE GRANULARITY GATE**

- Current QC schema cannot structurally reference `ComponentInstance`.
- `QcInspection` and `NonConformanceReport` only reference Production Order,
  Production Stage, legacy Component and Project.
- Finished Goods eligibility cannot be implemented safely from QC metadata or
  legacy `Component.status`.
- Minimal additive schema proposal is documented in
  `docs/audits/component-domain5-qc-finished-goods-report.md`.
- No code/schema/migration/runtime write was performed for DOMAIN.5.
- DOMAIN.5A has closed the schema blocker. Remaining DOMAIN.5 work is
  Production completion, instance QC state transitions and Finished Goods
  eligibility.
- DOMAIN.5B has closed the `IN_PRODUCTION` enum blocker.
- DOMAIN.5 remains blocked because Production start/completion is currently
  order/work-order/completed-quantity level and does not identify which
  physical `ComponentInstance` rows started or completed.
- Next gate: define instance-level Production execution evidence before moving
  instances through `PLANNED -> IN_PRODUCTION -> PRODUCED_WAITING_QC`.

## COMPONENT DOMAIN.4 - Production Integration & Physical Instance Creation

Implemented on 2026-07-27.

Status: **IMPLEMENTED - TEST/BUILD/RUNTIME SMOKE PASS**

- Production Order release now creates canonical `ComponentInstance` rows for
  requirement-bound Production Orders.
- Instances preserve Component, Revision, BOM definition, Production Order,
  Requirement and Project lineage.
- Initial instance state is `PLANNED`, not Finished Goods, QC PASS, Yard stock
  or inventory.
- Instance timeline rows are created with
  `eventType=component.instance.planned` from Production release.
- Existing Component definitions and DOMAIN3 requirements remain readable and
  still do not create physical instances until Production release.
- Finished Goods gating remains scheduled for DOMAIN.5.

## COMPONENT DOMAIN.3 - Component Create & Project Requirement Conversion

Implemented in code on 2026-07-27.

Status: **IMPLEMENTED - MIGRATION/TEST/BUILD PASS**

- Added additive typed engineering fields to `Component`:
  `componentType String?`, `profile String?`, and `@@index([componentType])`.
- Added canonical create API:
  `POST /components/foundation/definition-requirements`.
- New create operation atomically creates one engineering Component definition
  and one `ProjectComponentRequirement.requiredQuantity`.
- New create does not create ComponentInstances, ProductionOrders, inventory
  quantity, Finished Goods, Yard stock or Component Inventory.
- Component code and requirement number are generated by the backend and guarded
  by unique constraints with retry.
- Components create modal now says `Tạo hồ sơ cấu kiện`, explicitly selects
  `Công trình / Dự án`, and labels quantity as `Số lượng yêu cầu`.
- Components read models prefer typed `componentType/profile` and requirement
  quantity, with legacy `description` JSON fallback for older records.
- Backup `/tmp/steeltrack-domain3-before-20260727.dump` was created and
  verified, then migration
  `20260727223000_component_domain3_typed_definition_fields` was deployed.
- Runtime smoke through the authenticated API created exactly one Component
  definition and one ProjectComponentRequirement, with zero ComponentInstances,
  ProductionOrders or InventoryTransactions.
- STABILITY7 fixture records and B1 released BOM lineage remain readable.

## COMPONENT DOMAIN.2 - Canonical Schema Foundation

Implemented on 2026-07-27.

Status: **IMPLEMENTED - MIGRATION/TEST/BUILD PASS**

- `Component` remains the canonical engineering definition and existing legacy
  fields remain readable.
- Added additive schema foundation:
  `ProjectComponentRequirement`, `ComponentInstance` and
  `ComponentInstanceTimeline`.
- Added optional `ProductionOrder.componentRequirementId` for future
  Production lineage.
- Added `/components/foundation/requirements` and
  `/components/foundation/instances` read/create API foundation protected by
  JWT and Zod validation.
- Requirement quantity is now represented as planning demand and does not
  create inventory or physical instances.
- ComponentInstance create starts as physical identity only; it cannot be
  created directly as QC-passed or Finished Goods through the foundation DTO.
- Controlled DOMAIN2 runtime smoke verified multi-project requirements for one
  Component, PLANNED instance semantics, STABILITY7 readability and B1 released
  BOM lineage.
- No frontend, Inventory, QC, Yard, Logistics, Historical Dashboard or Snapshot
  Engine conversion was performed.

## Component Manufacturing Workflow Sprint B1

Implemented on 2026-07-27.

Status: **IMPLEMENTED - TEST/BUILD PASS**

- Engineering BOM line and routing payloads are now validated through a strict
  materialization contract before validation/release.
- Released Component BOM definitions must contain materializable lines:
  material identity, positive quantity, non-negative waste, normalized material
  category, optional alternatives, and valid routing steps.
- `replaceBom` stores normalized Engineering BOM line/routing JSON and computes
  the content hash from the normalized contract shape.
- `validateBom` and `releaseRevision` refuse non-materializable Engineering
  BOM definitions before Production can consume them.
- No Component UI, Inventory, QC, Yard, Logistics, Projects, Historical
  Dashboard, Snapshot Engine, or third BOM model was introduced.

## Component Manufacturing Workflow Sprint A

Implemented on 2026-07-23.

Status: **IMPLEMENTED - TEST/BUILD PASS**

- Existing Component aggregate lifecycle is now used as the Engineering Release
  authority for manufacturing.
- `ComponentLifecycleState.DRAFT` represents unreleased engineering work.
- `ComponentLifecycleState.ACTIVE` with a current released Component Revision
  and released BOM definition represents `Released for Production`.
- Production Order creation now refuses unreleased Components, preventing Draft
  engineering records from entering manufacturing.
- No Component schema change was required for Sprint A; later workflow states
  remain scheduled for Sprint B-J decisions/implementation.

## Component Draft Lifecycle Hardening

Implemented on 2026-07-23.

Status: **IMPLEMENTED - TEST/BUILD PASS**

- Legacy Component creation now assigns `ComponentLifecycleState.DRAFT` and
  `aggregateVersion=1`, aligning it with the canonical Components command
  service.
- Components read models now label draft components as `Draft`.
- Draft components are excluded from finished-goods stock counts in Components
  overview/project KPI paths.
- Existing legacy components with `lifecycleState=null` remain readable for
  compatibility.
- Full operational lifecycle states beyond the current schema remain a pending
  architecture/schema decision.

## EPIC 2 Components Completion

Implemented on 2026-07-21.

Status: **IMPLEMENTED - BUILD PASS, BROWSER QA PENDING**

- Production/BOM, Stock, Material Stock, Transfers, Internal QC, History and
  Reports now use Inventory-canon workspace primitives for panels, chart cards,
  table hero surfaces and pagination.
- Hardcoded sparkline/trend arrays and synthetic chart fallback values were
  removed from active Components UI paths.
- History filters now use the real read-model search/action contract instead
  of non-functional dropdown/date controls.
- Reports no longer fabricates lifecycle chart values from history row indexes.
- Internal QC still uses real component lifecycle data because an authoritative
  Components QC/NCR contract is not available; unsupported NCR data renders a
  truthful empty state.
- Backend, API, React Query, route, permission, schema and business behavior are
  unchanged.

## Components Inventory Canon Alignment

Implemented on 2026-07-21.

Status: **IMPLEMENTED - VISUAL QA PENDING**

- Components Overview now follows the Inventory Overview rhythm more closely:
  KPI scan, compact filters, dominant table hero, right analytics rail and
  independent lower queue section.
- Components List now follows the Inventory Materials rhythm: filter panel,
  table hero with stable empty rows, Inventory pagination and a fuller right
  analytics rail.
- No backend, API, React Query, permission, route or business behavior changed.

## EPIC BUSINESS001 Steel Structure Domain Completion

Implemented on 2026-07-18.

Status: **IMPLEMENTED - VISUAL QA PENDING**

- Components Overview, List, Internal QC and Reports now use component
  lifecycle, fabrication, QC wait, ready-to-ship and shipping language.
- Placeholder-style NCR counts were removed where no authoritative NCR contract
  exists; existing lifecycle-derived queues are used instead.
- Project distribution and lifecycle status remain derived from existing read
  data only.
- No backend, API, React Query, permission or business behavior changed.

## UX Review Round 2

Implemented on 2026-07-18.

Status: **IMPLEMENTED - VISUAL QA PENDING**

- Components Overview right-side cockpit now prioritizes status distribution,
  activity and project distribution.
- Added QC waiting and ready-to-ship queue cards using existing component
  status/location rows.
- Chart cards were increased in visual weight to match Inventory's cockpit
  usefulness.
- No backend, API, React Query, permission or business behavior changed.

## UX Review Round 1

Implemented on 2026-07-18.

Status: **IMPLEMENTED - VISUAL QA PENDING**

- Components Overview table now shows Top N rows in the dashboard context.
- The table card exposes `Xem tất cả` and routes to `/components/list` for the
  full Enterprise Table workspace.
- Components List remains the full workspace with filters, pagination and
  detail drawer.
- Short dashboard component lists use a smaller card height to reduce empty
  space.
- No backend, API, React Query, permission or business behavior changed.

## EPIC UI005B Design Language Inference

Implemented on 2026-07-18.

Status: **IMPLEMENTED - VISUAL QA PENDING**

- Components Overview, List and Reports now follow Inventory's inferred
  workspace rhythm: KPI first, compact toolbar, table as anchor, side analytics
  and summary strip.
- Components List create actions moved into the toolbar instead of a standalone
  action row before KPIs.
- Components tables use the shared Enterprise table head/row density more
  consistently.
- Backend, API, React Query, route, permission, authentication and business
  behavior are unchanged.

## EPIC UI005A Workspace Completion

Implemented on 2026-07-18.

Status: **IMPLEMENTED - SCREENSHOT EVIDENCE BLOCKED**

- Components workspace wrapper no longer renders duplicated page-local hero,
  breadcrumb or tab chrome inside the application shell.
- Internal QC now derives its table, status and summary from live Components
  read data instead of static rows.
- Components Reports now has a dedicated workspace route rather than reusing the
  History page as a route placeholder.
- Legacy null wrapper pages now delegate to the active Components Overview
  workspace.
- No backend, API, React Query, route, permission, DTO or business behavior
  changed.

## RFC003 Aggregate Command API

Implemented on 2026-07-17.

Status: **APPROVED - ADDITIVE API**

- Added `/components/commands` routes for Component identity, Revision,
  Engineering BOM, review, approval, release, deprecation and archive.
- Every mutation requires JWT and `Idempotency-Key`; existing aggregate writes
  require positive optimistic versions.
- Exact replay returns persisted results without duplicate timeline,
  ActivityLog or Outbox; stale versions fail without side effects.
- AD-019 `component.revision.review.submitted` and
  `component.revision.released` remain the canonical facts.
- Existing `/components` routes, frontend and legacy `ComponentStatus` behavior
  remain unchanged. No new migration was required.

## Canonical Aggregate Implementation

Implemented on 2026-07-17.

Status: **CANONICAL DOMAIN AND ADDITIVE COMMAND API IMPLEMENTED**

- Added nullable canonical Component lifecycle and optimistic aggregate version.
- Added versioned Component Revision, Engineering BOM Definition and immutable
  Release Evidence persistence.
- Added Components-owned commands for identity, revision, review, release,
  archive and BOM validation.
- Added AD-019 canonical V1 facts with command idempotency, aggregate ordering,
  ActivityLog/audit/domain Outbox atomicity and one-current-release swap.
- Preserved public API, frontend and legacy operational `ComponentStatus`.
- Existing rows remain unadopted (`lifecycleState = null`) by design.
- Operator-reviewed legacy adoption remains a follow-up decision; no inferred
  state migration is permitted.

## ADS002 Component State Machine

Approved on 2026-07-17 as AD-016.

Status: **DOMAIN LIFECYCLE APPROVED - INTERNAL IMPLEMENTATION COMPLETE**

- Component identity states: `DRAFT`, `ACTIVE`, `DEPRECATED`, `ARCHIVED`.
- Revision states: `DRAFT`, `IN_REVIEW`, `APPROVED`, `RELEASED`,
  `SUPERSEDED`, `ARCHIVED`.
- Engineering BOM belongs to and releases atomically with one Revision.
- Released/superseded content is immutable; correction requires a new revision.
- Only one Revision may be current; replacement release atomically supersedes
  the prior current Revision.
- Release has no rollback. Archive is terminal, non-destructive and gated by
  downstream owner obligations.
- Existing `STOCK/CUTTING/WELDING/PAINTING/READY/SHIPPED/DELIVERED/INSTALLED`
  data remains compatibility-only and is not automatically migrated.
- No code, API, schema, migration, workflow or data changed in ADS002.

## EPIC186 Domain Audit & Foundation

Completed on 2026-07-17.

Status: **CORE PLATFORM PASS - DOMAIN FOUNDATION BLOCKED**

- Repository, ADR011 List/Overview/History, dashboard snapshots, Runtime and
  Operations Center remain PASS.
- `ComponentStatus` currently combines fabrication, storage, QC and logistics
  state without one canonical state machine.
- Only `SHIPPED -> DELIVERED -> INSTALLED` is guarded; create/update and several
  cross-module repository paths can write other statuses directly.
- Reservation, Issue, Consumption and Return are Production material entities,
  not Component entities. Inventory remains stock/ledger owner.
- The active Material Stock workspace bypasses that boundary by reconstructing
  balances in React and posting a generic Inventory return transaction.
- `component.updated` is atomic, but create/delete/costing and cross-module
  writes do not have complete Components domain-event coverage.
- Revision, release and archive entities/workflows remain undefined.
- No code, API, schema, migration, workflow or data changed during this audit.

## Core Platform v1.0 Certification

Status: **PASS** (EPIC174, 2026-07-13)

Component update/status, timeline, Activity Log, audit Outbox and
`component.updated` domain Outbox now share one repository transaction. The
post-commit EventBus path is removed; ADR011, dashboard snapshots, Runtime and
Operations Center remain PASS.

## EPIC173 Dashboard Certification

Status: **APPROVED** (2026-07-13)

`GET /components/dashboard` now calls `ComponentsSnapshotReadService`. KPI,
status distribution and activity aggregates are snapshot-first; missing/stale
reads use repository calculation and enqueue rebuild. The Overview table,
filters, pagination, Detail and History remain repository live workspaces.
No UI, business, schema, Runtime or Operations Center behavior changed.

## Runtime Platform

EPIC144 completed on 2026-07-13.

Status: **APPROVED, EVENT FRESHNESS PARTIAL**

- Module counters: snapshot hit/miss/age/lag, fallback and read-model hit.
- Snapshot reader and repository fallback instrumentation: PASS.
- Operations Center Components Platform Health: PASS.
- `USE_COMPONENTS_SNAPSHOT` visibility: PASS.
- Background job and Outbox telemetry: PASS.
- Snapshot parity readiness: PASS (warning-only, no auto-repair).
- Existing `component.updated` event coverage: PASS; broader domain-event
  freshness remains deferred.
- Workspace remains Repository Live Read Model under ADR011.

## Snapshot Foundation

EPIC143 completed on 2026-07-12.

Status: **APPROVED, EVENT FRESHNESS PARTIAL**

- `ComponentDashboardSnapshot`: persisted daily dashboard domain summary.
- `ComponentSummarySnapshot`: reusable per-Component domain summary.
- `ComponentSnapshotRepository`: calculate/read/upsert boundary.
- Shared Snapshot Reader/Writer/Validator/Rebuilder/Dispatcher integration: PASS.
- `USE_COMPONENTS_SNAPSHOT`: registered with standard max-age behavior.
- Missing/stale snapshot: repository fallback plus background update request.
- Existing `component.updated`: routed to Components snapshot jobs.
- Create/delete/revision/release/archive event coverage: not invented; deferred.
- List/Overview/History workspaces remain repository live read models under ADR011.

## Workspace Live Read Model

EPIC142 completed on 2026-07-12.

Status: **APPROVED FOR LIST, OVERVIEW, HISTORY, DETAIL AND COSTING**

- `GET /components/read-model/list`: paginated rows, material readiness, KPI and analytics.
- `GET /components/read-model/overview`: paginated rows, status summary, facets and distributions.
- `GET /components/read-model/history`: real ComponentTimeline rows, summary and pagination.
- `GET /components/:id/timeline`: optional pagination; no-query legacy array remains compatible.
- Components target pages no longer filter, paginate or aggregate business values from full arrays in React.
- Detail and Costing remain repository live reads.
- Stock, Material Stock, Production and Transfers remain follow-up read-model scopes.

## Repository Completion

EPIC141 completed on 2026-07-12.

Status: **APPROVED, 100% MODULE SERVICE COVERAGE**

- `ComponentsService -> ComponentsRepository -> Prisma`: PASS.
- `ComponentCostingService -> ComponentCostingRepository -> Prisma`: PASS.
- Components services contain no `PrismaService`, `this.prisma`, or direct
  transaction-client model access.
- Costing recalculation persists `ComponentCosting`, Component cost summary, and
  ActivityLog in one repository-owned transaction.
- Cost formulas, warnings, API, workflow, UI, schema, Inventory, and Production
  behavior are unchanged.
- Components still requires separate read-model, event/snapshot, runtime, and
  Operations Center sprints before Core Platform freeze.

## Core Platform Foundation Audit

EPIC140 completed on 2026-07-12.

Status: **FOUNDATION BLOCKED (28% COMPLIANCE)**

- `ComponentsService -> ComponentsRepository -> Prisma`: PASS.
- `ComponentCostingService -> Prisma`: repository boundary violation.
- Component List API has server pagination capability, but active frontend hooks
  request all rows and poll every five seconds.
- Overview aggregates Components, Production and Yard live arrays in React rather
  than reading a persisted dashboard snapshot.
- QC Internal and History/Reports use hardcoded rows/KPIs.
- `component.updated` is ephemeral and post-commit; no Component Outbox/routing.
- No Component snapshot models, feature flag, metrics, jobs or Operations Center
  Platform Health exist.
- Proposed revision/release/archive events remain blocked because corresponding
  domain entities/states/workflows do not exist.

EPIC140 changed documentation only. See `docs/runtime/components-*.md`.

## Scope

Components covers steel component master records, production linkage, component timeline, stock/yard visibility, and handoff from Production.

## Implemented Features

* Components list, overview, stock, material stock, production, yard, and history pages.
* Generic component master creation through `POST /components`.
* Component creation UI in `/components/list`.
* Component records can be linked to Projects.
* Production BOM and Manufacturing Order workflows can start from selected Components.
* Production execution can create or mark a component as `READY` from a valid Manufacturing Order after material issue.
* Component timeline records production-created and yard-staged state changes.
* Component delivery workflow advances `SHIPPED -> DELIVERED -> INSTALLED` through dedicated APIs.
* Delivery and installation write `ComponentTimeline` actions `DELIVERED` and `INSTALLED`.
* Installation mapping stores `installZone`, `installAxis`, `installLevel`, and `installPosition` on the Component.
* Component detail UI shows installation location for installed components.
* Component costing is persisted in `ComponentCosting` and can be recalculated from production consumption data.
* Component costing is now automatically recalculated when production completion marks the component `READY`.
* Automatic costing writes ActivityLog action `AUTO_RECALCULATE_COSTING`; manual recalculation still writes `RECALCULATE_COSTING`.
* Component detail UI includes a Costing section for estimated cost, actual cost, variance, material, labor, machine, and overhead.
* Sprint 11 adds Component Cost Breakdown with planned BOM material rows, actual consumed/scrap material rows, KPI cards, and costing warnings.
* Costing warnings detect `BOM_MATERIAL_NOT_CONSUMED`, `UNPLANNED_MATERIAL`, and `QUANTITY_VARIANCE`.
* Sprint 11A formats component material stock costs as whole VND and supports decimal return quantities when returning production material back to Main Warehouse.
* Sprint 12A migrates Components List and Components Stock presentation toward the Inventory cockpit baseline using shared module UI primitives.
* Components lifecycle KPI strips now show `Tổng cấu kiện`, `READY`, `SHIPPED`, `DELIVERED`, and `INSTALLED` from existing frontend data.
* Sprint 12C adds sticky filters, lifecycle KPI click-to-filter, shared empty/loading states, and standard `ModuleDetailDrawer` usage for Components List/Stock detail surfaces.
* Sprint 18B turns Components List into a Component Management Cockpit using the Inventory visual foundation, including KPI strip, operational component grid, shared detail drawer, and analytics panels.
* Component Cockpit grid now surfaces Project, Work Order, Progress, Material Ready, and Weight alongside existing component fields.
* Component Cockpit detail drawer includes component info, BOM summary, material required/issued/remaining, related Work Orders, and production progress.
* Sprint 18C adds BOM Intelligence mapping and computes Component Material Ready from BOM required quantity and Production Material Issue net issued quantity.
* Material readiness no longer falls back to `100%`; components without BOM/required material do not silently appear fully ready.
* Sprint 20A adds a read-only Costing Engine summary for Components.
* `GET /components/:id/cost` aggregates linked Production Order cost summaries into Component material cost and cost per unit without overwriting persisted `ComponentCosting`.

## Component Creation Audit

Current frontend path:

* `/components/list`
* `ComponentsListPage`
* `useCreateComponent`
* `POST /components`

Backend path:

* `ComponentsController.create`
* `ComponentsService.create`
* `ComponentsRepository.create`
* Tables: `components`, `activity_logs`

Production-context path:

* `POST /production/:id/component`
* Requires issued production material for the MO.
* Updates existing linked Component to `READY`, or creates one if the MO does not already reference a Component.
* Tables: `components`, `component_timelines`, `production_logs`

## Root Cause Found

Generic backend component creation was functional in API smoke testing.

The isolated UI blocker found during Sprint 3 was the login page default password:

* UI default: `admin123`
* Current seed password: `123`

This prevented a fresh user from logging in with the prefilled credentials before using the create component form.

Fix:

* Login page default password now matches the seed password `123`.

## API Endpoints

* `GET /components`
* `GET /components/:id`
* `GET /components/:id/timeline`
* `GET /components/:id/costing`
* `GET /components/:id/costing/breakdown`
* `GET /components/:id/cost`
* `POST /components`
* `POST /components/:id/deliver`
* `POST /components/:id/install` with `installZone`, `installAxis`, `installLevel`, `installPosition`
* `POST /components/:id/costing/recalculate` for manual recalculation; production completion now also calls the same upsert logic automatically.
* `PATCH /components/:id`
* `DELETE /components/:id`
* `POST /components/upload`
* `POST /components/timeline-upload`
* `POST /production/:id/component`

## Remaining Tasks

* Decide whether component master creation should remain separate from production-output creation long term.
* Add richer costing inputs for labor, machine, overhead, QC rework, and Yard handling.
* Compare Sprint 20A read-model component cost with persisted `ComponentCosting` during Sprint 20B Component Cost Analysis.
* Add stricter UI messaging that Production output creation requires issued material.
* Add delivery and installation document numbers, signed handover evidence, and coordinate/drawing references if required by field operations.
* Evaluate whether long-term component costing should move from `Float` to database decimal types if accounting-grade precision is required.
* Continue UI standardization for remaining Components tabs after Sprint 12A review.
* Consider adding a backend `GET /components/:id/material-readiness` API if multiple modules need the same readiness aggregation and frontend duplication becomes too high.
# Enterprise Read Platform

Components registers summary, current released revision, revision history,
engineering BOM and release timeline projections from AD-019 Outbox events.
AD-016 aggregate behavior and existing APIs remain unchanged. Consumer cutover
is pending migration deployment and parity validation.

## RFC002A Canonical Payloads

Component identity events now contain resulting identity/catalog facts.
Revision events consistently carry revision, BOM and content-hash facts when
present. New Component projections are authoritative by contract; the current
retained Outbox contains no historical canonical Component commands.

## Inventory Structural UI Alignment

Components Overview and Components List were structurally aligned to the
Inventory Inbound and Inventory Materials page hierarchy. The two target pages
now use `EnterpriseModulePage` directly, keep a single content stack, place the
table as the hero inside the 9/3 grid, and close the hero grid before rendering
the bottom analytics/summary section. Backend contracts and business behavior
were unchanged.
