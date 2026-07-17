# Production Transition Matrix

Date: 2026-07-17  
Status: **APPROVED - ADS003**

## Production Order

| From | Command | To | Allowed |
| --- | --- | --- | --- |
| none | `CreateProductionOrder` | `DRAFT` | Yes |
| `DRAFT` | `ReleaseProductionOrder` | `RELEASED` | Yes |
| `RELEASED` | `MarkProductionOrderReady` | `READY` | Yes, gates pass |
| `READY` | `StartProductionOrder` | `IN_PROGRESS` | Yes, gates revalidated |
| `IN_PROGRESS` | `PauseProductionOrder` | `PAUSED` | Yes |
| `PAUSED` | `ResumeProductionOrder` | `IN_PROGRESS` | Yes |
| `IN_PROGRESS` | `FinalizeProductionCompletion` | `COMPLETED` | Yes, final gates pass |
| `COMPLETED` | `CloseProductionOrder` | `CLOSED` | Yes, close gates pass |
| `DRAFT` | `CancelProductionOrder` | `CANCELLED` | Yes |
| `COMPLETED` | start/resume | any | No; use linked rework order |
| `CLOSED`, `CANCELLED` | any transition | any | No; terminal |
| any canonical state | target `PLANNED`/`DELAYED` | any | No; compatibility only |

## Work Order

| From | Command | To | Allowed |
| --- | --- | --- | --- |
| none | `CreateWorkOrdersFromRouting` | `PLANNED` | Yes |
| `PLANNED` | `MarkWorkOrderReady` | `READY` | Yes, dependencies pass |
| `READY` | `StartWorkOrder` | `IN_PROGRESS` | Yes, parent in progress |
| `IN_PROGRESS` | `PauseWorkOrder` | `PAUSED` | Yes |
| `PAUSED` | `ResumeWorkOrder` | `IN_PROGRESS` | Yes |
| `READY`, `IN_PROGRESS` | `BlockWorkOrder` | `BLOCKED` | Yes, typed reason |
| `BLOCKED` | `MarkWorkOrderReady` | `READY` | Yes, blocker cleared |
| `IN_PROGRESS` | `CompleteWorkOrder` | `COMPLETED` | Yes, evidence complete |
| `PLANNED`, `READY`, `BLOCKED` | `CancelWorkOrder` | `CANCELLED` | Yes, parent policy permits |
| `COMPLETED`, `CANCELLED` | any transition | any | No; terminal |

## Execution Run

| From | Command | To | Allowed |
| --- | --- | --- | --- |
| none | `CreateExecutionRun` | `CREATED` | Yes |
| `CREATED` | `StartExecutionRun` | `RUNNING` | Yes |
| `RUNNING` | `PauseExecutionRun` | `PAUSED` | Yes |
| `PAUSED` | `ResumeExecutionRun` | `RUNNING` | Yes |
| `RUNNING` | `CompleteExecutionRun` | `COMPLETED` | Yes |
| `CREATED`, `RUNNING`, `PAUSED` | `AbortExecutionRun` | `ABORTED` | Yes, reason required |
| `COMPLETED`, `ABORTED` | any transition | any | No; terminal |

## Material Reservation

| From | Command | To | Allowed |
| --- | --- | --- | --- |
| none | `CreateReservationDraft` | `DRAFT` | Yes, parent released |
| `DRAFT` | `ReserveMaterial` | `RESERVED` | Yes, allocation valid |
| `RESERVED` | partial issue | `PARTIALLY_ISSUED` | Yes |
| `RESERVED`, `PARTIALLY_ISSUED` | final issue | `ISSUED` | Yes |
| `DRAFT` | `CancelReservation` | `CANCELLED` | Yes |
| `RESERVED`, `PARTIALLY_ISSUED` | `ReleaseReservation` | `RELEASED` | Yes, remaining allocation released |
| `RESERVED`, `PARTIALLY_ISSUED` | `ExpireReservation` | `EXPIRED` | Yes, remaining allocation released |
| terminal outcome | any transition | any | No |

## Scrap

| From | Command | To | Allowed |
| --- | --- | --- | --- |
| none | `CreateScrapDraft` | `DRAFT` | Yes |
| `DRAFT` | `PostProductionScrap` | `POSTED` | Yes, balance valid |
| `DRAFT` | `CancelScrapDraft` | `CANCELLED` | Yes |
| `POSTED` | `ReversePostedScrap` | `REVERSED` | Yes, compensating fact |
| `POSTED` | edit/delete | any | No |
| `CANCELLED`, `REVERSED` | any transition | any | No; terminal |

## Rework

| Source | Command | Result |
| --- | --- | --- |
| QC NCR/rework request | `AcceptReworkRequest` | New linked `REWORK` Order in `DRAFT` |
| QC NCR/rework request | `RejectReworkRequest` | Production decision fact; NCR unchanged |
| Original `COMPLETED`/`CLOSED` Order | direct rewind | Invalid |
| Linked rework Order | normal lifecycle command | Uses canonical Production Order transitions |
