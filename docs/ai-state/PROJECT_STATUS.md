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
