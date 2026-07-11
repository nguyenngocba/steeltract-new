# Production Snapshot Writer Report

## Status

**READY**

`SnapshotWriterService` now handles `request.scope.module === 'production'`.

For a Production snapshot job, the writer calculates and persists:

* dashboard summary snapshots;
* production order summary snapshots;
* work-center summary snapshots.

All writes run inside the existing Prisma transaction in `SnapshotWriterService`.

## Trigger Path

Existing persistent Production events are registered:

* `production.started`
* `production.stage.completed`
* `production.delayed`
* `production.completed`

Those events schedule `snapshot.production.update` jobs through the existing `EventConsumerService` and `SnapshotUpdateDispatcher`.

## Scope Behavior

When a production order event carries an order id, order snapshots can be scoped by `productionOrderId`. Dashboard snapshots are global for the current snapshot date. Work-center snapshots are prepared for scoped updates through `workCenterId`, and can rebuild all work centers when the scope is absent.

## Non-Goals

EPIC132 does not:

* rebuild snapshots synchronously in HTTP requests;
* create new Production workflow events;
* change Production API responses;
* cut the dashboard endpoint over to snapshot-first reads;
* write snapshots directly from Production services.
