# EPIC160 - Yard Business Architecture Audit

## Implemented Business Capabilities

| Capability | Status | Notes |
| --- | --- | --- |
| Zone, row and slot structure | IMPLEMENTED | persisted models and validated APIs |
| Placement into slot | IMPLEMENTED | capacity/stack-level and blocked-slot guards |
| Internal move | IMPLEMENTED | placement update, immutable movement row, source/target occupancy update |
| Yard removal | PARTIAL | records removal and marks Component `SHIPPED`; no loading plan or dispatch receipt contract |
| Crane registry/reference | PARTIAL | CRUD/status and movement reference only; no task queue or telemetry lifecycle |
| Movement history | IMPLEMENTED | PLACE/MOVE/REMOVE records with bounded API |
| Attachments/activity logs | PARTIAL | placement attachments and activity logs exist |
| Manual layout snapshot | IMPLEMENTED | operator-triggered JSON snapshot, not Core Snapshot Engine |

## Missing YMS Capabilities

| Capability | Severity | Gap |
| --- | --- | --- |
| Receive from QC PASS | P0 | no consumer/command proving QC release before Yard receipt |
| Reservation | P0 | no `YardReservation` model or lifecycle despite blueprint |
| Hold/release | P0 | no business state, command, approval or event |
| Truck loading plan/task | P0 | no persisted loading plan, sequence, crane task or completion confirmation |
| Dispatch handoff | P0 | removal directly marks Component shipped; no Logistics/Dispatch aggregate handoff |
| Atomic domain events | P0 | business transaction and domain Outbox event are separate commits |
| Weight/stack safety | P1 | maximum stack level is enforced, but weight-order and slot/zone weight limits are not modeled/enforced |
| Crane operations | P1 | no assignment/start/complete/failure lifecycle |
| Reservation expiry/conflict | P1 | absent |
| Yard inventory ownership | P1 | placement accepts generic item IDs/codes without a canonical receiving document |

## Business Maturity

**Assessment: operational placement CRUD with movement ledger, not yet a complete
Yard Management System.** Estimated business completeness is 45% against the
approved draft blueprint. The existing flow can locate and move finished items,
but cannot formally control admission, reservation, hold, truck loading or
dispatch release.

