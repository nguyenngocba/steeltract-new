# SteelTrack Changelog

## 2026-06-04

### Material Master v1 Usage Type

Implemented:

- Added `materialUsageType` to Material Master with enum values:
  - `PRIMARY`
  - `SECONDARY`
  - `CONSUMABLE`
- Added Prisma migration `20260604214339_add_material_usage_type`.
- Applied the migration to the local SteelTrack database.
- Updated Inventory item create/update flow to persist `materialUsageType`.
- Updated Inventory item, detail, and audit responses to return:
  - `materialUsageType`;
  - `materialTypeId`;
  - `categoryId`;
  - `zoneId`;
  - `zoneCode`;
  - `zoneName`;
  - combined zone display label.
- Updated the material drawer:
  - `Loại vật tư` now means `Vật tư chính`, `Vật tư phụ`, `Vật tư tiêu hao`;
  - old technical material type field is renamed to `Quy cách / nhóm kỹ thuật`;
  - added default warehouse zone selection;
  - tightened form spacing.
- Added `Loại vật tư` column to Inventory Overview stock table, Stock tab table, and Stock full-list modal.
- Updated material detail popup to show `Loại vật tư`.
- Verified existing local materials are all structural steel, so default `PRIMARY` is currently correct.

Build:

- Prisma generate passed.
- Backend build passed.
- Frontend build passed.

### Material Drawer UX And Soft Delete

Implemented:

- Reworked `MaterialDrawer` to match the inbound modal structure:
  - two-column operational form;
  - usage type/category/technical group/default zone/unit/minimum stock fields aligned in one grid;
  - four summary boxes below the fields;
  - business note panel;
  - full-width description area;
  - clearer footer actions.
- Added soft delete for `InventoryItem`:
  - new `deletedAt` field;
  - migration `20260604224726_inventory_item_soft_delete`;
  - delete action now marks material as deleted instead of hard-deleting rows referenced by transactions/BOM/history.
- Updated Inventory repository queries so deleted materials are hidden from active material lists, stock audit, and transaction selectors.
- Improved Stock tab delete error display if a delete request fails.

Build:

- Prisma generate passed.
- Migration deploy passed.
- Backend build passed.
- Frontend build passed.

### Material Detail Supplier Column Fix

Implemented:

- Updated material detail popup tab `Nhà cung cấp`.
- Renamed supplier table column `Tổng nhập` to `Đơn giá nhập`.
- The column now displays inbound unit price from supplier history, falling back to average cost when unit price is missing.
- Updated the legacy hidden Overview detail table label for consistency.

Build:

- Frontend build passed.

### Outbound Material Location Fallback Fix

Implemented:

- Fixed outbound material modal when selected material has stock but old transaction lines do not have `zoneId`.
- Backend material detail now falls back to the material default `zoneId` when transaction item/transaction zone is missing.
- Frontend outbound modal now builds location options from material location balances directly, and falls back to the material default zone with current stock when no balance rows are returned.
- This keeps `Vị trí lấy vật tư` visible for older materials that have stock but legacy transactions without zone data.

Build:

- Backend build passed.
- Frontend build passed.

### Inventory Tab Visual Standardization

Implemented:

- Promoted the Stock tab visual language into shared Inventory UI primitives:
  - `InventoryPanel`;
  - `InventoryKpi`;
  - `InventoryInsightPanel`;
  - `InventoryPagination`;
  - shared table shell/head/row classes;
  - shared page spacing and grid gap classes.
- Reworked `InventoryMaterialsPage` layout to prevent charts and lists from visually sticking together:
  - 12-column layout;
  - wider stock table area;
  - clearer right-side analytics stack;
  - shared pagination below the stock table;
  - quick statistics inside the same panel system.
- Applied the same visual standard to:
  - `InventoryOverviewPage`;
  - `InventoryInboundPage`;
  - `InventoryOutboundPage`;
  - `InventoryTransferPage`;
  - `InventoryStockTakePage`;
  - `InventoryTransactionsPage`;
  - `InventoryAlertsPage`;
  - `InventoryAuditPage`.
- Removed local duplicate `KpiCard` and `InsightPanel` helpers from the normalized tabs.
- Reworked the Inventory Overview main screen so its KPI strip, stock table, recent inbound/outbound panels, warehouse filter, and action buttons match the rest of the Inventory cockpit.
- Kept backend, API, Prisma, and mutation logic unchanged.

Build:

- Frontend build passed.

### Inventory Global Action Bar

Implemented:

- Added a shared Inventory action bar aligned to the right of the Inventory tab strip.
- Added module-level actions:
  - `Nhập kho` -> `/inventory/inbound`
  - `Xuất kho` -> `/inventory/outbound`
  - `Khác > Điều chuyển` -> `/inventory/transfer`
  - `Khác > Kiểm kê` -> `/inventory/stock-take`
  - `Khác > Điều chỉnh tồn kho` -> `/inventory/adjustments`
  - `Khác > Tạo vật tư mới` -> shared `MaterialDrawer`
- Replaced duplicated tab bars in active Inventory pages with the shared Inventory tab workspace.
- Removed the old Overview quick-action panel.
- Removed the duplicate create-material button from the Stock tab filter bar.
- Kept all existing inbound, outbound, transfer, stock-take, and adjustment forms intact.
- Did not modify backend code or Prisma schema.

Build:

- Frontend build passed.

### Inventory UX Fix - Transaction Form Priority

Implemented:

- Moved transaction forms to the top of the dedicated Inventory transaction pages:
  - `InventoryInboundPage`
  - `InventoryOutboundPage`
  - `InventoryTransferPage`
  - `InventoryStockTakePage`
- Final page order is now: Form -> KPI -> Filter -> Table.
- Kept existing form fields, submit handlers, mutation logic, and API usage unchanged.
- Did not modify backend code or Prisma schema.

Build:

- Frontend build passed.

### Inventory Transaction UX Refactor

Implemented:

- Restored modal workflow for Inventory transaction creation:
  - inbound;
  - outbound;
  - transfer;
  - stock-take.
- Added reusable transaction modal components for the existing form workflows.
- Updated Inventory action bar so:
  - `Nhập kho` opens the inbound modal;
  - `Xuất kho` opens the outbound modal;
  - `Khác > Điều chuyển` opens the transfer modal;
  - `Khác > Kiểm kê` opens the stock-take modal.
- Converted dedicated transaction tabs back to history/analytics pages only.
- Preserved existing form fields, validation, mutation payloads, and API hooks inside the modal components.
- Did not modify backend code or Prisma schema.

Build:

- Frontend build passed.

### Inventory Material Detail UX Unification

Implemented:

- Added a shared material detail modal for Inventory.
- Reused the same material detail UI from both Overview and Stock tabs.
- Stock tab now loads the richer material detail data before showing the detail workspace.
- Improved Inventory transaction modal buttons and native select dropdown readability.
- Kept transaction mutation logic and backend unchanged.

Build:

- Frontend build passed.

### Inventory Transaction Controls And Detail Tabs

Implemented:

- Fixed `Khác` dropdown by rendering it in a document-level portal with fixed positioning.
- Rearranged inbound and outbound transaction modal layouts to match the requested form structure:
  - date/time;
  - supplier/project/target;
  - material and quantity;
  - location;
  - KPI cards;
  - amount summary;
  - file input placeholder;
  - note textarea;
  - clear cancel/confirm footer.
- Added material detail side tabs:
  - Tổng quan;
  - Nhập / Xuất;
  - Công trình;
  - Nhà cung cấp;
  - Vị trí;
  - Phân tích;
  - Lịch sử thay đổi.
- Backend, Prisma, and transaction mutation endpoints unchanged.

Build:

- Frontend build passed.

### Inventory Transfer And Material Form UX Fix

Implemented:

- Added transaction time field to the transfer modal.
- Material create/edit drawer now renders through a document-level portal to avoid being hidden under Inventory tab content.
- Restyled MaterialDrawer to match the newer transaction modal form layout and dark select behavior.

Build:

- Frontend build passed.

### Inventory Stock Tab Analytics Cleanup

Implemented:

- Refined `InventoryMaterialsPage` pagination so the stock list shows `Hiển thị 1-10/xxx kết quả` at the bottom-left by default, with clickable page numbers centered below the table.
- Replaced the stock-location horizontal chart with a donut distribution by warehouse/location.
- Added a monthly stock movement trend chart derived from inventory transactions.
- Removed the old stock-health composition and stock-rhythm charts from the Stock tab.
- Rewired stock alerts from current stock/minimum stock data and separated alert rows visually by severity.
- Added a bottom quick-stat strip for today's inbound, outbound, transfer, current-month stock-take, and stock variance indicators.
- Kept backend, API, and Prisma unchanged.

Build:

- Frontend build passed.

### Sprint A.5 - Inventory Cleanup

Implemented:

- Converted `InventoryOverviewPage` into a dashboard-only cockpit for transaction workflows.
- Removed Overview-owned inbound, outbound, transfer, and stock-take modal forms.
- Removed the Overview transaction modal state and submit handlers.
- Changed Overview quick actions to navigate to dedicated transaction pages:
  - `/inventory/inbound`
  - `/inventory/outbound`
  - `/inventory/transfer`
  - `/inventory/stock-take`
- Kept MaterialDrawer and material detail behavior in Overview.
- Did not modify transaction pages or backend code.

Build:

- Frontend build passed.

### Inventory Outbound And Transfer Submit Fix

Implemented:

- Fixed outbound modal expected issue value so `Giá trị xuất dự kiến` uses material detail `averageCost` first, then material `averageCost/unitPrice` fallback.
- Outbound modal now auto-selects the first available stock location for the chosen material when location balances load.
- Added a fallback source location from the material default zone/current stock when detailed location balances are not yet available.
- Transfer modal now auto-selects a valid source zone and destination zone after choosing a material.
- Transfer submit button is now disabled only when the selected material, zones, quantity, and source stock are invalid.
- Added user-facing warnings when an outbound material has no usable stock location or the requested quantity exceeds source-zone stock.
- Backend, API, and Prisma unchanged.

Build:

- Frontend build passed.

### Inventory Location Balance Validation Fix

Root cause:

- Material `001` had total stock `1,567` and default material zone `B01`.
- Its three inbound test transaction lines had no `InventoryTransactionItem.zoneId` and their transaction headers also had no `InventoryTransaction.zoneId`.
- Material detail calculated `locationBalances` with fallback `line.zoneId ?? transaction.zoneId ?? item.zoneId`, so frontend showed `1,567` available at `B01`.
- Outbound/transfer validation used `getCurrentStockAtLocation`, which only counted line zone or transaction header zone and did not include item default zone fallback.
- Result: frontend showed stock at `B01`, backend validated stock at `B01` as `0`, then threw `Insufficient stock for 001 at selected location`.

Implemented:

- Updated backend stock-at-location validation to treat legacy no-zone transaction lines as belonging to the material default zone when the selected zone matches `InventoryItem.zoneId`.
- Updated inbound modal so choosing a material auto-selects its default zone, falling back to the first warehouse zone, preventing future no-zone inbound lines from normal UI usage.
- Backend, frontend, and Prisma schema unchanged except service/UI logic.

Verification:

- SQL check for material `001` now resolves backend validation stock at `B01` as `1,567`.
- Backend build passed.
- Frontend build passed.

### Inventory Master Data And BOM Material Grouping

Implemented:

- Rebuilt the Inventory master-data workspace for:
  - material categories;
  - material type/specification groups;
  - units of measure.
- Added create/edit/deactivate actions for material categories, material types/specifications, and inventory units.
- Category/type/unit deletes are soft deactivations so existing Material Master, transaction, BOM, and production references remain intact.
- The workspace now shows usage counts from current Material Master links.
- Seeded/standardized steel-structure master data:
  - 8 active material categories;
  - 24 active material type/specification records;
  - 14 active units.
- Deactivated unused demo/duplicate categories and old duplicate material type codes.
- Production BOM material selector now groups production-warehouse materials by `materialUsageType`:
  - `PRIMARY` -> Vật tư chính;
  - `SECONDARY` -> Vật tư phụ;
  - `CONSUMABLE` -> Tiêu hao.
- When selecting a material in the BOM modal, BOM item category is auto-derived from the selected material usage type.

Build:

- Backend build passed.
- Frontend build passed.

### Shell Header And Inventory Overview Density Pass

Implemented:

- Moved global quick search from the left side of the topbar to the right side, next to the `LIVE` status chip.
- Added route-aware compact module titles on the left side of the topbar, e.g. `Kho vật tư`.
- Removed the large duplicate Inventory Overview section header because the module title now lives in the topbar.
- Reduced Inventory workspace padding, panel spacing, KPI size, panel header height, and panel body padding.
- Tightened Inventory Overview:
  - stock table remains capped at 10 visible rows;
  - table typography and row padding are smaller;
  - recent inbound and outbound panels remain capped at 5 transactions;
  - recent transaction cards use smaller text and tighter spacing;
  - warehouse filter buttons are more compact.

Build:

- Frontend build passed.

### Global Module Header Density Pass

Implemented:

- Applied the compact header pattern globally through shared `SectionHeader`.
- Removed the repeated large `SteelTrack ERP` eyebrow from module section headers.
- Section titles now render as compact single-line headers with one-line descriptions.
- Expanded route-aware topbar titles so more modules show short names in the topbar:
  - Tổng quan;
  - Kho vật tư;
  - Cấu kiện;
  - Sản xuất;
  - Bãi tập kết;
  - Công trình;
  - Nhà cung cấp;
  - Chất lượng QC;
  - Vận chuyển;
  - Mua hàng;
  - Chứng từ;
  - Phân tích;
  - Báo cáo;
  - Thông báo;
  - Danh mục hệ thống;
  - AI Assistant;
  - Cài đặt hệ thống;
  - Người dùng;
  - Vai trò & phân quyền;
  - Nhật ký hệ thống;
  - Sao lưu dữ liệu.

Build:

- Frontend build passed.

### Settings Catalog And Unit Management

Implemented:

- Added `Danh mục / Đơn vị` management inside `Hệ thống > Cài đặt`.
- The settings screen now manages the same Inventory master-data records used by Material Master:
  - material categories;
  - material usage groups overview (`PRIMARY`, `SECONDARY`, `CONSUMABLE`);
  - material type/specification groups;
  - units of measure.
- Create/edit/deactivate actions use the existing Inventory endpoints, so Settings and Inventory share one data source.
- Usage counters show how many active materials are linked to each category/type/unit/usage group.
- Material usage groups are shown as fixed system standards because they currently come from `InventoryItem.materialUsageType` enum.

Build:

- Frontend build passed.

### Inventory Foundation Phase A - UI Consolidation

Implemented:

- Removed the duplicate create-material form from `InventoryOverviewPage`.
- Added `MaterialDrawer` to `InventoryOverviewPage` so the overview quick action opens the same create/edit Material Master form used by `InventoryMaterialsPage`.
- Kept Material Master creation separate from initial inbound transaction creation.
- Confirmed no Prisma schema change and no migration were created.
- Did not modify the Supplier module.
- Refined the app sidebar theme to better match the dark cockpit UI:
  - glass-style dark sidebar background;
  - calmer group headers;
  - clearer active submenu state;
  - hash-aware active matching for child tabs such as Yard 2D/3D tabs.

Build:

- Frontend build passed.
- Backend build passed.

### Yard Zone/Slot Runtime Fix

Implemented:

- Added API-backed Yard zone fetching on the frontend so the 2D yard map can render zones independently from slot results.
- Added Yard create-zone and create-slot mutations using existing `/yard/zones` and `/yard/zones/:zoneId/slots` endpoints.
- Added in-app create Zone and create Slot modals in the Yard cockpit.
- Updated Yard Overview and 2D map to pass configured zones into the shared 2D map.
- Updated the 2D map toolbar:
  - moved zoom `- / + / %` controls into the top position toolbar near the selected location indicator;
  - added `+ Zone` and `+ Slot` actions;
  - added per-zone `+ Slot` action.
- Production "Chuyển thành phẩm ra bãi" now shares the same `/yard/slots` runtime source, so available slots will populate when Yard slots exist and still have stack capacity.
- Fixed `/yard/slots` backend 500 root cause by adding missing `yard_item_placements.stagedQuantity` and `yard_item_placements.remainingQuantity` columns.
- Applied migration `20260605050000_add_yard_placement_quantities`.
- Verified authenticated Yard API:
  - `/yard/slots` returns 75 slots after the test slot creation;
  - 73 slots are currently available for production staging;
  - creating slot `07-01` under `ST-YARD-07` succeeds.

Build:

- Frontend build passed.
- Backend build passed.

### Production To Yard Feedback And Quantity Fix

Implemented:

- Production "Xác nhận QC và chuyển bãi" now shows inline success/error feedback inside the staging panel instead of relying only on toast notifications.
- Backend error messages are surfaced to the operator; the QC gate error is translated into Vietnamese with the required next action.
- Added visible disabled-state reasons for missing slot, invalid quantity, or quantity exceeding remaining MO quantity.
- Fixed staged/remaining quantity calculation to count Yard placements by `metadata.productionOrderId`, not only by shared `componentId`.
- This prevents multiple production orders using the same component master from consuming each other's remaining staging quantity.
- Verified an approved-QC MO can stage to Yard:
  - `MO-20260603-11563`;
  - component `CPL-73140121`;
  - slot `ST-YARD-07/07-08/L1`;
  - `/yard/slots` returns the new placement.

Build:

- Frontend build passed.
- Backend build passed.

### QC Fast Approval Workflow

Implemented:

- Completed the QC operator workflow for production orders that block Yard staging.
- Added inline QC success/error feedback in `QcPage`.
- Header `+ Tạo phiếu kiểm tra` now opens the QC planning queue.
- Added quick actions on completed production orders waiting for QC:
  - `Tạo QC`;
  - `Tạo & duyệt đạt`.
- The quick approval flow reuses an existing non-approved inspection when possible; otherwise it creates a new inspection, starts it, completes it as `PASSED`, then approves it.
- Added the same quick approval action in the production-order QC detail popup.
- Verified end-to-end:
  - created, started, passed, and approved QC inspection `QC-20260605-1780639947783` for `MO-20260605-36058`;
  - after approval, Production `stage-to-yard` succeeded;
  - component `CPL-33167708` was staged to Yard slot `ST-YARD-C/ST-C-03/L2`.

Build:

- Frontend build passed.
- Backend build passed.

### Clean Workflow Test Reset

Implemented:

- Created backup before cleanup:
  - `backups/steeltrack_before_clean_workflow_20260605_132345.dump`.
- Added reusable reset SQL script:
  - `scripts/reset-clean-workflow.sql`.
- Reset operational/test data so the workflow can be tested from a clean start:
  - inventory materials;
  - inventory transactions;
  - return requests;
  - projects;
  - components;
  - BOMs;
  - production orders/stages/logs/issues;
  - QC inspections/results/issues/NCR attachments;
  - Yard placements/movements/snapshots;
  - purchase/material requests;
  - activity logs/outbox events.
- Preserved foundation data:
  - users, roles, permissions;
  - material categories/types/units;
  - suppliers;
  - QC checklist standards;
  - yard zones and slots.
- Reset all yard slots to `AVAILABLE` with `currentStackLevel = 0`.

Verification after reset:

- Operational rows are clean:
  - `inventory_items = 0`;
  - `inventory_transactions = 0`;
  - `return_requests = 0`;
  - `projects = 0`;
  - `components = 0`;
  - `BOM = 0`;
  - `production_orders = 0`;
  - `qc_inspections = 0`;
  - `yard_item_placements = 0`;
  - `yard_movements = 0`;
  - `activity_logs = 0`.
- Preserved master/layout rows:
  - `inventory_categories = 12`;
  - `material_types = 26`;
  - `master_units = 14`;
  - `Supplier = 3`;
  - `qc_checklists = 2`;
  - `qc_checklist_items = 4`;
  - `yard_zones = 8`;
  - `yard_slots = 93`.
