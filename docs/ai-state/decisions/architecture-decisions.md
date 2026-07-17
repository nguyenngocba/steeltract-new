# Architecture Decisions

## AD-001: Modular Monolith Boundary

Decision:

- SteelTrack remains a modular monolith with business modules organized around Inventory, Components, Production, Yard, Projects, Suppliers, QC, Dashboard, and System.

Rationale:

- The current codebase shares a single Prisma schema, common runtime navigation, and cross-module workflows that are easier to keep consistent inside one deployable application.

Implications:

- Prefer extending existing modules over creating new top-level modules.
- Cross-module workflows should be expressed through service boundaries, persisted documents, and explicit integration points.

## AD-002: Transaction-First Inventory

Decision:

- Inventory movements are represented as inventory transactions and transaction items.

Rationale:

- Stock movement must remain auditable across receiving, outbound, transfer, production issue, return, and adjustment workflows.

Implications:

- Do not directly mutate material quantity as the primary stock operation.
- New stock-affecting workflows should create transaction documents and lines.

## AD-003: Location Stock Snapshot

Decision:

- `inventory_location_stocks` is the current operational source for material balance by `inventoryItemId + zoneId + slotId + level`.

Rationale:

- The system now needs slot/floor-level warehouse views and validation in create/inbound/outbound/transfer workflows.

Implications:

- Location-aware UI should read positive `inventory_location_stocks` balances where available.
- Future reconciliation should rebuild or verify this table from transaction history.

## AD-004: Material Quantity Snapshot Compatibility

Decision:

- `inventory_items.quantity` remains a summary/snapshot only.

Rationale:

- Existing modules still read material quantity directly, but detailed location balance is now tracked separately.

Implications:

- Keep snapshot updates for backward compatibility.
- Avoid using `inventory_items.quantity` as the sole source for location-sensitive workflows.

## AD-005: Remove Empty Location Stock Rows

Decision:

- Location stock rows with resulting `quantity <= 0` are deleted instead of retained.

Rationale:

- Active warehouse views and selectors should only show usable positive stock locations.

Implications:

- Historical audit must come from transactions, not zero-balance snapshot rows.

## AD-006: Main Warehouse And Production Warehouse Are Separate

Decision:

- `MAIN` / `Kho chính` and `PRODUCTION` / `Kho sản xuất` are separate parent warehouses.

Rationale:

- Production material staging and consumption must not be mixed with main warehouse stock.

Implications:

- General Inventory transfer is limited to `Kho chính`.
- Production material availability and BOM validation use `Kho sản xuất`.

## AD-007: Real Data Over Static Mock Cockpits

Decision:

- Dashboard, System, Notifications, Users, Roles, Logs, QC, Suppliers, and Inventory views should prefer persisted runtime data over static mock arrays.

Rationale:

- SteelTrack is now focused on operational ERP/MES workflows rather than static prototypes.

Implications:

- UI pages should call backend APIs where operational data exists.
- Placeholder controls should be documented as Phase S2 when mutation APIs are not yet implemented.

## AD-008: Inventory Visual Baseline

Decision:

- Current enterprise pages should follow the Inventory dark cockpit visual baseline.

Rationale:

- The user expects a consistent warehouse/material-management theme across modules.

Implications:

- New module work should reuse compact KPI cards, dark panels, table shells, and constrained operational layouts.

## AD-009: AI-State Documentation Is Mandatory

Decision:

- `docs/ai-state` is the operational memory for Codex work.

Rationale:

- The project changes quickly and needs durable context between sessions.

Implications:

- Completed work must update `CHANGELOG_AI.md`.
- Workflow/state changes must update the relevant status, module, decision, or task docs.

## AD-010: Architecture Freeze Rules

Decision:

- SteelTrack architecture freeze remains active for runtime and module boundaries.

Rationale:

- The project has accumulated legacy/runtime experiments, and current work must stabilize rather than introduce duplicate abstractions.

Rules:

- No duplicate runtimes.
- No duplicate workspace systems.
- No direct Prisma usage in controllers for new work.
- No giant components.
- No experimental abstractions in core.

Deprecated runtime names:

- `cockpit-runtime`
- `workspace-runtime`
- `telemetry-runtime`
- duplicated engine layers

Official roots:

- Frontend: `core/`, `shared/`, `modules/`, `infrastructure/`.
- Backend: `modules/`, `core/`, `shared/`.

## AD-011: Layered Backend Responsibility

Decision:

- New backend work should follow Controller -> Service -> Repository -> Prisma.

Rationale:

- Controllers should validate and route requests only; business logic belongs in services and database query reuse belongs in repositories.

Implications:

- Direct Prisma calls in controllers are technical debt unless they are part of pre-existing legacy code being left untouched.
- New service code should avoid manipulating HTTP responses directly.

## AD-012: Realtime Payloads Stay Lightweight

Decision:

- Realtime events should send identifiers and changed fields, not full objects.

Rationale:

- Large websocket payloads increase coupling and make frontend cache consistency harder.

Implications:

- Frontend should refetch server state with TanStack Query after receiving lightweight realtime signals.

## AD-013: Event Naming Standard

Decision:

- Event names use lowercase dot notation in the format `domain.entity.action`.

Examples:

- `inventory.item.received`
- `inventory.item.issued`
- `inventory.item.returned`
- `production.order.started`
- `production.order.completed`
- `qc.inspection.failed`
- `qc.inspection.passed`
- `yard.slot.assigned`
- `yard.component.moved`
- `project.delivery.completed`

Rules:

- Lowercase only.
- Dot notation only.
- No spaces.
- No generic names.
- Event payloads must be lightweight.

## AD-014: Attachment Binary Storage Outside Source Tree

Decision:

- SteelTrack stores attachment metadata in PostgreSQL and file bytes on filesystem storage outside the application source tree.
- The storage root is configured by `STORAGE_ROOT` and defaults to `/data/steeltrack-storage`.

Rationale:

- Uploaded files should be backup-able, moveable, and later replaceable by NAS/MinIO/S3-style storage without coupling them to the frontend build, backend source tree, or repository history.

Implications:

- Do not store uploaded file bytes in PostgreSQL.
- Do not store uploaded files under `apps/frontend/public`, repo-local `uploads`, or other source-code folders.
- UI should display `originalName`; backend storage should use deterministic stored names plus checksum-based dedupe.
- Duplicate content should reuse the existing physical file and create a separate metadata reference.

## AD-015: Bounded Context Ownership And Foreign Write Prohibition

Decision:

- Inventory, Components, Production, QC, Projects, Yard, Suppliers and
  Logistics each exclusively own their aggregates, commands, source queries and
  authoritative events.
- No module may write another context's tables or call its repository as a
  persistence shortcut.
- Cross-context mutation uses an application command service exported by the
  owner. The owner validates and performs its own writes.
- Owner services may share one local PostgreSQL transaction context when an
  atomic invariant requires it. This remains a modular-monolith transaction,
  not shared aggregate ownership or distributed 2PC.
- Non-atomic collaboration uses Outbox events and idempotent consumers.

Core ownership:

- Inventory owns stock, valuation, location balances, adjustment and stock take.
- Components owns Component identity and future revision/released engineering
  definition.
- Production owns Work/Production execution, material reservation/issue intent,
  consumption, production return intent, completion, scrap and rework execution.
- QC owns inspection result and NCR.
- Projects owns WBS demand/allocation, site return intent and installation
  acceptance.
- Yard owns physical topology, allocation, placement, movement and loading
  execution.
- Suppliers owns supplier/commercial sourcing documents.
- Logistics owns loading plan, dispatch, shipment and delivery proof.

Implications:

- Production Issue/Return invokes Inventory's posting boundary; Inventory alone
  mutates stock and publishes the Inventory fact.
- Components does not own a duplicate material ledger and cannot post generic
  Inventory returns for Production material.
- Component, Production, QC, Yard, Logistics and Project statuses remain
  separate source facts; one shared status column must not act as a workflow bus.
- Earlier direct foreign Repository allowances are superseded by ADS001.
- See `docs/architecture/domain-ownership-matrix.md` and related ADS001 reports.

## AD-016: Component Identity And Engineering Revision State Machine

Decision:

- `Component` owns identity availability with canonical states `DRAFT`,
  `ACTIVE`, `DEPRECATED` and terminal `ARCHIVED`.
- `ComponentRevision` owns engineering review and release with canonical states
  `DRAFT`, `IN_REVIEW`, `APPROVED`, `RELEASED`, `SUPERSEDED` and terminal
  `ARCHIVED`.
- Engineering BOM content is versioned inside one Component Revision. It cannot
  be released separately from its parent revision.
- Released and superseded revisions are immutable. Corrections require a new
  revision; release cannot roll back to an editable state.
- A Component has at most one current released revision. Releasing a replacement
  and superseding the prior revision must be atomic.
- Archive is non-destructive and obligation-gated. It never deletes released
  engineering history or invalidates existing downstream references.

Ownership implications:

- Production stage, QC result, Inventory/Yard location, Logistics delivery and
  Project installation remain foreign owner facts and read projections.
- Existing `ComponentStatus` values are compatibility data, not the ADS002
  canonical state machine. ADS002 authorizes no automatic mapping or migration.
- `component.revision.released` is the sole canonical release fact; duplicate
  release events describing the same transition are forbidden.
- Event envelope/version/subscriber compatibility remains an ADS004 decision.
- See `docs/architecture/component-state-machine.md` and the ADS002 companion
  documents.

## AD-017: Production Execution, Completion, Scrap And Rework State Machine

Decision:

- Production Order retains the canonical lifecycle `DRAFT -> RELEASED -> READY
  -> IN_PROGRESS <-> PAUSED -> COMPLETED -> CLOSED`, with `DRAFT -> CANCELLED`.
- `READY` is a canonical admission state. Start must revalidate volatile gates.
- One Production Order coordinates one or more independently versioned Work
  Orders generated from its frozen routing basis.
- Production starts at the atomic `StartProductionOrder` commit that also
  starts the first eligible Work Order and Execution Run.
- Partial completion is append-only and does not transition the Order. Final
  completion and close are separate commands with separate gates.
- Scrap is a Production-owned disposition aggregate separate from Consumption.
  Posted Scrap is immutable and corrected only by reversal.
- Rework never rewinds the original Order. Production accepts a QC-owned
  NCR/rework request by creating a linked `REWORK` Production Order in `DRAFT`.

Ownership implications:

- Inventory alone posts stock for Issue, Return or recoverable Scrap.
- Components owns the released engineering Revision/BOM referenced by an Order;
  Production cannot mutate it.
- QC owns rejected quantity, NCR and re-inspection result. Production consumes
  them as projections/commands and owns execution only.
- Existing standalone WorkOrder, ProductionStage and Consumption `scrapQty`
  records are compatibility data. ADS003 authorizes no migration or automatic
  reinterpretation.
- Event envelope/version/subscriber compatibility remains an ADS004 decision.
- See `docs/architecture/production-state-machine.md` and the ADS003 companion
  documents.

## AD-018: Production-Inventory Application Interaction Contract

Decision:

- Production owns Reservation, Issue intent, Consumption, Return intent,
  Completion, Scrap and Production material ledger.
- Inventory owns live physical availability queries and every stock/valuation
  posting.
- Reservation draft/release, Consumption, Completion and non-recoverable Scrap
  are Production-local and never mutate Inventory.
- Issue, Return and explicit recoverable Scrap receipt use Inventory's exported
  posting service inside one shared local PostgreSQL transaction.
- Inventory returns a bounded idempotent PostingReceipt. Production records the
  receipt identifiers in its domain record/ledger before the common commit.
- Owner Outbox events update projections after commit. Event replay never
  repeats an already committed stock mutation.

Implications:

- Draft Reservation begins only after Order release; allocation/ledger/event
  begins when material is actually reserved.
- Consumption and Completion never reduce Inventory because stock was reduced
  at Issue.
- Return restores stock only through Inventory-owned posting.
- Scrap does not imply Inventory Adjustment. Recoverable Scrap uses an explicit
  Inventory receipt command; QC retains inspection/NCR/disposition ownership.
- These are internal application contracts and change no public API.
- ADS004 must define event envelope, version, subscriber, retry and replay
  details without changing these interaction semantics.

## AD-019: Canonical Cross-module Event Contract

Decision:

- Every canonical event has one AD-015 publisher, one immutable schema version,
  a documented ordering key, stable idempotency key and explicit subscribers.
- ADS004 events begin at envelope version `1`; the version is not embedded in
  the event name.
- Delivery is at least once. Consumers achieve one business effect through
  durable event-id/version deduplication and aggregate-version ordering.
- Mutation and Outbox commit atomically. Retry/replay republishes the fact and
  never re-executes the original owner mutation.
- Subscribers may update only their projection or invoke their own validated
  command. They cannot write the publisher aggregate or republish the source
  fact as their own.

Canonical conflict resolutions:

- Component release is `component.revision.released`, not
  `component.released`.
- Production Issue/Return are `production.material.issued/returned`, not
  `production.issue.completed` or `production.return.completed`.
- Production Scrap is `production.scrap.posted/reversed`.
- Yard uses `yard.item.placed/moved`; Logistics uses
  `logistics.shipment.created/dispatched/delivered`.
- Broad current signals such as `inventory.transaction.created`,
  `component.updated` and legacy Production names are compatibility/internal
  inputs, not alternate canonical facts.

AD-018 protection:

- Inventory stock is posted synchronously through the owner application
  contract before Issue/Return events exist.
- No Production event consumer may infer or repeat Inventory stock mutation.
- See `docs/architecture/canonical-event-catalog.md` and ADS004 companions.
