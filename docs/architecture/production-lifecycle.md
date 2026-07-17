# Production Domain Lifecycle

Date: 2026-07-17  
Status: **APPROVED - ADS003**

## Order Planning And Release

`CreateProductionOrder` creates `DRAFT` against an exact released Component
Revision/BOM reference. Draft data may be edited and cancelled. Release freezes
the manufacturing basis, generates the Work Orders from routing and permits
reservation planning.

## Reservation And Readiness

A draft Reservation may be prepared after the Production Order is `RELEASED`.
It records demand only and publishes no allocation fact. `ReserveMaterial`
moves the reservation to `RESERVED` or `PARTIALLY_ISSUED`, writes the Production
ledger and publishes the Production-owned reservation fact without changing
Inventory stock.

`MarkProductionOrderReady` requires:

- a still-valid released Component Revision/BOM reference;
- generated routing/Work Orders;
- material policy satisfied by reservation/issue state;
- no blocking domain condition.

## Start

Production starts only when `StartProductionOrder` commits. The command
revalidates volatile readiness, moves the Order `READY -> IN_PROGRESS`, starts
the first eligible Work Order and creates its first Execution Run atomically.
Preparing a reservation, issuing material or opening a screen does not mean
Production started.

## Work Order Execution

Work Orders follow routing dependencies and may run sequentially or explicitly
in parallel. A Work Order has its own lifecycle and optimistic version. Its
pause/block state does not automatically pause the parent Order. A global
`PauseProductionOrder` pauses every active run and then marks the Order paused.

## Partial Completion

Each `RecordPartialCompletion` appends a quantity result tied to the responsible
Work Order/run. It does not transition the Production Order to `COMPLETED`.

Production-owned quantities are:

- `plannedQty`: target units for the Order;
- `completedQty`: net units whose required Production execution is complete;
- `scrapQty`: units irreversibly disposed by posted Production Scrap;
- `remainingQty = max(plannedQty - completedQty - scrapQty, 0)`.

`rejectedQty` is a QC-owned projection and remains a subset/classification of
completed output until QC disposition. Open rework quantity is also a subset,
not an extra term in the conservation equation.

## Final Completion And Close

`FinalizeProductionCompletion` records the final completion evidence and moves
`IN_PROGRESS -> COMPLETED` only when `remainingQty = 0`, all mandatory Work
Orders are complete, material usage is within issued quantities and no active
run exists.

`CloseProductionOrder` is separate. It requires final QC/disposition evidence,
no open rework linked to the order, and reconciled issued material:

```text
issued = consumed + posted scrap + returned + approved remaining balance
```

Close is terminal and never occurs implicitly from a completion record.

## Scrap And Rework

Scrap is posted against the Order, Work Order/run, material/output and reason.
It is not Consumption and does not directly write Inventory.

QC owns NCR and the request for rework. Production accepts that request by
creating a linked `REWORK` Production Order. The original Order is not moved
back to `IN_PROGRESS`; traceability is preserved through the linkage. QC owns
the subsequent re-inspection result.

