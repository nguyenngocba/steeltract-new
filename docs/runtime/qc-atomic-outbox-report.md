# QC Atomic Outbox Report

## Before

```text
QC repository transaction -> commit
EventBus.emit(persistToOutbox) -> second transaction
```

Audit events could also be written through a separate Outbox transaction while
the QC transaction was still open.

## After

```text
QcRepository.transaction
  + QC mutation
  + ActivityLog
  + audit.activity.created Outbox
  + qc.* / notification.requested Outbox
  -> one commit
```

`QcRepository.createOutboxEvent` uses an idempotent upsert and requires the
active `QcTx`. Existing event names, payload content, module metadata and
idempotency semantics are retained. The Background Outbox worker remains the
only publisher after commit; no second persistent EventBus write is performed.

Atomic coverage includes existing events:

- `qc.inspection.started`
- `qc.inspection.completed`
- `qc.issue.created`
- `qc.ncr.created`
- `qc.rework.required`
- associated `audit.activity.created` and `notification.requested` rows

EPIC151 does not add the canonical events proposed by EPIC150.

