# Next Tasks

1. Replace the derived production-material warehouse view with a persisted balance/receipt ledger so returns, BOM reservations, and material issues are all auditable independently from main Inventory.
2. Complete Production Material Issue creation from the production material warehouse and consume/reserve production-material stock per MO/BOM.
3. Replace the current BOM-derived component cost estimate with a persisted finished-component costing ledger that includes material issue actuals, labor, machine, overhead, QC rework, and Yard handling cost.
4. Add formal Yard outbound/shipment documents so the "Xuất bãi" quick action can create audited shipment records instead of only removing the placement.
5. Add Yard shipment staging, richer crane telemetry, realtime movement animation, and full zone/slot CRUD screens.
6. Supplier Phase S2: add persisted Supplier-Material mapping, supplier status lifecycle, richer score history, document upload hooks, and supplier analytics without starting Procurement/PO scope.
7. Projects Phase S2: add persisted project contract fields, milestones, project material budgets, planned/actual schedule baselines, and project document/photo attachments.
8. QC Phase S2: add full checklist result entry, inspector assignment, NCR lifecycle, evidence attachments, calibration records, QC dashboards by project/component, and persisted QC release certificate before Yard shipment.
9. System Phase S2: add editable persisted system settings, user create/edit/lock/password reset, role permission mutation APIs, audit export, backup job execution, and configuration change approval.
10. Build Organizations operational foundation.
11. Build Logistics operational foundation.
12. Replace frontend-generated random document numbers with backend-generated deterministic sequences.
