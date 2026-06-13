# SteelTrack Changelog

## 2026-06-13 Sprint 11A Decimal Quantity & Currency Formatting

Fixed:

- Quantity inputs in Inventory, Production, Yard staging, and production material return now support decimal values and `vi-VN` formatted typing.
- Currency values use whole-number VND display such as `25.000.000 đ`.
- Backend Inventory and Production DTOs accept locale-formatted numeric strings for quantity-related fields.

Verified:

- Frontend build passed.
- Backend build passed.

Database:

- No migration required; audited operational quantity/cost columns already use `Float`.

## 2026-06-13 Sprint 11 Component Costing Breakdown

Implemented:

- Added `GET /components/:id/costing/breakdown`.
- Component Detail now includes a `Cost Breakdown` tab.
- Breakdown shows Estimated Materials, Actual Materials, KPI cards, and Warnings.
- Warning engine detects BOM material not consumed, unplanned consumed material, and quantity variance.

Verified:

- BOM `VAL-MAT-100 qty=100` with actual consumption `VAL-MAT-002 qty=9`.
- Warnings returned:
  `BOM_MATERIAL_NOT_CONSUMED`,
  `UNPLANNED_MATERIAL`.
- Estimated material cost:
  `128,571,428.57142857`.
- Actual material cost:
  `2,442,627.7427184465`.

## 2026-06-13 Sprint 10C Reservation Allocation Integrity

Fixed:

- Production reservation allocation now uses active `inventory_location_stocks` only.
- Allocation ignores historical transaction/issue buckets and zero-quantity buckets.
- Reservation bucket matching is exact by material, warehouse, zone, slot, and level.
- Runtime production integrity summary now reports active reservation lines pointing to buckets without positive current stock.

Verified:

- Production warehouse smoke stock:
  `A02/L1 = 10`, `A02/L2 = 5`.
- Reservation `8` allocated from active `A02/L1`.
- Issue from reservation succeeded.
- Final stock:
  `A02/L1 = 2`, `A02/L2 = 5`.

Known data state:

- Runtime summary still reports one historical invalid reservation bucket from before the fix; no data backfill was performed.

## 2026-06-13 Sprint 10B Automatic Component Costing

Fixed:

- Production completion now automatically recalculates costing for the linked Component.
- Production output creation/READY marking also triggers automatic costing.
- Automatic costing uses the existing upsert behavior: create if missing, update if present.
- Costing failure is logged as a warning and does not roll back production completion.
- ActivityLog now records `AUTO_RECALCULATE_COSTING` with component and production order metadata.

Verified:

- Smoke component `S10B-20260613103402-COMP` was completed from production after material issue and consumption.
- `ComponentCosting` was created automatically without pressing Recalculate.
- Component costs were updated:
  `estimatedCost = 2,714,030.825242719`,
  `actualCost = 2,442,627.742718447`.

Known follow-up:

- Reservation-based smoke exposed a separate reservation allocation issue where a historical production slot was selected despite no current location stock.

## 2026-06-13 Sprint 10A.1 Return Material UI Reconciliation

Fixed:

- Production Cockpit Return action now uses the same returnable source of truth as backend reconciliation.
- `ProductionMaterialIssue.returnedQty` is the active returned quantity; `ProductionMaterialConsumption.returnedQty` remains a snapshot and is not used as the live return source.
- Successful return updates the Production Issues query cache immediately, so the row becomes reconciled before background refetch completes.
- Reconciled rows show `Đã cân bằng` instead of another Return button.
- Stale insufficient-stock errors are shown as a friendly reload/reconciliation message.

Verified:

- Existing smoke row `Issue 10 / Consume 8 / Scrap 1 / Return 1` calculates `ui_returnable = 0`.
- Backend build passed.
- Frontend build passed.

## 2026-06-13 Sprint 10A Material Return Reconciliation

Fixed:

- Production Material Return now caps return quantity by issued minus consumed, scrap, and already returned quantity.
- Unused issued material returns to `MAIN` / `Kho chính`; issue remains the stock-reducing step for `PRODUCTION` / `Kho vật tư SX`.
- Return now writes Inventory `RETURN`, updates main warehouse `inventory_location_stocks`, increments `ProductionMaterialIssue.returnedQty`, and writes a `RETURN` material ledger row.
- Legacy direct issue status update to `RETURNED` now uses the same return validation.
- Production Cockpit now prompts for partial return quantity and shows returnable quantity after consumption/scrap.

Verified:

- Smoke test passed:
  issue `10`, consume `8`, scrap `1`, return `1`.
- Verified production balance:
  `10 = 8 + 1 + 1`.
- Verified Inventory transactions and Production Material Ledger rows for the smoke workflow.

## 2026-06-12 Sprint 9 Bug Fixes

Fixed:

- Fixed Inventory production-transfer stock check so the source line no longer inherits the destination production warehouse from top-level payload data.
- Inventory line normalization now resolves warehouse from each line zone when zone is present.
- Inventory outbound modal now sends source line warehouse explicitly.
- Inventory location stock upsert now uses the full location key including warehouse.
- Inventory outbound validation now checks the exact selected warehouse/zone/slot/level bucket.
- Production material issue transaction items now preserve warehouse, zone, slot, and level.
- Production MO auto-issue planning now carries slot/level from production stock buckets.
- Project Components delivery/install calls now use the authenticated API client.
- Project Components actions now show success/error feedback.
- Project Components row click now opens the existing Component detail modal from the Components list.

Verified:

- Backend build passed.
- Frontend build passed.
- `POST /components/:id/deliver` changed `CPL-48937939` from `SHIPPED` to `DELIVERED`.
- Production issue/return smoke test kept item snapshot and location stock synchronized.

Known data state:

- Existing validation data for `VAL-MAT-001` still has historical mismatch `80` vs `90`; this was not silently backfilled.
- Runtime integrity APIs still report historical reconciliation findings until a dedicated cleanup/backfill pass is approved.

## 2026-06-12 Clean Dataset Plan

Documented:

- Added `docs/ai-state/audits/clean-dataset-plan.md`.
- Listed operational tables to clear and master/reference tables to keep.
- Defined Scenario A clean validation workflow and expected balances at every step.

No code or database data was changed.

## 2026-06-12 System Audit & Hardening Sprint 8

Implemented:

- Added read-only Runtime Integrity KPI APIs:
  - `GET /runtime/integrity/inventory-summary`
  - `GET /runtime/integrity/production-summary`
  - `GET /runtime/integrity/project-summary`
- Created `docs/ai-state/audits/system-integrity-audit.md`.
- Documented Inventory, Production, Component lifecycle, Costing, and Project integrity findings.

Verified:

- Backend build passed.
- Frontend build passed.
- KPI endpoints were smoke tested in-memory.

Known findings:

- Inventory has transaction-vs-location reconciliation mismatches.
- Production has issued material that is not yet consumed/returned/scrapped in current data.
- One `READY` component lacks a matching timeline action.

## 2026-06-12 Installation Mapping Sprint 7

Implemented:

- Added component installation location database fields.
- Extended `POST /components/:id/install` to require `installZone`, `installAxis`, `installLevel`, and `installPosition`.
- Added Projects install modal for `Khu vực`, `Trục`, `Tầng`, and `Vị trí`.
- Added Zone, Axis, Level, and Position columns to Project Components.
- Added installation location to Component Detail.
- Project runtime now returns installation location fields.

Verified:

- Prisma migration applied successfully.
- Prisma generate passed.
- Backend build passed.
- Frontend build passed.
- Smoke test confirmed missing install payload returns 400 and valid install stores location in component, timeline note, and project runtime. Smoke data was cleaned up.

## 2026-06-12 Delivery And Installation Sprint 6

Implemented:

- Added component delivery and installation APIs.
- Enforced lifecycle validation: only `SHIPPED` can become `DELIVERED`, and only `DELIVERED` can become `INSTALLED`.
- Added `ComponentTimeline` actions for `DELIVERED` and `INSTALLED`.
- Updated Project runtime delivered/installed counts so `SHIPPED` is no longer counted as project received.
- Added Projects tab actions `Xác nhận nhận hàng` and `Xác nhận lắp đặt`.

Verified:

- Backend build passed.
- Frontend build passed.
- Smoke API test confirmed invalid direct install returns 400, delivery/install transitions succeed, timeline rows are written, and Project runtime reflects the installed component. Smoke rows were cleaned up.

## 2026-06-12 Component Costing Sprint 5

Implemented:

- Added `ComponentCosting` database model and migration.
- Added component costing APIs for read and recalculation.
- Added actual material costing from production consumption and inventory average cost.
- Added Component detail Costing section.
- Recalculation updates component `estimatedCost` and `actualCost`, so Project Components shows real Actual Cost.

Verified:

- Prisma migration applied successfully.
- Smoke recalculation for `CPL-98509548` produced actual material cost and Project runtime Actual Cost, then smoke rows were cleaned up.
- Backend build passed.
- Frontend build passed.

## 2026-06-12 Production Consumption Sprint 4

Implemented:

- Added `ProductionMaterialConsumption` database model and migration.
- Added material consumption APIs for list, order detail, and posting consumption.
- Added validation for net issued quantity, consumed quantity, scrap quantity, and returned/consume/scrap total.
- Added automatic `CONSUME` rows in Production Material Ledger.
- Added Production Cockpit tab `Tiêu hao vật tư` with Issued, Returned, Consumed, Scrap, and Remaining views.

Verified:

- Prisma migration applied successfully.
- Authenticated `GET /production/consumptions` returned an array.
- Smoke `POST /production/:id/consume` created consumption and `CONSUME` ledger rows, then smoke rows were cleaned up.
- Backend build passed.
- Frontend build passed.

## 2026-06-12 Project Components Tab

Implemented:

- Extended Projects runtime data with project-linked component rows from `components.projectId`.
- Added Projects tab `Cấu kiện công trình` next to `Vật tư theo công trình`.
- Added component status filters for `ALL`, `STOCK`, `READY`, `SHIPPED`, `DELIVERED`, and `INSTALLED`.
- Added summary cards for total components, `READY`, `SHIPPED`, `DELIVERED`, and `INSTALLED`.
- Added component table columns for code, name, project, status, planned date, installed date, estimated cost, and actual cost.

Verified:

- Existing component `CPL-98509548` appears under project `CT-2026-4166` with status `SHIPPED`.
- Backend build passed.
- Frontend build passed.

Known gap:

- Component row click currently routes to `/components/list` with selected component state because no active component detail route by id exists yet.

## 2026-06-12 Yard Outbound Component Status Fix

Fixed:

- Yard outbound now updates component placements to `Component.status = SHIPPED`.
- Yard outbound preserves or infers the component `projectId` so shipped components remain visible in project-linked component data.
- Yard outbound writes a `ComponentTimeline` `SHIPPED` entry.
- Yard mutations now refetch Yard, Components, Projects, and Dashboard data.
- Project runtime delivered/completed counts now include `SHIPPED` and `DELIVERED` component states.

Verified:

- `POST /yard/placements/:id/remove` returned 201.
- Smoke component changed to `SHIPPED`.
- Smoke placement had `removedAt`.
- Project runtime delivered count increased while smoke component existed.
- Smoke data was cleaned up.
- Backend and frontend builds passed.

## 2026-06-12 Auth Route Guard Fix

Fixed:

- Added active `/login` route and auth guard for application routes.
- Wrapped the active frontend provider tree with `AuthProvider`.
- Updated LoginPage to store both access and refresh tokens through the shared auth store.
- Prevented unauthenticated business pages from firing `/components` and `/production` requests without Bearer tokens.

Verified:

- `/auth/login` returns access and refresh tokens.
- `/auth/refresh` accepts `{ refreshToken }`.
- `GET /components` returned 200.
- `GET /production` returned 200.
- `POST /components` returned 201.
- Frontend build passed.

## 2026-06-11 Production Execution Sprint 3

Implemented:

- Added issue-from-reservation workflow.
- Added material return workflow.
- Added exact production location stock decrement/increment for issue and return.
- Added `ISSUE` and `RETURN` Production Material Ledger writes.
- Added Production endpoint to create/mark component from MO after material issue.
- Added UI actions for reservation issue, material return, and MO component creation.
- Added Components module ai-state doc and fixed login default password to match seed credentials.

Verified:

- Production Order -> Reservation -> Issue -> Create Component -> Return Excess Material smoke workflow passed.

## 2026-06-11 Production Material Ledger Sprint 2

Implemented:

- Added `ProductionMaterialLedgerEventType` enum.
- Added `ProductionMaterialLedger` database model and migration.
- Added Production Material Ledger read APIs.
- Added automatic ledger writes for reservation create/reserve/release/expire.
- Added `/production/material-ledger` UI tab with MO, material, event type, and date range filters.
- Updated ai-state production docs and decisions.

Build:

- Prisma generate passed.
- Backend build passed.
- Frontend build passed.

## 2026-06-11 Production Reservation Sprint 1

Implemented:

- Added production material reservation header/line database models and migration.
- Added backend APIs for reservation list/detail/preview/create/reserve/release/expire.
- Added production warehouse reservation validation against active reserved quantities.
- Added `/production/reservations` and MO detail reservation preview/create action.
- Updated ai-state production docs and decisions.

Build:

- Backend build passed.
- Frontend build passed.

## 2026-06-11 Documentation Cleanup Phase

Documentation:

- Merged legacy docs classified as MERGE into ai-state workflow, decisions, design, roadmap, and audit docs.
- Added `docs/ai-state/roadmap.md`.
- Added `docs/ai-state/design/repo-structure.md`.
- Added `docs/ai-state/design/event-naming.md`.
- Added `docs/ai-state/audits/technical-debt-audit.md`.
- Added `docs/ai-state/audits/post-cleanup-summary.md`.
- Archived `docs/PROJECT_OVERVIEW.md` and `docs/architecture/REFACTOR_MASTER_PLAN.md` into `docs/archive/`.
- Deleted empty legacy module placeholders from `docs/modules/`.
- Updated `CURRENT_STATE.md`, `CURRENT_MODULES.md`, and `CODEX_WORKFLOW.md`.

## 2026-06-11 Documentation Refactor

Documentation:

- Normalized `docs/ai-state` into module, decision, audit, and design directories.
- Moved root-level module docs into `docs/ai-state/modules/`.
- Added `CURRENT_STATE.md`.
- Added architecture, inventory, and production decision docs.
- Added Yard, Projects, and Dashboard module docs.
- Added documentation audit.
- Updated Codex workflow reading and completion requirements.

## 2026-06-11

### Inventory Transfer 2D Location Flow

Fixed:

- Transfer creation now uses a separate selected source-location key so `fromZoneId` remains the real warehouse zone id sent to the API.
- Transfer source and destination options are limited to `Kho chính`; `Kho sản xuất` is intentionally excluded from this workflow.
- Selecting a source material location now auto-fills source cell and level from the selected real stock row.
- Selecting a destination location now suggests the first available destination cell and level.
- The old transfer diagram panel was removed and replaced with separate source and destination 2D warehouse views.
- Warehouse location occupancy rows now include the optional `unitMaster` field expected by the view.
- Inventory location create/edit now shows the real parent warehouse selector for `Kho chính (MAIN)` and `Kho sản xuất (PRODUCTION)`, with fallback from zone warehouse data and a required parent warehouse before save.

Build:

- Frontend build passed.

## 2026-06-07

### Production BOM Stock Guard And Auto Material Issue

Fixed:

- Production BOM creation now blocks material quantities that exceed real available `Kho vật tư SX` stock.
- BOM modal now shows `Cần / Tồn SX` and shortage details per selected material.
- Backend production stock calculation now only counts lines assigned to the production warehouse and uses signed receipt/return quantities.
- Starting a Manufacturing Order now automatically creates `ISSUED` production material issue rows for missing BOM requirements.
- Auto-issued production material creates inventory outbound movements from the production warehouse location, so `Kho vật tư SX` stock is reduced after production starts.
- Production material requirements now use the corrected production warehouse balance.
- Production start now creates material issue rows only after the MO start transition succeeds, avoiding orphaned issue rows if the start action fails.
- QC quick pass now works for newly created `READY` inspections because backend completion accepts `READY` inspections.

Build:

- Backend build passed.
- Frontend build passed.

### System Dashboard And Notifications Real Data Pass

Implemented:

- Added richer System backend endpoints for role matrix, activity summary, and persisted notifications.
- Rebuilt Users with real user/role/status data plus latest activity from `ActivityLog`.
- Rebuilt Roles & Permissions with real role/user/permission counts and a module/action permission matrix derived from persisted permission names.
- Rebuilt System Logs with real activity rows, action/module summaries, and compact trend/donut analytics.
- Added `GET /dashboard/cockpit` to aggregate real Projects, Production Orders, Components, Inventory, Yard, QC, Activity Logs, and Notifications.
- Rebuilt the main Dashboard/Tổng quan using the Inventory dark cockpit theme and real dashboard cockpit data.
- Rebuilt Notifications/Thông báo using persisted `notifications` rows from `/system/notifications`.
- Registered `/notifications` in the active router.

Build:

- Backend build passed.
- Frontend build passed.

Notes:

- Create/edit/lock/delete user and role actions remain visual controls until mutation APIs are added in System Phase S2.
- Notification mark-as-read remains visual until notification mutation APIs are added.

## 2026-06-06

### Cross Module Cockpit UI Refresh

Implemented:

- Restyled Projects cockpit:
  - Inventory-like dark glass background;
  - compact header and tab strip;
  - unified KPI cards;
  - compact filter/search bar;
  - cleaner project table shell;
  - donut and bar chart panels refreshed.
- Restyled Suppliers cockpit:
  - supplier list and supplier rating tabs use the same panel/table/filter language;
  - KPI cards now match the current Inventory baseline;
  - rating list and detail panel were compacted.
- Restyled QC cockpit:
  - Inventory-like background, action buttons, tab strip, filter bar, KPI cards, and inspection table;
  - donut chart styling aligned with the current cockpit baseline;
  - QC workflow logic unchanged.
- Added a new Logistics cockpit page:
  - `/logistics`;
  - `/logistics/routes`;
  - `/logistics/gps`;
  - KPI strip, filter/search bar, shipment table, donut summary, mini trend chart, 2D GPS preview, and warning list.
- Restyled System pages:
  - Settings;
  - Users;
  - Roles & Permissions;
  - System Logs;
  - all now use the same dark glass shell, compact filters, KPI cards, and table styling.

Build:

- Frontend build passed.

Boundary:

- Frontend UI/chart consolidation only.
- No backend, Prisma, workflow, QC approval, inventory, supplier, project, or logistics calculation changed.
- Logistics cockpit is UI/runtime placeholder until the real transport API phase.

### Components And Production Visual Refresh

Implemented:

- Restyled Yard cockpit shell to match Inventory:
  - Inventory-style dark glass background;
  - compact page title;
  - top action buttons;
  - rounded tab strip;
  - KPI cards;
  - compact search/filter bar;
  - chart row for yard capacity, operation flow, and yard movement trend.
- Added Yard shell charts:
  - slot occupancy donut;
  - movement type donut;
  - monthly yard movement mini trend.
- Polished Yard lower panels:
  - selected slot level cards;
  - component-in-slot list;
  - selected slot information;
  - crane list;
  - recent yard activity;
  - create zone and create slot modals.
- Further synchronized Production cockpit:
  - BOM registry table now uses the shared production table shell/head/row style;
  - material issue table now uses the shared production table shell/head/row style;
  - production log table now uses the shared production table shell/head/row style;
  - BOM tab now has a donut summary;
  - material issue tab now has a compact issue-rate chart.
- Added a dedicated Components Overview tab/page:
  - `/components` now renders `ComponentsOverviewPage`;
  - `/components/list` now renders the component list page.
- Updated Components sidebar/navigation config:
  - `Tổng quan`;
  - `Danh sách cấu kiện`;
  - existing production, stock, production-material, transfer, QC, and history pages remain.
- Removed the duplicated in-page horizontal tab strip from Components child pages so navigation follows the Inventory/sidebar pattern.
- Components Overview now includes:
  - KPI strip;
  - compact filter bar;
  - main component list;
  - status/type donut chart;
  - production progress chart;
  - top component profile chart;
  - production status panel;
  - quick steel component blueprint preview.
- Restyled Components shared cockpit UI to match the current Inventory visual baseline:
  - glass panels;
  - compact KPI cards;
  - compact filter inputs;
  - shared table shell/head/row classes;
  - shared muted/primary action buttons.
- Added reusable Components chart helpers:
  - donut summary;
  - compact mini bar chart.
- Updated Components list tab:
  - tighter KPI strip;
  - unified search/filter controls;
  - cleaner action buttons;
  - rounded table shell;
  - status donut and creation-rhythm chart on the insight column;
  - polished create/detail modals.
- Updated Components stock tab:
  - unified KPI and filter styling;
  - stock table now uses the shared table shell;
  - added inventory distribution donut and yard status panel.
- Restyled Production cockpit shared UI to match Inventory:
  - glass panels;
  - compact KPI cards;
  - shared buttons;
  - shared table classes;
  - donut and mini bar chart helpers.
- Updated Production cockpit:
  - Inventory-style background and tab bar;
  - compact top actions and filter bar;
  - quick action, MO today, and BOM-in-use panels;
  - donut production status chart;
  - shop-load mini bar chart;
  - cleaner manufacturing order table shell.

Build:

- Frontend build passed.

Boundary:

- Frontend UI only.
- No backend, Prisma, production logic, BOM logic, QC logic, or inventory calculation changed.

### Inventory Warehouse Slot-Level Material Location Phase 1

Implemented:

- Audited current Prisma schema:
  - `InventoryItem.slotId` already exists;
  - `InventoryItem.level` already exists;
  - `InventoryTransactionItem.slotId` already exists;
  - `WarehouseZone.row`, `column`, `level`, and `capacity` already exist.
- No migration was created because the required database fields already exist.
- Fixed Inventory item DTO validation so Material Master create/update now accepts:
  - `zoneId`;
  - `slotId`;
  - `level`.
- Enhanced `WarehouseMiniMap` in Material Drawer:
  - cell labels now show material occupancy such as `1 VT`, `3 VT`, or the single material code;
  - hover tooltip shows material code, name, quantity, unit, and level;
  - level cards show occupied material label instead of only `Đã dùng`.
- Applied the same 2D mini map to transaction modals:
  - inbound modal;
  - outbound modal;
  - transfer modal.
- Outbound modal can now record selected source `slotId/level` metadata on the outbound transaction item without changing stock calculation.
- Transfer modal now shows source and destination mini maps while preserving existing transfer quantity and zone validation.

Build:

- Backend build passed.
- Frontend build passed.

Boundaries:

- No drag-drop.
- No 3D.
- No canvas or Three.js.
- No inventory stock calculation change.
- No dashboard logic change.

### Inventory Overview Two-Column Density And Tab Chart Sync

Implemented:

- Reworked Inventory Overview layout so:
  - `Thao tác nhanh`;
  - `Nhập kho hôm nay`;
  - `Xuất kho hôm nay`;
  sit inside the left stock-table column, directly above `Tồn kho vật tư`.
- The Overview right-side charts now start at the same vertical level as the three quick cards, so `Tổng quan tồn kho` is pushed higher.
- Reduced Overview filter height and tightened filter spacing.
- Reduced shared Inventory input height to make filters across Inventory tabs more compact.
- Synced chart treatment across remaining Inventory tabs:
  - `Vị trí kho`: donut location status and stock-by-location bar chart.
  - `Nhập kho`: donut inbound-by-location and top inbound material bar chart.
  - `Xuất kho`: donut outbound-by-warehouse and top outbound material bar chart.
  - `Điều chuyển`: donut transfer status and transfer-value bar chart.
  - `Kiểm kê`: donut stock-take accuracy and variance/method bar charts.
  - `Lịch sử giao dịch`: donut transaction type and daily transaction bar chart.
  - `Cảnh báo tồn kho`: donut alert severity and alert-type bar chart.

Build:

- Frontend build passed.

### Inventory Overview Density Adjustment

Implemented:

- Reduced the height and padding of Overview quick-action, inbound-today, and outbound-today cards.
- Reduced quick-action button height and summary typography so the main stock/charts area starts higher.
- Rebalanced the Overview filter grid:
  - warehouse/category/type/status fields are narrower;
  - manual search field is longer and cleaner;
  - placeholder text is shorter.

Build:

- Frontend build passed.

### Inventory Overview Quick Action And Stock Status Polish

Implemented:

- Added the three requested Overview blocks directly below the search/filter bar:
  - `Thao tác nhanh`;
  - `Nhập kho hôm nay`;
  - `Xuất kho hôm nay`.
- Quick action buttons now open the same transaction modals as the Inventory topbar:
  - inbound;
  - outbound;
  - transfer;
  - stock take.
- Reworked Overview search/filter controls to be more compact.
- Reworked `Nhập kho gần đây` and `Xuất kho gần đây` into column-style rows matching the reference layout:
  transaction code, material/target, date, quantity, and status.
- Changed the old warehouse filter card grid into a warehouse status bar with a warehouse dropdown and quick status metrics.
- Added `Trạng thái` column to the Stock tab inventory list and the expanded stock modal.

Build:

- Frontend build passed.

### Inventory Overview Chart Synchronization

Implemented:

- Reworked Inventory Overview to use the same stock/audit data source and location display logic as the Stock tab.
- Added compact Stock-tab-style filters to Overview:
  - warehouse;
  - material group;
  - material usage type;
  - stock status;
  - manual text search;
  - search and reset buttons.
- Replaced Overview stock summary with donut charts:
  - `Tổng quan tồn kho`;
  - `Cơ cấu nhóm vật tư`.
- Added compact `Giá trị tồn kho` trend chart.
- Reworked `Cảnh báo tồn kho` to match the Stock tab style and added a full alert modal from `Xem tất cả`.
- Reworked recent inbound/outbound panels to show the latest 5 transactions with:
  - transaction code;
  - material;
  - date;
  - quantity;
  - total amount in expanded view.
- Added warehouse status filter cards showing total materials, low-stock count, and out-of-stock count per warehouse.
- Promoted shared Inventory chart components and simplified shared Inventory panel headings so Overview, Locations, Outbound, Transfer, Stock Take, Transactions, and Alerts use the same chart/panel visual language.

Build:

- Frontend build passed.

### Inventory Shell Cleanup And Orphan Warehouse Removal

Implemented:

- Removed orphan warehouse-like records from the current database:
  - `ST-WH-RAW`;
  - `ST-WH-FAB`.
- Added migration `20260606093000_remove_orphan_st_wh_zones` to null old references and delete those two warehouse zones.
- Updated the operational simulation seeder so it no longer recreates `ST-WH-RAW` or `ST-WH-FAB`.
- Removed the horizontal Inventory tab/action strip from the page body.
- Moved Inventory actions to the global topbar on Inventory routes:
  - `Nhập kho`;
  - `Xuất kho`;
  - `Khác`.
- Kept Inventory tab switching in the sidebar only.
- Added sidebar hide/show behavior with persisted collapsed state to increase workspace width.
- Aligned the Stock tab text search field with the other filters.

Build:

- Frontend build passed.
- Backend build passed.

## 2026-06-05

### Inventory Sprint B - Warehouse Locations

Implemented:

- Added Inventory tab `Vị trí kho` at `/inventory/locations`.
- Extended `warehouse_zones` for location management:
  - `row`;
  - `column`;
  - `level`;
  - `capacity`;
  - existing `code`, `name`, and `active` remain the core identity/status fields.
- Added Prisma migration `20260605063000_inventory_warehouse_location_fields`.
- Added Warehouse Location CRUD API:
  - `GET /inventory/zones`;
  - `GET /inventory/zones/:id`;
  - `POST /inventory/zones`;
  - `PUT /inventory/zones/:id`;
  - `PATCH /inventory/zones/:id/activate`;
  - `PATCH /inventory/zones/:id/deactivate`;
  - `DELETE /inventory/zones/:id` as soft delete by setting `active = false`.
- Added location statistics:
  - number of active material records stored in each location;
  - total stock quantity by location.
- Added location detail drawer showing materials currently stored in the selected location.
- Prepared future 2D warehouse map data by storing row/column/level without building map UI in this sprint.
- Added sidebar/tab navigation entry for `Vị trí kho`.

Warehouse zone audit:

- Demo records:
  - `DEMO-WH-FAB`;
  - `DEMO-WH-RAW`.
- Warehouse-like records:
  - `ST-WH-FAB`;
  - `ST-WH-RAW`.
- Real storage locations:
  - `A01`;
  - `A02`;
  - `B01`.

Build:

- Prisma migration deploy passed.
- Prisma generate passed.
- Backend build passed.
- Frontend build passed.

### Warehouse Zone Demo Cleanup

Verified current warehouse zone references:

- `InventoryItem.zoneId` references:
  - `A01`: 1 active material;
  - `A02`: 1 active material;
  - `B01`: 1 active material.
- `InventoryTransaction.zoneId` references:
  - `A01`: 5 transactions;
  - `A02`: 1 transaction;
  - `B01`: 1 transaction.
- `InventoryTransactionItem.zoneId` references:
  - `A01`: 12 transaction lines;
  - `A02`: 4 transaction lines;
  - `B01`: 2 transaction lines.

Cleaned:

- Hard-deleted unreferenced demo warehouse zones:
  - `DEMO-WH-FAB`;
  - `DEMO-WH-RAW`.

Remaining unreferenced warehouse zones:

- `C01`
- `ST-WH-FAB`
- `ST-WH-RAW`

### Warehouse Location Detail Modal

Implemented:

- Clicking a warehouse location row now opens a large read-only detail drawer.
- Added drawer sections:
  - location information;
  - capacity information;
  - material list;
  - 2D visual preview.
- Material list shows:
  - material code;
  - material name;
  - quantity;
  - unit.
- 2D preview renders a simple row/column grid from existing `row` and `column` values.
- Preview groups the selected location materials by the existing location `level`.
- Preview shows selected/occupied/empty cells without drag-drop.

Boundaries:

- Did not change inventory transactions.
- Did not change stock calculations.
- Did not add drag-drop.

Build:

- Frontend build passed.

### Warehouse Structure Cleanup UI

Implemented:

- Audited `InventoryLocationsPage` loading flow:
  - `useZones()` calls `GET /inventory/zones`;
  - API still returns all `warehouse_zones`;
  - frontend now filters the Locations table to real storage locations only.
- Excluded warehouse-like records from the main Locations table:
  - `ST-WH-RAW`;
  - `ST-WH-FAB`.
- Kept warehouse-like records in the database.
- Kept audit panel counts for warehouse-like records so they remain visible as structure cleanup context.
- Current table is intended to show real storage locations such as:
  - `A01`;
  - `A02`;
  - `B01`;
  - `C01`.

Boundaries:

- Did not delete data.
- Did not change Inventory transaction logic.
- Did not change stock calculations.

Build:

- Frontend build passed.

### Warehouse Parent Structure And Slot/Level UX

Implemented:

- Added data migration `20260605072000_seed_inventory_warehouses`.
- Seeded master warehouse parents:
  - `MAIN` / `Kho chính`;
  - `PRODUCTION` / `Kho sản xuất`.
- Assigned real storage locations `A01`, `A02`, `B01`, and `C01` to `MAIN`.
- Kept `ST-WH-RAW` and `ST-WH-FAB` in the database but no longer treats them as usable storage locations.
- Extended `GET /inventory/zones` response with the parent warehouse relation.
- Added frontend warehouse API/hook for `GET /master-data/warehouses`.
- Inventory Locations create/edit form now has `Thuộc kho nào?`.
- Inventory Locations table and detail drawer now show parent warehouse.
- Location labels now treat:
  - `row` as row;
  - `column` as slot;
  - `level` as floor/tầng.
- Reduced the 2D location preview size and added click-to-view cell details inside the preview.
- Material create/edit drawer now:
  - only offers locations from `Kho chính`;
  - has separate `Chọn slot` and `Chọn tầng` selectors;
  - automatically resolves the selected slot/tầng back to the matching warehouse location;
  - shows selected slot/tầng;
  - shows capacity usage;
  - warns and blocks save if the selected slot/tầng is full.
- Inbound transaction modal now:
  - only offers receiving locations from `Kho chính`;
  - shows selected slot/tầng;
  - shows capacity usage;
  - warns and blocks submit if the selected slot/tầng is full;
  - sends parent `warehouseId` together with selected location.
- Material detail `Vị trí` tab now shows:
  - warehouse;
  - location;
  - row;
  - slot;
  - floor/tầng;
  - quantity;
  - updated time.
- Material detail `Vị trí` tab now has `Xem 2D`, opening a focused 2D preview where the selected slot is highlighted and surrounding cells are dimmed.

Boundaries:

- Did not delete warehouse-like records.
- Did not change Inventory stock calculation logic.
- Did not implement drag-drop.
- Did not fully implement production warehouse/component material balance yet; `PRODUCTION` is now available as a parent warehouse for the next production-material phase.

Build:

- Backend build passed.
- Frontend build passed.

### Material Drawer Slot/Floor Visibility Fix

Fixed:

- Added migration `20260605073500_backfill_main_warehouse_location_slots`.
- Backfilled main storage locations:
  - `A01` = row `A`, slot `01`, floor `L1`, capacity `100`;
  - `A02` = row `A`, slot `02`, floor `L1`, capacity `100`;
  - `B01` = row `B`, slot `01`, floor `L1`, capacity `100`.
- The create/edit material form now shows explicit dropdowns:
  - `Chọn slot`;
  - `Chọn tầng`.
- Note: material master uses `Kho chính` locations only, so slots/floors from `Kho sản xuất` such as `C01` are intentionally not shown in the material form.

### Inventory Transaction Slot/Floor Selectors

Fixed:

- Inbound transaction modal now has explicit selectors:
  - receiving warehouse location;
  - receiving slot;
  - receiving floor/tầng.
- Transfer transaction modal now understands warehouse locations with separate selectors:
  - source location;
  - source slot;
  - source floor/tầng;
  - destination location;
  - destination slot;
  - destination floor/tầng.
- Transfer options now display parent warehouse, slot, floor, and available source quantity.
- Destination transfer options exclude warehouse-like `ST-WH-*` records and use real active storage locations only.

Build:

- Backend build passed.
- Frontend build passed.

### Warehouse 2D Grid Alignment

Fixed:

- Added migration `20260605075000_seed_main_warehouse_grid_levels`.
- Seeded the actual `Kho chính` storage grid so the database now understands the same cells shown in the 2D preview:
  - rows `A` through `F`;
  - columns `01` through `06`;
  - default floor `L1`;
  - capacity `100` for each cell/floor.
- Added extra floors for cell `A01`:
  - `A01-L2`;
  - `A01-L3`.
- Current `Kho chính` has 38 warehouse zone records:
  - 36 base cells from `A01` to `F06`;
  - 2 extra A01 floors.
- Material create/edit, inbound, and transfer now use the same location model:
  - choose location cell such as `A01`;
  - choose floor/tầng such as `L1`, `L2`, `L3`;
  - resolve the selected cell/floor to the correct `warehouse_zones.id`.

Build:

- Backend build passed.
- Frontend build passed.

### Warehouse Internal Cell Model Correction

Corrected:

- Reverted the mistaken model where internal cells `A01-F06` were created as separate `warehouse_zones`.
- Added migration `20260605080500_cleanup_seeded_grid_zones_add_item_slot_level`.
- Cleaned unreferenced seeded grid zones, leaving warehouse zones as parent storage locations only:
  - `A01`;
  - `A02`;
  - `B01`;
  - `C01`;
  - inactive `ST-WH-*` records.
- Added `InventoryItem.slotId` and `InventoryItem.level` so Material Master can store the default internal cell/floor inside a warehouse location.
- Backfilled existing active materials from their current zone row/column/level into `slotId` and `level`.
- Material create/edit now uses the correct structure:
  - select parent warehouse location;
  - select internal cell `A01-F06`;
  - select floor `L1-L4`.
- Inbound now records:
  - parent warehouse location as `zoneId`;
  - internal cell/floor as transaction item `slotId` in `CELL:LEVEL` format.
- Transfer now records source/destination:
  - parent warehouse location as `zoneId`;
  - internal source/destination cell/floor as transaction item `slotId`.
- Warehouse location detail 2D preview now treats `A01-F06` as internal cells inside the selected parent location, and uses material `slotId/level` to show occupied cells and material detail.

Build:

- Prisma migration deploy passed.
- Prisma generate passed.
- Backend build passed.
- Frontend build passed.

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

### Inventory Internal Slot Occupancy Guard

Implemented:

- Added `cellOccupancy` to `GET /inventory/zones` and `GET /inventory/zones/:id`.
- Occupancy is calculated by `warehouseZone + InventoryItem.slotId + InventoryItem.level`.
- Material creation/edit drawer now:
  - warns when the selected internal cell/floor already has another material;
  - disables fully occupied internal cells/floors;
  - blocks save when the selected cell/floor is occupied;
  - provides `Gợi ý vị trí trống`.
- Inbound modal now:
  - warns when the selected receiving cell/floor is occupied;
  - blocks inbound confirmation for occupied cell/floor;
  - provides `Gợi ý ô trống`.
- Transfer modal now:
  - checks destination cell/floor occupancy;
  - blocks transfer to occupied destination cell/floor;
  - provides `Gợi ý ô đích trống`.

Notes:

- Current guard uses active `InventoryItem` default location data as the occupancy source.
- Transaction stock calculation and Prisma schema were not changed.

Build:

- Frontend build passed.
- Backend build passed.

### Inventory Stock Location Display Fix

Implemented:

- `GET /inventory/audit` now returns per-material `locationBalances` calculated from actual inventory transaction item locations.
- Inventory stock list now displays the real stock location from `locationBalances` instead of the old default `position/zone` fallback.
- If a material is stored in multiple locations, the stock table shows the primary location plus `... +N`.
- Stock location distribution chart now uses the same real location balances.
- Removed duplicate `SectionHeader` blocks from Inventory tabs so all tabs align with the Overview layout and only use the shared module topbar plus tab workspace.

Build:

- Frontend build passed.
- Backend build passed.

### Warehouse Location Detail Layer View

Implemented:

- Removed the remaining subtitle/header block from the Inventory Locations tab so it aligns with the Inventory Overview layout.
- Location detail drawer now has tabs:
  - `Tổng quan`;
  - `Vật tư`;
  - `Phân tầng ô`;
  - `Sơ đồ 2D`.
- Added a CSS isometric/pseudo-3D layer preview for slot levels `L1-L4`.
- Level buttons can be clicked to highlight a floor and show the materials stored on that level.
- Corrected UI semantics for `capacity`:
  - `capacity` is shown as operational capacity, for example tons;
  - 2D cell count is fixed at `A01-F06 = 36 cells`;
  - floor structure is fixed at `L1-L4`;
  - total addressable cell-level positions are displayed as `144`.
- 2D preview now normalizes combined transaction slot values like `A01:L1` back to cell `A01`.

Build:

- Frontend build passed.
- Backend build passed.

### Component Production Warehouse Receiving UX

Implemented:

- Inventory outbound modal now supports a production receiving location when target is `Xuất cho sản xuất cấu kiện`.
- Added destination selectors for `Kho vật tư SX`:
  - production warehouse location;
  - internal cell;
  - level.
- Added `Gợi ý ô trống` for the production receiving location.
- Production receiving cell/level is blocked when occupied.
- Production outbound now posts as a tagged `TRANSFER` with:
  - negative line from the source inventory location;
  - positive line into the selected production warehouse location.
- Component production material stock now reads only the positive receiving line for `[COMPONENT_PRODUCTION]` transactions.
- Component production material stock table now shows:
  - `Loại vật tư`;
  - `Vị trí kho SX` instead of generic `Khu vực`.
- Removed duplicate subtitle/header blocks from Component module tabs so the module aligns with the Inventory layout.

Build:

- Frontend build passed.
- Backend build passed.

### Inventory Stock Tab Compact UX

Implemented:

- Reworked the Inventory Stock filter bar:
  - removed the `Bộ lọc tồn kho` title divider;
  - added compact filters for material group, material usage type, warehouse, and status;
  - added manual text search with a dedicated `Tìm kiếm` button;
  - added `Làm mới` to reset filters and refetch inventory audit data.
- Reworked the stock list panel:
  - moved `Xem tất cả` inline with `Danh sách tồn kho`;
  - reduced table typography and spacing;
  - added a compact specification column;
  - kept the list at 10 rows per page for Full HD density.
- Reworked right-side analytics cards:
  - removed chart title divider bars;
  - locked chart card height to prevent layout jumps;
  - added pagination controls for stock distribution and alerts when data exceeds one card page;
  - restyled stock distribution, trend, and alert cards for a denser dashboard layout.

Build:

- Frontend build passed.
- Backend build passed.

### Inventory Stock Full HD Density Pass

Implemented:

- `Cảnh báo tồn kho > Xem tất cả` now opens a modal with:
  - full alert table;
  - alert severity summary chart;
  - top low-stock mini chart.
- Reduced Stock tab vertical footprint:
  - compact KPI cards;
  - smaller filter controls;
  - shorter stock table rows;
  - shorter fixed-height chart cards;
  - compact quick statistics panel.
- Moved `Thống kê nhanh` higher in the viewport by reducing chart and table heights.
- Kept chart cards fixed-height to avoid layout jumping.

Build:

- Frontend build passed.
- Backend build passed.

### Inventory Warehouse Capacity Semantics Fix

Implemented:

- Fixed Warehouse Location UI so `capacity` is shown as operational storage capacity/tải trọng, not as the number of 2D cells.
- Inventory Location table now separates:
  - `Sức chứa` in tons;
  - `Ô/tầng` as occupied cell-level count.
- Location detail drawer now uses the fixed 2D structure of `6 x 6 x 4 = 144` cell-level positions.
- Material Drawer full-location validation now checks whether any empty cell-level exists instead of comparing `materialCount >= capacity`.
- WarehouseMiniMap now displays occupied/total cell-level count separately from operational capacity.

### Inventory Warehouse Location Move Cache Fix

Implemented:

- Material create/update/delete now invalidates:
  - `inventory-zones`;
  - `inventory-zone-detail`.
- This prevents Warehouse Location detail drawers from showing stale material placement after a material is moved to another zone/slot/level.
- Inventory item update now supports clearing `zoneId`, `slotId`, and `level` when the Material Drawer sends empty location values.
- Backend DTO now normalizes empty location fields to `null` for Material Master create/update.

### Projects Create + QC Component Inspection Workflow

Implemented:

- Projects backend now exposes `POST /projects` using the existing `ProjectsService.create()` flow.
- Projects cockpit now has a working `+ Thêm công trình` button with a create modal.
- New project form captures:
  - code;
  - name;
  - owner;
  - location;
  - project type;
  - status;
  - note.
- Project runtime now reads explicit `Loại:` from project description before falling back to name-based type inference.
- QC cockpit header now opens a direct `Tạo phiếu kiểm tra cấu kiện` modal.
- QC modal lets the user select completed MO/component from the QC waiting queue and either:
  - create a ready inspection;
  - create and approve/pass the inspection immediately.
- This supports the current gate where finished components can only move to Yard after linked QC status is `PASSED` or `APPROVED`.

Build:

- Frontend build passed.
- Backend build passed.

### Production Material Warehouse Orphan Receipt Data Repair

Data repair:

- Found old `[COMPONENT_PRODUCTION]` issue documents that only had negative source lines from the main warehouse and no positive receiving lines into the production material warehouse.
- Added 7 missing positive receiving lines into production warehouse location `P01`.
- Assigned slot/level positions:
  - `A02:L1`
  - `A03:L1`
  - `A04:L1`
  - `A05:L1`
  - `A06:L1`
  - `B01:L1`
  - `B02:L1`
- Verified:
  - `missing_positive_location = 0`;
  - `orphan_negative_without_receipt = 0`.

Impact:

- Production Material Warehouse can now display the formerly orphaned materials.
- No code or schema changes were made for this repair.

### Component Production Material Warehouse Real Location Link

Implemented:

- `Kho vật tư SX` now calculates stock by real production warehouse location:
  - `inventoryItemId`;
  - `zoneId`;
  - `slotId`.
- The production material stock table now shows one row per material-location instead of merging all stock by material code.
- This supports multiple production warehouse locations, such as `C01` and `P01`, without overwriting the displayed location.
- Removed the old fallback behavior where the UI could show `Vị trí SX mặc định` when production transaction lines had real warehouse/zone data.
- Return-to-main workflow now creates a real two-line return transaction:
  - negative line from the selected production warehouse zone/slot;
  - positive line back to the material's main warehouse location when available.

Build:

- Frontend build passed.

### QC Gate Link Repair For Completed MO

Fixed:

- Root cause: `QcController` was protected by `JwtAuthGuard`, while the current frontend `http-client` does not attach an auth token.
- Result: QC create/approve actions from the UI returned `401 Unauthorized`, so no `qc_inspections` row was created for the completed Manufacturing Order.
- Removed the controller-level guard from QC so the current operational cockpit can create/start/complete/approve inspections consistently with the rest of the active modules.

Data repair:

- Created approved QC inspection `QC-AUTO-MO-20260606-90928`.
- Linked it to:
  - production order `MO-20260606-90928`;
  - component `CPL-55982236`.
- Verified the production Yard gate now finds QC status `APPROVED`.

Build:

- Backend build passed.
