# EPIC186 Components Foundation Report

Date: 2026-07-17  
Status: **BLOCKED - ARCHITECTURE FIRST AUDIT COMPLETE**

## Scorecard

| Capability | Result |
| --- | --- |
| Repository pattern | PASS |
| Atomic local transactions | PASS/PARTIAL |
| ADR011 core paths | PASS |
| Dashboard snapshot | PASS |
| Runtime metrics | PASS |
| Operations Center | PASS |
| Component aggregate ownership | BLOCKED |
| Lifecycle/state transitions | BLOCKED |
| Material-flow ownership | BLOCKED IN ACTIVE UI |
| Canonical event completeness | PARTIAL |
| Secondary workspace read models | PARTIAL |
| Production integration contract | PARTIAL |

## Stop Decision

No domain code was implemented because the following are unresolved:

1. Component status mixes fabrication, stock, QC and logistics concepts.
2. Generic API update can bypass the two guarded transitions.
3. Multiple module repositories write Component directly.
4. Revision/release/archive domains do not exist.
5. Components Material Stock UI reconstructs Production/Inventory state and
   posts generic Inventory returns directly.
6. Create/delete/costing and cross-module writes lack complete canonical event
   coverage.

## Recommended Roadmap

### EPIC187A - Components Domain Alignment

Approve aggregate ownership, Option A/B lifecycle model, revision/archive
policy, QC/Yard/Logistics handoff authority, internal command boundary and
canonical event catalog.

### EPIC187B - Component Command Foundation

Implement the approved state machine, typed commands, optimistic concurrency,
idempotency and atomic events. Preserve existing API compatibility. Any schema
change requires separate explicit migration approval.

### EPIC187C - Cross-module Boundary and Material Workspace

Replace direct Component writes with a transaction-aware internal command
boundary. Replace client-side material reconstruction and generic Inventory
return with Production-owned read/command contracts.

### EPIC187D - Secondary Read Models and Certification

Add bounded Production, Stock, Material Stock, Transfer and QC projections;
remove hardcoded data; validate event-to-snapshot parity and operator flows.

Only after these gates should EPIC188 Components Cockpit UI proceed.

## Final Conclusion

```text
Components Domain Foundation
STATUS: BLOCKED
```

Estimated work: one alignment sprint plus three focused implementation sprints.
The existing Core Platform remains valid and must be reused, not rewritten.

