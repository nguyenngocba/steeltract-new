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
- Notifications/Thông báo now reads persisted `notifications` records from `/system/notifications` and is registered in the active router.
- System mutation workflows are still not implemented: user create/edit/lock/delete, role permission mutation, notification mark-read, audit export, and backup execution remain Phase S2.

## 2026-06-07 Production Material Notes

- Production BOM creation now blocks over-allocation against real `Kho vật tư SX` balance and shows `Cần / Tồn SX` shortage warnings in the BOM modal.
- Starting a Manufacturing Order now auto-issues missing BOM material quantities from production warehouse stock and creates `ISSUED` production material issue rows plus outbound inventory movements.
- Formal BOM reservation documents and manual material issue approval/editing remain backlog work.

## 2026-06-11 Documentation Notes

- `docs/ai-state` is now the primary documentation source for current state, workflow, module status, decisions, design guidance, and audits.
- Legacy MERGE documentation has been folded into ai-state documents:
  architecture decisions, inventory decisions, workflow rules, roadmap, repo structure, event naming, and technical debt audit.
- Legacy ARCHIVE documents are moved to `docs/archive/`.
- Empty legacy module placeholder docs classified as DELETE have been removed.
