# Components Event Standard Assessment

Date: 2026-07-17  
Status: **PARTIAL CONTRACT - NO NEW EVENT APPROVED**

## Existing Durable Event

`component.updated` is persisted atomically for generic update, delivery and
installation. It carries the Component identifier and changed fields and routes
through the shared Outbox/Background Engine to Components snapshots.

## Coverage Matrix

| Mutation | Domain event | Result |
| --- | --- | --- |
| Create | none | GAP |
| Generic update | `component.updated` | PASS, changed-field accuracy limited |
| Deliver | `component.updated` | PARTIAL |
| Install | `component.updated` | PARTIAL |
| Delete | none | GAP; archive policy unresolved |
| Cost recalculation | none | GAP if costing freshness is event-driven |
| Revision | no domain/workflow | BLOCKED |
| Release | no domain/workflow | BLOCKED |
| Archive | no domain/workflow | BLOCKED |

## Canonical Naming Candidates

The following are candidates only and must not be published before RFC approval:

- `component.created`
- `component.updated`
- `component.qc-released`
- `component.delivered`
- `component.installed`
- `component.cost.recalculated`
- `component.revision.created`
- `component.archived`

`component.released` is ambiguous between design release, production release,
QC release and logistics release. It must not be adopted without qualification.

## Required Event Invariants

```text
Component command transaction
  -> aggregate mutation
  -> Timeline/ActivityLog
  -> audit Outbox
  -> domain Outbox with stable idempotency key
  -> commit
```

Payloads should contain identifiers, version/status and changed fields, not
full entities. Snapshot updates remain asynchronous.

## Cross-module Events

Production, QC, Yard, Logistics and Projects should publish their own facts.
Components may consume those facts to project state only after lifecycle
ownership is approved. Consumers must not infer stock mutation or write
Inventory ledgers.

