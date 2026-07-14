# QC Snapshot Writer Report

## Background Write Path

```text
existing qc.* Outbox event
  -> EventConsumerService
  -> SnapshotUpdateDispatcher
  -> snapshot.qc.update
  -> SnapshotWriterService
  -> one Prisma transaction
     + QcDashboardSnapshot upsert
     + affected QcInspectionSnapshot upsert
```

The writer calculates rows from current QC/Production data and never writes
inside an HTTP business transaction. Dashboard and inspection rows are upserted;
there is no delete-then-insert swap and no fake data generation.

Registered existing events:

- `qc.inspection.started`
- `qc.inspection.completed`
- `qc.issue.created`
- `qc.ncr.created`
- `qc.rework.required`

Create, approve, reject and NCR-update events do not currently exist and were
not invented. Snapshot freshness for those transitions is therefore partial
until an approved event-compliance sprint adds canonical events.

