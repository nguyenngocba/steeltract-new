# Next Tasks

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
9. Extend Production Material Issue and Consumption workflows with manual approval controls, issue/return document headers, adjust postings, and richer consumption entry UX. Sprint 10A fixed the active return reconciliation path; this backlog item is for approval/document UX, not the basic return balance equation.
10. Extend Component Costing with labor, machine, overhead, QC rework, Yard handling cost, approvals, and costing history snapshots.
11. Backfill or reconcile legacy Production Material Ledger gaps for issue rows that predate ledger automation or came from non-ledger issue paths.
12. Add formal Yard outbound/shipment, project receiving, and installation certificate documents on top of the current `SHIPPED -> DELIVERED -> INSTALLED` component status workflow and text-based install mapping.
13. Add Yard shipment staging, richer crane telemetry, realtime movement animation, and full zone/slot CRUD screens.
14. Projects Phase S2: add persisted project contract fields, milestones, project material budgets, planned/actual schedule baselines, and project document/photo attachments.
15. QC Phase S2: add full checklist result entry, inspector assignment, NCR lifecycle, evidence attachments, calibration records, QC dashboards by project/component, and persisted QC release certificate before Yard shipment.
16. System Phase S2: add editable persisted system settings, user create/edit/lock/password reset, role permission mutation APIs, notification mark-read APIs, audit export, backup job execution, and configuration change approval.
17. Dashboard Phase S2: add persisted dashboard preferences, deeper drill-through links, and formal notification/action mutation flows after System mutation APIs exist.
18. Build Organizations operational foundation.
19. Build Logistics operational foundation.
20. Move remaining frontend-suggested document numbers fully backend-side. Sprint 2026-06-15 standardized active generated codes to `PREFIX-YYMMDD-###`; the follow-up is a formal backend sequence/locking API.
21. Clean up legacy frontend auth/router files after confirming no imports remain, so future auth work only uses the active shared auth store and guarded router.
