# Inventory Core Platform Compliance Audit

Date: 2026-07-08

Scope: EPIC111. This is an audit only. No Inventory code, API, UI, workflow, Prisma schema, migration, commit, or staging operation was performed.

## Executive Summary

Inventory is the most mature business module in SteelTrack, but it is not yet fully compliant with the Core Platform target.

Estimated compliance:

```text
Inventory: 72%
```

Inventory has strong operational coverage, deterministic document numbering, exact stock-bucket mutation, attachments, return requests, dashboard snapshot cutover, and runtime metrics through the global platform layer. The main remaining gap is architectural consistency: command paths still call Prisma directly, some dashboard/detail reads still aggregate runtime data, workflow transitions are not consistently event/outbox-backed, and Operations Center visibility is still generic rather than Inventory-specific.

## Evidence Reviewed

Backend:

- `apps/backend-api/src/modules/inventory/inventory.module.ts`
- `apps/backend-api/src/modules/inventory/inventory.controller.ts`
- `apps/backend-api/src/modules/inventory/inventory.service.ts`
- `apps/backend-api/src/modules/inventory/inventory.repository.ts`
- `apps/backend-api/src/modules/inventory/return-workflow.service.ts`
- `apps/backend-api/src/modules/dashboard/dashboard-inventory-read-model.service.ts`
- `apps/backend-api/src/core/snapshots/*`
- `apps/backend-api/src/core/jobs/*`
- `apps/backend-api/src/modules/operations-center/*`

Frontend:

- `apps/frontend/src/modules/inventory/config/inventory-tabs.ts`
- `apps/frontend/src/modules/inventory/pages/tabs/*`
- `apps/frontend/src/app/router/AppRouter.tsx`
- `apps/frontend/src/app/config/navigation.config.ts`
- `apps/frontend/src/app/shell/sidebar/navigation.config.ts`

Prior audits:

- `docs/audit/enterprise-query-audit.md`
- `docs/audit/enterprise-index-audit.md`
- `docs/runtime/snapshot-cutover-report.md`
- `docs/runtime/operations-center-system-health-report.md`
- `docs/ai-state/modules/inventory.md`

## Workspace Compliance

| Workspace | Route | Status | Core Platform Notes |
| --- | --- | --- | --- |
| Tổng quan kho | `/inventory` | Strong | Snapshot-first dashboard path exists through `DashboardReaderService` and `InventoryDashboardSnapshot`; some chart/detail payloads still rely on runtime compatibility data. |
| Giao dịch | `/inventory/transactions` | Strong | Operational route exists. Transaction detail still uses nested item/material/location payloads and needs tab-scoped detail queries at large volume. |
| Vật tư & Tồn kho | `/inventory/materials` | Strong | Material detail is feature-rich but broad. Split analytics, history, attachments, project usage, supplier usage into tab-native APIs before transaction volume grows. |
| Phiếu trả | `/inventory/returns` | Medium | Return request workflow exists and reconciles project pending/returned quantities, but it remains Prisma-heavy and should publish formal events. |
| Nhập kho | `/inventory/inbound` | Strong | Exact Zone/Slot/Level validation exists. Smart suggestions read transaction history directly and should become a bounded read model if heavily used. |
| Xuất kho | `/inventory/outbound` | Strong | Valuation and all-line aggregation have been fixed. Approval/audit timeline is still lighter than enterprise workflow requirements. |
| Điều chuyển | `/inventory/transfer` | Strong | Exact source/destination bucket workflows exist. Route-level analytics should move to read models before large transaction growth. |
| Kiểm kê | `/inventory/stock-take` | Medium | UI and adjustment-preview workflow exist; formal approval and immutable stocktake session lifecycle need hardening. |
| Điều chỉnh | `/inventory/adjustments` | Medium | UX is aligned with Inventory cockpit. Adjustment audit context is stored in transaction note/metadata rather than first-class fields. |
| Cảnh báo | `/inventory/alerts` | Medium | Alerts are present, but alert rules should be backed by snapshot/read-model health signals. |
| Audit | `/inventory/audit` | Medium | Admin-only route exists. Audit should be converted into immutable event/activity timelines with bounded queries. |

## Repository Compliance

Status: Partial.

Strengths:

- `InventoryRepository` exists and is exported by `InventoryModule`.
- Dashboard inventory read-model sources and recent dashboard transactions go through the repository.
- Some transaction command handling exists via `CreateTransactionHandler` and query handling via `ListTransactionsHandler`.

Gaps:

- `InventoryService` still injects `PrismaService` and performs many direct reads/writes.
- `ReturnWorkflowService` directly calls Prisma for return requests, activity logs, project task material allocations, inventory transactions, and allocation reconciliation.
- Master-data controllers inside the Inventory module (`zones`, categories, units, material types) directly call Prisma.
- Repository boundaries are stronger for reads than for command workflows.

Recommendation:

1. Move command writes for Inventory transactions, stock buckets, return requests, and activity logs behind repositories.
2. Keep business behavior unchanged and wrap repository methods around current Prisma calls first.
3. Only after tests/validation are stable, split transaction command services from dashboard/detail query services.

## Runtime Metrics Compliance

Status: Strong at platform level, partial at module-level interpretation.

Strengths:

- Runtime metrics interceptor and Prisma query profiler are global platform services.
- Inventory APIs are automatically measured for latency, SQL count/time, memory, and budget signals.
- Snapshot metrics track hit/miss/fallback/stale/age/confidence.

Gaps:

- Inventory-specific runtime dashboards in Operations Center are not yet separated by workspace.
- There is no explicit Inventory workspace performance score showing Inbound, Outbound, Transfer, Returns, Materials, Locations, and Dashboard separately.

Recommendation:

- Add module/workspace tags to Inventory endpoints in runtime analytics reports.
- Surface Inventory workspace performance inside Operations Center without changing business APIs.

## Snapshot Compliance

Status: Good for dashboard, incomplete for operational/detail analytics.

Strengths:

- `InventoryDashboardSnapshot` exists.
- SNAP.2 routes Inventory cockpit dashboard reads through `DashboardReaderService`.
- Snapshot fallback, freshness, confidence, and parity warnings are implemented.

Gaps:

- Inventory dashboard snapshot is minimal and does not cover every chart/list field.
- Material Detail analytics, transaction timelines, location analytics, return request aging, and stocktake variance are not persisted snapshots.
- There is no persisted material daily movement snapshot or location-balance daily snapshot.

Recommendation:

Priority snapshot candidates:

1. `MaterialDailyMovementSnapshot`
2. `InventoryLocationBalanceSnapshot`
3. `InventoryReturnRequestSnapshot`
4. `InventoryTransactionValueSnapshot`
5. `InventoryStocktakeVarianceSnapshot`

## Background Engine Compliance

Status: Partial.

Strengths:

- Background job infrastructure, snapshot dispatcher, rebuilder, writer, validator, outbox, retry, and idempotency foundation exist.
- Inventory dashboard snapshot rebuild can be triggered through the background path.

Gaps:

- Inventory transaction creation still performs stock updates, item quantity snapshot updates, valuation, and some reconciliation synchronously.
- Return receipt/reject reconciliation is synchronous.
- Heavy historical rebuilds and reconciliation checks are not consistently background jobs.

Recommendation:

- Keep stock mutation synchronous where user consistency requires it.
- Move non-blocking side effects to background jobs:
  - dashboard/material/location snapshot updates;
  - notification generation;
  - activity timeline fan-out;
  - parity validation;
  - large historical reconciliation.

## Event Compliance

Status: Partial.

Strengths:

- `EventsModule` is imported by Inventory.
- `ReturnWorkflowService` injects `EventBusService`.
- Outbox/Event pipeline exists globally.

Gaps:

- Inventory does not consistently publish canonical events for every lifecycle transition.
- Cross-module workflows still rely on direct service calls and shared table updates, especially Project return reconciliation.

Recommended event contract:

- `inventory.transaction.created`
- `inventory.stock_bucket.updated`
- `inventory.return.requested`
- `inventory.return.received`
- `inventory.return.rejected`
- `inventory.stocktake.completed`
- `inventory.adjustment.posted`
- `inventory.material.updated`

Events should not replace synchronous stock correctness. They should drive snapshots, notifications, Operations Center counters, and integrations.

## Read Model And Query Compliance

Status: Medium.

Known risks from existing audits:

- Material Detail history can become heavy without tab-native APIs.
- Return workflow and Project material allocation calculations derive pending/returned/available values in multiple places.
- Transaction list/detail includes nested materials, units, warehouses, zones, and items.
- ActivityLog reads need strict module/date/entity bounds.

Recommendations:

- Keep detail-by-id includes bounded.
- Replace list/cockpit runtime reduces with read models.
- Add read model ownership for:
  - material history;
  - return request status/aging;
  - stock by location;
  - movement value by type/date;
  - stocktake variance.

## Operations Center Compliance

Status: Partial.

Available now:

- Operations Center shows global runtime, background jobs, outbox, snapshots, cache/read-model, database size, storage, API ranking, query ranking, performance score, and alerts.
- Inventory snapshots are visible as part of snapshot health.

Missing:

- Inventory-specific health page:
  - stock bucket mismatch count;
  - transaction valuation coverage;
  - pending returns;
  - stale material snapshots;
  - slow Inventory endpoints;
  - Inventory job queue health;
  - Inventory event failure groups.

Recommendation:

- Add an Operations Center Inventory panel in OPS follow-up work. Read-only first.

## UX Compliance

Status: Good, but fragmented.

Strengths:

- Inventory is still the Design System Master for cockpit pages.
- Workspaces use cockpit cards, chart cards, table shells, right-side drawers, and compact headers.
- Return Requests cockpit has been aligned with Inventory visual language.

Gaps:

- Multiple generations of frontend Inventory code still coexist:
  - `pages/tabs/*`
  - `features/*`
  - `tabs/*`
  - `domain/*`
  - `runtime/*`
  - duplicate stores/services.
- Some routes are standalone page routes while earlier UX decisions wanted a single Inventory workspace shell.
- Detail modal/drawer standardization is mostly done but should be checked after future pages are added.

Recommendation:

- Do not redesign now.
- Consolidate active workspace ownership in documentation and remove/retire orphaned frontend generations only after route usage is verified.

## Business Workflow Compliance

Status: Medium-High.

Strong workflows:

- Import/export/transfer/return transaction creation.
- Exact stock bucket enforcement.
- Deterministic document numbering.
- Project material return request and receive/reject lifecycle.
- Attachments for materials/transactions/returns.

Workflow gaps:

- Approval is incomplete for inbound, outbound, adjustment, stocktake, and return acceptance.
- Timeline/audit is not uniformly modeled as immutable lifecycle events.
- Attachments are implemented but not always required/validated by workflow state.
- Adjustment system/actual quantities remain audit metadata rather than first-class fields.
- Stocktake sessions need a formal approval lifecycle and immutable variance records.

## Scalability Readiness

Inventory is ready to scale operationally into higher volume if the next work focuses on read models and repository/event boundaries.

High-risk tables:

- `inventory_transactions`
- `inventory_transaction_items`
- `inventory_location_stocks`
- `return_requests`
- `activity_logs`
- `attachments`

The current index foundation helps common paths, but read-model conversion is still required before 100M+ transaction items.

## Required Before Further Major Inventory Features

Critical:

1. Repository-wrap remaining Inventory command paths.
2. Publish canonical Inventory events through outbox for transaction/return/adjustment/stocktake.
3. Add read models for Material Detail and stock/location analytics.

High:

1. Move non-blocking snapshot/notification/activity fan-out to background jobs.
2. Add Inventory-specific Operations Center health.
3. Formalize stocktake and adjustment audit fields.

Medium:

1. Consolidate frontend workspace generations.
2. Split Material Detail into tab-native lazy queries.
3. Add approval workflows where operators need control gates.

