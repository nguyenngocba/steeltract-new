# Production Command Endpoints

Date: 2026-07-17

All paths below are relative to `/production/commands` and require JWT plus
`Idempotency-Key`.

| Method and path | Command |
| --- | --- |
| `POST /orders` | Create Production Order |
| `POST /orders/:id/release` | Release and create deterministic Work Orders |
| `POST /orders/:id/ready` | Mark Ready after admission gates |
| `POST /orders/:id/start` | Start after volatile gates |
| `POST /orders/:id/pause` | Pause with reason |
| `POST /orders/:id/resume` | Resume |
| `POST /orders/:id/complete` | Finalize completion |
| `POST /orders/:id/close` | Close after QC/rework/material gates |
| `POST /orders/:id/cancel` | Cancel Draft order |
| `POST /work-orders/:id/start` | Start Work Order |
| `POST /work-orders/:id/pause` | Pause Work Order with reason |
| `POST /work-orders/:id/resume` | Resume Work Order |
| `POST /work-orders/:id/complete` | Complete Work Order |
| `POST /completions` | Record append-only completion |
| `POST /completions/:id/reverse` | Append completion reversal |
| `POST /scraps` | Create Scrap Draft |
| `POST /scraps/:id/post` | Post Scrap |
| `POST /scraps/:id/cancel` | Cancel Draft Scrap |
| `POST /scraps/:id/reverse` | Reverse posted Scrap |
| `POST /rework/accept` | Accept QC rework request |
| `POST /rework/reject` | Reject QC rework request |
| `POST /rework/:requestId/complete` | Complete accepted Rework |

Optional headers are `X-Correlation-Id` and `X-Causation-Id`. Validation rejects
unknown body fields and non-positive aggregate versions.

Every command targeting an existing aggregate requires `expectedVersion`:

- Order and Work Order commands lock their respective aggregate.
- Completion recording and Scrap Draft creation lock the parent Production
  Order before appending the child record.
- Completion reversal and Scrap mutation lock the child aggregate.
- Rework accept/reject lock the original Production Order; Rework completion
  locks the Rework aggregate.

Create Production Order is the only command without `expectedVersion`, because
the aggregate does not exist before that command.
