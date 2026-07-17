# Production Command Contract

Date: 2026-07-17  
Status: **APPROVED - ADS003; IMPLEMENTATION DEFERRED**

## Common Rules

- Commands include target identifier, expected aggregate version, actor,
  reason where required and stable idempotency key.
- Production application services own validation and orchestration; Production
  repositories own persistence and atomic Outbox.
- Foreign modules cannot write Production aggregates or generic statuses.
- Inventory effects use `InventoryPostingService`; Production never writes
  stock tables.

## Production Order Commands

| Command | Source | Result | Required checks |
| --- | --- | --- | --- |
| `CreateProductionOrder` | none | `DRAFT` | Exact released Component Revision/BOM; unique order number. |
| `UpdateProductionOrderDraft` | `DRAFT` | `DRAFT` | Manufacturing basis remains valid. |
| `ReleaseProductionOrder` | `DRAFT` | `RELEASED` | Freeze basis; generate Work Orders; atomic event. |
| `MarkProductionOrderReady` | `RELEASED` | `READY` | Routing/material/blocking gates pass. |
| `StartProductionOrder` | `READY` | `IN_PROGRESS` | Revalidate volatile gates; start first eligible Work Order/run. |
| `PauseProductionOrder` | `IN_PROGRESS` | `PAUSED` | Pause all active runs; reason required. |
| `ResumeProductionOrder` | `PAUSED` | `IN_PROGRESS` | At least one Work Order can continue. |
| `FinalizeProductionCompletion` | `IN_PROGRESS` | `COMPLETED` | Quantity, Work Order, execution and material gates pass. |
| `CloseProductionOrder` | `COMPLETED` | `CLOSED` | QC/disposition, rework and material reconciliation pass. |
| `CancelProductionOrder` | `DRAFT` | `CANCELLED` | No released execution/material side effects. |

## Work Order Commands

| Command | Source | Result | Required checks |
| --- | --- | --- | --- |
| `CreateWorkOrdersFromRouting` | parent release | `PLANNED` | Deterministic routing version and sequence. |
| `MarkWorkOrderReady` | `PLANNED`, `BLOCKED` | `READY` | Dependencies and QC/material/work-center gates pass. |
| `StartWorkOrder` | `READY` | `IN_PROGRESS` | Parent in progress; no active run conflict. |
| `PauseWorkOrder` | `IN_PROGRESS` | `PAUSED` | Active run paused; reason required. |
| `ResumeWorkOrder` | `PAUSED` | `IN_PROGRESS` | Work-center and blocking gates pass. |
| `BlockWorkOrder` | `READY`, `IN_PROGRESS` | `BLOCKED` | Typed blocking reason/evidence. |
| `CompleteWorkOrder` | `IN_PROGRESS` | `COMPLETED` | Required output/evidence captured; active run completed. |
| `CancelWorkOrder` | `PLANNED`, `READY`, `BLOCKED` | `CANCELLED` | Parent draft/released cancellation policy permits. |

## Execution Commands

`CreateExecutionRun`, `StartExecutionRun`, `PauseExecutionRun`,
`ResumeExecutionRun`, `CompleteExecutionRun` and `AbortExecutionRun` operate
inside one Work Order. Only one run may be `RUNNING` or `PAUSED` for that Work
Order at a time.

## Reservation Commands

- `CreateReservationDraft` is valid only after parent Order release and records
  demand without ledger/event allocation.
- `ReserveMaterial` allocates available production material and begins the
  Production reservation ledger/event lifecycle.
- `IssueReservedMaterial` advances reserved quantity toward partial/full issue
  and invokes Inventory-owned stock posting.
- `ReleaseReservation` and `ExpireReservation` release only the remaining
  allocation; they never create stock movement.
- `CancelReservation` applies only to a `DRAFT` reservation.

## Completion Commands

- `RecordPartialCompletion` appends output quantity and evidence without
  completing the Order.
- `ReverseCompletionRecord` appends a compensating record; it never edits the
  original.
- `FinalizeProductionCompletion` performs the Order transition only after all
  final gates pass.

## Scrap Commands

- `CreateScrapDraft` records proposed quantity, source, reason and disposition.
- `PostProductionScrap` validates available WIP/material balance and writes the
  immutable scrap/ledger fact.
- `CancelScrapDraft` is valid only before posting.
- `ReversePostedScrap` appends reversal evidence; an Inventory consequence, if
  any, is a separate Inventory-owned posting command.

## Rework Commands

- `AcceptReworkRequest` consumes a QC-owned NCR/rework request idempotently and
  creates a linked `REWORK` Production Order in `DRAFT`.
- `RejectReworkRequest` records a Production planning decision but never closes
  or rewrites the NCR.
- Rework execution uses the normal Order/Work Order commands.
