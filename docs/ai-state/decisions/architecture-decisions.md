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
