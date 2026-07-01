# SteelTrack Enterprise Architecture Audit

Date: 2026-06-29

Scope: architecture audit only. No application code, schema, migration, workflow, commit, or staging changes.

## Executive Summary

SteelTrack has a strong operational core in Inventory, Production, Components, Yard, QC, Costing, and Dashboard. The system is no longer just a CRUD shell: it has transaction documents, stock buckets, production reservations/issues/consumptions, material ledgers, component lifecycle, Yard placements/movements, QC inspections/NCR, attachments, workflow definitions, outbox/background jobs, and shared cockpit UI primitives.

The main architectural gap is not "missing screens"; it is enterprise orchestration:

- Workflow definitions exist, but module workflows are not consistently bound to WorkflowInstance approvals.
- Realtime gateways exist, but most primary workspaces still depend on polling.
- Costing has material-cost foundations, but labor, machine, overhead, rework, and logistics costs are not captured as first-class facts.
- Historical import is not ready because transaction replay, location ledger rebuild, and snapshot rebuild rules are not formalized.
- Logistics and Planning are navigation-ready but business-model incomplete.

## Phase 1 - Module Inventory

| Module | Status | Routes | Pages/Tabs | Drawers/Forms | Tables | Charts | Reports | Realtime |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Inventory | Implemented | Complete | Complete | Complete | Complete | Strong | Partial | Polling + gateway foundation |
| Components | Partial | Complete | Complete | Strong | Strong | Partial | Placeholder | Polling |
| Production | Partial | Complete | Broad | Strong | Strong | Strong | Placeholder | Polling + backend logs |
| Yard | Partial | Complete | Broad incl. 2D/3D | Strong | Strong | Strong | Partial | Polling |
| Projects | Partial | Complete | Broad | Partial | Strong | Partial | Placeholder | Polling |
| Suppliers | Partial | Complete | Broad | Partial | Partial | Partial | Placeholder | Polling |
| QC | Partial | Complete | Broad | Strong | Strong | Partial | Placeholder | Polling |
| Logistics | Placeholder | Complete | Placeholder/static | Minimal | Static | Static | Placeholder | Not ready |
| Planning | Placeholder | Partial | Production planning route | Minimal | Partial | Missing | Missing | Not ready |
| Admin/System | Partial | Complete | Users/Roles/Settings/Logs | Partial | Strong | Partial | Partial | Polling |
| Dashboard | Partial | Complete | KPI/Trends/Activities/Notifications | Read-only | Strong | Strong | Partial | Polling |

## Phase 2 - Navigation Audit

Navigation is mostly route-backed. Active routes are registered in `apps/frontend/src/app/router/AppRouter.tsx`; sidebar entries are duplicated across `apps/frontend/src/app/shell/sidebar/navigation.config.ts` and `apps/frontend/src/app/config/navigation.config.ts`.

| Module | Navigation Status | Notes |
|---|---:|---|
| Dashboard | Complete | Uses `/` plus query tabs such as `/?tab=trends`. Needs search-aware active state consistency in all sidebar renderers. |
| Inventory | Complete | Dedicated routes for overview, materials, locations, transactions, inbound, outbound, transfer, stock-take, adjustments, alerts, master data, audit. |
| Components | Complete | All listed tabs route-backed; `/components/reports` currently reuses history page. |
| Production | Complete/Partial | Route-backed tabs, but incidents and reports are placeholders inside one page component. |
| Yard | Complete | 2D/3D/locations/components/dispatch/tracking/heatmap/timeline/history are route-backed. |
| Projects | Complete/Partial | Route-backed, but costs/documents/logs are placeholders. |
| Suppliers | Complete/Partial | Route-backed, but quotes/purchase/payables/logs/reports are placeholders or thin views. |
| QC | Complete/Partial | Route-backed. CAPA maps to NCR-style view; legacy plan/standards/calibration routes still exist but are not all in sidebar. |
| Logistics | Complete/Placeholder | Route-backed but data is static/demo inside frontend page. |
| Admin | Partial | `/settings/rbac`, `/settings/master-data`, `/settings/logs` appear in one config but are not registered in AppRouter. |

Broken/debt found:

- Two active navigation configs are not perfectly synchronized.
- Some route entries are intentionally placeholders but look like full modules.
- Several legacy/archived router/sidebar files remain in repository and should not be treated as active architecture.

## Phase 3 - Data Model Audit

Core entities are present:

- Inventory: `InventoryItem`, `InventoryTransaction`, `InventoryTransactionItem`, `InventoryLocationStock`, `ReturnRequest`, `ReturnRequestItem`, `WarehouseZone`.
- Components: `Component`, `ComponentCosting`, `ComponentTimeline`.
- Production: `ProductionOrder`, `BOM`, `BOMItem`, `BOMRoutingStep`, `ProductionMaterialReservation`, `ProductionMaterialReservationLine`, `ProductionMaterialLedger`, `ProductionMaterialIssue`, `ProductionMaterialConsumption`, `ProductionStage`, `ProductionTask`, `ProductionSchedule`, `ProductionLog`, `WorkCenter`, `Machine`, `WorkOrder`.
- Yard: `YardZone`, `YardRow`, `YardSlot`, `YardItemPlacement`, `YardMovement`, `Crane`, `YardSnapshot`.
- QC: `QcChecklist`, `QcChecklistItem`, `QcInspection`, `QcResult`, `QcIssue`, `QcAttachment`, `NonConformanceReport`.
- Projects/Suppliers/Purchasing: `Project`, `Supplier`, `PurchaseOrder`, `PurchaseOrderItem`, `PurchaseReceiving`, `MaterialRequest`, `MaterialRequestItem`.
- Platform: `WorkflowDefinition`, `WorkflowStep`, `WorkflowInstance`, `WorkflowAction`, `Attachment`, `AttachmentVersion`, `AttachmentLink`, `OutboxEvent`, `BackgroundJob`, `JobExecution`, `ActivityLog`, `Notification`.

Missing or weak entities:

- Logistics delivery/dispatch/shipment entities are missing; `Vehicle` alone is not enough.
- Project cost/budget/milestone/document entities are missing or not first-class.
- CAPA is not first-class; QC has NCR and issues, but CAPA workflow is not modeled deeply.
- Labor, machine, overhead rate/capture entities are missing for full costing.
- Immutable slot-level Inventory ledger is missing.
- WorkflowInstance binding to operational module records is not yet systematic.

Duplicated/dead risks:

- `WarehouseZone` exists for inventory/storage and `YardZone` exists for yard; this is valid but needs naming discipline.
- `Task` and `ProductionTask` may confuse operators/developers unless documented by module ownership.
- Archived frontend modules/routers can confuse audits and code search.

## Phase 4 - Dashboard Audit

Dashboard now has:

- KPI Chính.
- Executive Control Tower.
- Predictive Trends.
- Recent Activities.
- Notifications.
- Recommendations.
- Backend services: Dashboard metrics, activity, notification, insight, recommendation.

Real data coverage:

- Inventory: strong.
- Production: moderate.
- Yard: moderate.
- QC: moderate.
- Projects: moderate.
- Suppliers/Purchasing: partial.
- Logistics: weak.

Risks:

- Some dashboard queries read and aggregate recent operational rows on demand.
- Dashboard is read-only; suggested actions do not create workflow tasks or purchase requests.
- Health/recommendation rules need calibration against real operator data.

## Phase 5 - Workflow Readiness

| Module | Readiness | Notes |
|---|---:|---|
| Inventory | Partial | Transaction workflows are strong; approvals are only partial. |
| Production | Partial | Reservation/issue/return/consume are strong; approval/document state machine is incomplete. |
| Projects | Partial | Delivery/install lifecycle exists; milestones/contracts/approvals are incomplete. |
| Suppliers | Not Ready | Supplier master/evaluation exists; purchasing workflow is incomplete. |
| QC | Partial | Inspection/NCR exists; CAPA and assignment workflow are incomplete. |

## Phase 6 - Costing Readiness

| Cost Type | Readiness | Evidence |
|---|---:|---|
| Material Cost | Ready/Partial | Transaction item valuation, issue valuation, consumption, component costing, read-only Costing Engine. |
| Labor Cost | Not Ready | Workers/tasks exist, but no labor time and rate capture bound to costing. |
| Machine Cost | Not Ready | Machines/work centers exist, but no runtime/rate capture bound to costing. |
| Overhead Cost | Not Ready | No allocation rules or persisted overhead pools. |
| Project Cost | Partial | Read-only aggregation can roll up material cost; budgets/baselines missing. |

## Phase 7 - Historical Import Readiness

Historical import is Partial at best.

Ready:

- Master data import can be designed around categories, units, suppliers, projects, warehouses, zones, users, roles.
- Attachment metadata model is ready.

Blockers:

- Imported stock must reconcile `InventoryTransactionItem`, `InventoryLocationStock`, and `InventoryItem.quantity`.
- No formal ledger rebuild command exists.
- Historical Production ledgers may need replay from issue/consume rows.
- Snapshot rebuild strategy is not formalized.
- Duplicate operational code handling is improved for Inventory, but not generalized across modules.

## Phase 8 - Realtime Readiness

Backend has WebSocket foundations:

- `RuntimeGateway`.
- `RealtimeGateway`.
- `EventsGateway` with domain subscriptions and throttling.
- Inventory gateway.

Frontend still mostly uses polling:

- Dashboard: 10 seconds.
- Inventory: 4-5 seconds.
- Production/Yard/Projects/QC/Suppliers: 5 seconds.

Readiness: Partial.

Gap: define a single event contract per module and connect workspaces to event-triggered query invalidation instead of broad polling.

## Phase 9 - Performance Audit

Strengths:

- Prisma indexes exist on many status/date/entity fields.
- Operational pages generally use TanStack Query and `useMemo`.
- Many backend list queries are bounded or domain-specific.

Risks at scale:

- 1M rows: current dashboards likely remain usable if time windows stay bounded, but frontend-heavy reductions can become slow.
- 5M rows: dashboard activity/trend and transaction pages need persisted rollups or server-side pagination everywhere.
- 10M rows: on-demand aggregation over `InventoryTransaction`, `InventoryTransactionItem`, `YardMovement`, `ProductionLog`, and `ActivityLog` becomes a bottleneck.

Priority performance debt:

- Add/persist analytic snapshots for dashboard trends.
- Replace frontend reduce/filter over full arrays with paginated API queries.
- Add missing composite indexes after query-plan review.
- Add materialized/read models for stock movement, production readiness, and project cost.

## Phase 10 - Design System Audit

Shared cockpit primitives exist:

- `CockpitKpiCard`.
- `CockpitChartCard`.
- `CockpitTableShell`.
- `DataTablePagination`.
- `CockpitSidebarStats`.
- `CockpitRecentList`.
- `CockpitStatusList`.
- `CockpitEmptyState`.
- `COCKPIT_SHELL`.
- `COCKPIT_HEIGHTS`.

Coverage:

- Inventory, Components, Production, Yard, Dashboard use shared cockpit primitives.
- Projects, Suppliers, QC, Logistics still use older `Module*`, enterprise, or local panel styles.

Design debt:

- Some Components pages still contain hardcoded/demo metric values.
- Logistics has a separate local visual system and static data.
- Projects/Suppliers/QC are operationally useful but not fully cockpit-standard.

## Overall Architecture Judgment

Mature enough for:

- Inventory transaction operations.
- Production material flow.
- Component lifecycle.
- Yard placement/movement.
- QC gate basics.
- Executive read-only dashboard.
- Material costing foundation.

Not yet mature enough for:

- Enterprise workflow engine rollout across all modules.
- Historical import at production scale.
- Realtime-first operations.
- Full actual costing including labor/machine/overhead.
- Logistics control tower.

