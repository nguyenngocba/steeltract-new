# Inventory Module

## Current Sprint

SteelTrack Sprint A - Inventory Foundation Implementation

Scope:

- Phase A only: UI consolidation.
- No Prisma schema changes.
- No migrations.
- No Supplier module changes.

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
- Existing material zones are already assigned to `A01` or `ST-WH-RAW`.

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

Inventory now uses a shared module action bar next to the Inventory tab strip.

Changes:

- Primary actions: `Nhập kho`, `Xuất kho`.
- More menu actions: `Điều chuyển`, `Kiểm kê`, `Điều chỉnh tồn kho`, `Tạo vật tư mới`.
- Transaction actions route to their dedicated Inventory pages.
- `Tạo vật tư mới` opens the shared `MaterialDrawer`.
- The old Overview quick-action panel was removed.
- The Stock tab no longer has its own duplicate create-material button.
- Existing specialized transaction forms remain inside their pages.

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

## Boundaries Preserved

- Material creation does not create an initial inbound transaction.
- Inventory inbound/outbound/transfer workflows were not moved in this phase.
- Database schema was not changed.
- Supplier module was not touched.

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
