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
8k. Validate Sprint 20I.3G/H/P/Q/R/S category KPI card enhancements with operators, ensuring format `X (Y tấn)` with styled spans, equal height `h-[108px]`, and ton-based delta values in parentheses (`▲/▼ X% (+Y%)`) match expectations.
8l. Validate Sprint 20I.4F visual rhythm and parity updates of the 5 Inventory Materials dashboard cards and charts, ensuring that they match the Inventory Overview card layout, fixed header height (`h-[64px]`), 12-month historical snapshot engine synchronization (May 2026 snapshot ≈ 7.711.783.211 đ value / ~10.767 tons, June 2026 snapshot ≈ 14.168.720.116 đ value / ~15.542.5 tons), and that cards 1, 2, and 3 are styled at `h-[170px]` with scroll containers for the original chart dimensions without overlapping or clipping.
8m. Validate Sprint 20I.5A Inventory Locations Dashboard redesigned layout, ensuring the 5 chart rows match the specified heights, cockpit theme visual components, and that the slot transfer routes chart is successfully replaced with the zone capacity distribution chart.
8n. Validate Sprint 20I.5B Inventory Locations Dashboard layout polish, ensuring the primary location section occupies the left, right sidebar stacks three charts, horizontal bars are replaced by compact tables, gap/spacing is minimized to `gap-1`/`space-y-1`, and all labels are localized to Vietnamese.
8o. Validate Sprint 20I.5C Inventory Locations Dashboard usability polish, ensuring the Locations list has detailed columns, custom row heights and padding, and rounded status badges, the four analytics cards are enlarged, and the "Xem tất cả" header buttons trigger the full-table modal dialogs with Vietnamese transaction dates.
8p. Validate Sprint 20I.5D Inventory Locations Responsive Workspace, ensuring that all fixed width constraints, max-w-* limits, mx-auto centering wrappers, container classes, and hardcoded column/sidebar widths are removed, the root layout is set to w-full min-w-0 flex-1 space-y-1, the top section is structured as a 12-column grid with Danh sách vị trí kho occupying col-span-12 2xl:col-span-8 and the right sidebar occupying col-span-12 2xl:col-span-4, the bottom analytics section utilizes a 12-column grid with col-span-12 xl:col-span-6 layout for all four cards, and the dashboard dynamically resizes across expanded/collapsed sidebars, laptops, and ultrawide screens.
8q. Validate Sprint 20I.5E Inventory Locations Top 5 Preview, ensuring all 6 analytics cards render top 5 sorted rows in preview mode using dedicated sliced preview memos, while the "Xem tất cả" modals render the full unsliced source memos, with custom DESC/newest-first sorting applied to all.
8r. Validate Sprint 20I.5F Inventory Locations KPI Cockpit, ensuring the 5 cockpit cards display identical styles, WMS cockpit layout, 6-month historical trend sparklines, and dynamic delta notes with correct units and formats.
8s. Validate Sprint 20D.1 Executive Dashboard Implementation, ensuring the redesigned Inventory Overview Page successfully reuses the shared cockpit components (`CockpitKpiCard`, `CockpitChartCard`, `COCKPIT_HEIGHTS`), handles the 4-row layout fluidly across 1440px and ultrawide viewports, renders mock forecasts/donut segments/pulse metrics, and supports all performance gauge visualizations.
9. Extend Production Material Issue and Consumption workflows with manual approval controls, issue/return document headers, adjust postings, and richer consumption entry UX. Sprint 10A fixed the active return reconciliation path; this backlog item is for approval/document UX, not the basic return balance equation.
9a. Review Sprint 18 Production UI with operators. Production Cockpit and the main Production tabs now match the Inventory theme more closely; remaining work should focus on extracting repeated local table/detail helpers only after the new presentation is accepted.
9b. Validate Components Theme Unification on 2026-06-27 (Sprint 20C.8) with operators, ensuring that `ComponentsListPage.tsx` matches the `InventoryMaterialsPage` design system (fluid root layout, gap-1, local `InventoryMetricCard` elements, local `ChartCard` containers, table styling, and creation modal).
9c. Review Sprint 18D Work Order Cockpit with operators. `READY TO RELEASE` is currently UI-only; follow-up should decide whether release workflow should be blocked below 100% readiness and whether Work Order APIs should expose true material value/unit cost.
9d. Review Sprint 18E Material Issue Dashboard with operators. Material Issue readiness is computed from existing BOM/Issue data in the frontend; follow-up should decide whether Material Issue APIs should expose unit cost/line value and whether issue/return documents need approval headers.
9e. Review Sprint 19A Production Warehouse Cockpit with operators. The cockpit uses existing Inventory location balances plus reservation/order data; follow-up should decide whether a persisted production warehouse ledger is needed for auditable receipt/reserve/issue/return history.
9f. Review Sprint 19B Production Execution Board with shopfloor operators. The board currently uses available stage/status data with UI fallback mapping; follow-up should decide whether backend should expose canonical work-center stage queues and TV-mode preferences.
9g. Sprint 19C MES Data Audit recommends Costing before deeper Shopfloor work. Shopfloor foundations exist, but immutable stage transition history, actual runtime/downtime, production-line queues, and labor/machine rate data are not canonical enough for the next major track.
10. Review Sprint 20A Costing Engine with seeded and real cost data. Sprint 20A.5 now provides a runnable `DEMO20A5-*` demo dataset with 20/20 component costing and 20/20 full-readiness work orders; use it for dashboard/costing QA, then validate against real operator data.
11. 20B Component Cost Analysis:
    - (Done) 20B.1: Audit existing Component module UI patterns.
    - 20B.2: Expose component-level estimated/actual/variance analysis UI with drill-down by BOM material, consumed/scrap quantity, issue transaction cost source, and persisted ComponentCosting comparison.
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
