# Production and Components Boundary

Date: 2026-07-17  
Status: **APPROVED - ADS001**

## Components Owns

- Component identity and code.
- Component design/revision history.
- Released engineering BOM revision.
- High-level component handoff lifecycle and archive/supersede policy.
- Component-centric read projections and costing presentation.

## Production Owns

- Work Order and Production Order.
- Manufacturing routing copy and execution stages/tasks.
- Production status, current stage and completion result.
- Material Reservation, Issue intent, Consumption, Return intent and Production
  material ledger.
- Scrap and rework execution after their contracts are approved.

## Inventory Owns

- Every stock movement caused by Production Issue or Return.
- Location stock, valuation, Inventory transaction and Inventory Outbox.

## QC Owns

- Inspection result and NCR. Components and Production may project this status
  but cannot persist QC truth.

## Required Interaction

```text
Components releases immutable Component/BOM revision
  -> Components event/query contract
  -> Production creates order referencing revision
  -> Production executes and publishes order/stage/material facts
  -> QC publishes inspection result
  -> Components updates its projection or executes an approved handoff command
```

## Status Policy

`ComponentStatus` must not remain the integration bus for Production, QC, Yard,
Logistics and Projects. Until ADS002 defines the replacement state machine:

- existing values remain compatibility data;
- no new module may add direct status writes;
- Production stage is read from Production;
- QC result is read from QC;
- Yard location is read from Yard;
- delivery is read from Logistics;
- installation acceptance is read from Projects.

## Material Policy

Components never owns a material reservation/issue/consumption/return ledger.
It reads a Production material projection. A Components UI wishing to return
unused production material must invoke the Production Return command; Production
then invokes Inventory posting. Direct generic Inventory posting from Components
is forbidden.

## Costing Policy

Component costing may consume released BOM, Production consumption and Inventory
valuation contracts. It must not mutate source records or infer missing stock
movements. Long-term cross-context costing should use stable owner read contracts
or projections rather than direct schema coupling.

