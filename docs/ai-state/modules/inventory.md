# Inventory Module

## EPIC119 Inventory Inbound & Outbound UI/UX Audit

Status: **COMPLETED**

- Audited all Inbound and Outbound UI elements, workflows, and database integration structures in a read-only manner.
- Identified that both operations are limited to single-item transactions (P0), lack split-location export (P0), and use center modals instead of right drawers (P1).
- Mapped Inbound/Outbound workflows and data-binding channels, highlighting the combined location selector and KPI card differences as inconsistencies.
- Outlined a Drawer-based multi-line layout proposal in [inventory-inbound-outbound-layout-proposal.md](file:///opt/projects/steeltrack/docs/design/inventory-inbound-outbound-layout-proposal.md), component maps in [inventory-inbound-outbound-component-map.md](file:///opt/projects/steeltrack/docs/design/inventory-inbound-outbound-component-map.md), and remediation steps in [inventory-inbound-outbound-remediation-plan.md](file:///opt/projects/steeltrack/docs/design/inventory-inbound-outbound-remediation-plan.md).

## EPIC118.2 Inventory Historical Chart Data Audit

Status: **COMPLETED**

- Audited all historical widgets and charts in `InventoryOverviewPage` in a read-only manner.
- Identified that "Chưa có dữ liệu lịch sử" displays for 6 metric cards due to UI early returns (UI_BINDING_ERROR) and absence of database schema/fields for out-of-stock and categories in `InventoryDashboardSnapshot` (SNAPSHOT_PAYLOAD_MISSING).
- Documented findings in [inventory-historical-chart-audit.md](file:///opt/projects/steeltrack/docs/audit/inventory-historical-chart-audit.md), mapped data flows in [inventory-historical-data-flow.md](file:///opt/projects/steeltrack/docs/audit/inventory-historical-data-flow.md), and formulated remediation steps in [inventory-historical-chart-remediation-plan.md](file:///opt/projects/steeltrack/docs/audit/inventory-historical-chart-remediation-plan.md).

## EPIC118.1 UI/Data Binding Remediation

Status: **APPROVED WITH LIMITATIONS**

- Overview normal reads use `/inventory/overview`, backed by persisted material
  and dashboard snapshots plus bounded repository aggregates.
- Materials use `/inventory/materials` with server-side search, filters, sorting,
  pagination, summary, and facets.
- Material transaction/log history is page-scoped and lazy.
- Transaction attachments are fetched by transaction ID on demand.
- Synthetic inventory trends and incorrect today/stocktake/variance bindings were
  removed.
- Material/location/snapshot parity remains 23/23.
- Remaining limitations: offset pagination needs large-data benchmarking; runtime
  Prisma query-count telemetry currently reports zero.

## EPIC118 UI/Data Binding Status

Historical audit status: **REMEDIATED BY EPIC118.1**

- Database parity at audit time: PASS for all 23 active materials.
- Material Detail snapshot-first path: PASS.
- Location snapshot-first path: PASS.
- The original `/inventory/audit` binding, synthetic trend, and client-side
  1,000/200-row limits were the blockers.
- EPIC118.1 replaced those target-page paths. See
  `docs/runtime/inventory-ui-data-parity-report.md`.

## Current Sprint

SteelTrack EPIC118.1 - Inventory UI Data Binding Remediation

Business Freeze audit update:

- EPIC117 Inventory Business Completion was completed as an audit-only pass.
- Ledger/location/item consistency checks passed:
  - `inventory_items.quantity` matches `inventory_location_stocks` totals for audited items.
  - `InventoryLocationSnapshot` totals match live location stock totals.
  - No negative location stock rows were found.
  - Inventory transaction items have complete valuation fields.
- Inventory Business Freeze v1.0 is approved.
- Formal DTO/Zod validation, transaction line location/valuation fields, and
  material/location snapshot parity were completed in EPIC117.1.
- Stock Take retains the approved adjustment-based v1 workflow; a first-class
  session lifecycle remains Phase 2 scope.

Scope:

- Complete the final Inventory snapshot layer without changing UI, workflow, public API contracts, or business logic.
- Persist domain snapshots for Material Detail and Inventory Locations.
- Read Material Detail and Locations from snapshots first, with repository-backed fallback.
- Update snapshots through the Background Engine, not inside request transactions.
- Expose full Inventory snapshot health through Operations Center.

Implemented in EPIC112 INV.CORE.2:

- Added `InventoryMaterialSnapshot` and `InventoryLocationSnapshot`.
- Added migration `20260708103000_inventory_domain_snapshots`.
- Extended `InventorySnapshotRepository` to calculate, read, validate, and upsert material/location domain snapshots.
- Extended `SnapshotWriterService` so Inventory background jobs write dashboard, material, and location snapshots.
- `InventoryReadModelService.materialDetail()` now uses snapshot-first reads with fallback to the repository-backed read model.
- `InventoryReadModelService.locations()` now uses snapshot-first reads with fallback to live repository composition.
- `InventoryEventService` now schedules background snapshot update jobs after persistent Outbox event publication.
- Runtime metrics now distinguish material snapshot hit/miss and location snapshot hit/miss.
- Operations Center Inventory health now includes material/location snapshot health, freshness, hit ratio, lag, and rebuild status.
- Inventory is now an Architecture Freeze v1.0 candidate.

Implemented in EPIC112 INV.CORE.1:

- Added `InventoryReadModelService`.
- Added `InventoryEventService`.
- Extended `InventoryRepository` to own the remaining active Inventory persistence/read source methods.
- `InventoryService` no longer injects `PrismaService`.
- `ReturnWorkflowService` no longer injects `PrismaService`.
- Inventory master controllers for zones, categories, units, and material types now call `InventoryRepository`.
- `GET /operations-center/overview` includes additive Inventory health data for repository, read model, snapshot, event/outbox, jobs, cache, and operational counts.
- Persistent Inventory events now cover transaction creation, stock bucket updates, return requested/received/rejected/accepted, adjustment posted, stocktake marker completion, and material updates.

Current compliance:

- Repository coverage for active Inventory module service/controller persistence: 100%.
- Event/Outbox coverage for active Inventory lifecycle events: 100%.
- Material Detail read path: persisted snapshot first, repository-backed fallback.
- Inventory Location read path: persisted snapshot first, repository-backed fallback.
- Snapshot health is exposed through Operations Center.

Verification:

- Prisma generate passed.
- Prisma migrate deploy passed.
- Backend build passed during implementation.

Known limitations:

- Inventory Architecture Freeze v1.0 still needs real operator flow validation and parity checks before being marked fully frozen.
- Stocktake event emission uses transaction payload/type markers until a formal stocktake domain lifecycle exists.
- Cross-module writers that create Inventory-affecting records should be audited separately.

Previous sprint baseline:

SteelTrack Sprint B - Warehouse Locations

Scope:

- Add Inventory location management before Supplier module work continues.
- Manage `warehouse_zones` as warehouse storage locations.
- Prepare row/column/level data for future 2D warehouse map.
- No Redis, caching, or performance optimization in this sprint.
- Do not build warehouse map UI yet.

## Implemented In Sprint B

### Warehouse Location Management

Inventory now has a dedicated `Vị trí kho` tab.

Route:

- `/inventory/locations`

Navigation:

- Sidebar Inventory submenu includes `Vị trí kho`.
- Inventory no longer renders the horizontal in-page tab strip; users switch Inventory workspaces from the sidebar.
- Sprint INV.NAV.2 restores advanced operational pages under the nested `Nghiệp vụ nâng cao` sidebar group:
  - `/inventory/inbound`
  - `/inventory/outbound`
  - `/inventory/transfer`
  - `/inventory/stock-take`
  - `/inventory/adjustments`
  - `/inventory/alerts`
  - `/inventory/audit`
- The advanced group is collapsed by default, remembers expansion per session, and auto-opens when an advanced child route is active.
- Inventory actions `Nhập kho`, `Xuất kho`, and `Khác` are shown in the topbar on Inventory routes.
- Epic PERF Foundation gates Material Detail attachment queries by active tab so image/document/transaction attachments are fetched only when the current detail tab needs them.
- EPIC 100 extends `InventoryRepository` for Material Detail aggregate reads and Dashboard Inventory read-model sources. Command workflows remain intentionally unchanged.
- EPIC104 adds composite indexes for Inventory transaction/date reads, material transaction history, transaction item joins, and exact stock bucket validation. The migration is `20260707120000_enterprise_index_foundation`; EXPLAIN evidence is stored in `docs/runtime/de1/`.

Database:

- `WarehouseZone` now stores:
  - `code`;
  - `name`;
  - `row`;
  - `column`;
  - `level`;
  - `capacity`;
  - `active`.

Migration:

- `20260605063000_inventory_warehouse_location_fields`
- `20260707120000_enterprise_index_foundation`

API:

- `GET /inventory/zones`
- `GET /inventory/zones/:id`
- `POST /inventory/zones`
- `PUT /inventory/zones/:id`
- `PATCH /inventory/zones/:id/activate`
- `PATCH /inventory/zones/:id/deactivate`
- `DELETE /inventory/zones/:id`

Behavior:

- Create warehouse location.
- Edit warehouse location.
- Assign warehouse location to a parent warehouse.
- Activate/deactivate warehouse location.
- Soft delete by setting `active = false`.
- Location list calculates:
  - number of active material records stored in each location;
  - total stock quantity by location.
- Location detail drawer shows materials stored in the selected location.
- Location detail drawer shows row/slot/floor and a read-only 2D preview.
- Material Master create/edit uses `Kho chính` locations only and warns when a selected slot/floor is full.
- Inventory inbound uses `Kho chính` locations only and warns when a selected slot/floor is full.
- Material detail `Vị trí` tab can open a focused 2D preview for the selected slot/floor.
- Sprint 13B.1 redesigns the Material Detail drawer UI only: shared Module Detail Drawer, header KPI strip, horizontal tabs, colored transaction type badges, location distribution donut/table, movement trend, forecast panel, project usage summary, and supplier purchase summary.
- Sprint 13B.2 completes the Material Detail theme consistency pass: tabs now use the shared `ModuleTabs`, tables use shared module table tokens, and the focused 2D location preview uses `ModuleDetailDrawer` / `ModuleAnalyticsPanel` instead of a custom modal shell.
- Sprint 11A.2 centralizes frontend quantity/currency formatting through shared helpers and removes direct frontend `toLocaleString('vi-VN')` / `Intl.NumberFormat` usage.
- Sprint 13B.3 adds Material Detail image gallery readiness, Material Master image preview UI, and Material Analytics Cockpit panels for Inbound Trend, Outbound Trend, Inventory Trend, Forecast 7 Days, and Inventory Turnover.
- Sprint 14A persists Material Detail photos through the shared Attachments module. `Hình ảnh vật tư` now has `Thêm ảnh`, uploads images to `/attachments/upload`, refreshes the gallery, and displays images served from filesystem storage.
- Material Detail now includes `Tài liệu vật tư` for non-photo attachments and shows original filename, category, size, upload date, and download action.
- Material attachment metadata is stored in PostgreSQL while file content is stored outside the repo under `STORAGE_ROOT` or `/data/steeltrack-storage/inventory/materials`.
- Sprint 14B adds Inventory Transaction attachments for Inbound, Outbound, Transfer, and Stock Take forms. Attachments are selected during form entry and uploaded immediately after the transaction save succeeds.
- Inventory transaction attachments use `module=inventory`, `entityType=transaction`, and `entityId=transactionId`; files are routed under `/data/steeltrack-storage/inventory/transactions/<type>`.
- Inventory Transactions now has a detail drawer with a `Tài liệu đính kèm` tab showing original filename, category, size, upload date, download action, and image previews.
- Sprint 14B.5 refines Inventory attachment UX: Inventory material rows no longer show attachment badges, Material Detail Overview shows image/document summary counts, transaction/project/supplier tabs expose contextual attachment columns, and the documents tab classifies file source by Master Material or related inventory transaction.
- Inventory Transactions UX 2.0 adds a `Hồ sơ` column to dedicated Nhập kho, Xuất kho, Điều chuyển, and Kiểm kê pages. The `📎` action opens a standard attachment drawer for the selected transaction.
- Sprint 15A fixes outbound value display. The Outbound page now aggregates all item lines for KPI and table values, and transaction API read responses compute missing outbound line value from average inbound cost when legacy `EXPORT` rows do not store `unitPrice` / `totalAmount`.
- Sprint 15B fixes the source data path for Inventory transaction valuation. `InventoryService.createTransaction`, Production material issue/return direct writers, and Material Movement direct writer now persist `unitPrice` and `totalAmount` on transaction items. Historical missing values were repaired with `scripts/sql/backfill-inventory-transaction-item-costs.sql`.
- Sprint 16A adds an Outbound transaction detail drawer, `Giá trị xuất hôm nay` KPI, value-based top material ranking, and top project ranking by outbound value without changing API or schema.
- Sprint 16B adds a Transfer transaction detail drawer, source/destination warehouse-zone-slot-level visibility, transfer value KPIs, top routes, and source/destination location rankings without changing API or schema.
- Sprint 16C adds an Inbound transaction detail drawer, all-line inbound KPI/ranking aggregation, top supplier analytics, price increase/decrease monitoring, and shared larger filter spacing for Inbound/Outbound/Transfer without changing API or schema.
- Sprint 16D expands Outbound analytics with project consumption share, daily/monthly outbound trends, material consumption by value/issue count, outbound-purpose distribution, financial KPIs for today/week/month/year, and abnormal consumption alerts using existing transaction API data only.
- Sprint 17A expands Stock Take with a stocktake session list, row detail drawer, variance KPIs, top variance material/location analytics, and adjustment preview columns (`SystemQty`, `ActualQty`, `VarianceQty`, `UnitPrice`, `VarianceValue`) using existing adjustment transaction data only.
- Sprint 17B expands Inventory Locations with occupancy percentage, free/occupied slot KPIs, inventory value by location, value-ranked occupied slot analytics, slot material drill-down, and transfer source/destination slot movement analytics using existing frontend APIs only.
- Sprint 17E hardens Inventory document numbering. New Inventory transactions use backend-owned `code = transactionNo`, five-digit date sequences (`NK/XK/DC/KK/INV-YYMMDD-00001`), max-suffix generation instead of `count() + 1`, and duplicate retry on Prisma `P2002`.
- Sprint 17F separates main warehouse stock, production warehouse stock, and total stock in Inventory Overview, Inventory Materials, and Material Detail. Stock health and purchasing alerts now use only `Kho chính` / `MAIN` balances from `locationBalances`; production warehouse balances are displayed separately and do not mask main-warehouse shortages.
- Sprint 19D refactors Inventory Adjustments into the same center pattern as Inbound, Outbound, and Transfer. The page now uses an Inventory-style KPI strip, analytics panels, primary adjustment table, row detail drawer, and `+ Điều chỉnh tồn kho` modal.
- Sprint 19D removes direct delta entry from the adjustment form. Users enter Material, Zone, Slot, Level, readonly System Qty, Actual Qty, Reason, and Attachments; Difference is auto-calculated and posted as the adjustment quantity.
- Sprint 19D uses `KK` prefix for adjustment transaction numbers in the frontend request, keeping adjustment/stocktake numbering aligned with Inventory document rules.
- Sprint 19E adds `Điều chỉnh tồn kho` to Inventory navigation below `Kiểm kê` and makes the global `Khác -> Điều chỉnh tồn kho` action open the adjustment modal directly.
- Sprint 19E moves adjustment creation into shared `AdjustmentTransactionModal`, reusing the Inventory transaction modal foundation with attachments and `WarehouseMiniMap`.
- Sprint 19E adjustment creation reads Material Detail `locationBalances`, displays selectable warehouse/zone/slot/level rows, calculates System Qty from the exact selected bucket, and writes new System Qty / Actual Qty audit context into the existing transaction `note` field.
- Inventory now includes a `Phiếu trả vật tư` / Return Requests workspace at `/inventory/returns`. It lists Project material return requests by Requested, Received, Accepted, and Rejected state, shows return detail/log context, receives returned material through the existing Inventory return workflow, and rejects requests by mapping to existing `CANCELLED` status without schema changes.
- Receiving a Project material return increases Inventory stock through a `RETURN` transaction and reconciles Project allocation; rejecting a request clears Project pending return without increasing stock.
- Inventory stock quantity display uses shared locale parsing/formatting and tabular numeric styling so integer quantities such as `700` display correctly while decimal stock remains supported.
- Inventory transfer creation is limited to `Kho chính`, auto-fills source cell/floor from the selected material stock location, suggests a free destination cell/floor, and shows separate source/destination 2D location views instead of the legacy transfer diagram.
- Sprint 9 stock mutation hardening validates and updates the exact full bucket `inventoryItemId + warehouseId + zoneId + slotId + level`, so new transaction paths keep `inventory_items.quantity` and `inventory_location_stocks` synchronized.
- Sprint 11A decimal quantity pass lets Inventory inbound, outbound, transfer, stock-take, stock adjustment, Material Master minimum stock, and warehouse location capacity accept decimal values with `vi-VN` formatted typing.
- Currency display uses whole-number VND formatting, for example `25.000.000 đ`.
- Material photo upload and Inventory transaction attachments are now persisted through shared attachments. Upload controls for Material Master datasheets, CO, CQ, and catalogs still need a dedicated non-photo document upload UI.
- Sprint 20I.3 redesigned the Inventory Overview KPI strip to display 8 custom cards (Tổng giá trị tồn kho, Tổng khối lượng, Mã vật tư, Sắp hết hàng, Vật tư chính, Vật tư phụ, Vật tư tiêu hao, Hết hàng) with custom colored tones and loading skeletons.
- Sprint 20I.3B/C/D/E/F/G/N implemented real 12-month historical stock snapshots using transaction ledger rollbacks and transaction-based existence dates (`firstTransactionDate`), rendering real monthly sparkline trends for yearly age scales, and comparing current month with the previous month dynamically (e.g. `▲/▼ X% với tháng trước`).
- Sprint 20I.3G/H/P/Q/R/S enhanced the category KPI cards (Vật tư chính, Vật tư phụ, Vật tư tiêu hao) to show `X (Y tấn)` (e.g., `6 (2.053 tấn)`) with the delta percentages calculated from quantity in tons (`Y tấn`) rather than item count, formatted without spaces after the arrow for integers (e.g., `▲40%`), and using compact typography. Sprint 20I.3R removed all composition progress bars and subtitle rendering, and Sprint 20I.3S polished the category card value typography to render count as `text-white font-semibold` and quantity as `text-slate-400 font-normal text-[14px]` inline, ensuring all 8 KPI cards maintain equal height `h-[108px]`.
- Sprint 20I.3P/Q/R/S updated the KPI delta line: inventory metrics display absolute and relative change split using parentheses (e.g. `▲5.203,5 tấn (+48,3%)`), while count metrics display absolute change count only (e.g. `▲3 mã`).
- Sprint 20I.4A/C/D/E/F restyles and synchronizes all 5 Inventory Materials dashboard cards and charts: container styled at `rounded-2xl`, `border-slate-800`, `bg-slate-950/60`, and height adjusted to `h-[108px]` for metrics and `h-[170px]` for charts; synchronizes the 12-month historical snapshot engines using ledger rollbacks to eliminate delta bugs.
- Sprint 20I.5A/B redesigns the Inventory Locations dashboard to follow a compact, Vietnamese-localized MES/WMS Cockpit visual rhythm: organizes the Locations list on the left with a height of `h-[520px]`, stacks a right sidebar (`320px`, `gap-1`) with three charts (Hiệu suất sức chứa donut, Trạng thái vị trí vertical bar chart, and Phân bố loại vật tư pie chart), replaces horizontal bar charts with compact top-5 Vietnamese tables, reduces spacing (`gap-1`, `space-y-1`), and localizes all units to Vietnamese.
- Sprint 20I.5C enhances the Locations tab usability: makes "Danh sách vị trí kho" larger (`h-[560px]`, `text-[12px]` text, `py-2.5` padding, `text-xs font-semibold` headers, detailed status columns, and rounded status badges), enlarges the four analytics cards to heights of `h-[320px]` and `h-[300px]`, and adds a "Xem tất cả" button on each card header to open a full-table modal dialog (`fixed inset-0 bg-slate-950/75 backdrop-blur-md max-h-[70vh] overflow-auto rounded-2xl`) displaying complete values, weights, imports, and exports with transaction dates.
- Sprint 20I.5D makes the Inventory Locations workspace fully fluid and responsive: removes all fixed width constraints, `max-w-*` limits, `mx-auto` centering wrappers, container classes, and hardcoded column/sidebar widths. The root layout is set to `w-full min-w-0 flex-1 space-y-1`. The top section uses a 12-column grid (`grid-cols-12 gap-1`) where "Danh sách vị trí kho" takes `col-span-12 2xl:col-span-8` and the stacked right sidebar takes `col-span-12 2xl:col-span-4`. The bottom analytics section uses a 12-column grid (`grid-cols-12 gap-1`) with `col-span-12 xl:col-span-6` for each of the four cards, enabling fluid resizing for sidebar toggle, laptop, and ultrawide viewports. Both frontend and backend builds passed.
- Sprint 20I.5E introduces top-5 preview slicing on all 6 locations analytics cards: re-configures cards to display only the top 5 sorted preview rows using dedicated preview memos (`previewValueByLocation`, `previewStockByLocation`, `previewRecentInbound`, `previewRecentOutbound`, `previewTopMaterials`, `previewZoneCapacity`), while retaining the full unsliced datasets for the "Xem tất cả" modal dialogs. Standardizes DESC/newest-first sorting on all source and preview datasets. Both frontend and backend builds passed.
- Sprint 20I.5F replaces the first 5 locations analytics cards with the standard WMS KPI cockpit cards showing 6-month historical sparklines (totalLocationsTrend, occupiedLocationsTrend, emptyLocationsTrend, occupancyPercentTrend, totalStockTrend) and dynamic Vietnamese delta notes (currency, weight in tons, percentage, and location counts) in a responsive grid layout. Both frontend and backend builds passed.

Parent warehouses:

- `MAIN` = Kho chính
- `PRODUCTION` = Kho sản xuất

Warehouse zone audit:

- Deleted demo records:
  - `DEMO-WH-FAB`;
  - `DEMO-WH-RAW`.
- Deleted orphan warehouse-like records:
  - `ST-WH-FAB`;
  - `ST-WH-RAW`.
- Real storage locations:
  - `A01`;
  - `A02`;
  - `B01`;
  - `C01`.

Boundary:

- `PRODUCTION` exists as the parent warehouse for future production-material/component integration.
- Production warehouse balances are persisted in `inventory_location_stocks`; historical rows created before full bucket enforcement may still require reconciliation.
- Drag-drop warehouse map is not implemented yet.

Build:

- Prisma migration deploy passed.
- Prisma generate passed.
- Backend build passed.
- Frontend build passed.
- Sprint 11A audit found no Inventory quantity/cost migration requirement because audited operational fields already use `Float`.
- Sprint 15B backend build passed and verification SQL showed IMPORT, EXPORT, TRANSFER, and RETURN all have complete persisted `unitPrice` / `totalAmount` values.
- Sprint 17F frontend build passed.

## Implemented In Phase A

### Material Master v1 Usage Type

Material Master now has a business usage classification separate from technical material type.

Field:

- `materialUsageType`

Enum:

- `PRIMARY` = Vật tư chính
- `SECONDARY` = Vật tư phụ
- `CONSUMABLE` = Vật tư tiêu hao

Implemented:

- Prisma enum and InventoryItem field.
- Migration `20260604214339_add_material_usage_type`.
- Inventory create/update accepts and persists the field.
- Inventory list/detail/audit returns the field.
- Material drawer uses `Loại vật tư` for usage type.
- Technical material type is labeled `Quy cách / nhóm kỹ thuật`.
- Material drawer includes default warehouse zone selection.
- Stock list and Overview list include a `Loại vật tư` column.
- Zone display now prefers `zone code - zone name`.

Current data:

- Existing local steel materials are classified as `PRIMARY`.
- Storage should resolve to real locations such as `A01`, `A02`, `B01`, and `C01`; orphan `ST-WH-*` warehouse-like records have been removed.

Build:

- Prisma generate passed.
- Backend build passed.
- Frontend build passed.

### Material Drawer UX And Soft Delete

Material create/edit now follows the same operational modal rhythm as Inventory inbound.

Implemented:

- Two-column material form.
- Summary boxes for usage type, minimum stock, default zone, and state.
- Business note panel explaining how Material Master connects to inventory, BOM, and production.
- Clear footer actions.

Delete behavior:

- Inventory materials now use soft delete through `InventoryItem.deletedAt`.
- Active lists hide deleted materials.
- Existing transaction, BOM, production, and audit history remains intact.
- This fixes delete failures caused by hard-delete foreign key constraints.

Migration:

- `20260604224726_inventory_item_soft_delete`

Build:

- Prisma generate passed.
- Migration deploy passed.
- Backend build passed.
- Frontend build passed.

### Material Detail Supplier Column Fix

Material detail supplier history now shows inbound price correctly.

Changed:

- `Nhà cung cấp` tab column `Tổng nhập` renamed to `Đơn giá nhập`.
- Value uses supplier inbound `unitPrice`, with average cost fallback.

Build:

- Frontend build passed.

### Outbound Material Location Fallback

Outbound material location selection now supports legacy stock rows.

Fixed:

- Older transaction lines can have stock quantity but no `zoneId`.
- Material detail now falls back to the material default zone.
- Outbound modal builds selectable locations from balances and falls back to default material zone when needed.

Result:

- Selecting a material with stock now shows `Vị trí lấy vật tư` instead of an empty location dropdown.

Build:

- Backend build passed.
- Frontend build passed.

### Inventory Tab Visual Standardization

The Stock tab visual language is now the baseline for active Inventory tabs.

Shared UI primitives:

- `InventoryPanel`
- `InventoryKpi`
- `InventoryInsightPanel`
- `InventoryPagination`
- shared table shell/head/row classes
- shared page stack and grid spacing classes

Sprint 12A UI foundation:

- Inventory Overview and Inventory Stock are the design reference for module cockpit screens.
- Inventory visual wrappers now delegate to generic shared primitives in `apps/frontend/src/shared/ui/modules`.
- Inventory behavior, API calls, filters, and stock workflows were not changed by this refactor.
- Remaining Inventory-only chart and modal helpers should stay local until another module needs the same abstraction.

Applied to:

- `InventoryOverviewPage`
- `InventoryMaterialsPage`
- `InventoryInboundPage`
- `InventoryOutboundPage`
- `InventoryTransferPage`
- `InventoryStockTakePage`
- `InventoryTransactionsPage`
- `InventoryAlertsPage`
- `InventoryAuditPage`

Results:

- Charts and side panels have clearer vertical separation.
- Tables use the same dark shell, header, hover, and pagination behavior.
- KPI strips use the same card scale, tone bar, and note style.
- Filters now sit in the same panel style across the transaction/history tabs.
- Inventory Overview now matches the same KPI, panel, table, quick-list, warehouse filter, and button styling as the other tabs.
- Local duplicate KPI/insight helper components were removed from normalized tabs.

Boundaries:

- Backend unchanged.
- API unchanged.
- Prisma schema unchanged.
- Transaction mutation logic unchanged.

### Inventory Global Action Bar

Inventory uses a shared module action bar in the global topbar on Inventory routes.

Changes:

- Primary actions: `Nhập kho`, `Xuất kho`.
- More menu actions: `Điều chuyển`, `Kiểm kê`, `Điều chỉnh tồn kho`, `Tạo vật tư mới`.
- Transaction actions open their existing modal workflows.
- `Tạo vật tư mới` opens the shared `MaterialDrawer`.
- The old Overview quick-action panel was removed.
- The Stock tab no longer has its own duplicate create-material button.
- The in-page Inventory tab strip was removed; sidebar navigation is now the single tab switcher.

### Inventory UX Fix - Transaction Form Priority

Dedicated transaction pages now present their work form before analytics.

Affected pages:

- `InventoryInboundPage`: inbound form appears before KPI, filters, and table.
- `InventoryOutboundPage`: outbound form appears before KPI, filters, and table.
- `InventoryTransferPage`: transfer form and movement diagram appear before KPI, filters, and table.
- `InventoryStockTakePage`: stock-take line-entry form appears before KPI, filters, and table.

Boundaries:

- Form fields unchanged.
- Mutation logic unchanged.
- Backend/API/Prisma untouched.

### Inventory Transaction Modal Workflow

Inventory transaction creation is modal-driven again.

Implemented:

- `InboundTransactionModal` keeps the inbound form and create transaction logic.
- `OutboundTransactionModal` keeps the outbound form, location-balance validation, and create transaction logic.
- `TransferTransactionModal` keeps transfer source/destination balance logic and create transaction logic.
- `StockTakeTransactionModal` keeps stock-take line entry and adjustment transaction logic.
- `InventoryGlobalActionBar` opens these modals directly.
- Inbound, outbound, transfer, and stock-take tabs now act as history/analytics surfaces.

Boundaries:

- Backend unchanged.
- API hooks unchanged.
- Prisma schema unchanged.

### Unified Material Detail UI

Material detail display is now shared across Inventory Overview and Stock.

Implemented:

- `InventoryMaterialDetailModal` provides one consistent material detail workspace.
- Overview opens the shared detail modal from selected material rows.
- Stock opens the same detail modal and passes audit fallback data while loading richer material detail data.
- Transaction modal controls have clearer primary action buttons and dark native select options.

### Transaction Modal UX Polish

Latest UI adjustments:

- The global `Khác` menu uses a portal so it is no longer clipped by the tab container.
- Inbound/outbound modals now use a two-column operational form layout with summary panels and footer actions.
- Material detail modal includes side tabs for overview, in/out, projects, suppliers, locations, analytics, and logs.
- Transfer modal includes transaction time.
- Material create/edit drawer uses a portal and matching modal-style form layout.
- Outbound now calculates expected issue value from material detail average cost with list-row fallbacks.
- Outbound and transfer modals auto-select valid stock locations when a material is selected, preventing submit lock caused by an empty source-zone selection.
- Outbound shows clear validation warnings for missing stock location and quantity greater than selected source-zone stock.
- Backend stock-at-location validation now matches material detail location fallback for legacy no-zone transaction lines: if the selected zone is the material default zone, no-zone historical lines count toward that zone.
- Inbound modal auto-selects the selected material default zone to prevent new no-zone inbound records from normal UI usage.

### Master Data Workspace

Inventory master data now manages the core Material Master dictionaries directly:

- material categories;
- material type/specification groups;
- units of measure.

Implemented:

- Create/edit/deactivate actions for all three dictionary groups.
- Deactivation instead of hard delete to preserve links from materials, transactions, BOM, and production.
- Usage counts from active Material Master records.
- Steel-structure baseline dictionary data:
  - 8 active material categories;
  - 24 active material type/specification groups;
  - 14 active units.
- Duplicate/demo category records with no active material links were deactivated.

Production integration:

- Production BOM material selection reads `materialUsageType`.
- BOM selector groups production-warehouse stock into:
  - Vật tư chính;
  - Vật tư phụ;
  - Tiêu hao.
- BOM item category is auto-derived when a material is selected.

### Compact Overview Layout

Inventory Overview has been adjusted for a denser cockpit layout:

- global quick search moved to the right side of the app topbar near `LIVE`;
- module title is shown in the topbar as `Kho vật tư`;
- duplicate large Overview header removed;
- stock table remains capped at 10 visible rows;
- recent inbound/outbound panels remain capped at 5 transactions each;
- Inventory KPI, panel, table, recent-card, and warehouse-filter spacing were tightened.

### Stock Tab Analytics Cleanup

`InventoryMaterialsPage` has been tightened into a clearer stock analytics workspace.

Changes:

- Stock table pagination defaults to a bottom-left `Hiển thị 1-10/xxx kết quả` label and centered clickable page numbers.
- Location distribution now uses a donut chart instead of horizontal bars.
- A monthly stock movement trend chart is derived from inventory transactions.
- Stock alerts are calculated from current stock and minimum stock thresholds.
- Removed the older stock-health and stock-rhythm charts.
- Added a bottom quick-stat strip for today's inbound, outbound, transfer, current-month stock-take, and stock variance indicators.

Boundaries:

- Backend unchanged.
- API unchanged.
- Prisma schema unchanged.

### Sprint A.5 Overview Cleanup

`InventoryOverviewPage` is now dashboard-only for transaction workflows.

Changes:

- Removed Overview-owned inbound modal.
- Removed Overview-owned outbound modal.
- Removed Overview-owned transfer modal.
- Removed Overview-owned stock-take modal.
- Removed transaction form state and submit handlers from Overview.
- Quick actions now route to dedicated pages:
  `/inventory/inbound`, `/inventory/outbound`, `/inventory/transfer`, `/inventory/stock-take`.
- Material detail and `MaterialDrawer` remain available in Overview.

### Material Master Form Consolidation

`MaterialDrawer` is now the only active create/edit Material Master form used by the Inventory cockpit.

Changes:

- `InventoryOverviewPage` no longer owns `createMaterialForm`.
- `InventoryOverviewPage` no longer contains `handleCreateMaterial`.
- `InventoryOverviewPage` no longer renders the duplicate `activeModal === 'create-material'` form.
- The Overview quick action `Thêm vật tư mới` opens `MaterialDrawer`.
- `InventoryMaterialsPage` continues to use `MaterialDrawer` for create/edit.

### Sidebar Theme Alignment

The app sidebar was adjusted to better match the Inventory cockpit theme:

- Dark glass-style sidebar shell.
- Softer section labels.
- Cleaner child tab indentation.
- Blue active state with subtle glow.
- Hash-aware active state for sub-tabs.

### Inventory Overview Chart Synchronization

`InventoryOverviewPage` now follows the same visual and data pattern as the Stock tab.

Changes:

- Overview stock table and charts now use Inventory Audit stock rows as the source of truth.
- Filter bar matches the Stock tab pattern:
  warehouse, material group, usage type, status, manual search, search, and reset.
- Stock table is capped to 10 rows with shared pagination.
- Right-side analytics now includes:
  stock overview donut, inventory value trend, stock alerts, and material group donut.
- Stock alerts match the Stock tab visual treatment and include a full `Xem tất cả` modal.
- Recent inbound and outbound cards show the latest 5 transactions with code, material, date, and quantity.
- Shared chart-card, compact donut, and compact trend primitives were added for consistent Inventory analytics surfaces.

Latest polish:

- Overview now has a `Thao tác nhanh` block below the filter bar.
- Quick actions open the existing inbound, outbound, transfer, and stock-take modals.
- `Nhập kho hôm nay` and `Xuất kho hôm nay` are shown beside quick actions above the stock table.
- Recent inbound/outbound cards use column-style rows with code, material/target, date, quantity, and status.
- Warehouse filtering is presented as a compact status bar with a warehouse dropdown.
- Stock tab inventory list includes a `Trạng thái` column.
- Overview now uses a two-column cockpit layout: quick cards and stock table on the left, analytics charts starting at the same height on the right.
- Shared Inventory inputs are compacted for lower filter height across tabs.
- Remaining Inventory tabs now use shared donut/bar chart treatment for their side analytics:
  locations, inbound, outbound, transfer, stock take, transactions, and alerts.

### Warehouse Slot-Level Material Location

Current status:

- `InventoryItem` persists:
  - `zoneId`;
  - `slotId`;
  - `level`.
- `InventoryTransactionItem` persists `slotId` metadata using the existing `CELL:LEVEL` convention.
- Material Master create/update accepts and saves zone, slot, and level.
- `WarehouseMiniMap` is a 2D-only view and now displays material occupancy in each cell:
  - empty cell;
  - single material code;
  - multiple material count such as `3 VT`.
- Hovering a cell/level shows material code, name, quantity, unit, and level.
- The same 2D map is available in:
  - Material Drawer;
  - Inbound transaction modal;
  - Outbound transaction modal;
  - Transfer transaction modal.

Boundary:

- Stock calculation still uses the existing transaction/zone logic.
- Slot/level is currently operational location metadata and is not yet a persisted balance ledger.
- Drag-drop, 3D, Canvas, and Three.js are not implemented.

Capacity semantics:

- Warehouse `capacity` means operational storage capacity/tải trọng, not number of 2D cells.
- The current 2D storage structure is fixed at 36 cells x 4 levels = 144 cell-level positions per real storage location.
- UI must display capacity and occupied cell-level count as separate values.
- Full-location validation should use empty cell-level availability, not `materialCount >= capacity`.

### Inbound Location & Price Suggestions

Current status:

- Positive-quantity inbound lines must include `zoneId`, `slotId`, and `level`.
- Backend validation is enforced centrally in `InventoryService.createTransaction()` for all `IMPORT` / `INBOUND` transaction creation paths.
- The main inbound modal highlights missing location fields, disables confirmation, and shows `Vui lòng chọn vị trí lưu kho.` plus the count of incomplete inbound lines.
- `GET /inventory/items/:id/inbound-suggestions` derives suggestions from real transaction history:
  - last used inbound location;
  - last inbound unit price;
  - 30-day weighted average inbound unit price.
- The inbound modal auto-fills the last unit price once when a material is selected, keeps the value editable, and warns if the edited price differs by more than 30% from the last inbound price.

Boundary:

- No schema or migration was introduced.
- Free-capacity text is only shown when zone capacity data exists; otherwise the UI does not invent utilization.
- Outbound, transfer, return, and adjustment flows were not changed by this validation rule.

### Enterprise Performance Notes

Current status:

- Inventory Dashboard aggregation uses `DashboardInventoryReadModelService` and `InventoryRepository` source queries instead of duplicating Inventory transaction reads across dashboard services.
- Inventory cockpit dashboard reads now go through `DashboardReaderService` and prefer persisted `InventoryDashboardSnapshot` rows when enabled, fresh, and parity-safe.
- EPIC 101 defines Inventory transaction, transaction item, location stock, and return request index recommendations in `docs/audit/enterprise-index-audit.md`.
- Inventory is the first candidate for persisted snapshots:
  - `InventoryDashboardSnapshot`;
  - `MaterialDailyMovementSnapshot`.

Boundary:

- Some dashboard chart/table fields still use runtime compatibility data because the current `InventoryDashboardSnapshot` is warehouse-summary level.
- No schema, migration, or index changes were introduced by EPIC 101.
- Material Detail core analytics still need a future tab-specific API/snapshot split if transaction volume grows.

## Boundaries Preserved

- Material creation does not create an initial inbound transaction.
- Inventory inbound/outbound/transfer workflows were not moved in this phase.
- Database schema was not changed.
- Supplier module was not touched.
- Sprint 12C UI polish only added sticky shared filters and frontend KPI click-to-filter for Inventory Stock status; Inventory stock logic and APIs were not changed.

## Remaining Phase A Follow-Up

- Continue polishing `InventoryOverviewPage`, `InventoryMasterDataPage`, and `InventoryAdjustmentsPage` if a deeper screen-by-screen design pass is requested.
- Consider moving common trend/donut chart helpers from page-local code into shared Inventory chart primitives.

## Next Phase

Phase B - Database enhancement for steel-structure Material Master fields:

- `specification`
- `grade`
- `standard`
- `origin`
- `unitWeight`
- `defaultSupplier`
- `leadTimeDays`
- stronger unit/category/material type DTO alignment

## Business Freeze v1.0

Approved: 2026-07-09

- Active stock authority: `inventory_location_stocks`.
- Material snapshot parity: 23/23, zero mismatches.
- Item quantity compatibility parity: zero mismatches.
- Transaction valuation completeness: 78/78 lines.
- Inventory controller validation: typed Zod DTOs; no `@Body() any`.
- Snapshot repair path: persistent outbox -> Background Engine -> writer.
- Operations Center: no pending/failed Inventory outbox events or jobs after
  reconciliation.
- Stock Take v1.0 remains adjustment-backed. A formal session and approval
  lifecycle is documented for Phase 2.
