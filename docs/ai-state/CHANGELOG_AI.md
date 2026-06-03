# SteelTrack AI Changelog

## 2026-06-03

Completed:

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

* Backend and frontend builds pass after API-backed fallback replacement.
* Remaining `Math.random` usages in active modules are for generated document/reference suffixes or randomized simulation mode, not seeded fake operational records.
* Frontend Inventory, Components, Production, and Yard surfaces now use runtime/API data for the touched workflows.
* Current database verification: zero legacy unprefixed material records for `HB200`, `HB250`, `I200`, `PL12`, `PL20`; zero `DEMO` records in the checked Inventory, Components, Production, and Yard tables.
* Active frontend module scan no longer finds `mock-data` folders under `apps/frontend/src/modules`; remaining `demo.` strings in the Simulation seeder are retained only to clean old legacy records.
* Current operational bootstrap result: 5 inventory materials, 10 inventory transactions, 12 components, 6 production orders, 6 yard zones, 72 yard slots, 2 QC checklists, 4 workers.
* Production material warehouse now includes real `[COMPONENT_PRODUCTION]` outbound transactions, but still needs a backend balance/receipt model if it must behave as a fully independent warehouse instead of an issued-material view.
* Latest verification: `pnpm -C apps/frontend build` passes after the latest UI/runtime changes; previous backend build passed and backend was not changed in the latest batch. Vite still reports the existing NODE_ENV and large chunk warnings.

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
