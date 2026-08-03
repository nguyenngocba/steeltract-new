# Production Module

## STABILITY.PROJECTS.3A - Legacy Yard Handoff Closure

Implemented on 2026-07-29.

Status: **IMPLEMENTED - LEGACY PATH RETURNS 410**

- `POST /production/:id/stage-to-yard` is retained only for compatibility and
  now returns `410 Gone` before any Yard write.
- `ProductionService.stageToYard()` also throws `GoneException` to prevent
  internal callers from staging by ProductionOrder/Component definition
  identity.
- Production cockpit Yard staging now selects a physical `ComponentInstance`
  in `QC_PASSED` or `USE_AS_IS` state and calls canonical `/yard/stage`.
- Aggregate Production completion and Finished Goods eligibility semantics are
  unchanged.

## COMPONENT DOMAIN.5D - ComponentInstanceExecution Schema Foundation

Implemented on 2026-07-28.

Status: **IMPLEMENTED - PHYSICAL EXECUTION FOUNDATION READY**

- Production keeps `ProductionExecution` as the batch/run header.
- Added `ComponentInstanceExecution` as per-instance operation evidence for a
  selected physical ComponentInstance in one WorkOrder/run.
- Added authenticated command/read foundation under `/production/commands` for
  assign/start/complete/cancel/history.
- Aggregate Production completed quantities remain compatible; physical truth
  for new canonical instance-aware execution now comes from
  `ComponentInstanceExecution`.
- DOMAIN.5E remains responsible for actual `ComponentInstance.state`
  transitions and QC handoff.

## COMPONENT DOMAIN.5C - Production Instance Execution Granularity Audit & Design

Completed on 2026-07-28.

Status: **DESIGN COMPLETE - AWAITING DOMAIN.5D SCHEMA FOUNDATION**

- Audited ProductionOrder, WorkOrder, ProductionExecution,
  ProductionCompletion, routing/stage models and material boundaries.
- Current start/completion commands do not carry `ComponentInstance` IDs,
  serial sequences or serial ranges.
- Current aggregate completed quantity cannot prove which physical steel
  components are ready for QC.
- Recommended future `ComponentInstanceExecution` to bridge
  `ProductionExecution` batch/run headers to per-instance operation evidence.
- Deliverable:
  `docs/audits/component-domain5c-production-instance-execution-design.md`.

## COMPONENT DOMAIN.5A - QC Physical Instance Lineage Foundation

Implemented on 2026-07-27.

Status: **IMPLEMENTED - PRODUCTION READY TO RESUME DOMAIN.5**

- QC now has nullable physical `ComponentInstance` lineage for inspections,
  NCRs and QC inspection snapshots.
- This closes the schema blocker that prevented Production completion from
  handing physical instances to QC safely.
- Production code was not changed in DOMAIN.5A; DOMAIN.4 remains the current
  implemented Production boundary where release creates `PLANNED`
  ComponentInstances.

## COMPONENT DOMAIN.5B - ComponentInstance IN_PRODUCTION State Gate

Implemented on 2026-07-28.

Status: **IMPLEMENTED - PRODUCTION GRANULARITY GATE OPEN**

- Added additive `ComponentInstanceState.IN_PRODUCTION` enum value.
- Deployed migration
  `20260728090000_component_domain5b_instance_in_production_state` after backup
  `/tmp/steeltrack-domain5b-before-20260728.dump`.
- Existing `ComponentInstance` rows were not backfilled and remained
  `PLANNED`.
- Production start/completion physical instance transitions were not
  implemented because current command evidence does not identify instance IDs,
  serial sequences or serial ranges.

## COMPONENT DOMAIN.5 - Production Completion, QC & Finished Goods Gate

Audited on 2026-07-27 and resumed on 2026-07-28.

Status: **BLOCKED BY PRODUCTION INSTANCE GRANULARITY GATE**

- Production completion and QC handoff were audited for the canonical
  `ComponentInstance` workflow.
- Implementation is blocked because QC cannot yet reference physical
  `ComponentInstance` rows with a relational FK.
- Production should not move instances to Finished Goods until QC PASS /
  approved Use-As-Is can be tied to physical instance identity.
- Proposed additive schema is documented in
  `docs/audits/component-domain5-qc-finished-goods-report.md`.
- DOMAIN.4 remains the current implemented boundary: release creates
  `PLANNED` instances only.
- DOMAIN.5A deployed the required QC instance-lineage foundation. Remaining
  work is Production completion state transition and Finished Goods gating.
- DOMAIN.5B has closed the `IN_PRODUCTION` enum blocker.
- DOMAIN.5 remains blocked because current Production start/completion paths
  identify orders, work orders, execution runs and aggregate completed
  quantities, but not the affected physical `ComponentInstance` rows.

## COMPONENT DOMAIN.4 - Production Integration & Physical Instance Creation

Implemented on 2026-07-27.

Status: **IMPLEMENTED - TEST/BUILD/RUNTIME SMOKE PASS**

- Canonical `/production/commands/orders` accepts optional
  `componentRequirementId`.
- Requirement-bound Production Orders validate ProjectComponentRequirement
  ownership, released Engineering basis, Project match, integer production
  quantity and active allocation against `requiredQuantity`.
- Requirement-bound DRAFT Production Orders preserve Component, Revision, BOM
  definition, materialized Production BOM and Requirement lineage.
- Production Order release is now the canonical manufacturing authorization
  point for physical identity creation.
- Releasing a requirement-bound order creates one `ComponentInstance` per
  production quantity in `PLANNED` state.
- Instance numbers are generated server-side using Component code, Production
  Order number and serial sequence.
- Release replay and optimistic concurrency prevent duplicate ComponentInstance
  creation.
- ComponentInstance creation does not create InventoryTransactions, QC PASS,
  produced evidence, Finished Goods, Yard placement or Component inventory.
- Runtime fixture `DOMAIN4-1785146027125` verified split production 8 + 7
  against requirement quantity 20, over-allocation rejection, lineage and
  no Inventory/QC/Yard side effects.

## COMPONENT DOMAIN.2 Lineage Foundation

Implemented on 2026-07-27.

Status: **IMPLEMENTED - DOMAIN.4 CONVERSION COMPLETE**

- `ProductionOrder` now has optional `componentRequirementId` for binding to
  `ProjectComponentRequirement`.
- Existing Production Order creation, lifecycle, Engineering BOM B1
  materialization and Production Warehouse semantics remain unchanged.
- DOMAIN.4 writes this lineage through the canonical command API and creates
  planned ComponentInstances at release for requirement-bound orders.

## Component Manufacturing Workflow Sprint B1

Implemented on 2026-07-27.

Status: **IMPLEMENTED - TEST/BUILD PASS**

- Production now materializes released Engineering BOM definitions into the
  existing Production `BOM` / `BOMItem` model before creating component-bound
  Production Orders.
- The materialized Production BOM stores Engineering lineage:
  `componentId`, `componentRevisionId`, `bomDefinitionId`,
  `engineeringContentHash`, `source=ENGINEERING`, `materializedAt`, and
  `materializedBy`.
- Canonical command creation and legacy `POST /production` creation both bind
  component-bound orders to the materialized Production BOM.
- Stale content hashes, unreleased revisions, unreleased BOM definitions,
  missing materials, and mismatched caller-selected BOMs are rejected instead
  of silently creating inconsistent Production Orders.
- Existing manual/legacy BOM orders without a Component remain compatible.
- No Production UI, Inventory, QC, Yard, Logistics, Projects, Historical
  Dashboard, Snapshot Engine, or third BOM model was introduced.

## Component Manufacturing Workflow Sprint A

Implemented on 2026-07-23.

Status: **IMPLEMENTED - TEST/BUILD PASS**

- Production Order creation now enforces the Engineering Release gate for
  component-bound orders.
- Legacy `POST /production` requires the selected Component to be
  engineering-released (`ComponentLifecycleState.ACTIVE`) with a current
  revision before order creation.
- Canonical `/production/commands/orders` validates the released engineering
  basis: Component lifecycle, current revision, released revision, released BOM
  definition and matching content hash.
- This preserves the approved Production lifecycle and keeps new orders in
  `DRAFT`; release/start remain separate lifecycle commands.
- No Inventory, Historical Dashboard, Snapshot Engine, Warehouse Realtime,
  Prisma schema or Production UI changes were made.

## Production Order Creation Fix

Implemented on 2026-07-23.

Status: **IMPLEMENTED - TEST/BUILD PASS**

- Production create UI now sends canonical `DRAFT` status to the legacy
  `POST /production` endpoint.
- Backend create validation remains unchanged and still rejects non-DRAFT
  create requests.
- Root cause was a frontend/backend lifecycle contract mismatch:
  `ManufacturingOrderModal` sent legacy `PLANNED`, while AD-017 state machine
  requires `DRAFT -> RELEASED -> READY -> IN_PROGRESS`.
- No Production schema, repository redesign, Inventory workflow or API route
  changes were made.

## EPIC 3.1 Production UI Polish

Implemented on 2026-07-21.

Status: **IMPLEMENTED - BUILD PASS, BROWSER QA PENDING**

- Production toolbar now uses active quick status filters instead of inert
  filters.
- Production Queue now has a paginated table hero and right analytics rail
  before the kanban board.
- The kanban remains available as a lower operational workspace.
- Consumption and Incidents right rails now use fuller cockpit analytics cards
  backed by existing data or standard empty states.
- Backend, API contracts, React Query contracts, permissions, schema and
  business behavior are unchanged.

## EPIC 3 Production Completion

Implemented on 2026-07-21.

Status: **IMPLEMENTED - BUILD PASS, BROWSER QA PENDING**

- `/production/machines` is now a visible Production workspace backed by the
  existing `/production/machines` endpoint.
- Production Machines uses shared cockpit table, pagination, KPI, donut,
  mini-bar and empty-state primitives.
- Production KPI cards no longer render synthetic trend arrays when no real
  historical trend contract exists.
- Production chart fallbacks no longer inject fake values; missing data is
  represented by standard no-data states.
- Consumption and Incidents now use `DataTablePagination`.
- BOM, Warehouse, Issues, Reservations, Ledger and Logs tables preserve stable
  empty rows for Inventory-canon table height behavior.
- Backend, API contracts, React Query keys, permissions, schema and business
  behavior are unchanged.

## EPIC BUSINESS001 Steel Structure Domain Completion

Implemented on 2026-07-18.

Status: **IMPLEMENTED - VISUAL QA PENDING**

- Production reports and order registry now use manufacturing-order and
  steel-fabrication language.
- Material flow metrics are labelled as steel issue, steel consumption and
  reservation where existing data supports it.
- Ready-to-release now lists real work orders with material readiness >= 100%
  instead of a placeholder explanation.
- No backend, API, React Query, permission or business behavior changed.

## UX Review Round 2

Implemented on 2026-07-18.

Status: **IMPLEMENTED - VISUAL QA PENDING**

- Production Overview right-side cockpit now prioritizes progress distribution,
  material readiness and `Cần chú ý hôm nay`.
- The attention queue uses existing delayed, material shortage and low-progress
  signals from Production read data.
- Chart cards were increased in visual weight to match Inventory's cockpit
  usefulness.
- No backend, API, React Query, permission or business behavior changed.

## UX Review Round 1

Implemented on 2026-07-18.

Status: **IMPLEMENTED - VISUAL QA PENDING**

- Production Overview order table now shows Top N rows in the dashboard
  context.
- The table card exposes `Xem tất cả` and routes to `/production/orders` for
  the full Enterprise Table workspace.
- Short dashboard order lists use a smaller card height to reduce empty space.
- No backend, API, React Query, permission or business behavior changed.

## EPIC UI005B Design Language Inference

Implemented on 2026-07-18.

Status: **IMPLEMENTED - VISUAL QA PENDING**

- Production Overview now mirrors Inventory's operating rhythm without copying
  Inventory-specific JSX or data.
- Quick manufacturing actions and today/waiting/delayed summary cards appear
  before the main order table.
- Recent activity moved into supporting context below the primary table and
  side analytics.
- Backend, API, React Query, route, permission, authentication and business
  behavior are unchanged.

## EPIC UI005A Workspace Completion

Implemented on 2026-07-18.

Status: **IMPLEMENTED - SCREENSHOT EVIDENCE BLOCKED**

- Active Production workspace no longer renders duplicated page-local hero,
  breadcrumb or tab chrome inside the application shell.
- Primary Production create actions moved into the operational filter toolbar.
- Incidents and Reports now render data-backed workspaces using existing orders,
  logs, issues, reservations and material-flow read data instead of placeholder
  navigation panels.
- Operator-facing temporary/TODO labels were replaced with truthful limitation
  text where backend fields are not yet available.
- No backend, API, React Query, route, permission, DTO or business behavior
  changed.

## EPIC UI006 Shared Components Consolidation

Implemented on 2026-07-18.

Status: **IMPLEMENTED - VISUAL QA PENDING**

- Production no longer imports
  `@/modules/inventory/components/InventoryVisuals`.
- Production chart cards, table tokens, status chips, meters, compact donut,
  mini bars and panel facade delegate to shared Enterprise UI components.
- Existing Production page names, wrappers and behavior remain compatible; the
  module facade is now thin and business-readable.
- No API, React Query, route, permission, DTO, backend or business behavior
  changed.

## EPIC UI005 Enterprise Workspace

Implemented on 2026-07-18.

Status: **IMPLEMENTED - VISUAL QA PENDING**

- All active `/production/*` routes use the Inventory-derived
  `EnterpriseWorkspace`, cockpit table/panel/pagination and shared drawer
  language.
- Manufacturing Order, Production BOM, Material Return, Consumption and Yard
  staging use the shared Enterprise form primitives and 36px controls.
- Production no longer owns custom modal shells or browser-prompt mutation
  forms; modal focus, Escape, scroll and sticky actions are centralized.
- Existing APIs, React Query hooks/keys, DTOs, permissions, routes and business
  behavior are unchanged.
- Incidents and Reports remain truthful no-data states pending approved domain
  contracts; no mock data was introduced.

## RFC003 Production Execution Aggregate

Implemented on 2026-07-17.

Status: **APPROVED - CANONICAL DOMAIN COMPLETE**

- Added durable `ProductionExecution` state and optimistic aggregate version.
- Implemented internal start, pause, resume, complete and abort commands.
- Order start now starts the first Work Order and first execution in the same
  transaction; active-run uniqueness is enforced in PostgreSQL.
- Canonical V1 execution facts flow through the existing Outbox and Enterprise
  Read Platform projection registry.
- No controller, public route, frontend, Inventory or Components change was
  made. Operator certification remains pending.

## EPIC188 Command API Rollout

Implemented on 2026-07-17.

Status: **APPROVED - ADDITIVE API**

- Added `/production/commands` endpoints for Production Order, Work Order,
  Completion, Scrap and Rework command aggregates.
- All command mutations require JWT and `Idempotency-Key`; existing aggregate
  mutations require positive `expectedVersion`.
- Exact duplicate commands replay the original result; conflicting key reuse or
  stale versions return Conflict without side effects.
- Correlation/causation, ordering, retry, timeline, ActivityLog, audit and
  canonical Outbox remain aligned with AD-019 and repository-atomic.
- Existing `/production` routes and frontend remain unchanged. No schema or
  migration was needed.

## RFC002 Production Aggregate Implementation

Implemented on 2026-07-17.

Status: **CANONICAL INTERNAL BOUNDARY APPROVED; PUBLIC CUTOVER PENDING**

- Added Production Order and independently versioned `1:N` Work Order
  aggregates aligned to AD-017.
- Added append-only Completion, Scrap and linked Rework persistence/commands.
- Added optimistic concurrency, durable command idempotency, timeline,
  ActivityLog, audit Outbox and canonical AD-019 V1 events atomically.
- Issue/Return material facts retain Inventory posting receipt ids;
  recoverable Scrap calls `InventoryPostingService`; Consumption/Completion do
  not post stock.
- The additive migration is deployed without legacy row rewrite. Existing API
  and UI remain compatibility paths pending a separately approved additive
  version/idempotency contract and operator certification.

## ADS003.5 Production-Inventory Interaction Contract

Approved on 2026-07-17 as AD-018.

Status: **APPLICATION BOUNDARY APPROVED - IMPLEMENTATION DEFERRED**

- Production owns Reservation, Issue/Return intent, Consumption, Completion,
  Scrap and material ledger.
- Reservation/Release/Consumption/Completion/non-recoverable Scrap do not
  mutate Inventory.
- Issue, Return and recoverable Scrap receipt call Inventory-owned posting in
  one shared local transaction and consume a bounded idempotent PostingReceipt.
- Production records receipt identifiers before commit; owner Outboxes update
  snapshots/projections after commit.
- Event replay cannot execute stock posting again.
- No code, API, schema, migration, workflow, state machine or data changed.

## ADS003 Production State Machine

Approved on 2026-07-17 as AD-017.

Status: **DOMAIN LIFECYCLE APPROVED - IMPLEMENTATION DEFERRED**

- Production Order retains `DRAFT -> RELEASED -> READY -> IN_PROGRESS <->
  PAUSED -> COMPLETED -> CLOSED`, plus draft cancellation.
- `READY` is an admission state; Start revalidates volatile gates and atomically
  starts the first eligible Work Order/Execution Run.
- One Production Order coordinates `1:N` independently versioned Work Orders.
- Partial completion is append-only; final completion and close are separate.
- Scrap is a separate disposition aggregate, not Consumption.
- Rework creates a linked `REWORK` Production Order and never rewinds the
  original Order.
- Inventory owns stock, Components owns released Revision/BOM and QC owns
  rejected quantity/NCR/re-inspection.
- Existing schema/API/legacy records remain compatibility-only. No code, API,
  schema, migration, workflow or data changed in ADS003.

## EPIC186 Domain Completion Assessment

Completed on 2026-07-17.

Status: **AUDIT COMPLETE - IMPLEMENTATION BLOCKED**

- Canonical Production Order lifecycle, repository boundary, atomic Outbox,
  material flow, ADR011 read paths, snapshot and runtime foundations remain
  approved.
- `WorkOrder` is currently standalone and is not related to Production Order,
  routing, stage or work center; its service is not active in the module/API.
- Production has stage status/current-stage WIP, but no approved quantitative
  completed/rejected/remaining model.
- `production.order.*` remains canonical. Legacy `production.started` and
  `production.completed` are compatibility inputs only.
- Consumption records actual Production usage after Inventory Issue and must
  not mutate Inventory stock again. Canonical Scrap remains a future aligned
  command/event under PROD-015.
- No code, API, schema, migration, workflow or data changed in this assessment.

## Core Platform v1.0 Certification

Status: **PASS** (EPIC174, 2026-07-13)

Legacy `production.stage.completed` and `production.staged.to-yard` durable
events now commit inside their Production-side repository transactions, and
Production Activity Logs have atomic audit Outbox rows. Canonical lifecycle and
material events remain unchanged. Operator/business certification is still a
separate pending gate.

## EPIC172 Cockpit ADR011 Remediation

Completed on 2026-07-13.

Status: **APPROVED**

- Production Overview, Orders and Planning use
  `GET /production/read-model/cockpit`.
- `ProductionRepository` owns search, status/planning filters, sorting,
  pagination, KPI, progress, readiness, delayed-order, queue and Work Center
  composition.
- React renders the returned read model and no longer calculates the Cockpit
  order KPI/analytics from full order, issue and reservation arrays.
- The existing `GET /production` API remains compatible.
- `GET /production/metrics` remains snapshot-first; operator workspace data does
  not read persisted snapshots.
- No UI, workflow, business, schema, runtime or Operations Center change was
  made.

## Platform Certification

EPIC137 audit completed on 2026-07-12.

Status: **CODE COMPLETE, BUSINESS CERTIFICATION BLOCKED (65%)**

- Repository and lifecycle boundaries: PASS.
- Material-flow automated verification: PASS.
- Canonical/legacy routing contract: PASS; runtime delivery unverified.
- Snapshot/runtime/Operations Center foundation: CODE VERIFIED.
- Runtime Production snapshots, Outbox and jobs: no persisted evidence.
- Historical Issue `1.1` matches Inventory `EXPORT -1.1` at the same exact
  warehouse/zone/slot/level; Return and full lifecycle remain unverified.
- A designated test order is required for operator certification. Existing
  business data was not modified.

## Production Material Flow

EPIC135B implementation completed on 2026-07-11.

Status: **IMPLEMENTATION PASS, REAL-DATA E2E BLOCKED**

Canonical events `production.material.reserved`, `released`, `issued`,
`consumed`, and `returned` are persisted atomically with Production domain and
ledger changes. Draft reservations have no ledger/event side effects. Manual
and reservation Issues share the same Inventory posting and Production ledger
semantics. Consumption excludes Scrap from consumed ledger/event/snapshot
quantities. Background routing updates Production snapshots; Inventory Issue
and Return snapshot updates remain driven by Inventory-owned Outbox events.

Focused verification passes 7 suites/24 tests. A complete real operator flow is
pending a designated disposable Production Order.

## Production-Inventory Transaction Boundary

EPIC135A completed on 2026-07-11.

Status: **APPROVED**

Production no longer mutates Inventory transaction, item, or location-stock
tables. Issue and Return call Inventory-owned `InventoryPostingService` inside
the same repository transaction as Production issue/reservation/ledger changes.
Inventory owns validation, valuation, stock mutation, Inventory transaction, and
Inventory Outbox writes.

Draft Reservation is demand-only and writes no `RESERVE` ledger row. Actual
reserve allocation writes the single `RESERVE` semantic. `CONSUME` ledger rows
exclude Scrap. Canonical material command/event contracts are ready for EPIC135B.

## Production Order Lifecycle

EPIC134 completed on 2026-07-11.

Status: **APPROVED**

Implemented lifecycle:

```text
DRAFT -> RELEASED -> READY -> IN_PROGRESS <-> PAUSED -> COMPLETED -> CLOSED
DRAFT -> CANCELLED
```

Dedicated command endpoints validate every transition. Create is restricted to
`DRAFT`, generic update cannot change status, and `PLANNED`/`DELAYED` remain
read-compatible without becoming command targets. Each lifecycle transition,
ActivityLog, and canonical `production.order.*` Outbox event commits atomically
through `ProductionOrderRepository`. Background Engine updates the existing
Production snapshot foundation after Outbox dispatch.

## Blueprint Alignment

Production Blueprint Alignment completed on 2026-07-11.

Status: **APPROVED FOR EPIC134 IMPLEMENTATION**

Canonical order lifecycle:

```text
DRAFT -> RELEASED -> READY -> IN_PROGRESS <-> PAUSED -> COMPLETED -> CLOSED
DRAFT -> CANCELLED
```

Canonical order events use `production.order.*`. `PLANNED`, `DELAYED`, and the
legacy event names remain compatibility inputs only. The additive enum migration
is prepared; command/state-machine and atomic Outbox implementation remain the
next sprint.

## Core Platform Status

EPIC133 on 2026-07-11 completed Production Runtime Metrics and Operations Center Integration.

Status: **RUNTIME PLATFORM APPROVED**

Runtime additions:

* Production-specific snapshot hit/miss counters.
* Production snapshot age and lag counters.
* Production read-model hit counter.
* Production fallback counter.
* `/production/metrics` dashboard-reader strategy using `ProductionDashboardSnapshot` with repository fallback.
* Production Platform Health in Operations Center.

Operations Center health includes:

* Repository status.
* Read Model status.
* Snapshot status.
* `USE_PRODUCTION_SNAPSHOT` feature flag status.
* Event/outbox status.
* Background job status.
* Runtime metrics status.
* Snapshot parity readiness.

Not included in EPIC133:

* New MES business workflows.
* UI changes.
* Inventory changes.
* Broader Production event contracts for reservation/issue/return/consumption/scrap/rework.

EPIC132 on 2026-07-11 completed Production Snapshot Foundation.

Status: **SNAPSHOT FOUNDATION APPROVED**

Snapshot additions:

* `ProductionDashboardSnapshot`
* `ProductionOrderSnapshot`
* `WorkCenterSnapshot`
* `ProductionSnapshotRepository`
* Production snapshot reader methods in `SnapshotReaderService`
* Production snapshot writer branch in `SnapshotWriterService`
* Production snapshot validation hook in `SnapshotValidatorService`
* `USE_PRODUCTION_SNAPSHOT` feature flag registration
* Existing `production.started`, `production.stage.completed`, `production.delayed`, and `production.completed` events mapped to Background Engine snapshot jobs

Boundary result:

* Production workspaces remain Repository Live Read Models under ADR011.
* Production dashboard/cockpit/analytics surfaces are prepared for persisted snapshot cutover.
* No Production UI, API contract, Inventory, business workflow, Operations Center UI, or Runtime Metrics behavior was changed.

Not included in EPIC132:

* Production dashboard API cutover to snapshot-first reads.
* Production-specific Runtime Metrics counters.
* Operations Center Production Platform Health.
* Expanded Production event contracts beyond existing lifecycle events.

EPIC131 on 2026-07-11 completed Production Repository Foundation.

Status: **REPOSITORY FOUNDATION APPROVED**

Repository additions:

* `BomRepository`
* `MaterialIssueRepository`
* `ProductionConsumptionRepository`
* `ProductionMaterialLedgerRepository`
* `ProductionOrderRepository`
* `ProductionReservationRepository`
* `RoutingRepository`
* `WorkCenterRepository`
* `WorkOrderRepository`

Boundary result:

* Production services no longer inject `PrismaService`.
* Production services no longer call `this.prisma`.
* Production services no longer call direct model methods on `Prisma.TransactionClient`.
* `PrismaService` is now confined to Production repositories.

Not included in EPIC131:

* Production snapshots.
* Production Background Engine jobs.
* Production Runtime Metrics counters.
* Operations Center Production Health.
* New MES workflows.
* UI/API changes.

EPIC130 on 2026-07-11 audited Production as the first module intended to inherit the Inventory Core Platform and ADR011 standard.

Status: **FOUNDATION AUDIT COMPLETE, REPOSITORY BLOCKER REMEDIATED BY EPIC131**

Findings:

* Production workspaces currently use live reads rather than persisted snapshots, so no ADR011 workspace-snapshot violation was found.
* `ProductionRepository` exists and covers part of the Production Order, Stage, Task, Log, Work Center, Machine, Schedule, ActivityLog, and metrics surface.
* Repository Boundary was incomplete in EPIC130 and remediated in EPIC131.
* Production dashboard snapshots were not implemented during EPIC130; EPIC132 later added `ProductionDashboardSnapshot`, `ProductionOrderSnapshot`, and `WorkCenterSnapshot`.
* Snapshot feature flags and event consumer mappings were missing during EPIC130; EPIC132 later registered `USE_PRODUCTION_SNAPSHOT` and existing `production.*` lifecycle events.
* Operations Center exposes Inventory, Projects, and Dispatch snapshot health but does not yet expose Production Platform Health.

Next architecture order:

1. Add repository-backed live read models for Production workspaces.
2. Cut Production dashboard/cockpit analytics over to persisted snapshots with fallback.
3. Expand Production event/outbox contracts.
4. Register Production runtime and Operations Center health.

## Scope

Production covers BOM, Manufacturing Orders, routing stages, production logs, production material issues, QC gate handoff, and Yard staging for finished components.

## Implemented Features

* Production BOM CRUD, clone, archive, and linked routing steps.
* BOM material selection from `Kho vật tư SX`.
* BOM creation validates real production-warehouse stock and blocks over-allocation.
* Manufacturing Order creation from Component + BOM.
* Manufacturing Order start, stage completion, and completed-component readiness.
* MO start auto-issues missing BOM material quantities from production warehouse stock.
* Auto-issued materials create `ProductionMaterialIssue` rows with status `ISSUED`.
* Auto-issued materials create outbound Inventory movements so `Kho vật tư SX` stock is reduced.
* Sprint 9 hardening preserves warehouse, zone, slot, and level from production stock buckets into auto-issued material rows and Inventory transaction items.
* MO start plans required material issues before changing status and creates issue rows only after the start transition succeeds.
* Material requirements endpoint shows required, available SX, issued, and shortage quantities.
* Formal Production Material Reservation documents are implemented for Sprint 1.
* Reservation preview validates BOM demand against production warehouse stock minus active reservations.
* Reservation lines allocate by production warehouse location bucket: `warehouseId + zoneId + slotId + level`.
* Reservation Allocation Integrity Sprint 10C uses only active `inventory_location_stocks.quantity > 0` production buckets and subtracts active reservations by exact material/warehouse/zone/slot/level bucket.
* Reservation create/reserve/release/expire APIs are available and do not move Inventory stock.
* Production Material Ledger Sprint 2 is implemented for reservation lifecycle events.
* Ledger rows record `RESERVE` and `RELEASE` events from reservation create/reserve/release/expire, with production order, reservation, material, location, quantity, event date, remark, and actor.
* Material Issue from Reservation Sprint 3 is implemented. Issue can only consume reserved quantities and reduces `inventory_location_stocks`.
* Material Return Sprint 3 is implemented and Sprint 10A reconciles returns after consumption/scrap.
* Returned unused issued material is posted back to `MAIN` / `Kho chính`; issue already reduced `PRODUCTION` / `Kho vật tư SX` stock.
* Return validation enforces `issued = consumed + scrap + returned + remaining`, so partial returns cannot exceed the unconsumed remainder.
* Ledger now records `ISSUE` and `RETURN` events from production issue/return workflows.
* Production Consumption Sprint 4 is implemented for recording actual consumed and scrap quantities per MO/material.
* Ledger now records `CONSUME` events from production consumption posting.
* Component Costing Sprint 5 calculates actual material cost from production consumption and Inventory average cost.
* Automatic Component Costing Sprint 10B recalculates costing after production completion/component `READY` without requiring the manual `POST /components/:id/costing/recalculate` action.
* Automatic costing failure is caught and logged as a backend warning so production completion remains successful.
* Component Costing Breakdown Sprint 11 compares BOM planned material quantities with actual Production Material Consumption rows and surfaces material variance warnings.
* Decimal Quantity Sprint 11A supports decimal BOM quantities, MO quantities, reservation issue quantities, material return/consume/scrap quantities, and Yard staging quantities in the UI and backend DTO parsing.
* Quantity UI formatting supports `vi-VN` decimal typing such as `1,5`, `0,125`, and `1.234.567,125` without converting values to integers.
* Production execution can create/mark a component from an MO only after material has been issued.
* Production UI includes `/production/reservations` and MO detail reservation preview/create action.
* Production UI includes `/production/material-ledger` with filters for Production Order, Material, Event Type, and Date Range.
* Production UI includes `/production/consumptions` with Issued, Returned, Consumed, Scrap, and Remaining summaries.
* Sprint 12B standardizes Production Cockpit presentation with shared module UI primitives for KPI strip, analytics panels, filter bar, and the primary Manufacturing Order data grid.
* Sprint 12C adds sticky Production filters and frontend status KPI click-to-filter without changing Production APIs or workflow logic.
* Sprint 18A aligns Production Cockpit more closely with the Inventory operational theme: Inventory-style KPI cards, filter controls, analytics panels, primary Production Orders grid, progress/readiness/delay indicators, and shared detail drawers for Production Orders, BOM detail, and Material Issues.
* Sprint 18A extended the Inventory-style data-grid/table treatment to Production BOM, Reservations, Material Ledger, Material Issues, Consumptions, and Logs without changing Production APIs or workflows.
* Sprint 18C confirms existing Production Order responses expose BOM items and material issues enough for frontend Component Material Readiness calculations.
* Sprint 18D turns `/production/orders` into a Work Order Cockpit with KPI strip, Inventory-style Work Order grid, BOM Intelligence Material Ready %, drawer sections, and analytics panels.
* Work Order `READY TO RELEASE` is currently UI-only and appears when Material Readiness reaches 100%; it does not lock or change backend workflow.
* Sprint 18E turns `/production/material-issues` into a Production Material Control Center with KPI strip, Inventory-style issue grid, Required/Issued/Returned/Remaining/Readiness indicators, detail drawer sections, and analytics panels.
* Material Issue readiness is computed in the frontend from existing BOM required quantities and Production Material Issue net issued quantities; no backend API or workflow change was introduced.
* Sprint 19A adds `/production/warehouse` as a Production Warehouse Cockpit focused only on `PRODUCTION` / `Kho vật tư SX` balances.
* Production Warehouse Cockpit computes `Available = Production Stock - Reserved`, `Shortage = Required - Available`, and status from available production stock rather than total stock.
* Production Warehouse Cockpit groups location balances by Production Zone / Slot / Level and adds shortage, readiness, and WO consumption analytics using existing Inventory/Production data.
* Sprint 19B adds `/production/execution` as a Production Execution Board with Kanban columns for Planning, Ready Material, Cutting, Assembly, Welding, Painting, and Completed.
* Execution Board cards reuse BOM/Issue material readiness, delay detection, progress estimation, issue history, and reservation summaries from existing Production data.
* Execution Board prefers actual active stage data and falls back to status/readiness mapping until backend exposes a canonical shopfloor stage model.
* Sprint 19C MES Data Audit documents current Shopfloor and Costing readiness in `docs/ai-state/audits/mes-data-audit.md`.
* Sprint 19C concludes Costing should be prioritized next because BOM, consumption, inventory valuation, and ComponentCosting data are more complete than canonical shopfloor runtime history.
* Sprint 20A adds a read-only Costing Engine summary for Production Orders.
* `GET /production/orders/:id/cost` returns required, issued, returned, net issued, consumed, scrap, material cost, cost per unit, and material-level cost source rows.
* Production Order material cost uses actual issue Inventory transaction valuation where available and weighted average Inventory cost as fallback.
* Sprint 20A.5 adds a runnable demo dataset seeder that creates 20 work orders with full material readiness, linked reservations, material issues, consumptions, ledger rows, Inventory issue valuation, and ComponentCosting rows for all 20 seeded components.
* Production-to-Yard staging is gated by linked QC inspection status `PASSED` or `APPROVED`.

## Database Models

* `BOM`
* `BOMItem`
* `BOMRoutingStep`
* `ProductionOrder`
* `ProductionStage`
* `ProductionTask`
* `ProductionSchedule`
* `ProductionLog`
* `ProductionMaterialIssue`
* `ProductionMaterialReservation`
* `ProductionMaterialReservationLine`
* `ProductionMaterialLedger`
* `ProductionMaterialConsumption`
* `ComponentCosting`
* `WorkOrder`
* `Shift`
* `ProductionCapacity`
* `ComponentAssembly`
* `ProductionRework`
* `ProductionScrap`
* `MachineDowntime`
* `MachineOee`

Core Platform snapshot models:

* `ProductionDashboardSnapshot`
* `ProductionOrderSnapshot`
* `WorkCenterSnapshot`

## API Endpoints

* `GET /production`
* `POST /production`
* `GET /production/:id`
* `PATCH /production/:id`
* `POST /production/:id/start`
* `POST /production/stages/:id/complete`
* `POST /production/:id/stage-to-yard`
* `GET /production/:id/requirements`
* `GET /production/boms`
* `POST /production/boms`
* `GET /production/boms/:id`
* `PATCH /production/boms/:id`
* `POST /production/boms/:id/clone`
* `POST /production/boms/:id/archive`
* `GET /production/material-issues`
* `POST /production/material-issues`
* `PATCH /production/material-issues/:id`
* `POST /production/material-issues/:id/return`
* `GET /production/reservations`
* `GET /production/reservations/:id`
* `GET /production/:id/reservation-preview`
* `POST /production/:id/reservations`
* `POST /production/reservations/:id/reserve`
* `POST /production/reservations/:id/issue`
* `POST /production/reservations/:id/release`
* `POST /production/reservations/:id/expire`
* `GET /production/material-ledger`
* `GET /production/material-ledger/:id`
* `GET /production/:id/material-ledger`
* `GET /production/consumptions`
* `GET /production/:id/consumptions`
* `GET /production/orders/:id/cost`
* `POST /production/:id/consume`
* `POST /production/:id/component`
* `GET /production/logs`

## Routes

* `/production`
* `/production/boms`
* `/production/orders`
* `/production/execution`
* `/production/reservations`
* `/production/warehouse`
* `/production/material-ledger`
* `/production/material-issues`
* `/production/consumptions`
* `/production/logs`

## Remaining Tasks

* **Sprint 1 (WorkOrder & Core Domain Setup)**: Implement `WorkOrder` entity, repositories, and DTOs. Migration of work order tables.
* **Sprint 2 (Shopfloor Runtime & Downtime)**: Implement `Shift`, `MachineDowntime`, and downtime tracking APIs.
* **Sprint 3 (Scrap & Rework Workflows)**: Implement `ProductionScrap`, `ProductionRework` tables, validations, and NCR connection.
* **Sprint 4 (Outbox Events & Event Consumer)**: Implement persistent outbox events for production transitions and event listener routing.
* **Sprint 5 (Persisted Snapshots)**: Completed foundation in EPIC132; remaining work is dashboard cutover, broader event contracts, and Operations Center health.
* **Sprint 6 (WMS & Costing Integration)**: Hardening material issue/return balance equations and average-cost ledger reconciliations.
* **Sprint 7 (Shopfloor Dashboard & Cockpits)**: Build dynamic manager and operator interfaces, including OEE and downtime gauges.
* **Sprint 8 (Operations Center & AI Optimizer)**: Integrate production alerts into the Operations Center and add AI-driven queue scheduling optimization.
# Enterprise Read Platform

Production registers order, work-order, timeline, execution, dashboard and
operator-queue projections from AD-019 Outbox events. Existing Production
aggregate commands and APIs are unchanged. UI/cockpit projection cutover remains
a separate validation step.

## RFC002A Canonical Payloads

Order, work-order, completion, material, Scrap and Rework events now expose the
resulting facts needed by projections while retaining AD-019 names/version and
atomic Outbox behavior. Production Execution has no publisher. Some issue paths
still lack a canonical cumulative material balance, so ProductionMaterialStatus
is not yet fully authoritative.

## COMPONENTS.PRODUCTION.2 Cockpit Read Model Enrichment

`GET /production/read-model/cockpit` now exposes canonical row enrichment for
Components Production: ProjectComponentRequirement, Project, Component
Definition, ComponentRevision, ComponentBomDefinition, physical
ComponentInstances, ComponentInstanceExecution, QC rows/NCR references and
material reservation/issue readiness. The existing route is reused; no schema,
command, lifecycle, Finished Goods, Yard or Logistics behavior changed.
