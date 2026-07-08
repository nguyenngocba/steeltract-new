# SteelTrack 5-Year Data Growth Plan

Date: 2026-07-07

Scope: EPIC 101 / Sprint ARCH.4.

This plan describes how SteelTrack should grow from the current operational system to 100M+ and eventually 1B+ records without changing business workflows. It is a planning document only; no schema changes were made.

## Growth Assumptions

Year 1:

* 10K-100K inventory transactions.
* 100K-1M transaction lines, activity logs, and attachment records.
* ProjectTask and Production ledger tables remain manageable with normal indexes.

Years 2-3:

* 1M-20M operational transaction/log/event rows.
* Dashboard and runtime endpoints must rely on snapshots or bounded read models.
* Audit/history screens require date windows by default.

Years 4-5:

* 100M+ rows in transaction, ledger, log, movement, and event tables.
* Some installations can approach 1B+ records across ledgers and events.
* Partitioning, archive policy, and persisted read models become mandatory.

## Tables That Need Partition Planning

Partition by month or quarter:

* `inventory_transactions` by `transactionDate`.
* `inventory_transaction_items` by transaction date through parent relationship or by denormalized transaction date if introduced.
* `activity_logs` by `createdAt`.
* `production_material_ledgers` by `eventDate`.
* `yard_movements` by `createdAt`.
* `dispatch_events` by `createdAt`.
* future inventory stock/value ledger tables by event date.

Partition optional:

* `attachments` metadata by `createdAt` if file/document volume grows heavily.
* `notifications` by `createdAt`.
* `background_jobs` by `createdAt` or archive status.

Do not partition early:

* master data, role/permission, category/unit, warehouse layout, template, and configuration tables.

## Archive Policy

Recommended retention in hot tables:

* Inventory transaction headers/items: keep all financial/legal rows hot for the required accounting window; move older operational details to archive only after audit requirements are defined.
* Activity logs: hot 12-24 months, archive older rows.
* Notifications: hot 6-12 months, archive or summarize older rows.
* Dispatch/Yard events: hot 12-24 months, archive older detailed events while preserving final status summaries.
* Attachment metadata: never delete active business documents automatically; archive old versions and soft-deleted records.

Archive requirements:

* Archives must preserve immutable ids.
* Archive lookup must not break audit exports.
* Dashboard snapshots must not depend on archived raw rows for normal operation.

## Persisted Read Models

Required before enterprise scale:

### InventoryDashboardSnapshot

Purpose:

* Stock value, total quantity, low/out stock, warehouse/category distribution, movement trends, procurement suggestions.

Refresh triggers:

* inventory transaction created/voided.
* material minimum stock update.
* nightly full rebuild.

### MaterialDailyMovementSnapshot

Purpose:

* Material Detail trend/history without scanning transaction lines.

Refresh triggers:

* inventory transaction line created/updated.
* nightly reconciliation.

### ProjectRuntimeSnapshot

Purpose:

* Project cockpit, command center, WBS health, cost, task status, resource readiness.

Refresh triggers:

* project task changed.
* material allocation changed.
* component allocation changed.
* return lifecycle changed.
* logistics dispatch received.

### ProjectTaskHealthSnapshot

Purpose:

* delayed tasks, dependency cascade impact, procurement readiness, cost variance.

Refresh triggers:

* project task dependency/date/progress/resource/cost changes.

### LogisticsDispatchSnapshot

Purpose:

* dispatch counts, status trends, vehicle utilization, pending receive/load boards.

Refresh triggers:

* dispatch order/event/item changed.

### DashboardExecutiveSnapshot

Purpose:

* executive health score, summary, recommendations, notification counts, and trend panels.

Refresh triggers:

* fan-in from module snapshots.
* scheduled periodic rebuild.

## Event Contract Foundation

Use small id-based events. Do not send full aggregate payloads.

Recommended event names:

* `inventory.transaction.created`
* `inventory.stock.changed`
* `inventory.return.requested`
* `inventory.return.received`
* `project.task.created`
* `project.task.updated`
* `project.task.deleted`
* `project.schedule.changed`
* `project.material.changed`
* `project.component.changed`
* `project.cost.changed`
* `project.inspection.changed`
* `logistics.dispatch.changed`
* `yard.movement.created`
* `production.ledger.changed`
* `dashboard.snapshot.invalidated`

Recommended event payload:

```json
{
  "eventName": "project.task.updated",
  "aggregateType": "ProjectTask",
  "aggregateId": "project-task-id",
  "projectId": "project-id",
  "occurredAt": "2026-07-07T00:00:00.000Z",
  "metadata": {
    "changedFields": ["status", "progress"]
  }
}
```

Rules:

* Event payloads identify what changed; snapshot builders fetch the current state.
* Events must be idempotent.
* Snapshot rebuild jobs must tolerate duplicate events.
* Full rebuild remains the source of truth when event replay is incomplete.

## Migration Roadmap

Phase 1:

* Enforce the performance gate.
* Add composite indexes for known high-volume query paths.
* Add endpoint timing and slow-query diagnostics.

Phase 2:

* Add persisted read model tables for Inventory, Projects, Logistics, and Dashboard.
* Keep existing API contracts; switch service internals to snapshots.
* Add nightly full rebuild jobs.

Phase 3:

* Add event-driven snapshot invalidation and incremental rebuild.
* Add archive tables/processes for ActivityLog, Yard/Dispatch events, and notifications.
* Add partitioning for transaction/log/ledger/event tables once data volume warrants it.

Phase 4:

* Add historical import tooling with ledger/snapshot rebuild.
* Add read-only archive search/export.
* Add operational SLO dashboards for endpoint latency and snapshot freshness.

## Design Principle

Operational workflows remain normalized and auditable.

Dashboard, command center, trend, and executive views should read persisted summaries.

This separation lets SteelTrack scale records without rewriting business logic.

