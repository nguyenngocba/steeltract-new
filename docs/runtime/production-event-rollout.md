# Production Event Rollout

Date: 2026-07-17  
Status: **PASS - CANONICAL V1 WRITES IMPLEMENTED**

## Canonical Facts

The command boundary writes approved `production.order.*`,
`production.work-order.*`, `production.completion.*`,
`production.scrap.posted/reversed` and `production.rework.*` facts. No new code
emits superseded `production.scrap.recorded` or legacy order aliases.

Every fact includes the AD-019 V1 metadata: UUID event id, version, producer,
aggregate identity/version, correlation/causation, actor, stable idempotency
key and ordering key. Retry capacity is ten attempts.

## Material Facts

Existing `production.material.*` writes now use the same V1 metadata. Issue and
Return payloads carry the Inventory transaction receipt plus separate location
fields. Reservation events are emitted per material instead of one ambiguous
multi-material total. Consumption remains a Production projection fact and
does not call Inventory.

## Atomicity

Domain Outbox, ActivityLog/audit Outbox and timeline rows share the business
transaction. Event replay only reuses persisted facts and cannot repeat an
Inventory posting.

## Compatibility

Legacy event readers remain untouched. Public event aliases are not introduced;
subscriber cutover/replay validation remains an operator rollout task.

## RFC003 Execution Facts

The command boundary now emits V1 `production.execution.started`, `paused`,
`resumed`, `completed` and `aborted`. The ordering key is
`execution:{executionRunId}`. Every payload satisfies
`ProductionExecutionFactV1`; the existing Enterprise Read Platform registry
routes these facts to `ProductionExecution` and `ProductionTimeline` without a
Projection Engine change.
