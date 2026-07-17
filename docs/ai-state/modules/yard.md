# Yard Module

## Core Platform v1.0 Certification

Status: **PASS** (EPIC174, 2026-07-13)

Repository, ADR011 live workspace, snapshot-first Dashboard, Runtime naming,
Operations Center and existing atomic audit/domain Outbox paths pass the final
platform parity rerun.

## EPIC173 Dashboard Certification

Status: **APPROVED** (2026-07-13)

`GET /yard/dashboard` now exposes `YardSnapshotReadService`. Yard KPI, capacity,
movement distribution and zone utilization are snapshot-first. Maps, locations,
placements, movement history, cranes and operator actions remain on the live
workspace read model. Missing/stale fallback and Background Dispatcher enqueue
remain unchanged.

## EPIC164 Runtime Platform

- Runtime Metrics: PASS (`yardSnapshotHit`, `yardSnapshotMiss`,
  `yardSnapshotAge`, `yardSnapshotLag`, `yardFallbackCount`,
  `yardReadModelHit`).
- Snapshot Reader telemetry: PASS.
- Operations Center Platform Health: PASS.
- Feature flag reporting: PASS (`USE_YARD_SNAPSHOT`).
- Background/Outbox monitoring: PASS for existing events/jobs.
- Snapshot parity: warning-only readiness PASS.
- Event freshness: PARTIAL; unimplemented reservation, hold, loading and
  dispatch workflows were not invented.
- ADR011: operator workspace remains Repository Live Read Model.

## Scope

Yard covers finished component staging, yard placement, yard movement visibility, outbound/removal workflow, crane tracking, loading/unloading tasks, and yard capacity management.

## Current Status

* **Design**: 100% Completed (Approved Master Blueprint at [yard-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/yard-blueprint.md)).
* **Implementation**: 72% (Cockpit UI and basic integration complete; advanced placement, reservations, crane task queues, and AI optimization remain as next implementation sprints).

## Implemented Features

* Yard cockpit UI follows the Inventory visual baseline.
* Sprint 12B standardizes Yard cockpit page header, KPI strip, filter bar, occupancy analytics, shipment/operation analytics, and trend panels with shared module UI primitives.
* Sprint 12C makes Yard filters sticky and lazy-loads 2D/3D operational maps so the Yard route chunk stays light until map tabs are opened.
* Yard staging is integrated with Production and gated by QC release.
* Yard placements and movements are included in operational workflow checks.
* Yard outbound removal marks linked component placements as `SHIPPED`, preserves/infers `projectId`, and writes component timeline history.
* Dashboard aggregates Yard activity and open workflow state.

## Database Models

The blueprint defines the following data models to be added:

* `YardZone`: Physical partition of the finished component yard.
* `YardSlot`: Specific coordinate coordinate slot in a zone.
* `YardItemPlacement`: Component physical placement details.
* `YardCrane`: Heavy cranes and equipment tracker.
* `YardReservation`: Booking coordinates for components prior to entry/dispatch.
* `YardMovement`: Immutable movement logs of components on the yard.
* `YardLoadUnloadTask`: Detailed crane tasks for loading, unloading, or shifting.

## API Endpoints

Designed endpoints in the blueprint include:

* `POST /yard/reservations` - Create slot reservations
* `POST /yard/placements` - Confirm physical component placements
* `POST /yard/movements` - Move components internally
* `GET /yard/layout-state` - Read layout state (snapshot-first)

## Routes

* Yard cockpit routes are active in the app navigation.

## Remaining Tasks (Phased Sprints)

* **Sprint 1**: Set up Prisma models and `YardRepository`.
* **Sprint 2**: Implement APIs for Placements and Reservations with occupancy gates.
* **Sprint 3**: Implement internal movements and Crane task queue dispatch.
* **Sprint 4**: Build `snapshot.yard.rebuild` background job and register metrics.
* **Sprint 5**: Integrate 2D/3D visual map on the frontend and wire AI smart stacking suggestions.
# EPIC160 Core Platform and Business Audit

## Audit Status

- Core Platform compliance: approximately 36% - BLOCKED.
- YMS business completeness: approximately 45% - BLOCKED.
- Repository: partial; Yard persistence is centralized but `removeItem` accesses Component/Production models through the transaction client.
- ADR011: failed; active workspace loads unbounded zones/slots and aggregates in React.
- Snapshot: manual `YardSnapshot` only; no Core Snapshot Engine integration.
- Runtime: global middleware only; no Yard module counters.
- Operations Center: no Yard Platform Health.
- Events: persistent but non-atomic and incomplete.

## Implemented Domain

- Yard zones, rows and slots.
- Component/item placement with stack-level guard.
- Internal movement and source/target occupancy updates.
- Removal with movement history.
- Crane registry/reference.
- Attachments and activity logs.
- Manual layout JSON snapshots.

## Business Gaps

- Formal QC PASS receipt/admission.
- Reservation and expiry/conflict lifecycle.
- Hold and release.
- Truck loading plans and crane load/unload tasks.
- Formal Logistics dispatch handoff and Project receipt.
- Weight-based slot/zone and stacking constraints.

## Active UI/Data Risks

- Empty 3D map renders `DEMO-*` placements.
- Yard QC status is synthesized by row index.
- History/KPI calculations use only the newest 12 movements.
- Main search/filter controls do not query the backend.

## Next Architecture Sequence

EPIC161 Repository/Atomic Outbox -> EPIC162 Live Read Model -> EPIC163 Snapshot -> EPIC164 Runtime/Operations Center -> separate Business Completion.
# EPIC161 Repository Foundation

## Status

- Repository Coverage: 100% (registered Yard module)
- Repository Boundary: PASS
- Transaction Boundary: PASS
- Atomic Outbox: PASS
- Cross-module persistence boundary: PASS
- ADR011 Live Read Model: pending EPIC162
- Core Snapshot: pending EPIC163
- Runtime/Operations Center: PASS (event coverage partial)

## Repository Contract

- `YardService` owns validation and orchestration.
- `YardRepository` owns Yard persistence, transaction creation, ActivityLog,
  Outbox and the existing Component/Production compatibility persistence used by
  Yard removal.
- Business rows, ActivityLog, audit Outbox and domain Outbox commit atomically.
- Existing event names and payloads remain unchanged.

## Unchanged

No UI, frontend, React Query, API, DTO, schema, migration, Read Model, Snapshot,
Runtime, Operations Center or business workflow changed in EPIC161.
# EPIC162 Live Read Model

## Platform Status

- Repository Foundation: PASS
- Atomic Outbox: PASS
- ADR011 Live Read Model: PASS
- Bounded workspace data: PASS
- Server KPI/history aggregation: PASS
- Fake 3D / synthetic QC data: removed
- Snapshot Foundation: pending EPIC163
- Runtime / Operations Center: PASS (event coverage partial)

## Workspace Contract

- Active endpoint: `GET /yard/read-model/workspace`.
- Zones, slots, movements and cranes are bounded.
- Slots and movement history expose independent pagination metadata.
- Search, zone/slot status, movement item/location/date/type and sorting are repository-owned.
- KPI, trend, movement distribution, zone utilization, crane availability,
  component distribution and QC queue are server-owned.
- Existing mutation APIs and legacy read APIs remain compatible.

## ADR011

Yard operator workspaces read the repository live model. Future dashboard and
analytics snapshots must not replace this strong read-after-write path.
# EPIC163 Snapshot Foundation

## Platform Status

- Repository Foundation: PASS
- Atomic Outbox: PASS
- ADR011 Live Read Model: PASS
- Snapshot Schema: PASS, migration deployed
- Snapshot Repository: PASS
- Snapshot Reader/Fallback: PASS
- Snapshot Writer/Background: PASS
- Snapshot Validator: PASS, warning-only
- Feature Flag: PASS (`USE_YARD_SNAPSHOT`)
- Runtime/Operations Center: PASS (event coverage partial)

## Domain Snapshots

- `YardDashboardSnapshot`: daily reusable Yard KPI and analytics summary.
- `YardWorkspaceSnapshot`: reusable global/per-zone capacity/layout summary.
- Legacy `YardSnapshot`: retained separately as operator-generated layout audit.

## Read Contract

- Dashboard/analytics foundation: snapshot-first with repository fallback.
- Missing/stale snapshot: live result plus background update request.
- Operator workspace: always `YardReadModelRepository` under ADR011.

## Freshness Limit

Only existing Yard placement, movement, removal, zone and manual-snapshot events
are routed. No reservation, hold, loading or dispatch workflow/event was added.
# RFC002A Canonical Payloads

Yard placement/movement events now emit bounded placement/location facts with a
complete AD-019 envelope. Placement is authoritative for new events. Prior move
zone/stack facts and `yard.loading.completed` remain unavailable, so full Yard
movement/loading projections are non-authoritative.
