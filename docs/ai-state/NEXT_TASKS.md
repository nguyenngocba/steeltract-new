# Next Tasks

Inventory foundation order locked after Material Master, Inventory Transactions, and Warehouse Locations:

1. Warehouse Structure Cleanup:
   normalize `warehouse_zones` into real storage locations, separate warehouse-like/demo records from usable locations, and keep CRUD behavior consistent before any map work.
2. Performance Sprint:
   reduce frontend polling, add required indexes, and replace location statistics with transaction-driven location balance or a persisted balance model.
3. Warehouse 2D Map:
   build map UI only after row/column/level/capacity data and location balances are stable.
4. Supplier:
   continue Supplier Phase S2 after Inventory location and balance foundation is stable.
5. Purchasing:
   start purchasing only after Supplier-Material mapping and Inventory receiving/location rules are stable.

Backlog after the locked order:

6. Replace the derived production-material warehouse view with a persisted balance/receipt ledger so returns, BOM reservations, and material issues are all auditable independently from main Inventory.
7. Continue Inventory technical cleanup by extracting the remaining local modal/table helpers into shared Inventory visual components and replacing frontend-generated inventory document numbers with backend deterministic sequences.
8. Complete Production Material Issue creation from the production material warehouse and consume/reserve production-material stock per MO/BOM.
9. Replace the current BOM-derived component cost estimate with a persisted finished-component costing ledger that includes material issue actuals, labor, machine, overhead, QC rework, and Yard handling cost.
10. Add formal Yard outbound/shipment documents so the "Xuất bãi" quick action can create audited shipment records instead of only removing the placement.
11. Add Yard shipment staging, richer crane telemetry, realtime movement animation, and full zone/slot CRUD screens.
12. Projects Phase S2: add persisted project contract fields, milestones, project material budgets, planned/actual schedule baselines, and project document/photo attachments.
13. QC Phase S2: add full checklist result entry, inspector assignment, NCR lifecycle, evidence attachments, calibration records, QC dashboards by project/component, and persisted QC release certificate before Yard shipment.
14. System Phase S2: add editable persisted system settings, user create/edit/lock/password reset, role permission mutation APIs, audit export, backup job execution, and configuration change approval.
15. Build Organizations operational foundation.
16. Build Logistics operational foundation.
17. Replace frontend-generated random document numbers with backend-generated deterministic sequences.
