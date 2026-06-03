# Next Tasks

1. Replace the derived production-material warehouse view with a persisted balance/receipt ledger so returns, BOM reservations, and material issues are all auditable independently from main Inventory.
2. Complete Production Material Issue creation from the production material warehouse and consume/reserve production-material stock per MO/BOM.
3. Replace the current BOM-derived component cost estimate with a persisted finished-component costing ledger that includes material issue actuals, labor, machine, overhead, QC rework, and Yard handling cost.
4. Add formal Yard outbound/shipment documents so the "Xuất bãi" quick action can create audited shipment records instead of only removing the placement.
5. Add Yard QC gate, shipment staging, richer crane telemetry, realtime movement animation, and full zone/slot CRUD screens.
6. Build Projects operational foundation.
7. Build Suppliers operational foundation.
8. Build Organizations operational foundation.
9. Build QC operational foundation.
10. Build Logistics operational foundation.
11. Complete Settings operational foundation.
12. Replace frontend-generated random document numbers with backend-generated deterministic sequences.
