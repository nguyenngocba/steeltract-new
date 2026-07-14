# EPIC161 - Yard Transaction Boundary Report

## Transaction Matrix

| Command | Atomic rows |
| --- | --- |
| Create/update/delete zone | zone + ActivityLog + audit Outbox + domain Outbox |
| Create row/slot | row/slot + ActivityLog + audit Outbox |
| Place item | placement + movement + slot occupancy + ActivityLog + audit/domain Outbox |
| Move item | placement + movement + source/target occupancy + ActivityLog + audit/domain Outbox |
| Remove item | placement + Component/Timeline compatibility update + movement + occupancy + ActivityLog + audit/domain Outbox |
| Generate manual snapshot | snapshot + ActivityLog + audit/domain Outbox |

`YardRepository.transaction` remains the single transaction owner. Service
methods orchestrate repository calls and perform existing guards within that
callback.

Attachment linking remains post-commit enrichment through `AttachmentsService`,
matching the existing module boundary. It is not stock, placement, movement or
event persistence and was not refactored into a distributed transaction.

## Validation

Focused tests prove that business persistence, ActivityLog and both Outbox rows
receive the same transaction client. A simulated Outbox failure rejects the
mutation transaction result.

