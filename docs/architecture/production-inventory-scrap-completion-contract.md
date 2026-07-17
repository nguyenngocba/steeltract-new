# Production Scrap And Completion Interaction Contract

Date: 2026-07-17  
Status: **APPROVED - ADS003.5**

## Quantity Ownership

Production owns planned, completed, consumed, posted Scrap, returned and
remaining execution quantities. QC owns rejected quantity and disposition.
Inventory owns physical stock and valuation.

## Scrap Decision Table

| Disposition | Production action | Inventory action | QC action | Reporting/Costing |
| --- | --- | --- | --- | --- |
| Process waste, not recoverable | Post Scrap and immutable Production ledger | None | Optional inspection/NCR according to QC policy | Consume Production Scrap fact |
| Recoverable offcut becomes stock | Post Scrap, then request explicit Inventory receipt | Validate/post recovered stock | Quality classification if policy requires | Correlate Scrap and Inventory receipt |
| Defective completed component | Reference QC NCR; do not call Inventory | None unless later recovered material is approved | Own NCR/disposition | Read QC + Production facts |
| Reworkable output | Accept QC rework request and create linked Rework Order | Issue/Return only through normal contracts | Own request and re-inspection | Correlate original/rework orders |

Scrap posting itself never means Inventory Adjustment. An Inventory receipt is
an explicit second owner command in the same transaction only when recoverable
material becomes controlled stock.

## Completion Gates

Partial Completion:

- appends Production evidence;
- changes no Inventory stock;
- does not close the Order;
- may trigger Production snapshots/projections only.

Final Completion:

- verifies Work Orders/execution and Production quantity conservation;
- verifies issued material is not over-consumed/scrapped/returned;
- changes no Inventory stock;
- publishes Production completion/order facts.

Close:

- requires no active execution or linked open Rework;
- requires QC/disposition policy to be satisfied;
- requires material reconciliation, with any physical return already posted
  through Inventory;
- changes no Inventory stock.

## Event Interaction Before ADS004

ADS003.5 fixes publisher ownership but not envelope details:

- Production publishes reservation, issue intent, consumption, return intent,
  completion, Scrap and Rework facts.
- Inventory publishes stock posting/transaction facts.
- QC publishes inspection, NCR and disposition facts.
- Reporting/Costing subscribe read-only.

No consumer is permitted to infer and execute a second stock mutation from a
Production material fact when an Inventory posting receipt already exists.

