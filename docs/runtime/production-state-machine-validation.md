# Production State Machine Validation

Date: 2026-07-11

Status: **PASS**

The state machine is implemented as a pure domain function in
`production-order-state-machine.ts`. It contains only the transitions approved
by PROD-014. The service converts invalid transition errors to HTTP 400 and
revalidates inside the repository transaction, preventing stale pre-read state
from bypassing the transition rule.

Validation evidence:

* 8 canonical transitions are explicitly mapped.
* 13 Jest cases pass, including all canonical paths, legacy/terminal state
  rejection, and `COMPLETED -> IN_PROGRESS` rejection.
* New orders reject any initial status other than `DRAFT`.
* Generic update rejects any supplied `status`.
* Stage completion requires the Production Order to be `IN_PROGRESS`; final
  stage completion writes the canonical completion Outbox event atomically.

No transition targets `PLANNED` or `DELAYED`.
