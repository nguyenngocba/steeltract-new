# Components Event Foundation Audit

Date: 2026-07-12

## Current Behavior

- `component.updated` is emitted through the in-memory EventBus after the
  repository transaction commits.
- The event is emitted for generic update, deliver and install.
- `changedFields` is hardcoded and does not fully describe generic updates.
- Create and delete emit no Component domain event.
- No Component event uses persistent Outbox.
- No Component event is registered in snapshot routing.

Therefore current events are useful websocket notifications, not an Enterprise
event foundation.

## Proposed Canonical Catalog

| Event | Domain prerequisite | Recommendation |
|---|---|---|
| `component.created` | Existing create command | Approve next foundation sprint |
| `component.updated` | Existing update command | Persist atomically; accurate changed fields |
| `component.delivered` | Existing SHIPPED -> DELIVERED transition | Prefer explicit event over generic update |
| `component.installed` | Existing DELIVERED -> INSTALLED transition | Prefer explicit event over generic update |
| `component.deleted` | Existing delete command | Decide delete vs archive policy first |
| `component.revision.created` | No revision entity/workflow | BLOCKED by domain decision |
| `component.released` | No RELEASED status/workflow | BLOCKED by domain decision |
| `component.archived` | No archive state/workflow | BLOCKED by domain decision |

## Required Event Standard

```text
Repository transaction
  -> Component/Timeline/Activity mutation
  -> persistent Outbox row
  -> commit
  -> EventConsumer
  -> Components snapshot background update
```

Payloads should contain identifiers, status/changed fields, source version and
timestamps, not full Component objects. Existing websocket notification can be
fed from dispatched canonical events for compatibility.

Event Foundation status: **NOT READY**.

