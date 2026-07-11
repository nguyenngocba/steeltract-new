# Production Order Transition Matrix

Date: 2026-07-11

| Current | Command | Next | Canonical event | Result |
| --- | --- | --- | --- | --- |
| `DRAFT` | Release | `RELEASED` | `production.order.released` | PASS |
| `RELEASED` | Ready | `READY` | `production.order.ready` | PASS |
| `READY` | Start | `IN_PROGRESS` | `production.order.started` | PASS |
| `IN_PROGRESS` | Pause | `PAUSED` | `production.order.paused` | PASS |
| `PAUSED` | Resume | `IN_PROGRESS` | `production.order.resumed` | PASS |
| `IN_PROGRESS` | Complete | `COMPLETED` | `production.order.completed` | PASS |
| `COMPLETED` | Close | `CLOSED` | `production.order.closed` | PASS |
| `DRAFT` | Cancel | `CANCELLED` | `production.order.cancelled` | PASS |

Create always persists `DRAFT` and emits `production.order.created` in the same
transaction. Every unlisted state/command pair is rejected with HTTP 400.
`PLANNED`, `DELAYED`, `CLOSED`, and `CANCELLED` have no outgoing command.

`PATCH /production/:id` remains backward-compatible at the DTO boundary but
rejects direct `status` writes. Callers must use lifecycle command endpoints.
