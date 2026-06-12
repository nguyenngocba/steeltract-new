# SteelTrack AI Changelog

## 2026-06-12 System Audit & Hardening Sprint 8

Completed:

* Created `docs/ai-state/audits/system-integrity-audit.md`.
* Audited Inventory reconciliation across `inventory_transactions`, `inventory_transaction_items`, and `inventory_location_stocks`.
* Audited Production material reservation, issue, return, consumption, and ledger data.
* Audited Component lifecycle states `READY`, `SHIPPED`, `DELIVERED`, and `INSTALLED`.
* Audited costing balance rule:
  `issued = returned + consumed + scrap`.
* Audited Project rule that installed components must have `projectId`.
* Added read-only KPI summary APIs:
  `GET /runtime/integrity/inventory-summary`;
  `GET /runtime/integrity/production-summary`;
  `GET /runtime/integrity/project-summary`.

Findings:

* Inventory has 26 transaction-vs-location reconciliation mismatches and 2 `inventory_items.quantity` snapshot mismatches.
* Production has 1 over-issued reservation line, no consumption rows in current live data, and issue rows not fully represented by `ISSUE` ledger rows.
* Component lifecycle has 1 `READY` component without a matching `READY` timeline action.
* Costing balance has 7 rows where issued material remains unallocated to returned/consumed/scrap.
* Project installed-component `projectId` rule has no current violations.

Verification:

* Backend build passed after adding Runtime Integrity APIs.
* Frontend build passed.
* KPI endpoints were verified through an in-memory API smoke test.

## 2026-06-12 Installation Mapping Sprint 7

Completed:

* Added component installation location fields:
  `installZone`, `installAxis`, `installLevel`, `installPosition`.
* Added Prisma migration `20260612110000_component_installation_location`.
* Extended `POST /components/:id/install` payload with required installation location fields.
* Install validation now requires the component to be `DELIVERED` and requires all installation location fields.
* Installation writes the location fields to `components`, sets `installedDate`, and records the full location in the `ComponentTimeline` `INSTALLED` note.
* Project runtime now returns installation location for each project component.
* Projects -> `Cấu kiện công trình` now opens an installation modal when confirming installation and requires:
  Khu vực, Trục, Tầng, Vị trí.
* Project Components table now displays Zone, Axis, Level, and Position columns.
* Component Detail now shows the installation location.

Verification:

* Prisma migration applied successfully.
* Prisma generate passed.
* Backend build passed.
* Frontend build passed.
* In-memory API smoke test verified missing install payload returns `400`, then `SHIPPED -> DELIVERED -> INSTALLED` succeeds with install location stored on the component, returned through `/projects/runtime`, and written to timeline note. Smoke data was cleaned up.

## 2026-06-12 Delivery And Installation Sprint 6

Completed:

* Audited `ComponentStatus` and confirmed `DELIVERED` and `INSTALLED` already exist in Prisma, so no schema migration was required.
* Added lifecycle APIs:
  `POST /components/:id/deliver`;
  `POST /components/:id/install`.
* Added validation:
  `SHIPPED -> DELIVERED`;
  `DELIVERED -> INSTALLED`.
* Delivery and installation APIs update `Component.status`, set `installedDate` on install, write ActivityLog rows, emit component update events, and create `ComponentTimeline` rows with actions `DELIVERED` and `INSTALLED`.
* Updated Project runtime so `SHIPPED` remains "đã xuất bãi", while delivered counts only include `DELIVERED` and `INSTALLED`.
* Added Project runtime component counters:
  `readyComponents`, `shippedComponents`, `deliveredComponents`, and `installedComponents`.
* Added `Xác nhận nhận hàng` and `Xác nhận lắp đặt` actions in Projects -> `Cấu kiện công trình`.

Verification:

* Backend build passed.
* Frontend build passed.
* In-memory API smoke test created a temporary `SHIPPED` component, verified direct install returns `400`, then verified deliver returns `DELIVERED`, install returns `INSTALLED`, timeline contains `DELIVERED` and `INSTALLED`, and `/projects/runtime` exposes the installed component. Smoke data was cleaned up.

## 2026-06-12 Component Costing Sprint 5

Completed:

* Audited Components and Production schema and confirmed components already expose `estimatedCost` and `actualCost`, but no persisted costing breakdown existed.
* Added `ComponentCosting` Prisma model and migration.
* Added costing APIs:
  `GET /components/:id/costing`;
  `POST /components/:id/costing/recalculate`.
* Added costing service that validates a Component has a Production Order and consumption records before recalculation.
* Material costing formula:
  `(ProductionMaterialConsumption.consumedQty + scrapQty) * Inventory average cost`.
* Inventory average cost uses the same inbound transaction basis as Inventory:
  positive inbound transaction value divided by positive inbound quantity.
* Recalculate upserts `ComponentCosting`, updates `Component.estimatedCost` and `Component.actualCost`, and writes an ActivityLog row.
* Added Component detail Costing section with estimated, actual, variance, material, labor, machine, overhead, and MO fields.
* Project Components tab continues to show `Actual Cost` from the component `actualCost` field populated by costing recalculation.

Verification:

* Prisma migration `20260612100000_component_costing` applied successfully.
* Route mapping confirmed:
  `GET /components/:id/costing`;
  `POST /components/:id/costing/recalculate`.
* Smoke costing for component `CPL-98509548` created temporary production consumption, recalculated costing, confirmed Project runtime Actual Cost updated, and cleaned up smoke rows/reset component costs.
* Backend build passed.
* Frontend build passed.

## 2026-06-12 Production Consumption Sprint 4

Completed:

* Audited production issue/return workflow and confirmed issued quantities are tracked by `ProductionMaterialIssue` with returned balances and `ISSUE`/`RETURN` material ledger rows.
* Added `ProductionMaterialConsumption` Prisma model and migration.
* Added consumption APIs:
  `GET /production/consumptions`;
  `GET /production/:id/consumptions`;
  `POST /production/:id/consume`.
* Added validation so consumed quantity, scrap quantity, and returned quantity cannot exceed issued material for the same MO/material.
* Added automatic Production Material Ledger `CONSUME` writes when material consumption is posted.
* Added Production Cockpit `Tiêu hao vật tư` route/tab with Issued, Returned, Consumed, Scrap, and Remaining summaries.

Verification:

* Prisma migration `20260612090000_production_material_consumption` applied successfully.
* `GET /production/consumptions` returned an authenticated array response.
* Smoke `POST /production/:id/consume` created a `ProductionMaterialConsumption` row and a matching `CONSUME` ledger row, then smoke rows were cleaned up.
* `pnpm -C apps/backend-api exec prisma generate` passed.
* Backend build passed.
* Frontend build passed.

## 2026-06-12 Project Components Tab

Completed:

* Audited Projects UI and confirmed it exposed project lists, progress, materials, and reports but did not expose project-linked components.
* Extended `GET /projects/runtime` with a `components` collection derived from `components.projectId`.
* Added Projects tab `Cấu kiện công trình` next to `Vật tư theo công trình`.
* Added project and component status filters for `ALL`, `STOCK`, `READY`, `SHIPPED`, `DELIVERED`, and `INSTALLED`.
* Added summary cards for total components, `READY`, `SHIPPED`, `DELIVERED`, and `INSTALLED`.
* Added project component table columns: component code, name, project, status, planned date, installed date, estimated cost, and actual cost.
* Component rows navigate to the existing Components list route because no component detail route is currently active.

Verification:

* Verified `CPL-98509548` appears in `/projects/runtime.components` with project `CT-2026-4166` and status `SHIPPED`.
* Backend build passed.
* Frontend build passed.

## 2026-06-12 Yard Outbound Component Status Fix

Completed:

* Audited Yard outbound flow from `YardOperationDialog` to `yardApi.remove`, `YardController.removeItem`, and `YardService.removeItem`.
* Confirmed previous outbound only set `YardItemPlacement.removedAt`, wrote a `REMOVE` yard movement, updated slot occupancy, and logged yard activity.
* Fixed Yard outbound for component placements so removal now also updates the linked Component to `SHIPPED`, clears yard location fields, preserves/infers `projectId`, and writes a `ComponentTimeline` `SHIPPED` entry.
* Updated Yard runtime mutation invalidation to refetch Yard, Components, Projects, and Dashboard queries after outbound.
* Updated Projects runtime metrics so `SHIPPED` and `DELIVERED` components count correctly in completed/delivered project component totals.

Verification:

* Smoke outbound created a project-linked component, placed it in Yard, removed it through `POST /yard/placements/:id/remove`, and verified:
  Component status `SHIPPED`;
  placement `removedAt` set;
  projectId retained;
  one `SHIPPED` component timeline row created;
  project runtime delivered count increased while the smoke component existed.
* Smoke records were removed after verification.
* Backend build passed.
* Frontend build passed.

## 2026-06-12 Auth Route Guard Fix

Completed:

* Audited frontend auth flow: LoginPage, Zustand auth store, token storage, Axios interceptor, refresh flow, and active router/provider wiring.
* Verified backend `/auth/login` returns both camelCase and snake_case token fields:
  `accessToken`, `access_token`, `refreshToken`, `refresh_token`.
* Verified `/auth/refresh` expects `{ refreshToken }` and returns rotated access/refresh tokens.
* Fixed active app provider wiring so `AuthProvider` runs inside `QueryClientProvider`.
* Added active `/login` route and route guard so business pages no longer render unauthenticated and fire `/components` or `/production` requests without Bearer tokens.
* Updated LoginPage to persist both access and refresh tokens through the shared auth store and navigate back through React Router instead of forcing a reload.

Verification:

* `GET /components` returned `200` with 6 existing records before smoke creation.
* `GET /production` returned `200`.
* `POST /components` returned `201`.
* Frontend build passed.

## 2026-06-11 Production Execution Sprint 3

Completed:

* Audited Component creation workflow across frontend, API, backend service, repository, and database.
* Verified generic `POST /components` creation works through API smoke testing.
* Fixed the isolated UI login blocker by aligning the login default password with the current seed password `123`.
* Added Production execution component endpoint `POST /production/:id/component`, requiring issued material before creating/marking a component as `READY`.
* Added reservation-linked material issue workflow:
  `POST /production/reservations/:id/issue`.
* Added material return workflow:
  `POST /production/material-issues/:id/return`.
* Extended `ProductionMaterialIssue` with reservation/location/return tracking.
* Issue reduces exact `inventory_location_stocks`; return restores exact location stock.
* Issue and return update reservation line balances and write `ISSUE` / `RETURN` ledger events.
* Added UI actions for issuing from reservation, returning issued material, and creating/marking a component from an MO.
* Added `docs/ai-state/modules/components.md`.

Verification:

* Smoke workflow completed:
  Production Order -> Reservation -> Issue -> Create Component -> Return Excess Material.
* Smoke ledger for the MO contains `RESERVE`, `ISSUE`, and `RETURN`.

Build:

* Backend build passed after service/controller changes.
* Frontend build passed after UI/API changes.

## 2026-06-11 Production Material Ledger Sprint 2

Completed:

* Added Prisma enum `ProductionMaterialLedgerEventType` with `RESERVE`, `RELEASE`, `ISSUE`, `RETURN`, `CONSUME`, and `ADJUST`.
* Added Prisma model and migration for `ProductionMaterialLedger`.
* Added ledger read APIs:
  `GET /production/material-ledger`;
  `GET /production/material-ledger/:id`;
  `GET /production/:id/material-ledger`.
* Added automatic ledger writes for reservation create/reserve/release/expire.
* Added `/production/material-ledger` tab with filters for Production Order, Material, Event Type, and Date Range.
* Updated production module, decisions, current state, current modules, and next-phase design docs.

Build:

* `pnpm -C apps/backend-api exec prisma generate`
* `pnpm -C apps/backend-api build`
* `pnpm -C apps/frontend build`

Notes:

* Ledger currently writes reservation lifecycle events. Issue, return, consume, and adjust writers remain future sprint work.

## 2026-06-11 Production Reservation Sprint 1

Completed:

* Added Prisma models and migration for `ProductionMaterialReservation` and `ProductionMaterialReservationLine`.
* Added reservation preview, create, reserve, release, and expire backend APIs.
* Reservation preview validates BOM demand against `Kho vật tư SX` availability minus active reservations.
* Reservation lines persist production warehouse allocation by `warehouseId + zoneId + slotId + level`.
* Added `/production/reservations` frontend tab and MO detail reservation preview/create action.
* Updated production module, decisions, current state, current modules, and next-phase design docs.

Build:

* `pnpm -C apps/backend-api exec prisma generate`
* `pnpm -C apps/backend-api build`
* `pnpm -C apps/frontend build`

Notes:

* Reservation does not move Inventory stock. Material issue from reservation, returns, production ledger, and costing remain future sprint work.

## 2026-06-11 Documentation Cleanup Phase

Completed:

* Merged legacy documentation classified as MERGE into ai-state:
  `AI_CONTEXT.md`, `AI_RULES.md`, `KNOWN_ISSUES.md`, `ROADMAP.md`, `TREE_STRUCTURE.md`,
  `architecture/ARCHITECTURE_FREEZE.md`, `architecture/INVENTORY_TRANSACTION_RULES.md`,
  and `inventory/inventory-phase1-migration-plan.md`.
* Preserved the KEEP event naming standard in ai-state by creating `design/event-naming.md` while leaving `docs/architecture/EVENT_NAMING.md` in place.
* Created new ai-state documents:
  `roadmap.md`;
  `design/repo-structure.md`;
  `design/event-naming.md`;
  `audits/technical-debt-audit.md`;
  `audits/post-cleanup-summary.md`.
* Updated `CODEX_WORKFLOW.md` with merged engineering rules and removed dependency on legacy root AI docs as required reading.
* Updated architecture and inventory decision docs with merged legacy decisions and migration rationale.
* Updated `CURRENT_STATE.md` and `CURRENT_MODULES.md` with documentation cleanup state.
* Created `docs/archive/` and moved ARCHIVE documents:
  `docs/PROJECT_OVERVIEW.md` -> `docs/archive/PROJECT_OVERVIEW.md`;
  `docs/architecture/REFACTOR_MASTER_PLAN.md` -> `docs/archive/REFACTOR_MASTER_PLAN.md`.
* Deleted only documents classified as DELETE:
  `docs/modules/COMPONENTS.md`;
  `docs/modules/INVENTORY.md`;
  `docs/modules/YARD.md`.

Notes:

* Documentation-only task; no application code, database, or schema changes were made.

## 2026-06-11 Documentation Refactor

Completed:

* Normalized `docs/ai-state` structure with `audits/`, `design/`, `modules/`, and `decisions/` directories.
* Moved module docs into the normalized module directory:
  `MODULE_PRODUCTION.md` -> `modules/production.md`;
  `MODULE_QC.md` -> `modules/qc.md`;
  `MODULE_SUPPLIERS.md` -> `modules/suppliers.md`;
  `MODULE_SYSTEM.md` -> `modules/system.md`.
* Created `CURRENT_STATE.md` summarizing Inventory, Production, QC, Yard, Suppliers, Projects, Dashboard, and System by status, architecture, limitations, and current focus.
* Created decision docs:
  `decisions/architecture-decisions.md`;
  `decisions/inventory-decisions.md`;
  `decisions/production-decisions.md`.
* Created missing module docs:
  `modules/yard.md`;
  `modules/projects.md`;
  `modules/dashboard.md`.
* Updated `CODEX_WORKFLOW.md` to require reading `PROJECT_STATUS.md`, `CURRENT_STATE.md`, `NEXT_TASKS.md`, related module docs, using Semble before grep, using Context7 before framework changes, building before completion, and updating ai-state docs after workflow changes.
* Created `audits/documentation-audit.md` with missing, outdated, duplicate, and recommended cleanup notes.

Notes:

* Documentation-only task; no application code, database, or schema changes were made.

## 2026-06-11

Completed:

* Updated Inventory transfer creation:
  transfer source/destination locations are now limited to `Kho chính` and exclude production warehouse locations;
  selecting a material source location now keeps the real `fromZoneId` for the transaction while using the selected `zone/slot/level` row to auto-fill source cell and level;
  destination warehouse selection now suggests and fills the first available destination cell/level;
  removed the old transfer flow diagram panel and replaced it with separate source and destination 2D warehouse location views matching the outbound workflow.
* Fixed a frontend type mismatch in the warehouse location 2D material list by allowing `unitMaster` on generated occupancy rows.
* Improved the Inventory location create/edit modal:
  the parent warehouse selector now clearly shows `Kho chính (MAIN)` and `Kho sản xuất (PRODUCTION)` from real master warehouse data, falls back to warehouse data embedded in zones if the master-data request is empty, and requires a parent warehouse before saving a new location.

Build:

* Frontend build passed.
* Frontend still reports the existing Vite warnings for `.env NODE_ENV=production` and large bundle chunk size.

## 2026-06-07

Completed:

* Fixed Production BOM and production material consumption:
  BOM create now validates requested material quantity plus waste against real available `Kho vật tư SX` stock and blocks over-allocation;
  the BOM modal now shows `Cần / Tồn SX` per selected material and displays shortage warnings before submit;
  backend production stock calculation now counts only transaction lines that belong to the production warehouse and uses signed receipt/return quantities instead of counting main-warehouse transfer lines;
  starting a Manufacturing Order now auto-creates `ISSUED` `ProductionMaterialIssue` rows for missing BOM requirements and creates outbound inventory movements from the production warehouse location so production material stock is reduced;
  `/production/:id/requirements` now uses the corrected production-warehouse balance logic;
  Production start now plans material issues before the MO state update and creates issue rows only after the start transition succeeds, avoiding orphaned production material issues if the start action fails.
* Fixed QC quick pass workflow:
  backend QC completion now accepts `READY` inspections in addition to `IN_PROGRESS` and `REWORK_REQUIRED`, so newly created ready inspections can be marked `PASSED` and approved without getting stuck.
* Upgraded System module detail pages to use richer real runtime data:
  Users now shows real user status, assigned roles, latest activity timestamp/action/module from `ActivityLog`, cockpit KPIs, filters, table, and detail panel;
  Roles now shows real roles, user counts, permission counts, and a permission matrix derived from persisted `Permission` records;
  System Logs now shows real `ActivityLog` rows, action/module summaries, activity trend, filters, and a cockpit table.
* Added backend System support endpoints:
  `GET /system/role-matrix`;
  `GET /system/activity-summary`;
  `GET /system/notifications`.
* Rebuilt the main Dashboard/Tổng quan as an Inventory-style dark cockpit backed by `GET /dashboard/cockpit`, aggregating real Projects, Production Orders, Components, Inventory transactions/items, Yard activity, QC open work, Activity Logs, and Notifications.
* Rebuilt the Notifications/Thông báo page to read persisted `notifications` records through `/system/notifications`, with unread/priority/read filters and a selected-notification detail workspace.
* Registered the active `/notifications` route in the main app router.

Modified:

* Dashboard frontend API contract.
* System frontend API contract.
* Users, Roles, System Logs, Dashboard, and Notifications frontend pages.
* Dashboard backend controller.
* System backend controller.

Build:

* Backend build passed.
* Frontend build passed.
* Frontend still reports the existing Vite warnings for `.env NODE_ENV=production` and large bundle chunk size.

## 2026-06-06

Completed:

* Removed orphan warehouse-like zones `ST-WH-RAW` and `ST-WH-FAB` from the current database and added migration `20260606093000_remove_orphan_st_wh_zones` so they are not retained as usable or hidden locations.
* Updated the operational sample-data seeder to stop recreating `ST-WH-RAW` and `ST-WH-FAB`.
* Simplified Inventory navigation:
  removed the horizontal in-page Inventory tab strip;
  Inventory tab switching is now handled from the sidebar;
  Inventory actions `Nhập kho`, `Xuất kho`, and `Khác` now render in the global topbar on Inventory routes.
* Added persisted sidebar hide/show behavior to increase available workspace width.
* Aligned the Stock tab free-text search field with the surrounding filters.
* Frontend and backend builds pass.

## 2026-06-03

Completed:

* Completed Inventory Sprint B - Warehouse Locations:
  added Inventory tab `/inventory/locations` labeled `Vị trí kho`;
  extended `WarehouseZone` with `row`, `column`, `level`, and `capacity` fields while preserving `code`, `name`, and `active`;
  added migration `20260605063000_inventory_warehouse_location_fields` and applied it to the local database;
  expanded `GET /inventory/zones` with material count and total stock quantity statistics;
  added `GET /inventory/zones/:id` detail data with stored materials and recent transaction lines;
  added create, edit, activate, deactivate, and soft-delete APIs for warehouse locations;
  added frontend location management workspace with KPI strip, filters, location table, current `warehouse_zones` audit panel, create/edit modal, and detail drawer;
  added sidebar and Inventory tab navigation for `Vị trí kho`;
  preserved the requested boundary: no Redis, caching, performance optimization, or 2D warehouse map UI in this sprint.
* Audited current `warehouse_zones` after the clean workflow reset:
  demo records are `DEMO-WH-FAB` and `DEMO-WH-RAW`;
  warehouse-like records are `ST-WH-FAB` and `ST-WH-RAW`;
  real storage locations are `A01`, `A02`, and `B01`.
* Backend and frontend builds pass after Inventory Sprint B. Frontend still reports the existing Vite warnings for `.env NODE_ENV=production` and large bundle chunk size.
* Added Material Master v1 usage classification:
  added Prisma enum `MaterialUsageType` with `PRIMARY`, `SECONDARY`, and `CONSUMABLE`;
  added `InventoryItem.materialUsageType` with default `PRIMARY` and applied migration `20260604214339_add_material_usage_type`;
  updated Inventory item create/update/list/detail/audit flows to persist and return usage type plus clearer zone code/name fields;
  changed the MaterialDrawer `Loại vật tư` field to Vietnamese usage options `Vật tư chính`, `Vật tư phụ`, `Vật tư tiêu hao`;
  renamed the old technical type selector to `Quy cách / nhóm kỹ thuật`;
  added default warehouse zone selection to the MaterialDrawer;
  added `Loại vật tư` columns to Inventory Overview, Stock list, and Stock full-list modal;
  updated the material detail popup to show `Loại vật tư`.
* Reworked the MaterialDrawer create/edit form to match the Inventory inbound modal layout with two-column fields, summary boxes, a business note panel, full-width description, and clearer footer actions.
* Fixed material deletion by adding soft delete:
  added `InventoryItem.deletedAt` and migration `20260604224726_inventory_item_soft_delete`;
  changed Inventory repository delete to mark records deleted instead of hard-deleting rows referenced by transactions/BOM/history;
  active Inventory item queries now hide deleted materials while preserving old operational history.
* Fixed Material Detail supplier tab:
  renamed supplier column `Tổng nhập` to `Đơn giá nhập`;
  changed the displayed value to inbound unit price with average cost fallback.
* Fixed Inventory outbound material location dropdown:
  material detail now falls back to the material default zone when legacy transaction lines have stock but no zone;
  outbound modal now builds selectable source locations from balances and falls back to the material default zone/current stock when no balance rows are returned.
* Replaced secondary frontend static fallback panels with API-backed runtime data:
  Analytics charts now read Inventory transactions, Production orders, and Yard metrics.
  Notifications and Command Center alerts now read Analytics Engine alerts.
  Digital Twin machine map and heatmap now read Production machines and Yard metrics.
  Smart Search now indexes Inventory materials, Components, and Yard slots from APIs.
  Material Movements now reads real Inventory transaction items.
* Removed unused secondary operational/static data files and unused random Yard grid components.
* Cleared the lightweight Inventory Zustand store seed so it no longer injects a fake realtime transaction.
* Removed legacy unprefixed inventory material records `HB200`, `HB250`, `I200`, `PL12`, and `PL20` from the current database after confirming they had no transaction, return, BOM, or production issue references.
* Deleted the dangerous `reset-inventory-phase2-demo.ts` script so it cannot wipe operational inventory history and reseed demo data.
* Replaced active frontend `mock-data` folders for Analytics, Digital Twin, Notifications, and AI Assistant with `operational-data` folders.
* Updated remaining active hardcoded sample identifiers such as `Beam H400`, `CK-220`, and `MC-02` to operational `ST-*` identifiers.
* Replaced backend Simulation `DEMO-*` seed/scenario data with operational SteelTrack `ST-*` data for Inventory, Components, Production, QC, Yard, Projects, Suppliers, workers, cranes, and analytics.
* Ran the operational sample data bootstrap against the current database with reset enabled.
* Verified the current database has zero `DEMO` records in the main Inventory, Components, Production, and Yard tables checked.
* Separated Components production material warehouse UI from main Inventory stock by deriving visible stock from issued Production Material Issue records.
* Added source location selection to the Inventory outbound modal and dedicated Inventory > Outbound tab; outbound transactions now carry the selected `zoneId` and block export quantities that exceed the chosen location balance.
* Linked Inventory outbound transactions tagged `[COMPONENT_PRODUCTION]` into Components > Production Material Stock so "Xuất sản xuất cấu kiện" appears in the production material warehouse view.
* Preserved scroll position and expanded-group state in both runtime sidebars so sidebar clicks no longer jump back to the top.
* Locked project selection when Inventory outbound target is "Xuất sản xuất cấu kiện" so component-production issues cannot be mixed with project outbound.
* Made Inventory > Materials stock rows clickable and mapped audit rows correctly into the material drawer for view/edit.
* Added Components list delete action backed by the existing Components DELETE API.
* Added Components production material stock detail popup and a "return to main warehouse" action tagged `[COMPONENT_PRODUCTION_RETURN]`.
* Changed Production BOM material selection and Production requirements availability to use production-material warehouse stock from `[COMPONENT_PRODUCTION]` transactions instead of main Inventory stock; production material issues now reduce available SX material balance.
* Replaced Components stock and transfer tabs with runtime data from Components and Yard placements/movements so component positions match the Yard.
* Kept the Production "stage to yard" panel visible when all stages are completed, even before the order status query refreshes.
* Split Yard overview into a dashboard-style cockpit instead of reusing the full 2D spatial map tab.
* Added Yard overview panels for spatial preview, zone utilization, component distribution, inbound/outbound queues, recent activity, and overload alerts.
* Removed the reference image background from Yard 2D map, added 2D zoom controls, and changed zone clicks to update side charts instead of opening a popup.
* Added Yard zone edit/delete controls in the 2D zone cards and a guarded backend `DELETE /yard/zones/:id` endpoint that only deletes empty zones.
* Adjusted Yard 3D slot layout to scale dynamically so configured zones/slots fit inside the visible floor.
* Restricted Yard inbound workflow to completed `READY` components that are not already placed in the Yard.
* Added sidebar scroll reset when changing module routes or hash tabs.
* Removed the sidebar route/hash scroll reset after it caused sidebar clicks to jump back to the top.
* Removed the unused frontend inventory mock data file.
* Removed the unused frontend Yard mock slots file.
* Hardened sidebar click behavior again by restoring scroll with layout effect, keeping the app shell height locked to the viewport, and blurring sidebar links on focus/mousedown so the browser does not scroll the active menu item into view.
* Split Inventory > Materials stock row click from edit behavior: clicking a material now opens a read-only material detail popup, while "Sửa" opens the material drawer and "Thêm vật tư mới" stays as the create drawer.
* Added a Components production order popup so clicking a production row shows current status, active stage, dates, and routing stage progress.
* Changed Components stock to derive inventory only from completed production orders that also have a Yard placement; stock rows now show Yard zone/slot, BOM-derived material cost estimate, total amount, and a button that focuses the exact Yard position.
* Added production-material warehouse return form with return time, quantity, and note; material detail popup now shows recent issue/return history tagged with component-production markers.
* Added Yard focus handoff from Components stock into Yard 2D map, with the selected slot highlighted and surrounding placements dimmed.
* Added explicit zone detail popup buttons in Yard 2D zones and stronger selected-zone visual styling.
* Added clickable component detail cards inside the Yard zone detail popup with an "Xuất bãi" action that exports from the known current placement without asking the user to reselect a position.
* Enlarged Yard 3D crane GLB scale so the cranes render closer to zone size.
* Fixed Production-to-Yard staging rules in both Production MO popup and Yard inbound workflow:
  slots now remain selectable when they already contain lower stack levels as long as `currentStackLevel < maxStackLevel`;
  the next stack level is derived automatically instead of manually entered;
  inbound quantity is capped by completed MO quantity minus active Yard placements;
  Yard inbound now stages from completed MOs through the production `stage-to-yard` API instead of creating unlimited direct placements.
* Fixed another sidebar jump source by moving the AppSidebar scroll ref from the header to the actual scrollable menu area and persisting AppSidebar group open state.
* Completed Supplier Phase S1 Supplier Master Cockpit:
  replaced the simple CRUD supplier page with KPI strip, filter bar, main supplier table, right insight panel, and slide-over detail workspace;
  added supplier detail tabs for Overview, Materials, Inbound History, Ratings, and Files;
  added backend supplier cockpit summary/detail endpoints that derive inventory usage, inbound history, material history, and supplier-score ratings without schema changes;
  retained existing Supplier CRUD and `/suppliers` route without adding Procurement, Purchase Order, Contract, or Approval Workflow scope.
* Added two top-level Supplier module tabs matching the requested reference:
  `Danh sách nhà cung cấp` and `Đánh giá nhà cung cấp`;
  added `GET /suppliers/cockpit/evaluations` to connect Supplier Master, SupplierScore, and Inventory usage;
  added evaluation KPI strip, filters, evaluation table, selected supplier score detail panel, score trend, supplier classification, and recent evaluation cards.
* Built Projects/Công trình operational cockpit from real linked data:
  replaced the static Projects card page with five tabs: Tổng quan, Danh sách công trình, Tiến độ công trình, Vật tư theo công trình, and Báo cáo công trình;
  changed `/projects/runtime` from hardcoded project samples to data derived from Project, Component, ProductionOrder, and InventoryTransaction;
  added project KPI strips, filters, main project table, progress views, material-by-project table, report panels, and project detail popup.
* Removed a stray `production.service.ts` code fragment outside any method so backend build can pass.
* Built QC/Chất lượng operational cockpit:
  replaced the active `/qc` page with seven tabs: Tổng quan, Phiếu kiểm tra, Kế hoạch QC, Tiêu chuẩn, Không phù hợp (NCR), Hiệu chuẩn thiết bị, and Báo cáo;
  added `GET /qc/cockpit` to connect QC inspections, checklists, NCR, completed Production Orders, Components, and Projects;
  added QC KPI strip, filters, inspection table, latest inspection detail, production queue waiting for QC, checklist cards, NCR table, calibration placeholders, and report panels;
  added inspection detail and completed-MO popups so QC can create inspections and mark production/component checks as passed or rework-required;
  enforced the Yard staging gate in Production so a completed MO/component can only be staged to Yard after a linked QC inspection is `PASSED` or `APPROVED`;
  removed unused QC stub/static frontend files that could be confused with active data.
* Added operational workflow verification before System Settings work:
  added `GET /runtime/operational-workflow` to verify Supplier inbound, main Inventory stock, Project outbound, Production material outbound/return, BOM/MO, QC gate, Yard staging, Yard outbound, project return, and QC failure readiness from real database records;
  hardened Inventory outbound validation so server-side stock checks can enforce selected `zoneId` location balance, not only total item balance;
  backfilled 9 historical QC release records for active Yard component placements that existed before the QC gate was added, using current Yard placement and completed Production Order history;
  verified the current DB after backfill: supplier inbound 8, inventory items 8, project outbound 5, production outbound 4, production returns 3, BOMs 7, production orders 12, completed orders 10, approved QC 9, active Yard placements 23, removed Yard placements 15, staged components without QC 0.
* Built System cockpit foundation without adding schema duplicates:
  added `GET /system/overview`, `GET /system/users`, `GET /system/roles`, and `GET /system/activity-logs` using existing User, Role, Permission, ActivityLog, Inventory, Supplier, Project, Component, QC, and Yard tables;
  replaced Settings page with tabs matching the requested reference: Tổng quan, Cấu hình chung, Phân quyền, Danh mục, Tích hợp, Thông báo, Sao lưu & Phục hồi, and Nhật ký cấu hình;
  added workflow health panel inside Settings so the material-to-yard operational chain is visible as OK/WARN/BLOCKED;
  replaced Users, Roles, and System Logs pages with API-backed cockpit layouts and added active routes/sidebar entries for `/settings`, `/users`, `/roles`, and `/system-logs`.
* Optimized Inventory/Vật tư kho UI consistency:
  updated shared Inventory module shell, tab bar, KPI cards, section header, and runtime panels to a macOS-style glass surface with tighter typography, lighter shadows, and cleaner spacing;
  added shared Inventory visual components for KPI cards, glass panels, horizontal bar charts, mini bar charts, and consistent inputs;
  rebuilt Inventory > Tồn kho KPI/filter/table/insight panels with the new visual system, added smarter stock distribution, top inventory value, and stock health charts;
  changed the material detail popup to the same glass theme and kept row click as read-only detail while the `Sửa vật tư` action opens the edit form;
  rebuilt the material create/edit drawer in Vietnamese with the same Inventory glass visual language so editing from Tồn kho no longer feels like a different page;
  rebuilt Inventory > Audit with Vietnamese labels, macOS-style table, KPI strip, top value chart, and stock distribution mini chart;
  normalized active secondary Inventory tab panels/tables for Nhập kho, Xuất kho, Điều chuyển, Kiểm kê, Lịch sử giao dịch, and Cảnh báo tồn kho to the same glass surface treatment.
* Completed an additional Inventory dark cockpit cleanup pass:
  removed remaining light-mode/white surfaces from the Inventory module shell, tab bar, material drawer, material detail popup, Inventory > Tồn kho table, "Xem tất cả" modal, and secondary Inventory tabs;
  added a shared donut summary chart for professional stock-health composition and wired it into Inventory > Tồn kho alongside top value, location distribution, and stock rhythm visuals;
  kept add/edit material actions on the same Vietnamese cockpit drawer as the overview so Tồn kho no longer opens a mismatched material form.
* Completed Inventory Foundation Phase A UI consolidation:
  removed the duplicate create-material form and handler from Inventory Overview;
  wired the Overview "Thêm vật tư mới" action to the shared `MaterialDrawer`;
  preserved the no-schema/no-migration boundary for Phase A and did not touch the Supplier module;
  refreshed the app sidebar dark theme and active child-tab styling, including hash-aware active matching for submenu tabs.
* Completed Sprint A.5 Inventory cleanup:
  removed inbound, outbound, transfer, and stock-take modal forms from Inventory Overview;
  removed Overview transaction modal state and submit handlers;
  changed Overview quick actions to navigate to dedicated Inventory transaction pages while keeping MaterialDrawer and material detail in Overview;
  did not modify Inventory transaction pages or backend code.
* Refined Inventory > Tồn kho analytics:
  stock table pagination now defaults to a bottom-left `Hiển thị 1-10/xxx kết quả` label with centered clickable page numbers;
  warehouse/location stock distribution uses a donut chart;
  added a monthly stock movement trend chart from Inventory transactions;
  removed the older stock-health and stock-rhythm charts;
  rewired stock alerts from current stock/minimum stock thresholds;
  added a bottom quick-stat strip for today's inbound, outbound, transfer, current-month stock-take, and stock variance indicators.
* Standardized Inventory tab visuals using the Stock tab as the baseline:
  promoted shared Inventory panel/KPI/insight/pagination/table primitives;
  widened and spaced the Stock table/chart layout so analytics blocks no longer stick together;
  applied the same shell, KPI, filter, table, side-panel, and pagination treatment to Overview, Inbound, Outbound, Transfer, Stock Take, Transactions, Alerts, and Audit tabs;
  reworked the Overview main screen so its KPI strip, stock table, recent inbound/outbound lists, warehouse filter, and buttons match the rest of the Inventory cockpit;
  removed local duplicate KPI/insight helper components from the normalized tabs without changing backend, API, Prisma, or mutation logic.

Modified:

* Analytics chart data sources.
* Notifications and Command Center alert data sources.
* Digital Twin runtime panels.
* AI Assistant smart-search source.
* Material Movements backend service and frontend API client.
* Frontend operational static datasets for Analytics, Digital Twin, Notifications, and AI Assistant.
* Inventory transaction modal placeholder and lightweight runtime store seed.
* Production work-order and work-center static panels.
* Backend material movements static fallback records.
* Simulation operational sample data seeder.
* Simulation scenario runner.
* Simulation module provider wiring.
* Components material stock workspace.
* Components stock, transfer, and list workspaces.
* Production BOM modal and material requirements endpoint.
* Inventory outbound modal and dedicated outbound tab.
* Yard 2D/3D maps, tab workspace, operation dialog, API client, hooks, and backend zone endpoint.
* Application sidebar behavior.

Notes:

* Added `Danh mục / Đơn vị` management to `Hệ thống > Cài đặt`, reusing the same Inventory category/type/unit APIs used by Material Master.
* Settings now supports create/edit/deactivate for material categories, material type/specification groups, and units of measure, with active Material Master usage counters.
* Settings displays fixed material usage groups `PRIMARY`, `SECONDARY`, and `CONSUMABLE` with linked material counts; dynamic custom usage groups would require a later DB phase.
* Frontend build passes after Settings catalog/unit management.
* Applied compact section headers globally through shared `SectionHeader`, removing the large repeated `SteelTrack ERP` eyebrow and reducing module header height across tabs/modules.
* Expanded route-aware topbar titles for Inventory, Components, Production, Yard, Projects, Suppliers, QC, Logistics, Procurement, Documents, Analytics, Reporting, Notifications, Master Data, AI, Settings, Users, Roles, Logs, and Backup.
* Frontend build passes after the global module header density pass.
* Moved app quick search to the right side of the topbar next to `LIVE` and added route-aware compact module titles on the left, including `Kho vật tư`.
* Removed the duplicate large Inventory Overview header and tightened Inventory KPI/panel/table/recent-transaction spacing for a denser one-screen cockpit layout.
* Inventory Overview stock table stays capped at 10 rows and recent inbound/outbound panels stay capped at 5 transactions with smaller typography.
* Frontend build passes after the shell header and Inventory Overview density pass.
* Rebuilt Inventory master-data workspace for material categories, material type/specification groups, and units of measure with create/edit/deactivate actions and Material Master usage counts.
* Added Inventory unit CRUD on `/inventory/units` while keeping existing schema unchanged.
* Standardized steel-structure dictionary data: 8 active categories, 24 active material type/specification groups, and 14 active units; unused demo/duplicate records were deactivated instead of hard-deleted.
* Production BOM material selection now groups production-warehouse materials by `materialUsageType` and auto-derives BOM item category from the selected material.
* Backend and frontend builds pass after Inventory master-data and BOM grouping changes.
* Fixed Inventory location validation mismatch for material `001`: detail showed stock at default zone `B01` by falling back to `InventoryItem.zoneId`, while backend selected-location validation counted only line/header zone and returned zero for legacy no-zone inbound lines.
* Backend `getCurrentStockAtLocation` now counts legacy no-zone lines for the selected material default zone, matching material detail `locationBalances`.
* Inbound modal now auto-selects the selected material default zone so new normal UI inbound transactions persist a real `zoneId`.
* SQL verification for material `001`: total stock `1,567`, effective stock at `B01` `1,567`, previous strict line/header-zone stock `0`.
* Backend and frontend builds pass after the location validation fix.
* Fixed Inventory outbound and transfer modal submit locking by auto-selecting valid stock source/destination zones from material location balances or material default zone fallback.
* Fixed outbound expected issue value display to calculate from material detail average cost with material list fallback.
* Added outbound validation messages for missing source stock location and quantity exceeding selected source-zone stock.
* Frontend build passes after the Inventory outbound/transfer modal fix.
* Added transfer transaction time and moved MaterialDrawer to a portal with a cleaner modal-style layout.
* Fixed Inventory `Khác` action menu clipping by rendering the dropdown through a portal.
* Refined inbound/outbound modal layout and added side tabs to the shared material detail modal.
* Unified Inventory material detail display between Overview and Stock using a shared material detail modal.
* Improved transaction modal controls so primary create buttons and native select dropdowns are clearer in the dark UI.
* Restored Inventory transaction modal workflow for inbound, outbound, transfer, and stock-take actions from the global action bar.
* Dedicated Inventory transaction tabs now serve as history/analytics pages, while existing form and mutation logic lives in reusable modal components.
* Updated Inventory transaction page layout order to Form -> KPI -> Filter -> Table for inbound, outbound, transfer, and stock-take pages.
* Completed Inventory Global Action Bar: shared right-aligned action bar beside Inventory tabs, route-based transaction actions, and `MaterialDrawer` create action.
* Removed duplicate Inventory Overview quick actions and the Stock tab create-material filter button while preserving specialized transaction forms.
* Backend and frontend builds pass after API-backed fallback replacement.
* Remaining `Math.random` usages in active modules are for generated document/reference suffixes or randomized simulation mode, not seeded fake operational records.
* Frontend Inventory, Components, Production, and Yard surfaces now use runtime/API data for the touched workflows.
* Current database verification: zero legacy unprefixed material records for `HB200`, `HB250`, `I200`, `PL12`, `PL20`; zero `DEMO` records in the checked Inventory, Components, Production, and Yard tables.
* Active frontend module scan no longer finds `mock-data` folders under `apps/frontend/src/modules`; remaining `demo.` strings in the Simulation seeder are retained only to clean old legacy records.
* Current operational bootstrap result: 5 inventory materials, 10 inventory transactions, 12 components, 6 production orders, 6 yard zones, 72 yard slots, 2 QC checklists, 4 workers.
* Production material warehouse now includes real `[COMPONENT_PRODUCTION]` outbound transactions, but still needs a backend balance/receipt model if it must behave as a fully independent warehouse instead of an issued-material view.
* Latest verification: `pnpm -C apps/backend-api build` and `pnpm -C apps/frontend build` pass after Inventory UI optimization. Vite still reports the existing NODE_ENV and large chunk warnings.
* Yard runtime UI now fetches zones separately from slots, so zones can render on Yard Overview and the 2D map even before slot cards are populated.
* Added Yard cockpit create-zone and create-slot modals backed by the existing Yard APIs; new slots are immediately available to the production finished-goods staging dropdown when they have stack capacity.
* Moved Yard 2D zoom controls into the top location toolbar and added `+ Zone`, global `+ Slot`, and per-zone `+ Slot` actions to avoid covering the map canvas.
* Fixed the actual `/yard/slots` 500 error caused by missing `yard_item_placements.stagedQuantity` and `remainingQuantity` columns in the database; migration `20260605050000_add_yard_placement_quantities` has been applied.
* Authenticated verification now returns 75 Yard slots and 73 stack-available slots, so production finished-goods staging can select slots again.
* Production staging now surfaces backend errors inline instead of appearing unresponsive; QC gate failures are translated with the required action.
* Fixed Production-to-Yard remaining quantity calculation to count placements by `metadata.productionOrderId`, not by shared `componentId`.
* Verified successful staging for `MO-20260603-11563` into `ST-YARD-07/07-08/L1`; `/yard/slots` now returns the new placement.
* QC cockpit now includes a fast production-gate workflow: completed MOs can use `Tạo QC` or `Tạo & duyệt đạt`; the fast path creates/reuses an inspection, starts it, completes it as `PASSED`, and approves it.
* Verified QC gate end-to-end for `MO-20260605-36058`: QC inspection `QC-20260605-1780639947783` was approved, then Production staged `CPL-33167708` to `ST-YARD-C/ST-C-03/L2`.
* Database was reset for a clean end-to-end workflow test. Backup saved at `backups/steeltrack_before_clean_workflow_20260605_132345.dump`; reusable script added at `scripts/reset-clean-workflow.sql`.
* Operational data is now clean: inventory materials/transactions, returns, projects, components, BOMs, production orders, QC inspections, yard placements/movements, activity logs and outbox events are zeroed. Master dictionaries, suppliers, QC checklists, yard zones and yard slots were preserved; all yard slots are `AVAILABLE`.
* Frontend and backend builds pass after the Yard zone/slot runtime fix.

## 2026-06-02

Completed:

* Added transaction-driven Inventory runtime and operational workspace.
* Added Components operational pages for structure stock, transfers, internal QC, and fabrication history.
* Added Production BOM foundation, routing, Manufacturing Orders, material issues, and production logs.
* Linked Manufacturing Orders to Components.
* Added production execution actions for starting, completing, and staging finished structures to Yard.
* Replaced Yard demo slots with runtime API data and polling-based operational refresh.
* Applied the production foundation Prisma migration.
* Added real Production BOM creation from Components and Production workspaces.
* Removed embedded BOM material drafting from component creation; components now store only structure master data.
* Required Manufacturing Orders to select a BOM belonging to the selected component.
* Generated Manufacturing Order execution stages from the selected BOM routing.
* Added working BOM clone and archive actions in the Production BOM registry.
* Added Yard operational cockpit with realtime KPI strip, operational tabs, slot drill-down, level occupancy, structure details, crane status, and movement feed.
* Added Yard 2D spatial layout from real zone/slot placements.
* Added top-down React Three Fiber Yard viewer using the supplied crane and structure GLB assets.
* Added Yard submenu navigation for overview, 2D, 3D, inbound, outbound, internal transfer, internal QC, and history.
* Added deterministic Yard cockpit demo data with six operational zones, 72 slots, 12 staged structures, two cranes, stacked placements, and movement history.
* Added legacy Yard slot cleanup during simulation bootstrap so repeated demo bootstraps keep spatial metrics stable.
* Added working Yard inbound, outbound, and internal-transfer operator workflows backed by the existing placement APIs.
* Added a shared industrial Yard workflow dialog with component selection, crane coordination, destination slot suggestion, operational summary, and occupancy preview.
* Replaced the flat Yard slot grid with a color-coded zone cockpit over the supplied Yard reference image.
* Added zone drill-down popup with slot occupancy, horizontal stack-level cross-section, and structure detail list.
* Enlarged the Yard 3D digital twin and rendered structures across the active Yard slots with more visible crane assets.
* Verified Yard placement lifecycle with a real `place -> move -> remove` API smoke test and confirmed source and destination occupancy return to zero.

Modified:

* Sidebar navigation for Components and Production workspaces.
* Production frontend routes and operational pages.
* Production backend controllers, services, repositories, DTOs, and Prisma schema.
* Yard runtime frontend integration.
* AI state documentation structure.

Notes:

* Inventory operational foundation is complete.
* Components is approximately 70% complete.
* Production is approximately 65% complete.
* Yard is approximately 60% complete with configured demo zones, working operator workflows, zone drill-down, and enlarged 3D spatial viewer.
