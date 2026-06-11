# Current State

This document summarizes the current operational state of SteelTrack as of 2026-06-11. Percentages and detailed task ordering remain tracked in `PROJECT_STATUS.md` and `NEXT_TASKS.md`.

## Inventory

Status:

- Completed operational foundation.

Current architecture:

- Frontend Inventory module uses React/Vite/TanStack Query cockpit pages and modal workflows.
- Backend Inventory uses transaction documents and transaction items for stock movements.
- `inventory_location_stocks` stores current balance by `inventoryItemId + zoneId + slotId + level`.
- `inventory_items.quantity` remains a compatibility snapshot for modules still reading material quantity directly.
- Warehouse locations are stored in `warehouse_zones` and linked to `master_warehouses` (`MAIN` / `PRODUCTION`).

Known limitations:

- Some document numbers are still generated on the frontend.
- Slot-level reconciliation is not yet a formal ledger rebuilt from immutable transaction history.
- Some Inventory modal helpers remain locally embedded instead of shared visual components.

Current focus:

- Preserve transaction-first behavior.
- Continue warehouse structure cleanup, persisted slot-level balance work, and Inventory UI component extraction.

## Production

Status:

- In progress operational foundation.

Current architecture:

- Production covers BOMs, Manufacturing Orders, routing stages, production logs, material issues, QC gate handoff, and Yard staging.
- BOM material availability uses production warehouse stock.
- MO start auto-issues missing BOM material quantities from `Kho vật tư SX` and creates outbound Inventory movements.
- Production-to-Yard staging requires linked QC inspection status `PASSED` or `APPROVED`.

Known limitations:

- BOM reservation is derived; there are no formal reservation documents yet.
- Production material warehouse balance is still tied to Inventory transactions and issue rows, not a fully independent receipt/ledger model.
- Finished component costing is not persisted with actual material, labor, machine, overhead, QC rework, and Yard handling cost.

Current focus:

- Formalize material reservation, manual issue/return approvals, and persisted production-material balance/costing ledgers.

## QC

Status:

- In progress operational cockpit.

Current architecture:

- QC cockpit is API-backed and integrated with Production and Components.
- Completed Manufacturing Orders feed the QC waiting queue.
- QC pass/approve unlocks Production-to-Yard staging.
- NCR, checklist, calibration, and report areas exist as foundations.

Known limitations:

- Checklist item result entry is not yet complete.
- Evidence attachments, NCR lifecycle actions, calibration records, and release certificates remain Phase S2.
- Inspector display can still expose raw user ids in places.

Current focus:

- Add checklist result matrix, evidence, NCR lifecycle, calibration, and formal QC release certificates.

## Yard

Status:

- In progress operational foundation.

Current architecture:

- Yard cockpit and staging flow are connected to components and QC-gated production output.
- Yard placements and movements track staged/removed component flow.
- 2D cockpit/map concepts exist for operator visibility.

Known limitations:

- Formal outbound/shipment documents are not implemented.
- Shipment staging, realtime movement animation, richer crane telemetry, and full zone/slot CRUD remain backlog.
- Project return readiness exists as workflow intent, but not as a complete formal document flow.

Current focus:

- Add shipment/outbound documents, staging workflow, movement telemetry, and richer yard CRUD.

## Suppliers

Status:

- In progress Supplier Master Cockpit.

Current architecture:

- Supplier master CRUD and cockpit detail pages are API-backed.
- Supplier usage, material history, and inbound history are derived from Inventory inbound transactions.
- Supplier score summary reads existing `supplier-score` data matched by supplier name.

Known limitations:

- Supplier-material mapping is not persisted.
- Procurement, purchase orders, contracts, approval workflows, document uploads, and score history are not yet implemented.

Current focus:

- Add Supplier-Material mapping and Supplier Phase S2 foundations before Procurement starts.

## Projects

Status:

- In progress foundational cockpit.

Current architecture:

- Project data participates in Dashboard, Inventory outbound, Production, QC grouping, and Yard workflow checks.
- Current project workflows support visible management context and integration points rather than full contract/schedule control.

Known limitations:

- Contract fields, milestones, project material budgets, planned/actual schedule baselines, documents, and photo attachments are not complete.
- Project return flows are not yet formalized with full Yard and Inventory documents.

Current focus:

- Build Projects Phase S2 with contract, milestone, budget, schedule baseline, and document/photo foundations.

## Dashboard

Status:

- In progress real-data cockpit.

Current architecture:

- Main Dashboard uses `GET /dashboard/cockpit`.
- The cockpit aggregates Projects, Production Orders, Components, Inventory, Yard, QC, Activity Logs, and Notifications.
- UI follows the Inventory dark cockpit baseline.

Known limitations:

- Persisted dashboard preferences do not exist yet.
- Drill-through actions and notification/action mutation flows remain Phase S2.

Current focus:

- Add dashboard preferences, deeper drill-through links, and action mutations after System mutation APIs exist.

## System

Status:

- In progress System Phase S1 foundation.

Current architecture:

- Settings, Users, Roles & Permissions, System Logs, Notifications, and operational workflow health are API-backed.
- Users/Roles/System Logs use real `User`, `Role`, `Permission`, and `ActivityLog` data.
- Notifications read persisted notification rows through `/system/notifications`.

Known limitations:

- User create/edit/lock/delete, role permission mutation, notification mark-read, audit export, backup execution, and persisted editable settings are not implemented.

Current focus:

- Implement System Phase S2 mutation APIs and operational controls.

## Documentation

Status:

- Ai-state is the primary operational documentation source.

Current architecture:

- Current status, module state, tasks, decisions, design guidance, and audits live under `docs/ai-state/`.
- Legacy root docs have been audited and their useful content has been merged into ai-state decision, design, roadmap, workflow, and audit documents.
- Historical overview/refactor docs are moved to `docs/archive/` when classified as archive.

Known limitations:

- Some legacy docs are intentionally retained after merge until the team confirms whether they should remain as onboarding entry points.
- Empty legacy module placeholders were removed when classified as delete.

Current focus:

- Keep `docs/ai-state` updated after workflow changes.
- Use `docs/ai-state/audits/post-cleanup-summary.md` and `legacy-docs-audit.md` to guide any further cleanup.
