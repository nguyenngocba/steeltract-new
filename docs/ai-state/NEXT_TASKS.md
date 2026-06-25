# Next Tasks

Current dataset note:

- The real/demo business data was cleaned on 2026-06-24. Operators should recreate materials, suppliers, projects, components, BOMs, production orders, QC records, yard placements, and transport records manually before workflow validation. Reference/configuration data remains available; see `docs/ai-state/audits/business-data-cleanup-20260624.md`.
- Date-time inputs in active Inventory transaction forms, Component production material return, and Production MO creation now refresh to current local time when opened/focused. Continue watching other future transaction forms for ad-hoc UTC `datetime-local` formatting.

Inventory foundation order locked after Material Master, Inventory Transactions, and Warehouse Locations:

1. Warehouse Structure Cleanup:
   normalize `warehouse_zones` into real storage locations, separate warehouse-like/demo records from usable locations, and keep CRUD behavior consistent before any map work.
2. Performance Sprint:
   reduce frontend polling, add required indexes, and replace location statistics with transaction-driven location balance or a persisted balance model.
   Use `docs/ai-state/audits/system-integrity-audit.md` before any balance backfill.
3. Warehouse 2D Map:
   next step is to turn the current read/select 2D slot-level map into a fuller warehouse workspace after row/column/level/capacity data and location balances are stable. Drag-drop and 3D remain out of scope.
4. Supplier:
   continue Supplier Phase S2 after Inventory location and balance foundation is stable.
5. Purchasing:
   start purchasing only after Supplier-Material mapping and Inventory receiving/location rules are stable.

Backlog after the locked order:

6. Replace the derived production-material warehouse view with a persisted balance/receipt ledger so returns, BOM reservations, and material issues are all auditable independently from main Inventory.
7. Add a persisted slot-level balance ledger so `zoneId + slotId + level` can be reconciled from transaction history instead of relying only on Material Master default location metadata.
8. Continue Inventory technical cleanup by extracting the remaining local modal/table helpers into shared Inventory visual components and replacing frontend-generated inventory document numbers with backend deterministic sequences.
8a. Complete Material Master non-photo document upload controls for datasheets, CO, CQ, and catalogs. Inventory Transaction attachments are now available for active transaction forms, transaction detail view, and dedicated Nhập/Xuất/Điều chuyển/Kiểm kê list drawers; Sprint 14B.5 keeps material-list UX clean and surfaces attachment context inside Material Detail.
8b. Monitor Inventory transaction valuation consistency after Sprint 15B backfill. New operational transaction items should persist `unitPrice` and `totalAmount`; future reconciliation work should focus on stock ledger rebuilding, not missing valuation fields.
8c. Continue Inventory Outbound UX refinement after Sprint 16A by validating operator feedback on the new detail drawer and value-based project/material analytics before extracting remaining local helpers.
8d. Continue Inventory Transfer UX refinement after Sprint 16B by validating route/source/destination analytics against real operator transfer patterns before extracting shared transaction-detail helpers.
8e. Continue Inventory Inbound UX refinement after Sprint 16C by validating supplier/value analytics and price-monitoring results against real purchase/receiving data before extracting shared transaction-detail helpers.
8f. Continue Inventory Outbound analytics review after Sprint 16D by validating project consumption, outbound purpose classification, and abnormal-consumption thresholds against real operational export patterns.
8g. Continue Inventory Stock Take review after Sprint 17A by validating whether adjustment transaction payloads expose real `SystemQty` / `ActualQty`; current UI uses existing fields when present and falls back to variance-only display when they are absent.
8h. Continue Inventory Locations review after Sprint 17B by validating slot occupancy/value analytics against real average-cost data and planning a formal slot-level value ledger if operators need auditable historical location valuation.
8i. Validate Sprint 17F main-warehouse stock status against real purchasing data. Stock alerts now use `MAIN` balances only; follow-up should ensure all active material rows expose reliable `locationBalances` with warehouse code/name metadata.
8j. Validate Sprint 19E adjustment workflow with operators. New adjustment creation uses exact Material Detail `locationBalances` and stores System Qty / Actual Qty audit context in transaction `note`; follow-up should decide whether these audit fields need first-class backend columns instead of metadata.
9. Extend Production Material Issue and Consumption workflows with manual approval controls, issue/return document headers, adjust postings, and richer consumption entry UX. Sprint 10A fixed the active return reconciliation path; this backlog item is for approval/document UX, not the basic return balance equation.
9a. Review Sprint 18 Production UI with operators. Production Cockpit and the main Production tabs now match the Inventory theme more closely; remaining work should focus on extracting repeated local table/detail helpers only after the new presentation is accepted.
9b. Review Sprint 18B/18C Component Management Cockpit with operators. The Components List now follows the Inventory cockpit theme and material readiness is calculated from BOM required quantity versus Production Material Issue net issued quantity; follow-up should decide whether to centralize this aggregation in a backend readiness API.
9c. Review Sprint 18D Work Order Cockpit with operators. `READY TO RELEASE` is currently UI-only; follow-up should decide whether release workflow should be blocked below 100% readiness and whether Work Order APIs should expose true material value/unit cost.
9d. Review Sprint 18E Material Issue Dashboard with operators. Material Issue readiness is computed from existing BOM/Issue data in the frontend; follow-up should decide whether Material Issue APIs should expose unit cost/line value and whether issue/return documents need approval headers.
9e. Review Sprint 19A Production Warehouse Cockpit with operators. The cockpit uses existing Inventory location balances plus reservation/order data; follow-up should decide whether a persisted production warehouse ledger is needed for auditable receipt/reserve/issue/return history.
9f. Review Sprint 19B Production Execution Board with shopfloor operators. The board currently uses available stage/status data with UI fallback mapping; follow-up should decide whether backend should expose canonical work-center stage queues and TV-mode preferences.
9g. Sprint 19C MES Data Audit recommends Costing before deeper Shopfloor work. Shopfloor foundations exist, but immutable stage transition history, actual runtime/downtime, production-line queues, and labor/machine rate data are not canonical enough for the next major track.
10. Review Sprint 20A Costing Engine with seeded and real cost data. Sprint 20A.5 now provides a runnable `DEMO20A5-*` demo dataset with 20/20 component costing and 20/20 full-readiness work orders; use it for dashboard/costing QA, then validate against real operator data.
11. 20B Component Cost Analysis: expose component-level estimated/actual/variance analysis with drill-down by BOM material, consumed/scrap quantity, issue transaction cost source, and persisted ComponentCosting comparison.
12. 20C Project Cost Control: roll component costing and project inventory transaction values into project-level cost control, budget variance, project material budgets, and project cost summaries.
13. Backfill or reconcile legacy Production Material Ledger gaps for issue rows that predate ledger automation or came from non-ledger issue paths.
14. Add formal Yard outbound/shipment, project receiving, and installation certificate documents on top of the current `SHIPPED -> DELIVERED -> INSTALLED` component status workflow and text-based install mapping.
15. Add Yard shipment staging, richer crane telemetry, realtime movement animation, and full zone/slot CRUD screens.
16. Projects Phase S2: add persisted project contract fields, milestones, project material budgets, planned/actual schedule baselines, and project document/photo attachments.
17. QC Phase S2: add full checklist result entry, inspector assignment, NCR lifecycle, evidence attachments, calibration records, QC dashboards by project/component, and persisted QC release certificate before Yard shipment.
18. System Phase S2: add editable persisted system settings, user create/edit/lock/password reset, role permission mutation APIs, notification mark-read APIs, audit export, backup job execution, and configuration change approval.
19. Dashboard Phase S2: add persisted dashboard preferences, deeper drill-through links, and formal notification/action mutation flows after System mutation APIs exist.
20. Build Organizations operational foundation.
21. Build Logistics operational foundation.
22. Move remaining non-inventory frontend-suggested document numbers fully backend-side. Sprint 17E made Inventory transaction numbering backend-owned with `PREFIX-YYMMDD-00001`, max-suffix generation, and `P2002` retry; the follow-up is a formal backend sequence/locking API for other modules and review of historical Inventory `code <> transactionNo` rows.
23. Clean up legacy frontend auth/router files after confirming no imports remain, so future auth work only uses the active shared auth store and guarded router.
