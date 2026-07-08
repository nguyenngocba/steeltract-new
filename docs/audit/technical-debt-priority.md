# Technical Debt Priority

Date: 2026-07-08

Scope: EPIC111 Inventory and Production technical debt. Audit only.

## Critical

### Inventory command paths still bypass repository boundaries

Evidence:

- `InventoryService` injects `PrismaService`.
- `ReturnWorkflowService` directly writes return requests, return items, project material allocations, activity logs, and inventory transactions.

Impact:

- Harder to enforce idempotency, background jobs, event publishing, and snapshot updates consistently.

Recommended action:

- Repository-wrap current command behavior without changing workflow.

### ProductionOrder / WorkOrder domain ambiguity

Evidence:

- `ProductionOrder` is the main production aggregate.
- Separate `WorkOrder` model and `WorkOrderService` still exist with direct Prisma calls.

Impact:

- Future MES features may attach to the wrong aggregate or duplicate workflow state.

Recommended action:

- Decide whether `WorkOrder` is deprecated, an alias, or a separate planning aggregate. Document and enforce the boundary before new Production features.

### Production lacks persisted snapshots

Evidence:

- Snapshot cutover targets Inventory, Projects, and Logistics dispatch.
- No first-class `ProductionDashboardSnapshot` or stage/readiness snapshots exist.

Impact:

- Production cockpit, execution board, material readiness, stage queues, and warehouse shortage analytics will become expensive as production data grows.

Recommended action:

- Add Production snapshot design before deeper MES rollout.

### Canonical event contracts are incomplete

Evidence:

- Inventory and Production import EventsModule/EventBus, but lifecycle events are not consistently published.

Impact:

- Background jobs, snapshots, Operations Center, notifications, and integrations cannot rely on a uniform event stream.

Recommended action:

- Define and publish Inventory and Production lifecycle events via outbox.

## High

### Inventory Material Detail remains broad

Impact:

- Material history, analytics, attachments, project usage, and supplier usage may over-fetch as transaction volume grows.

Recommended action:

- Split into tab-native APIs/read models and keep React Query cache per tab.

### Inventory return reconciliation is synchronous and loop-heavy

Impact:

- Large return requests or bulk project returns can create command latency and retry/idempotency risk.

Recommended action:

- Keep stock receipt synchronous, move non-blocking allocation summaries, timeline fan-out, and snapshot refresh to background jobs.

### Production direct Prisma services remain widespread

Evidence:

- BOM, material issue, consumption, ledger, reservation, workorder, and parts of ProductionService call Prisma directly.

Impact:

- Query policies, transaction boundaries, idempotency, and event publication remain inconsistent.

Recommended action:

- Introduce repositories per aggregate boundary before changing workflows.

### Missing MES domains

Missing or weak:

- Shift.
- Operation.
- Production line.
- Downtime.
- OEE.
- Immutable stage transition history.
- Operator/machine execution records.

Impact:

- Production cannot yet scale into a full MES.

Recommended action:

- Design domains first, then implement behind existing APIs where possible.

## Medium

### Inventory frontend has multiple generations

Evidence:

- Inventory contains `pages/tabs`, `features`, `tabs`, `domain`, `runtime`, duplicate services/stores.

Impact:

- Higher chance of fixing inactive UI paths or duplicating behavior.

Recommended action:

- Create an active/inactive frontend ownership map before deleting anything.

### Production placeholder routes

Evidence:

- `production-tabs.ts` and router include planning, incidents, and reports.

Impact:

- Users may reach views that are not fully workflow-backed.

Recommended action:

- Mark placeholders clearly or implement real foundations after domain hardening.

### Operations Center lacks module drill-down

Impact:

- Runtime visibility exists, but module owners cannot quickly isolate Inventory vs Production health.

Recommended action:

- Add read-only module panels after event/snapshot adoption.

### Approval workflows are inconsistent

Inventory:

- Stocktake/adjustment/inbound/outbound approval controls are partial.

Production:

- Material issue/return/consume/scrap approval/document controls are partial.

Recommended action:

- Standardize workflow states only after event contracts exist.

## Low

### UX polish leftovers

Inventory and Production are mostly aligned visually. Remaining debt is lower priority than repository/event/snapshot work.

Examples:

- drawer consistency checks after future pages;
- table density and pagination consistency;
- placeholder empty states;
- duplicate helper extraction.

### Documentation freshness

Some module docs contain older sprint framing alongside newer platform notes.

Recommended action:

- Continue appending audit-backed updates, then prune obsolete sprint-era sections in a dedicated documentation cleanup.

