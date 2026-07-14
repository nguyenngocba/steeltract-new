# Components Snapshot Writer Report

Date: 2026-07-12

## Background Path

```text
component.updated (existing event)
  -> EventConsumerService
  -> SnapshotUpdateDispatcher
  -> snapshot.components.update job
  -> SnapshotWriterService
  -> ComponentSnapshotRepository
  -> one Prisma transaction
     -> dashboard upsert
     -> affected summary upsert
```

Fallback reads and manual rebuilds can also enqueue Components jobs. Writer
updates are asynchronous; no HTTP mutation writes snapshot tables directly.

## Existing Event Constraint

Only `component.updated` currently exists and is routed. It covers generic
update, delivery and installation flows already emitted by ComponentsService.

No events were invented for create/delete/revision/release/archive:

- create/delete currently emit no Component event;
- revision/release/archive entities or workflows do not exist;
- initial/missing snapshots are handled by fallback/manual rebuild until a future
  approved persistent Component event sprint closes this gap.

This limitation does not block the snapshot foundation, but it prevents claiming
complete event-driven freshness for every Component mutation.

