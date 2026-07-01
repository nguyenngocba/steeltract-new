# SteelTrack Modules

## Completed

✅ Inventory

## In Progress

🚧 Dashboard
🚧 Components
🚧 Production
🚧 Yard
🚧 Settings
🚧 Suppliers
🚧 Projects
🚧 QC
🚧 Logistics
🚧 Users / Roles / System Logs

## Not Started

❌ Organizations

## 2026-06-06 UI Notes

- Projects, Suppliers, QC, Logistics, Settings, Users, Roles, and System Logs now follow the Inventory visual baseline for background, panels, KPI cards, compact filters, action buttons, tables, and chart cards.
- Logistics now has frontend routes at `/logistics`, `/logistics/routes`, and `/logistics/gps`; this is an In Progress UI cockpit and still needs real transport API integration.
- Components cockpit UI now follows the Inventory visual baseline for KPI cards, filters, panels, tables, action buttons, and detail modals.
- Components now has a dedicated Overview page at `/components`; the component list moved to `/components/list`.
- Components child pages no longer render an in-page horizontal tab strip; navigation follows the sidebar pattern like Inventory.
- Components list and stock tabs include compact chart panels for status distribution, creation rhythm, yard distribution, and yard status.
- Production cockpit UI now follows the Inventory visual baseline for page background, tab bar, KPI cards, filter bar, quick actions, status donut, shop-load chart, and MO table shell.
- Yard cockpit shell now follows the Inventory visual baseline for page background, top actions, tab strip, KPI cards, filter bar, yard capacity donut, movement donut, movement trend chart, and modal styling.
- Production BOM, material issue, and production log tables now use the same shared table shell/head/row visual style as Inventory.
- These updates are frontend-only visual consolidation; workflow and backend logic remain unchanged.

## 2026-06-07 System/Dashboard Notes

- Users, Roles & Permissions, and System Logs now use richer real runtime data from System APIs instead of thin table-only views.
- Dashboard/Tổng quan now uses `GET /dashboard/cockpit` and aggregates real Projects, Production, Components, Inventory, Yard, QC, Activity Logs, and Notifications data.
- Sprint 70EXEC.1 adds `GET /dashboard/executive-cockpit` plus backend metrics/activity/notification services for URL-driven Executive tabs: Predictive Trends, Recent Activities, and System Notifications.
- Sprint 70EXEC.2 extends `GET /dashboard/executive-cockpit` with Control Tower health score, 7-day summary, suggested actions, activity grouping, and notification center through backend insight/recommendation services.
- Notifications/Thông báo now reads persisted `notifications` records from `/system/notifications` and is registered in the active router.
- System mutation workflows are still not implemented: user create/edit/lock/delete, role permission mutation, notification mark-read, audit export, and backup execution remain Phase S2.

## 2026-06-07 Production Material Notes

- Production BOM creation now blocks over-allocation against real `Kho vật tư SX` balance and shows `Cần / Tồn SX` shortage warnings in the BOM modal.
- Starting a Manufacturing Order now auto-issues missing BOM material quantities from production warehouse stock and creates `ISSUED` production material issue rows plus outbound inventory movements.
- Production Reservation Sprint 1 now has formal reservation documents, reservation preview, reserve/release/expire APIs, `/production/reservations`, and MO detail reservation preview/create action.
- Production Material Ledger Sprint 2 now has a `ProductionMaterialLedger` model, read APIs, reservation lifecycle ledger writes, `/production/material-ledger`, and filters for MO, material, event type, and date range.
- Production Execution Sprint 3 now has issue-from-reservation, material return, exact production location stock updates, `ISSUE`/`RETURN` ledger events, and production-context component creation.
- Production Consumption Sprint 4 now has `ProductionMaterialConsumption`, consume APIs, `CONSUME` ledger events, and `/production/consumptions`.
- Component Costing Sprint 5 now has `ComponentCosting`, component costing APIs, material actual cost from production consumption and Inventory average cost, and a Component detail Costing section.
- Delivery/Installation Sprint 6 now has component `SHIPPED -> DELIVERED -> INSTALLED` APIs, timeline rows, Project Components actions, and runtime delivered/installed counters.
- Installation Mapping Sprint 7 now stores component install Zone/Axis/Level/Position, requires those fields in the install modal/API, returns them through Projects runtime, and shows them in Project Components and Component Detail.
- Projects Sprint 40PROJ.3 now exposes WBS, financial, health, and return request read models through Projects runtime; Project Detail renders a WBS tree grid and can create material return requests through the existing Inventory `SITE_RETURN` workflow.
- Projects Sprint 40PROJ.8 now adds persisted Project Template Library, default `Nhà xưởng 5 nhịp` template seed, template-backed project creation into normalized ProjectTask rows, and Quick Update Simple Mode foundation for field progress updates.
- System Audit & Hardening Sprint 8 added read-only Runtime Integrity KPI APIs and documented current Inventory, Production, Component, Costing, and Project integrity findings.
- Material Return Reconciliation Sprint 10A now validates returnable quantity after consumed/scrap quantities, returns unused issued material to Main Warehouse, writes Inventory `RETURN` plus Production Material Ledger `RETURN`, and prompts for partial returns in the Production Cockpit.
- Automatic Component Costing Sprint 10B now recalculates ComponentCosting during production completion/component READY workflows without requiring a manual Recalculate button.
- Reservation Allocation Integrity Sprint 10C now allocates reservations from active exact `inventory_location_stocks` production buckets only and exposes invalid reservation buckets in Runtime Integrity.
- Component Costing Breakdown Sprint 11 now exposes material-level planned vs actual costing rows and warnings in Component Detail.
- BOM Intelligence Sprint 18C now maps Component -> Production Order -> BOM -> BOM Items -> Production Material Issues and calculates Component Material Ready from required versus net issued quantity in the frontend cockpit.
- Work Order Cockpit Sprint 18D now upgrades `/production/orders` with Work Order KPIs, Material Ready %, Inventory-style grid, detail drawer sections, analytics panels, and UI-only `READY TO RELEASE` signaling.
- Material Issue Dashboard Sprint 18E now upgrades `/production/material-issues` into a Production Material Control Center with issue KPIs, BOM/Issue readiness calculations, Inventory-style grid, drawer sections, and analytics panels.
- Production Warehouse Sprint 19A now adds `/production/warehouse` for `PRODUCTION` warehouse stock KPIs, material availability, shortage/readiness analytics, WO consumption analytics, and Production Zone / Slot / Level detail.
- Production Execution Board Sprint 19B now adds `/production/execution` as a Kanban shopfloor board with stage columns, Work Order cards, bottleneck analytics, delay detection, material readiness, and Work Order drawer sections.
- MES Data Audit Sprint 19C documents current MES readiness in `docs/ai-state/audits/mes-data-audit.md` and recommends Costing Engine work before deeper Shopfloor development.
- Current Shopfloor data has usable skeletons (`ProductionStage`, `ProductionTask`, `ProductionLog`, `WorkCenter`, `Machine`) but still lacks canonical immutable transition history, runtime/downtime capture, production-line queues, and labor/machine rate data.
- Current Costing data is stronger because BOM planned materials, Production Material Consumption, Inventory Transaction Item valuation, and ComponentCosting already support the next material-costing phase.
- Costing Engine Sprint 20A now adds read-only backend cost summaries for Production Orders, Components, and Projects without schema or workflow changes.
- Sprint 20A material cost uses actual production issue Inventory transaction valuation first, then falls back to weighted average Inventory cost.
- Approval-oriented issue/return documents, adjust ledger writers, richer consumption entry UX, labor/machine/overhead costing inputs, and costing approvals remain backlog work.

## 2026-06-11 Documentation Notes

- `docs/ai-state` is now the primary documentation source for current state, workflow, module status, decisions, design guidance, and audits.
- Legacy MERGE documentation has been folded into ai-state documents:
  architecture decisions, inventory decisions, workflow rules, roadmap, repo structure, event naming, and technical debt audit.
- Legacy ARCHIVE documents are moved to `docs/archive/`.
- Empty legacy module placeholder docs classified as DELETE have been removed.
