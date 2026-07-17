# ADS003 Production State Machine

Date: 2026-07-17  
Status: **APPROVED - NORMATIVE ARCHITECTURE DECISION**

## Decision

Production owns manufacturing execution, material intent/usage, completion,
scrap disposition and rework execution. Inventory remains the sole stock owner,
Components remains the engineering-definition owner and QC remains the quality
result/NCR owner under AD-015 and AD-016.

## Production Order

```text
DRAFT -> RELEASED -> READY -> IN_PROGRESS <-> PAUSED -> COMPLETED -> CLOSED
   |
   +--------------------------------------------------------------> CANCELLED
```

Cancellation is allowed only from `DRAFT`. `CLOSED` and `CANCELLED` are
terminal. `PLANNED` and `DELAYED` remain compatibility data and are not command
targets.

`READY` remains a canonical admission state. It records that release,
engineering revision, routing and material gates passed at a point in time. It
is not a live availability projection. `StartProductionOrder` must revalidate
volatile gates before entering `IN_PROGRESS`.

## Work Order

One Production Order coordinates one or more Work Orders. A Work Order is an
independently versioned execution aggregate for one routing operation or
explicit parallel work package.

```text
PLANNED -> READY -> IN_PROGRESS <-> PAUSED -> COMPLETED
             |           |
             |           +-> BLOCKED -> READY
             +-------------------------------> CANCELLED
```

`CANCELLED` is allowed only before execution. A completed Work Order is
immutable. Routing dependencies determine when `PLANNED` can become `READY`.

## Production Execution Run

A Work Order may have multiple execution runs for shift handoff, pause/resume
and machine reassignment, but at most one active run.

```text
CREATED -> RUNNING <-> PAUSED -> COMPLETED
   |          |
   +----------+----------------> ABORTED
```

An aborted run preserves elapsed time and reason; it does not complete its Work
Order. A replacement run continues the same Work Order.

## Material Reservation

Reservation planning begins only after the parent Order is `RELEASED`.

```text
DRAFT -> RESERVED -> PARTIALLY_ISSUED -> ISSUED
  |          |               |
  |          +---------------+-> RELEASED
  |          +---------------+-> EXPIRED
  +-----------------------------> CANCELLED
```

`DRAFT` records demand only. The reservation fact and Production ledger begin
at `RESERVED`. Issue/Return stock consequences remain Inventory-owned.
`RELEASED`, `EXPIRED`, `CANCELLED` and `ISSUED` are terminal reservation
outcomes. Existing persistence without `RELEASED` remains compatibility data.

## Completion

Completion is an append-only quantity fact, not a freely editable status row.

```text
RECORDED -> REVERSED
```

Partial records accumulate. A final completion command transitions the Order
to `COMPLETED` only when all mandatory Work Orders are complete, quantity and
material reconciliation passes, and no active execution remains. Completion
never closes the Order automatically; `CloseProductionOrder` is a separate
control after QC/disposition and reconciliation gates.

## Scrap

Scrap is a separate Production-owned disposition aggregate, not a field folded
into Consumption semantics.

```text
DRAFT -> POSTED -> REVERSED
   |
   +-----------> CANCELLED
```

Posting writes an immutable Production scrap/ledger fact. Any recoverable-stock
consequence is an Inventory-owned command. A posted record is corrected only by
an explicit reversal.

## Rework

Rework never rewinds the original completed Production Order. A QC-owned NCR or
rework request is accepted by Production and creates a linked Production Order
with `orderKind = REWORK`, `reworkOfProductionOrderId` and the affected routing
scope. The rework order follows the normal Production Order and Work Order
state machines from `DRAFT`.

## Legacy Policy

Current schema fields and APIs remain unchanged. ADS003 authorizes no automatic
mapping, schema migration, event publication or runtime behavior change.
