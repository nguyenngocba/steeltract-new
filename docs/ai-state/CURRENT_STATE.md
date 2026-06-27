# Current State

This document summarizes the current operational state of SteelTrack as of 2026-06-24. Percentages and detailed task ordering remain tracked in `PROJECT_STATUS.md` and `NEXT_TASKS.md`.

## Runtime Dataset

Status:

- Business data was intentionally cleaned on 2026-06-24 so operators can recreate clean records manually.

Current architecture:

- The cleanup preserved system/configuration foundations: users, roles, permissions, inventory categories, material types, units, warehouses, warehouse zones, yard layout slots, QC checklist templates, workflow definitions, work centers, and machines.
- The cleanup cleared business/runtime data: materials, components, projects, suppliers, vehicles, inventory transactions and balances, production BOMs/orders/material activity, QC inspections/results/issues/NCRs, Yard placements/movements/snapshots, attachments metadata, notifications, analytics snapshots, and runtime logs.
- Backup before cleanup: `backups/steeltrack_before_business_data_cleanup_20260624_092729.dump`.
- Executed cleanup script: `scripts/sql/business-data-cleanup-20260624.sql`.
- Detailed audit: `docs/ai-state/audits/business-data-cleanup-20260624.md`.

Known limitations:

- Physical files under `/data/steeltrack-storage` were not deleted by SQL; attachment metadata in the database is now empty.

Current focus:

- Recreate clean master/business records manually from the preserved configuration foundation before validating workflows again.

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
- Sprint 14B splits Inventory attachments into Material Master attachments and Inventory Transaction attachments. Transaction documents use `module=inventory`, `entityType=transaction`, and `entityId=inventoryTransactionId`.
- Inventory Inbound, Outbound, Transfer, and Stock Take forms can upload attachments after the transaction is saved, and the Inventory Transactions page has a detail drawer with `Tài liệu đính kèm`.
- Sprint 14B.5 refines attachment UX: Inventory Materials list stays focused on material/stock/location/status, while Material Detail owns attachment context with summary counts, contextual document columns in transaction/project/supplier tabs, and source-classified document rows.
- Inventory Transactions UX 2.0 adds `Hồ sơ` columns to the dedicated Nhập kho, Xuất kho, Điều chuyển, and Kiểm kê lists; each `📎` count opens a transaction attachment drawer.
- Sprint 15A fixes outbound value display: Inventory Outbound now sums all transaction item values, and transaction API responses compute missing outbound `unitPrice` / `totalAmount` from average inbound material cost for legacy rows.
- Sprint 15B makes `inventory_transaction_items` the source of truth for transaction valuation. New transaction item writes persist `unitPrice` and `totalAmount`, direct Production/Material Movement writers do the same, and historical IMPORT/EXPORT/TRANSFER/RETURN rows were backfilled.
- Sprint 16A enhances Inventory Outbound with a transaction detail drawer, outbound value today KPI, value-based top material ranking, and top project ranking by outbound value using existing transaction API data.
- Sprint 16B enhances Inventory Transfer with a transaction detail drawer, source/destination location visibility, transfer value KPIs, route analytics, and source/destination location rankings using existing transaction API data.
- Sprint 16C enhances Inventory Inbound with a transaction detail drawer, all-line inbound aggregation, supplier/value analytics, price monitoring, and shared larger filter spacing across Inbound, Outbound, and Transfer tabs.
- Sprint 16D enhances Inventory Outbound analytics with project consumption share, daily/monthly outbound trend charts, material consumption value/issue counts, outbound-purpose distribution, financial KPIs for today/week/month/year, and abnormal consumption alerts using existing transaction API data only.
- Sprint 17A enhances Inventory Stock Take with session-level detail drawers, variance KPI cards, top variance materials/locations, and adjustment preview rows derived from existing adjustment transaction items.
- Sprint 17B enhances Inventory Locations with occupancy/free/occupied slot KPIs, inventory value by location, top occupied slots, click-through slot material drawer, and transfer movement route analytics using existing zone, audit, and transaction API data.
- Sprint 17E hardens Inventory document numbering: backend-owned `code = transactionNo`, five-digit `PREFIX-YYMMDD-00001` format, max-suffix generation instead of `count() + 1`, and retry on `P2002` duplicate collisions.
- Sprint 17F separates main warehouse, production warehouse, and total stock in Inventory Overview, Inventory Materials, and Material Detail. Stock health and purchasing alerts now use only `Kho chính` / `MAIN` balances so production stock cannot hide main-warehouse shortages.
- Sprint 19D/19E align Inventory Adjustments with the Inventory transaction workflow: sidebar route `/inventory/adjustments`, direct global action modal launch, shared `AdjustmentTransactionModal`, location-balance table, `WarehouseMiniMap`, location-specific System Qty, Actual Qty, auto Difference, Variance Value, reason presets, attachments, adjustment history grid, analytics, and row detail drawer.
- Inventory Overview monthly historical KPI trends and delta percentages use 12-point monthly snapshots computed using transaction ledger rollbacks and transaction-based existence dates (`firstTransactionDate`). Sparklines output real monthly trends when data age is >= 12 months (otherwise showing flat placeholder lines). Delta notes show absolute change and relative percentage change in parentheses (e.g. `▲5.203,5 tấn (+48,3%)`), and absolute counts change only for count metrics (e.g. `▲3 mã`). Category cards display simplified format values where the item count is styled as `text-white font-semibold` and quantity in tons is styled as `text-slate-400 font-normal` (e.g. `6 (2.053 tấn)`), maintaining equal height `h-[108px]`. Note text color uses dynamic emerald/red semantic coloring.
- Sprint 20I.4A restyles all 5 Inventory Materials dashboard cards to match the Inventory Overview card visual language: rounded-2xl containers, border-slate-800, bg-slate-950/60, and equal height of 260px. Card header typography is set to title: text-[10px] uppercase tracking-[0.12em] text-slate-400, primary value: text-2xl font-semibold text-white, and secondary note: text-[10px] text-slate-400. Cards 1 (Phân bố tồn kho), 2 (Biến động tồn kho), and 3 (Cảnh báo tồn kho) are updated in the materials tab layout, while Cards 4 (Theo mức độ) and 5 (Top tồn thấp) are restyled inside the alerts modal sidebar, reusing existing charts and preserving calculations and datasets.
- Sprint 20I.4C aligns the vertical rhythm of all 5 Inventory Materials dashboard cards by defining a fixed header container height (`h-[64px]` with `flex flex-col justify-start`), ensuring all chart elements align perfectly. Header typography spacing uses exact margins (`mt-1` on both value and subtitle). Subtitle strings are set to compact formats (e.g. `6 kho hoạt động`, `▲5.203,5 tấn (+48,3%)`, `▲2 với tháng trước`, `3 mức cảnh báo`, `Dưới định mức`).
- Sprint 20I.4D formats the value rows of all 5 Inventory Materials cards as clean KPI values (e.g. Card 1 and Card 2 show `15.970,5 tấn`, Card 3 shows `12`, Card 4 shows `3`, Card 5 shows `6`), moving descriptive labels entirely into the subtitles (e.g. `6 kho hoạt động`, `▲5.203,5 tấn (+48,3%)`, `▲2 với tháng trước`, `3 mức`, `Dưới định mức`). Value and subtitle classes are kept strictly aligned to the vertical rhythm layout of the overview.
- Sprint 20I.4E aligns the first 5 KPI cards in the Inventory Materials tab to be visually and behaviorally identical to the Inventory Overview KPI cards. Styled containers with rounded-2xl, border-slate-800, bg-slate-950/60, h-[108px], and p-4. Applied typography: title text-[10px] uppercase tracking-[0.12em] text-slate-400, value text-2xl font-semibold text-white mt-1, and subtitle text-[10px] mt-1. Formatted value metrics with Vietnamese locale decimal commas (e.g. ▲5.203,5 tấn (+48,3%)) and count metrics (e.g. ▲3 mã / ▼2 mã). Tone colors match Overview (emerald, cyan, indigo, amber, red). Unused formatPercentDelta helper was cleaned up.
- Sprint 20I.4F (and 20I.4E Part 2) fully synchronizes the Inventory Materials KPI snapshot engine with the transaction-based ledger logic in Inventory Overview by using 12 monthly end-of-month snapshots, data age detection, and main warehouse rollback logic for stock alerts. It also reduces the height of the first 3 dashboard cards (Phân bố tồn kho, Biến động tồn kho, Cảnh báo tồn kho) to `h-[170px]` with scroll viewports (`h-[82px] overflow-y-auto`) to preserve original chart geometries and label counts without clipping.
- Sprint 20I.5A redesigns the Inventory Locations dashboard charts into a premium MES/WMS Cockpit theme with a 2-column responsive layout (1-column on tablet/mobile). Standardizes card styling to use the custom industrial linear gradient, cyan borders, and rings. Arranges the charts into 5 rows with exact heights (`h-[220px]`, `h-[250px]`, `h-[280px]`), utilizing `LocationsChartCard` wrapper, `CompactDonutSummary`, and `HorizontalBars` components. Replaces the slot transfer routes chart with a new "Phân bố sức chứa theo kho" (Capacity Distribution by Warehouse/Zone) chart showing tons, occupancy percentage, and occupied slot counts. Both frontend and backend builds passed.
- Sprint 20I.5B polishes the Inventory Locations dashboard layout: places "Danh sách vị trí kho" on the left with a height of `h-[520px]` and responsive width (~1040px), stacks a 320px right sidebar with three charts (`Hiệu suất sức chứa`, `Trạng thái vị trí` as a vertical bar chart, and `Phân bố loại vật tư` as a pie chart), replaces horizontal bar charts with compact top-5 table layouts (Kho/Giá trị/%, Vị trí/Khối lượng/%, Mã/Vật tư/Số lượng), reduces visual spacing (`gap-1` and `space-y-1`), and localizes all units to Vietnamese (e.g. `tấn`). Both frontend and backend builds passed.
- Sprint 20I.5C polishes the Inventory Locations dashboard usability: enlarges the Locations section to `h-[560px]` with larger font sizes, detailed columns (Kho, Zone, Slot, Tầng, Khối lượng, Số vật tư, Trạng thái), and rounded status badges (Đang dùng, Trống, Bảo trì); enlarges the four analytics cards to heights of `h-[320px]` and `h-[300px]`; adds a "Xem tất cả" button on each card header to open full table modal dialogs (`fixed inset-0 bg-slate-950/75 backdrop-blur-md max-h-[70vh] overflow-auto rounded-2xl`) displaying complete values, weights, imports, and exports with transaction dates. Both frontend and backend builds passed.
- Sprint 20I.5D makes the Inventory Locations workspace fully fluid and responsive: removes all fixed width constraints, `max-w-*` limits, `mx-auto` centering wrappers, container classes, and hardcoded column/sidebar widths. The root layout is set to `w-full min-w-0 flex-1 space-y-1`. The top section uses a 12-column grid (`grid-cols-12 gap-1`) where "Danh sách vị trí kho" takes `col-span-12 2xl:col-span-8` and the stacked right sidebar takes `col-span-12 2xl:col-span-4`. The bottom analytics section uses a 12-column grid (`grid-cols-12 gap-1`) with `col-span-12 xl:col-span-6` for each of the four cards, enabling fluid resizing for sidebar toggle, laptop, and ultrawide viewports. Both frontend and backend builds passed.
- Sprint 20I.5E introduces top-5 preview slicing on all 6 locations analytics cards: re-configures cards to display only the top 5 sorted preview rows using dedicated preview memos (`previewValueByLocation`, `previewStockByLocation`, `previewRecentInbound`, `previewRecentOutbound`, `previewTopMaterials`, `previewZoneCapacity`), while retaining the full unsliced datasets for the "Xem tất cả" modal dialogs. Standardizes DESC/newest-first sorting on all source and preview datasets. Both frontend and backend builds passed.
- Sprint 20I.5F replaces the first 5 locations analytics cards with the standard WMS KPI cockpit cards showing 6-month historical sparklines (totalLocationsTrend, occupiedLocationsTrend, emptyLocationsTrend, occupancyPercentTrend, totalStockTrend) and dynamic Vietnamese delta notes (currency, weight in tons, percentage, and location counts) in a responsive grid layout. Both frontend and backend builds passed.
- Operational code generation now follows `PREFIX-YYMMDD-00001`; Inventory transactions are backend-owned and write matching `code` / `transactionNo`; see `docs/ai-state/decisions/code-numbering-decisions.md`.
- As of the 2026-06-24 business-data cleanup, Inventory material rows, transactions, and location balances are empty; categories, material types, units, warehouses, and warehouse zones are preserved.

Known limitations:

- Some document numbers are still suggested on the frontend, but now use the short shared code convention rather than timestamp/random suffixes.
- Slot-level reconciliation is not yet a formal ledger rebuilt from immutable transaction history.
- Sprint 8 audit found transaction-vs-location reconciliation mismatches and snapshot mismatches that need operator/admin review before any automated backfill.
- Sprint 9 fixed active mutation paths that created new snapshot/location mismatches, but existing mismatched validation rows still require a dedicated reconciliation/backfill decision.
- Some Inventory modal/chart helpers remain locally embedded instead of shared visual components.
- Dedicated Inbound/Outbound/Transfer/Stock Take pages now have richer analytics, but several local transaction detail helpers should still be extracted into shared Inventory transaction components after operator review.
- Location value analytics depend on currently available material average/unit cost data; rows without cost data display zero value until costing is available in the frontend source.
- Material photo upload is persisted through shared attachments. Dedicated non-photo Material Master upload controls for datasheets, CO, CQ, and catalogs are still pending beyond the current display/download section.
- Return transaction attachment upload depends on the active return UI path creating an Inventory transaction; the shared transaction attachment model and storage routing already support `RETURN`.
- Inventory stock status assumes `locationBalances` is present and warehouse names/codes correctly identify `MAIN` and `PRODUCTION`.
- New adjustment rows store System Qty / Actual Qty audit context in the existing transaction `note` field for UI display; historical adjustment rows created before Sprint 19E remain variance-only unless backfilled.

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
- Sprint 18A refactors Production Cockpit toward the Inventory operational theme with Inventory-style KPI cards, filter bar, analytics panels, Production Orders progress/readiness/delay grid, and shared drawers for Production Orders, BOM detail, and Material Issues.
- Sprint 18A also applies Inventory-style grid/table treatment to Production BOM, Reservations, Material Ledger, Material Issues, Consumptions, and Logs.
- Sprint 18D turns `/production/orders` into a Work Order Cockpit with Work Order KPIs, Inventory-style grid, BOM Intelligence Material Ready %, drawer sections, and analytics panels.
- Sprint 18E turns `/production/material-issues` into a Production Material Control Center with issue KPIs, Inventory-style grid, Required/Issued/Returned/Remaining/Readiness indicators, drawer sections, and analytics panels.
- Sprint 19A adds `/production/warehouse` as a Production Warehouse Cockpit for `PRODUCTION` / `Kho vật tư SX`, using existing Inventory location balances, audit cost, Production Orders, Reservations, and Consumptions.
- Production Warehouse Cockpit calculates `Available = Production Stock - Reserved`, `Shortage = Required - Available`, and status from production warehouse availability rather than total stock.
- Sprint 19B adds `/production/execution` as a Production Execution Board with Kanban columns for Planning, Ready Material, Cutting, Assembly, Welding, Painting, and Completed.
- Execution Board reuses BOM/Issue material readiness, delay detection, stage/progress estimation, issue history, and reservation summaries from existing Production data.
- Sprint 19C adds a MES data audit in `docs/ai-state/audits/mes-data-audit.md` and concludes current data is stronger for Costing than deeper Shopfloor development.
- Shopfloor has partial foundations through Production Orders, Stages, Tasks, Logs, Work Centers, and Machines, but lacks canonical immutable transition history, runtime/downtime capture, production-line queues, and labor/machine rate data.
- Costing has stronger foundations through BOM planned materials, Production Material Consumption, Inventory Transaction Item `unitPrice` / `totalAmount`, and ComponentCosting.
- Sprint 20A adds a read-only Costing Engine backend module with Production Order, Component, and Project cost summaries.
- Costing Engine material cost uses actual Production Material Issue Inventory transaction valuation first and falls back to weighted average Inventory transaction item cost.
- Sprint 20A exposes `GET /production/orders/:id/cost`, `GET /components/:id/cost`, and `GET /projects/:id/cost`; these endpoints do not mutate `ComponentCosting` or workflow state.
- Sprint 20A.5 adds a reusable `DEMO20A5-*` demo dataset seeder with 20 suppliers, 20 projects, 20 inventory items, 20 components, 20 BOMs, 20 production work orders, inventory stock/movements, reservations, material issues, consumptions, ledgers, and 20 component costing rows.
- The Sprint 20A.5 seed includes Production Material Issue-linked Inventory EXPORT transactions so the Costing Engine can read actual issue valuation instead of relying only on average-cost fallback.
- Production can create/mark a component from an MO only after material has been issued.
- MO start auto-issues missing BOM material quantities from `Kho vật tư SX` and creates outbound Inventory movements.
- Sprint 9 auto-issue planning preserves production warehouse slot/level and production issue transaction items carry the same warehouse/zone/slot/level into Inventory.
- Production-to-Yard staging requires linked QC inspection status `PASSED` or `APPROVED`.

Known limitations:

- Material issue from reservation is implemented, but approval-oriented multi-line issue/return documents are still future work.
- Ledger records `RESERVE`, `RELEASE`, `ISSUE`, `RETURN`, and `CONSUME`; adjust writers remain future work.
- Production material warehouse balance is still tied to Inventory transactions and issue rows, not a fully independent receipt/ledger model.
- Production Warehouse Cockpit is a frontend composition over existing data; it is not yet a persisted production warehouse ledger.
- Production Execution Board uses fallback stage mapping when backend stage data is absent or not canonical; a formal shopfloor stage model remains future work.
- Component costing persists material actuals and exposes material-level breakdown; labor, machine, overhead, QC rework, and Yard handling cost are currently zero/manual future inputs.
- Delivery and installation now complete the component lifecycle after Yard outbound with `SHIPPED -> DELIVERED -> INSTALLED`.
- Installation mapping stores exact project placement fields on Component: `installZone`, `installAxis`, `installLevel`, and `installPosition`.
- Sprint 8 audit found issued material remains unallocated where consumption has not been posted, and some issue rows are not yet represented by `ISSUE` ledger rows.
- Historical production issue rows that were created before Sprint 9 may still be missing exact slot/level transaction location and require reconciliation rather than silent mutation.
- Historical issue/consume rows may remain partially unreconciled until a clean validation dataset or approved backfill is run; Sprint 10A fixed the active return path only.
- Runtime integrity currently still reports one historical invalid reservation bucket created before Sprint 10C; no silent data backfill was performed.
- Some repeated Production table/detail helper logic is still local and should be extracted only after operator review approves the Sprint 18A presentation.
- Work Order material value analytics currently use required quantity as a proxy because current frontend data does not expose unit material cost per WO issue/BOM line.
- Material Issue value KPI is shown as unavailable because current Material Issue API responses do not expose unit material cost or total line value.
- Sprint 19C recommends deferring deeper Shopfloor dashboards until execution history/runtime data is canonical.

Current focus:

- Validate Sprint 20A Costing Engine against more real orders, then continue with 20B Component Cost Analysis and 20C Project Cost Control before deeper Shopfloor expansion.
- Use the Sprint 20A.5 demo dataset for repeatable QA of Inventory, Production, and Costing dashboard analytics.
- Continue validating Sprint 18D/18E/19A/19B Work Order, Material Issue, Production Warehouse, and Execution Board cockpits with operators while keeping Shopfloor modeling gaps explicit.

## Components

Status:

- In progress operational cockpit.

Current architecture:

- Components cover steel component master records, production linkage, lifecycle status, costing, QC/Yard handoff, and Project delivery/installation visibility.
- Component lifecycle supports `READY -> SHIPPED -> DELIVERED -> INSTALLED` through existing APIs and Project/Yard integration.
- Component costing persists estimated/actual cost from Production consumption and Inventory average cost, with material-level costing breakdown and variance warnings.
- Components List and Components Stock follow the Sprint 12A Inventory cockpit layout foundation with shared page headers, shared card/table primitives, lifecycle KPI strips, shared empty/loading states, and shared detail drawers.
- Sprint 18B turns Components List into a Component Management Cockpit with Inventory-style KPI strip, operational component grid, shared detail drawer, and analytics panels for weight, delay, material shortage, structure mix, and creation rhythm.
- Sprint 18C adds BOM Intelligence mapping for Component material readiness and computes `Material Ready` from BOM required quantity versus Production Material Issue net issued quantity.
- Sprint 20C.8 synchronizes the Components cockpit page (`ComponentsListPage.tsx`) visually and behaviorally with the `InventoryMaterialsPage` design system: implements fluid root layout (`w-full min-w-0 flex-1 space-y-1`), `gap-1` spacing, local `InventoryMetricCard` elements (Tổng cấu kiện, Đang sản xuất, Hoàn thành, Chờ vật tư, Trễ tiến độ), local `ChartCard` containers (`h-[220px]`), newest created and most used (by quantity) lists, direct table styling (hover-cyan row highlights, transparent bg, right-aligned numeric columns, and full pagination parity), and a unified create modal. Checked and verified to ensure no nested card wrappers, no light container boundaries, and no prohibited class names (`gap-3`, `gap-4`, `space-y-4`, `max-w-3xl`) remain. Both frontend and backend builds passed.

Known limitations:

- Component material readiness is currently aggregated in the frontend from existing Production/BOM/Issue responses; a backend readiness API may be useful if the same calculation spreads to more modules.
- Component detail still lives as a drawer/modal surface on list pages rather than a dedicated `/components/:id` route.
- Labor, machine, overhead, QC rework, Yard handling cost, approvals, and costing history snapshots remain future costing work.

Current focus:

- Validate Sprint 18B/18C cockpit, visual parity, and material readiness calculations with operators.

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
