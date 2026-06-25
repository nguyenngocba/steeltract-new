# Project Status

Inventory       100%
Components       88%
Production       80%
Yard             69%
Projects         58%
Suppliers        55%
Organizations     0%
QC               55%
Logistics         0%
Settings         55%
Dashboard        45%

Percentages represent implemented operational foundations and visible workflows, not final polish.

Inventory Overview historical material existence fix on 2026-06-25 (Sprint 20I.3N) completed. Changed existence check to transaction-based minimum timestamp logic. Recalculated May/June snapshots and deltas, verifying that the forced ▲100% delta notes disappeared. Frontend build passed.

Inventory Overview KPI cards compacted on 2026-06-25 (Sprint 20I.3H) completed. Changed category values from `X mã (Y tấn)` to `X (Y tấn)`. Changed note suffixes from month-specific to `với tháng trước`. Reduced note typography size to `text-[10px]` within `OverviewMetricCard`. Frontend build passed.

Inventory Overview category KPI quantity delta calculations on 2026-06-25 (Sprint 20I.3G) completed. Changed category KPI values to `X mã (Y tấn)` format and configured category delta percentage calculations to be computed from stock quantity in tons rather than item counts. Frontend build passed.

Inventory Overview snapshot numeric verification on 2026-06-25 (Sprint 20I.3F) completed. Selected material VT-NEW-00001 (Thép hình 10mm) and verified its transaction ledger records (IMPORT, EXPORT, TRANSFER, ADJUSTMENT) and stock rollback calculations at previous month, 6 months ago, and 12 months ago with 0 variance. Confirmed that historical value calculation is approximate.

Inventory Overview yearly KPI audit on 2026-06-25 (Sprint 20I.3E) completed. Conducted a complete logic verification of the historical monthly trend snapshots, dynamic data age scale detection, material creation filters, and transaction rollbacks. Verified that no semantic bugs exist and documented the findings.

Inventory Overview monthly historical KPI trends on 2026-06-25 (Sprint 20I.3D) completed. Configured 12-point end-of-month snapshots using transaction ledger rollbacks. Configured sparkline rendering to output real monthly trends when data age is >= 12 months, and flat placeholder lines when it is < 12 months. Added dynamic monthly comparison delta notes with semantic text coloring (emerald/red) indicating positive/negative changes. Frontend and backend builds passed.

Inventory KPI sparklines restore on 2026-06-25 (Sprint 20I.3C) completed. Restored all 8 KPI sparklines and delta percentages using dynamic data age detection and historical snapshot rollbacks. Enabled flat placeholder lines for age < 30 days and real recent/yearly trends for ages >= 30 and >= 365 days. Frontend and backend builds passed.

Inventory KPI semantics fix on 2026-06-25 (Sprint 20I.3B) completed. Corrected material usage cards to display unique material counts. Disabled sparklines for count metrics lacking historical data, and set their delta label fallback to "Chưa có dữ liệu lịch sử". Frontend build passed.

Inventory Overview KPI redesign on 2026-06-25 (Sprint 20I.3) completed. Replaced original 8 cards with Tổng giá trị tồn kho, Tổng khối lượng, Mã vật tư, Sắp hết hàng, Vật tư chính, Vật tư phụ, Vật tư tiêu hao, and Hết hàng. Added tones (indigo, violet, orange) and pulsing loading skeletons. Frontend build passed.

Component UI audit on 2026-06-25 (Sprint 20B.1) completed. Documented file inventory, reusable UI primitives, existing UI and chart patterns, and recommended implementation approaches. Frontend build passed.

Date-time refresh fix on 2026-06-25 did not change module percentages. It standardized frontend `datetime-local` initialization/focus behavior for Inventory transaction modals, Component production material return, and Production MO creation so forms use the current local date/time rather than UTC-derived stale values. Frontend build passed.

Database cleanup on 2026-06-24 did not change module implementation percentages. It backed up the current database to `backups/steeltrack_before_business_data_cleanup_20260624_092729.dump`, executed `scripts/sql/business-data-cleanup-20260624.sql`, and cleared business/runtime data for materials, components, projects, suppliers, vehicles, Inventory transactions/balances, Production BOM/MO/material activity, QC runtime, Yard placements/movements, attachments metadata, analytics/runtime logs, and notifications. Configuration/reference foundations remain in place: users, roles, permissions, categories, material types, units, warehouses, warehouse zones, yard layout, QC checklist templates, workflow definitions, work centers, and machines. Details are in `docs/ai-state/audits/business-data-cleanup-20260624.md`.

Latest Inventory UI polish pass completed on 2026-06-03; follow-up dark cockpit cleanup removed remaining white/light surfaces and added stock-health donut analytics. Inventory Sprint B Warehouse Locations completed on 2026-06-05 with location CRUD, row/column/level/capacity fields, active/soft-delete lifecycle, location stock statistics, and current `warehouse_zones` audit. Operational percentage remains 100%.

Dashboard increased to 45% on 2026-06-07 after replacing the placeholder overview with a real API-backed cockpit using Projects, Production, Components, Inventory, Yard, QC, Activity Logs, and Notifications data. System detail pages remain Settings 55% because mutation workflows for users, roles, settings, audit export, backup execution, and notification read-state are still Phase S2.

Production increased to 78% on 2026-06-12 after Sprint 4 added `ProductionMaterialConsumption`, consume APIs, `CONSUME` material ledger writes, and a Production Cockpit consumption tab for issued/returned/consumed/scrap/remaining quantities.

Components increased to 83% and Production increased to 80% on 2026-06-12 after Sprint 5 added persisted component costing, costing recalculation APIs, material actual cost from production consumption and Inventory average cost, and a Component detail Costing section.

Components increased to 86% and Projects increased to 55% on 2026-06-12 after Sprint 6 added `SHIPPED -> DELIVERED -> INSTALLED` lifecycle APIs, Project Components delivery/install actions, timeline rows, and delivered/installed runtime counters.

Components increased to 88% and Projects increased to 58% on 2026-06-12 after Sprint 7 added install Zone/Axis/Level/Position fields, required install mapping payloads, Project install modal, Project Components install-location columns, Component Detail install location, and runtime mapping fields.

Sprint 8 on 2026-06-12 did not add business workflow percentage. It added read-only Runtime Integrity KPI APIs and documented current reconciliation findings in `docs/ai-state/audits/system-integrity-audit.md`.

Sprint 10A on 2026-06-13 did not add business workflow percentage. It fixed the active Production Material Return path so returned unused issued material is reconciled against consumed/scrap quantities, received back into Main Warehouse, and verified with an issue 10 / consume 8 / scrap 1 / return 1 smoke test.

Sprint 10B on 2026-06-13 did not change module percentages. It connected production completion/component READY workflow to automatic ComponentCosting recalculation and verified `estimatedCost`/`actualCost` update without manual recalculate.

Sprint 10C on 2026-06-13 did not change module percentages. It fixed production reservation allocation to use active exact `inventory_location_stocks` buckets and verified reservation 8 against `A02/L1=10`, `A02/L2=5` with immediate issue success.

Sprint 11 on 2026-06-13 did not change module percentages. It added Component costing material breakdown API/UI and verified planned `VAL-MAT-100` versus actual unplanned `VAL-MAT-002` warning output.

Sprint 11A.2 / 13B.3 on 2026-06-17 did not change module percentages. It consolidated frontend numeric formatting through shared helpers, removed direct `toLocaleString('vi-VN')` / `Intl.NumberFormat` usage from frontend source, and upgraded Material Detail with image gallery readiness plus standardized analytics panels.

Sprint 14A on 2026-06-17 did not change module percentages. It added the shared attachment metadata/filesystem foundation, moved upload storage to `STORAGE_ROOT` or `/data/steeltrack-storage`, added checksum dedupe, and connected Inventory Material Detail image upload/document display to the Attachments backend.

Sprint 14B on 2026-06-18 did not change module percentages. It reused the shared Attachments foundation for Inventory transaction documents, added transaction document categories, transaction storage routing, create-form attachment upload, and a transaction detail attachment tab.

Sprint 14B.4 on 2026-06-18 did not change module percentages. It improved Inventory attachment UX discoverability with transaction/material attachment badges and overview quick panels, without backend, API, storage, database, or workflow changes.

Sprint 14B.5 on 2026-06-19 did not change module percentages. It removed attachment badges from the Inventory Materials list and moved attachment discovery into Material Detail with contextual source classification, without backend, API, storage, database, or workflow changes.

Inventory Transactions UX 2.0 on 2026-06-19 did not change module percentages. It added transaction attachment `Hồ sơ` columns and drawers to the dedicated Nhập kho, Xuất kho, Điều chuyển, and Kiểm kê pages without backend, API, storage, database, or workflow changes.

Sprint 15A on 2026-06-19 did not change module percentages. It fixed Inventory Outbound value reporting by aggregating all item lines in the frontend and computing missing outbound line values in transaction API responses from average inbound cost, with no schema or migration changes.

Sprint 15B on 2026-06-19 did not change module percentages. It fixed Inventory cost integrity at the source by persisting `unitPrice` and `totalAmount` during transaction item creation, repairing direct Production/Material Movement writers, and backfilling historical missing values without schema changes.

Sprint 16A on 2026-06-19 did not change module percentages. It enhanced the Inventory Outbound frontend with row detail drawer, outbound value today KPI, top materials by value, and top projects by outbound value using existing Inventory transaction API data only.

Sprint 16B on 2026-06-19 did not change module percentages. It enhanced the Inventory Transfer frontend with row detail drawer, transfer value KPIs, value-based top materials, top transfer routes, and source/destination location rankings using existing Inventory transaction API data only.

Sprint 16C on 2026-06-20 did not change module percentages. It enhanced the Inventory Inbound frontend with row detail drawer, all-line aggregation, inbound value/supplier KPIs, supplier/material value analytics, price monitoring, and shared filter spacing across Inbound/Outbound/Transfer using existing Inventory transaction API data only.

Sprint 16D on 2026-06-20 did not change module percentages. It enhanced the Inventory Outbound frontend with project consumption analytics, daily/monthly outbound trends, material consumption analytics, outbound-purpose distribution, today/week/month/year financial KPIs, and abnormal consumption alerts using existing Inventory transaction API data only.

Sprint 17A on 2026-06-20 did not change module percentages. It enhanced the Inventory Stock Take frontend with stocktake sessions, session detail drawer, variance KPIs, top variance material/location analytics, and adjustment preview using existing adjustment transaction API data only.

Sprint 17B on 2026-06-20 did not change module percentages. It enhanced the Inventory Locations frontend with occupancy/free/occupied slot KPIs, inventory value by location, top occupied slots with drill-down material list, and transfer movement route analytics using existing zone, audit, and transaction API data only.

Sprint 17E on 2026-06-20 did not change module percentages. It hardened Inventory document numbering by replacing `count() + 1` generation with max-suffix generation, enforcing backend-owned matching `code` / `transactionNo`, adding duplicate retry on `P2002`, and adding a diagnostic SQL report for historical mismatches.

Sprint 17F on 2026-06-20 did not change module percentages. It changed Inventory stock health presentation so Overview, Materials, and Material Detail separate `Kho chính`, `Kho SX`, and total stock; low/out-of-stock status now uses `MAIN` stock only, with frontend build passing and no backend/schema changes.

Sprint 18A on 2026-06-20 did not change module percentages. It refactored Production Cockpit UI toward the Inventory operational theme with Inventory-style KPI cards, filter bar, analytics panels, Production Orders progress/readiness/delay grid, and shared detail drawers for Production Orders, BOM detail, and Material Issues. A follow-up pass extended the same treatment to Production BOM, Reservations, Material Ledger, Material Issues, Consumptions, and Logs; frontend build passed with no backend/schema/workflow changes.

Sprint 18B on 2026-06-20 did not change module percentages. It refactored Components List into a Component Management Cockpit with Inventory-style KPI strip, operational component grid, shared detail drawer, and analytics panels. The initial material-readiness fallback was superseded by Sprint 18C; frontend build passed with no backend/schema/workflow changes.

Sprint 18C on 2026-06-20 did not change module percentages. It audited Component/BOM/Material Issue data relationships, documented the mapping in `docs/ai-state/audits/bom-intelligence-audit.md`, and replaced the Component Cockpit material-readiness fallback with a real frontend helper using BOM required quantity and Production Material Issue net issued quantity. Frontend build passed with no backend/schema/workflow changes.

Sprint 18D on 2026-06-20 did not change module percentages. It refactored `/production/orders` into a Work Order Cockpit with KPI strip, Material Ready integration from Sprint 18C, Inventory-style grid, drawer sections, and analytics panels. `READY TO RELEASE` is UI-only, and material value ranking uses required quantity as a proxy because current responses do not expose unit material cost. Frontend build passed with no backend/schema/workflow changes.

Sprint 18E on 2026-06-20 did not change module percentages. It refactored `/production/material-issues` into a Production Material Control Center with issue KPIs, Inventory-style grid, BOM/Issue readiness calculations, drawer sections, and analytics panels. Material issue value remains unavailable because current issue responses do not expose unit material cost or line total. Frontend build passed with no backend/schema/workflow changes.

Sprint 19A on 2026-06-22 did not change module percentages. It added `/production/warehouse` as a Production Warehouse Cockpit for `PRODUCTION` warehouse balances, with production-stock KPIs, material grid, shortage/readiness analytics, WO consumption analytics, and Production Zone / Slot / Level detail using existing Inventory and Production data only. Frontend build passed with no backend/schema/workflow changes.

Sprint 19B on 2026-06-22 did not change module percentages. It added `/production/execution` as a Production Execution Board Kanban with stage columns, Work Order cards, bottleneck analytics, delay detection, material readiness integration, and Work Order drawer sections using existing Production data only. Frontend build passed with no backend/schema/workflow changes.

Sprint 19C on 2026-06-22 did not change module percentages. It created `docs/ai-state/audits/mes-data-audit.md` and concluded that current MES data is stronger for Costing than deeper Shopfloor development. Production has partial shopfloor foundations (`ProductionStage`, `ProductionTask`, `ProductionLog`, `WorkCenter`, `Machine`), but lacks canonical immutable stage transition history, runtime/downtime capture, production-line queues, and labor/machine rate data. The next recommended sequence is 20A Costing Engine, 20B Component Cost Analysis, and 20C Project Cost Control.

Sprint 20A on 2026-06-22 did not change module percentages because it added backend read models rather than a new visible workflow. It added a read-only Costing Engine module with `GET /production/orders/:id/cost`, `GET /components/:id/cost`, and `GET /projects/:id/cost`. Material cost uses actual Production Material Issue inventory transaction valuation when available and falls back to weighted average Inventory cost. Three real Work Orders were verified against SQL issue transaction valuation with 0% variance. No Prisma schema change or migration was introduced.

Sprint 20A.5 on 2026-06-23 did not change module percentages. It backed up the database to `backups/steeltrack_before_sprint20a5_20260623_082210.dump`, added a transactional purge SQL script, and added a runnable Prisma demo seeder. The seeded `DEMO20A5-*` dataset creates 20 suppliers, 20 projects, 20 inventory items, 20 components, 20 BOMs, 20 production work orders, inventory stock/movement data, production reservations/issues/consumptions/ledger rows, and component costing for all components. Verification confirmed 20/20 components have costing and 20/20 work orders have full material readiness. Backend and frontend builds passed with no schema/API/migration change.

Sprint 19D on 2026-06-22 did not change module percentages. It refactored Inventory Adjustments to match the Inbound/Outbound/Transfer UX pattern, removed the inline Quick Adjustment Wizard, added a `+ Điều chỉnh tồn kho` modal, moved adjustment history into the primary table flow, added row detail drawer, KPI strip, and analytics panels. No backend, API, schema, migration, or workflow change was introduced.

Sprint 19E on 2026-06-22 did not change module percentages. It unified Inventory Adjustment with the wider Inventory workspace by adding the sidebar tab, opening the adjustment modal directly from Global Actions, moving creation into shared `AdjustmentTransactionModal`, using Material Detail `locationBalances` for exact bucket System Qty, adding a location table and `WarehouseMiniMap`, and preserving attachments/reason presets. Frontend build passed with no backend/API/schema/migration change.
