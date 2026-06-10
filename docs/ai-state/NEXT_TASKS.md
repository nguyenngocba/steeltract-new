# Next Tasks

Inventory foundation order locked after Material Master, Inventory Transactions, and Warehouse Locations:

1. Warehouse Structure Cleanup:
   normalize `warehouse_zones` into real storage locations, separate warehouse-like/demo records from usable locations, and keep CRUD behavior consistent before any map work.
2. Performance Sprint:
   reduce frontend polling, add required indexes, and replace location statistics with transaction-driven location balance or a persisted balance model.
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
9. Extend Production Material Issue workflow with manual issue/return editing, approval controls, and formal BOM reservation documents; auto-consumption on MO start now exists, but reservation remains derived.
10. Replace the current BOM-derived component cost estimate with a persisted finished-component costing ledger that includes material issue actuals, labor, machine, overhead, QC rework, and Yard handling cost.
11. Add formal Yard outbound/shipment documents so the "Xuất bãi" quick action can create audited shipment records instead of only removing the placement.
12. Add Yard shipment staging, richer crane telemetry, realtime movement animation, and full zone/slot CRUD screens.
13. Projects Phase S2: add persisted project contract fields, milestones, project material budgets, planned/actual schedule baselines, and project document/photo attachments.
14. QC Phase S2: add full checklist result entry, inspector assignment, NCR lifecycle, evidence attachments, calibration records, QC dashboards by project/component, and persisted QC release certificate before Yard shipment.
15. System Phase S2: add editable persisted system settings, user create/edit/lock/password reset, role permission mutation APIs, notification mark-read APIs, audit export, backup job execution, and configuration change approval.
16. Dashboard Phase S2: add persisted dashboard preferences, deeper drill-through links, and formal notification/action mutation flows after System mutation APIs exist.
17. Build Organizations operational foundation.
18. Build Logistics operational foundation.
19. Replace frontend-generated random document numbers with backend-generated deterministic sequences.
