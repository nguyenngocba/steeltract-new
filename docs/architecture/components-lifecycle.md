# Components Lifecycle Assessment

Date: 2026-07-17  
Status: **NOT APPROVED AS A STATE MACHINE**

## Persisted Statuses

```text
STOCK
CUTTING
WELDING
PAINTING
READY
SHIPPED
DELIVERED
INSTALLED
```

The enum is persisted and externally visible, but it is not currently governed
by one transition matrix.

## Enforced Paths

Only these dedicated commands enforce their source state:

```text
SHIPPED -> DELIVERED
DELIVERED -> INSTALLED
```

All other status changes can occur through generic create/update or direct
cross-module repository writes.

## Semantic Problems

1. `STOCK` is a physical/storage state while `CUTTING/WELDING/PAINTING` are
   Production execution stages.
2. Production already owns authoritative Stage and Order state, creating two
   potential sources of truth.
3. `READY` is used for production completion/QC readiness without a formal QC
   ownership rule.
4. `SHIPPED/DELIVERED/INSTALLED` are logistics/project handoff states.
5. No rejected, held, cancelled, archived or superseded state exists.

## Proposed Alignment Questions

The Architecture Review must choose one model:

### Option A - Component Owns Full Lifecycle

Component owns every transition; Production, QC, Yard, Logistics and Projects
send commands to Components. This gives one authority but requires broad
cross-module command migration.

### Option B - Component Owns Identity/Handoff State

Production execution remains derived from Production Order/Stage. Component
owns identity, revision, QC release, Yard/dispatch/project handoff and archive.
This avoids duplicating MES stage state and is the recommended direction.

No option is approved by this audit.

## Minimum Future Matrix

A later RFC must define:

- creation state;
- production-link and fabrication projection behavior;
- QC pass/fail/hold ownership;
- ready-to-yard and shipped/delivered/installed transitions;
- archive/supersede/revision behavior;
- terminal states and correction policy;
- command idempotency and optimistic concurrency.

Until then, do not add new lifecycle commands or canonical events.

