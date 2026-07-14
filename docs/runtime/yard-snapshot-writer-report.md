# EPIC163 - Yard Snapshot Writer Report

## Existing Event Routing

| Existing event | Snapshot routing |
| --- | --- |
| `yard.item.placed` | Yard Workspace + Dashboard rebuild batch |
| `yard.item.moved` | Yard Workspace + Dashboard rebuild batch |
| `yard.item.removed` | Yard Workspace + Dashboard rebuild batch |
| `yard.zone.updated` | Yard Workspace + Dashboard rebuild batch |
| `yard.snapshot.generated` | Yard Dashboard rebuild batch |

The shared writer currently calculates both Yard domain snapshot families in
one background job and upserts all rows in one database transaction. It does not
delete then insert.

Missing reservation, hold/release, loading and dispatch events were not invented.
They remain business-workflow limitations and cannot refresh snapshots until
those workflows are approved and implemented.

## Idempotency

Snapshot jobs use the existing dispatcher idempotency key strategy. Persisted
rows use unique `scopeKey + snapshotDate` or `scopeKey` upserts.

