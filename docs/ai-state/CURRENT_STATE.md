# Current State

This document summarizes the current operational state of SteelTrack as of 2026-06-12. Percentages and detailed task ordering remain tracked in `PROJECT_STATUS.md` and `NEXT_TASKS.md`.

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
- Sprint 8 audit found transaction-vs-location reconciliation mismatches and snapshot mismatches that need operator/admin review before any automated backfill.
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
- Production Material Reservation Sprint 1 persists reservation headers/lines and previews allocation by production warehouse location.
- Production Material Ledger Sprint 2 records reservation lifecycle events with MO, reservation, material, location, quantity, event type, date, remark, and actor.
- Sprint 3 issues material from reservation lines, returns unused issued material, updates exact `inventory_location_stocks`, and writes `ISSUE`/`RETURN` ledger rows.
- Sprint 4 records actual production material consumption and scrap per MO/material and writes `CONSUME` ledger rows.
- Sprint 5 persists component costing from production consumption and Inventory average cost, then syncs Component estimated/actual cost fields.
- Production can create/mark a component from an MO only after material has been issued.
- MO start auto-issues missing BOM material quantities from `Kho vật tư SX` and creates outbound Inventory movements.
- Production-to-Yard staging requires linked QC inspection status `PASSED` or `APPROVED`.

Known limitations:

- Material issue from reservation is implemented, but approval-oriented multi-line issue/return documents are still future work.
- Ledger records `RESERVE`, `RELEASE`, `ISSUE`, `RETURN`, and `CONSUME`; adjust writers remain future work.
- Production material warehouse balance is still tied to Inventory transactions and issue rows, not a fully independent receipt/ledger model.
- Component costing persists material actuals; labor, machine, overhead, QC rework, and Yard handling cost are currently zero/manual future inputs.
- Delivery and installation now complete the component lifecycle after Yard outbound with `SHIPPED -> DELIVERED -> INSTALLED`.
- Installation mapping stores exact project placement fields on Component: `installZone`, `installAxis`, `installLevel`, and `installPosition`.
- Sprint 8 audit found issued material remains unallocated where consumption has not been posted, and some issue rows are not yet represented by `ISSUE` ledger rows.

Current focus:

- Add material issue/return approval documents, adjust ledger writers, and richer production costing inputs.

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
- Yard outbound removal for component placements now marks the linked Component as `SHIPPED`, preserves/infers `projectId`, and writes a component timeline entry.
- Project delivery and installation confirmation now happen from Projects, after Yard outbound marks the component `SHIPPED`.
- 2D cockpit/map concepts exist for operator visibility.

Known limitations:

- Formal outbound/shipment documents are not implemented.
- Yard outbound currently records handoff through Yard movement, Component status, Component timeline, and ActivityLog; a dedicated delivery/project receiving document model is still backlog.
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
- Projects runtime now exposes project-linked components from `components.projectId`.
- Projects UI includes `Cấu kiện công trình` next to `Vật tư theo công trình`, with component status filters, summary cards, planned/installed dates, and estimated/actual cost columns.
- Project Components actions can confirm receiving `SHIPPED` components into `DELIVERED` and confirm `DELIVERED` components into `INSTALLED`.
- Project runtime separates `readyComponents`, `shippedComponents`, `deliveredComponents`, and `installedComponents`; delivered project counts include `DELIVERED` and `INSTALLED`, not in-transit `SHIPPED`.
- Project Components installation confirmation requires Khu vực, Trục, Tầng, and Vị trí, and runtime returns these installation fields.
- Project component Actual Cost is populated from Component costing recalculation when consumption data exists.
- Sprint 8 audit found no installed-component `projectId` violations in current data.
- Current project workflows support visible management context and integration points rather than full contract/schedule control.

Known limitations:

- Contract fields, milestones, project material budgets, planned/actual schedule baselines, documents, and photo attachments are not complete.
- Project return flows are not yet formalized with full Yard and Inventory documents.
- Delivery/installation confirmation does not yet create formal signed handover or installation certificate documents.
- Installation mapping is text-field based; coordinate/drawing overlay validation is still future work.
- Project component row click routes to the Components list because an active component detail route by id is not implemented yet.

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
- Frontend auth now uses the shared Zustand auth store, persisted access/refresh tokens, Axios auth interceptor, active `/login` route, and app route guard.
- Runtime Integrity read-only KPI APIs expose Inventory, Production, and Project integrity summaries under `/runtime/integrity/*`.

Known limitations:

- User create/edit/lock/delete, role permission mutation, notification mark-read, audit export, backup execution, and persisted editable settings are not implemented.
- Legacy archived auth/router files remain in the repository and should not be treated as active app entrypoints.

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
- Use `docs/ai-state/audits/system-integrity-audit.md` before planning reconciliation/backfill work.
