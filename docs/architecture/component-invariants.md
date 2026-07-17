# Component Domain Invariants

Date: 2026-07-17  
Status: **APPROVED - ADS002**

## Identity Invariants

1. Component code is stable and unique for the lifetime of the identity.
2. Archive never deletes engineering or audit history.
3. `ACTIVE` requires one current released revision.
4. `ARCHIVED` is terminal and cannot accept new revisions or references.
5. Component state never stores Production, QC, stock, Yard, Logistics or
   Project truth.

## Revision Invariants

1. Revision number is unique within a Component.
2. A Component has at most one current `RELEASED` revision.
3. `RELEASED`, `SUPERSEDED` and `ARCHIVED` revision content is immutable.
4. A released revision always identifies the exact BOM content hash released.
5. Releasing a replacement and superseding the prior current revision are one
   atomic transaction.
6. Downstream references remain bound to the original revision even after it is
   superseded or archived.
7. Approval evidence is retained when approval is withdrawn or review returned.

## BOM Invariants

1. One engineering BOM definition belongs to one Component Revision.
2. A BOM cannot be independently released from its revision.
3. Review and release require a validated BOM.
4. Any engineering content edit invalidates BOM validation and revision
   approval.
5. BOM lines have positive quantities, explicit units and deterministic line
   identity; duplicate/circular references must be rejected by validation.
6. Production copies or references a released BOM revision and cannot mutate
   the Components engineering definition.

## Release And Archive Invariants

1. Release cannot roll back to an editable state.
2. Release withdrawal is allowed only when no downstream context has accepted
   the revision reference.
3. A Component must be deprecated before an active identity can be archived.
4. Archive requires owner-contract confirmation that no open Production, QC,
   Yard, Logistics or Project obligation needs a new transition.
5. Archive is a visibility/selection policy, not hard deletion.

## Consistency Invariants

1. Aggregate mutation, timeline/audit evidence and domain Outbox commit in one
   repository transaction.
2. Commands use expected aggregate version and stable idempotency key.
3. Snapshots/read models are projections and cannot authorize commands.
4. Only Components application services issue Component/Revision/BOM commands.
5. Foreign facts may update projections but never bypass the state machine.

