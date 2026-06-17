# Current State

This document summarizes the current operational state of SteelTrack as of 2026-06-13. Percentages and detailed task ordering remain tracked in `PROJECT_STATUS.md` and `NEXT_TASKS.md`.

## Inventory

Status:

- Completed operational foundation.

Current architecture:

- Frontend Inventory module uses React/Vite/TanStack Query cockpit pages and modal workflows.
- Backend Inventory uses transaction documents and transaction items for stock movements.
- `inventory_location_stocks` stores current balance by `inventoryItemId + zoneId + slotId + level`.
- `inventory_items.quantity` remains a compatibility snapshot for modules still reading material quantity directly.
- Warehouse locations are stored in `warehouse_zones` and linked to `master_warehouses` (`MAIN` / `PRODUCTION`).
- Sprint 9 stock mutation paths use the full location bucket `inventoryItemId + warehouseId + zoneId + slotId + level` for exact location validation and location stock upsert.
- Sprint 11A decimal pass supports locale-formatted quantity input in operational Inventory forms and keeps VND currency display rounded to whole dong.
- Sprint 12A treats Inventory Overview/Stock as the UI design reference; Inventory visual wrappers now delegate to shared module UI primitives without changing Inventory behavior.
- Sprint 12C adds sticky module filters and frontend KPI click-to-filter for Inventory stock status where matching filters exist.
- Sprint 13B.1 redesigns the Material Detail drawer with shared module UI primitives, KPI strip, horizontal tabs, colored transaction badges, location distribution, movement trend, forecast, project usage, and supplier purchase summaries.
- Sprint 13B.2 adds shared `ModuleTabs` and brings the Material Detail drawer to Module UI Foundation compliance for tabs, table tokens, drawer behavior, and focused 2D location preview.
- Sprint 11A.2 centralizes frontend numeric formatting through shared quantity/currency helpers and removes ad-hoc `toLocaleString('vi-VN')` / `Intl.NumberFormat` usage from frontend source.
- Sprint 13B.3 adds Material Detail image gallery readiness, Material Master image preview UI, and standardized Material Analytics Cockpit panels for inbound, outbound, inventory trend, 7-day forecast, and turnover.
- Sprint 14A connects Material Detail image gallery to the shared Attachments backend. Material photos are uploaded through `/attachments/upload`, stored on filesystem under `STORAGE_ROOT`, and displayed from attachment metadata.
- Material Detail now shows non-photo `Tài liệu vật tư` attachments with original filename, size, upload date, and download link.
- Inventory Material Stock KPI sparklines use real monthly snapshots from Inventory audit rows, material `createdAt`, and Inventory transaction item movement history.
- Operational code generation now follows `PREFIX-YYMMDD-###` for new Inventory, Production, Components, Projects, QC, material movement, and receiving codes; see `docs/ai-state/decisions/code-numbering-decisions.md`.

Known limitations:

- Some document numbers are still suggested on the frontend, but now use the short shared code convention rather than timestamp/random suffixes.
- Slot-level reconciliation is not yet a formal ledger rebuilt from immutable transaction history.
- Sprint 8 audit found transaction-vs-location reconciliation mismatches and snapshot mismatches that need operator/admin review before any automated backfill.
- Sprint 9 fixed active mutation paths that created new snapshot/location mismatches, but existing mismatched validation rows still require a dedicated reconciliation/backfill decision.
- Some Inventory modal/chart helpers remain locally embedded instead of shared visual components.
- Material photo upload is persisted through shared attachments. General non-photo document upload controls for datasheets, CO, CQ, and catalogs are still pending rollout beyond the current display/download section.

Current focus:

- Preserve transaction-first behavior.
- Continue warehouse structure cleanup, persisted slot-level balance work, and Sprint 12B UI rollout to other modules.

## Production

Status:

- In progress operational foundation.

Current architecture:

- Production covers BOMs, Manufacturing Orders, routing stages, production logs, material issues, QC gate handoff, and Yard staging.
- BOM material availability uses production warehouse stock.
- Production Material Reservation Sprint 1 persists reservation headers/lines and previews allocation by production warehouse location.
- Sprint 10C reservation allocation uses active `inventory_location_stocks.quantity > 0` buckets only and matches exact `inventoryItemId + warehouseId + zoneId + slotId + level`.
- Production Material Ledger Sprint 2 records reservation lifecycle events with MO, reservation, material, location, quantity, event type, date, remark, and actor.
- Sprint 3 issues material from reservation lines, returns unused issued material, updates exact `inventory_location_stocks`, and writes `ISSUE`/`RETURN` ledger rows.
- Sprint 10A reconciles production material return after consumption: returnable quantity is capped by issued minus consumed, scrap, and previous returned quantity; valid returns are posted back to `MAIN` / `Kho chính`.
- Sprint 4 records actual production material consumption and scrap per MO/material and writes `CONSUME` ledger rows.
- Sprint 5 persists component costing from production consumption and Inventory average cost, then syncs Component estimated/actual cost fields.
- Sprint 10B automatically recalculates Component costing after production completion/component `READY`; costing failure is logged as a warning and does not roll back production completion.
- Sprint 11 exposes Component costing material breakdown by BOM planned materials and actual production consumption, including variance warnings.
- Sprint 11A decimal pass supports decimal BOM, MO, issue/return/consume, and Yard staging quantities in frontend workflows and backend DTO parsing.
- Sprint 12B aligns the Production Cockpit presentation with the shared module UI foundation for KPI strip, analytics panels, filter bar, and the primary data grid.
- Sprint 12C adds sticky filters, clickable status KPIs, shared loading states, and route-level frontend splitting around Production pages.
- Production can create/mark a component from an MO only after material has been issued.
- MO start auto-issues missing BOM material quantities from `Kho vật tư SX` and creates outbound Inventory movements.
- Sprint 9 auto-issue planning preserves production warehouse slot/level and production issue transaction items carry the same warehouse/zone/slot/level into Inventory.
- Production-to-Yard staging requires linked QC inspection status `PASSED` or `APPROVED`.

Known limitations:

- Material issue from reservation is implemented, but approval-oriented multi-line issue/return documents are still future work.
- Ledger records `RESERVE`, `RELEASE`, `ISSUE`, `RETURN`, and `CONSUME`; adjust writers remain future work.
- Production material warehouse balance is still tied to Inventory transactions and issue rows, not a fully independent receipt/ledger model.
- Component costing persists material actuals and exposes material-level breakdown; labor, machine, overhead, QC rework, and Yard handling cost are currently zero/manual future inputs.
- Delivery and installation now complete the component lifecycle after Yard outbound with `SHIPPED -> DELIVERED -> INSTALLED`.
- Installation mapping stores exact project placement fields on Component: `installZone`, `installAxis`, `installLevel`, and `installPosition`.
- Sprint 8 audit found issued material remains unallocated where consumption has not been posted, and some issue rows are not yet represented by `ISSUE` ledger rows.
- Historical production issue rows that were created before Sprint 9 may still be missing exact slot/level transaction location and require reconciliation rather than silent mutation.
- Historical issue/consume rows may remain partially unreconciled until a clean validation dataset or approved backfill is run; Sprint 10A fixed the active return path only.
- Runtime integrity currently still reports one historical invalid reservation bucket created before Sprint 10C; no silent data backfill was performed.

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
- Sprint 12B aligns Yard cockpit page header, KPI strip, filter bar, occupancy analytics, shipment/operation analytics, and trend panels with the shared module UI foundation.
- Sprint 12C lazy-loads Yard 2D/3D operational maps; the large 3D map chunk is isolated to the 3D tab.

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
- Sprint 12B aligns Projects page header, KPI strip, Project runtime cards, Components runtime cards, filter bar, table shell, and empty state with the shared module UI foundation.
- Sprint 12C adds frontend KPI click-to-filter for Project and Project Component runtime cards and moves Project detail to the standard module drawer.
- Project Components actions can confirm receiving `SHIPPED` components into `DELIVERED` and confirm `DELIVERED` components into `INSTALLED`.
- Project runtime separates `readyComponents`, `shippedComponents`, `deliveredComponents`, and `installedComponents`; delivered project counts include `DELIVERED` and `INSTALLED`, not in-transit `SHIPPED`.
- Project Components installation confirmation requires Khu vực, Trục, Tầng, and Vị trí, and runtime returns these installation fields.
- Project component Actual Cost is populated from Component costing recalculation when consumption data exists.
- Project Components delivery and installation actions use the authenticated frontend API client and show success/error feedback.
- Project Components row navigation opens the existing Component detail modal on the Components list when routed with a component id.
- Components List and Components Stock now follow the Sprint 12A Inventory cockpit layout foundation with shared page headers, shared card/table primitives, and lifecycle KPI strips.
- Sprint 8 audit found no installed-component `projectId` violations in current data.
- Current project workflows support visible management context and integration points rather than full contract/schedule control.

Known limitations:

- Contract fields, milestones, project material budgets, planned/actual schedule baselines, documents, and photo attachments are not complete.
- Project return flows are not yet formalized with full Yard and Inventory documents.
- Delivery/installation confirmation does not yet create formal signed handover or installation certificate documents.
- Installation mapping is text-field based; coordinate/drawing overlay validation is still future work.
- Component detail still lives as a modal on the Components list rather than a dedicated `/components/:id` route.

Current focus:

- Build Projects Phase S2 with contract, milestone, budget, schedule baseline, and document/photo foundations.

## Dashboard

Status:

- In progress real-data cockpit.

Current architecture:

- Main Dashboard uses `GET /dashboard/cockpit`.
- The cockpit aggregates Projects, Production Orders, Components, Inventory, Yard, QC, Activity Logs, and Notifications.
- UI follows the Inventory dark cockpit baseline.
- Sprint 13 main Dashboard is now an Executive Dashboard with Inventory Forecast, Component Pipeline, Yard Occupancy, QC Quality Trend, Production Signal, and Executive Alerts.
- Dashboard now adds material replenishment forecast panels that identify material codes needing purchase/import, projected 7-day balances, and recommended quantities from existing Inventory Audit and transaction data.
- Dashboard now adds a 7-day component forecast from current Component lifecycle status and open Production Orders.
- Executive Alerts include top material replenishment needs plus component delivery/installation backlog signals.
- Forecasts and alerts are rules-based from existing operational data only; no AI/ML, API contract, schema, or workflow changes were introduced.

Known limitations:

- Persisted dashboard preferences do not exist yet.
- Drill-through actions and notification/action mutation flows remain Phase S2.
- Forecast accuracy is limited by currently available historical movement aggregates; panels display assumptions where detailed time-series data is incomplete.
- Material recommendations are dashboard-only analytics and do not yet create procurement requests because Purchasing is not implemented.

Current focus:

- Add dashboard preferences, deeper drill-through links, procurement links for replenishment recommendations, and action mutations after System/Purchasing mutation APIs exist.

## System

Status:

- In progress System Phase S1 foundation.

Current architecture:

- Settings, Users, Roles & Permissions, System Logs, Notifications, and operational workflow health are API-backed.
- Attachments are a shared metadata-first subsystem. PostgreSQL stores attachment metadata only; file bytes are stored under `STORAGE_ROOT` or `/data/steeltrack-storage` and served through `/uploads/*`.
- Attachment upload validates MIME type and file size, computes SHA256 checksums, and reuses existing physical files for duplicate content while creating new metadata references.
- Users/Roles/System Logs use real `User`, `Role`, `Permission`, and `ActivityLog` data.
- Notifications read persisted notification rows through `/system/notifications`.
- Frontend auth now uses the shared Zustand auth store, persisted access/refresh tokens, Axios auth interceptor, active `/login` route, and app route guard.
- Runtime Integrity read-only KPI APIs expose Inventory, Production, and Project integrity summaries under `/runtime/integrity/*`.

Known limitations:

- User create/edit/lock/delete, role permission mutation, notification mark-read, audit export, backup execution, and persisted editable settings are not implemented.
- Attachment deletion currently removes/soft-deletes metadata through the existing attachment lifecycle; physical file cleanup policy for deduped files remains a future operations decision.
- Legacy archived auth/router files remain in the repository and should not be treated as active app entrypoints.

Current focus:

- Implement System Phase S2 mutation APIs and operational controls.

## Documentation

Status:

- Ai-state is the primary operational documentation source.

Current architecture:

- Current status, module state, tasks, decisions, design guidance, and audits live under `docs/ai-state/`.
- Sprint 12C records frontend route splitting and UI polish guidance in `docs/ai-state/design/ui-standardization-foundation.md`.
- Legacy root docs have been audited and their useful content has been merged into ai-state decision, design, roadmap, workflow, and audit documents.
- Historical overview/refactor docs are moved to `docs/archive/` when classified as archive.

Known limitations:

- Some legacy docs are intentionally retained after merge until the team confirms whether they should remain as onboarding entry points.
- Empty legacy module placeholders were removed when classified as delete.

Current focus:

- Keep `docs/ai-state` updated after workflow changes.
- Use `docs/ai-state/audits/post-cleanup-summary.md` and `legacy-docs-audit.md` to guide any further cleanup.
- Use `docs/ai-state/audits/system-integrity-audit.md` before planning reconciliation/backfill work.
