# Inventory Module

## Current Sprint

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
- Inventory no longer renders the horizontal in-page tab strip; users switch Inventory tabs from the sidebar.
- Inventory actions `Nhập kho`, `Xuất kho`, and `Khác` are shown in the topbar on Inventory routes.

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
- Inventory transfer creation is limited to `Kho chính`, auto-fills source cell/floor from the selected material stock location, suggests a free destination cell/floor, and shows separate source/destination 2D location views instead of the legacy transfer diagram.
- Sprint 9 stock mutation hardening validates and updates the exact full bucket `inventoryItemId + warehouseId + zoneId + slotId + level`, so new transaction paths keep `inventory_items.quantity` and `inventory_location_stocks` synchronized.
- Sprint 11A decimal quantity pass lets Inventory inbound, outbound, transfer, stock-take, stock adjustment, Material Master minimum stock, and warehouse location capacity accept decimal values with `vi-VN` formatted typing.
- Currency display uses whole-number VND formatting, for example `25.000.000 đ`.
- Material photo upload is now persisted through shared attachments. Upload controls for datasheets, CO, CQ, and catalogs still need a dedicated non-photo document upload UI.

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
