# Component Command Implementation Report

Date: 2026-07-17  
Status: **PASS**

`ComponentCommandService` implements the AD-016 owner commands:

- identity: create, metadata update, deprecate, reactivate and archive;
- revision: create, content update, submit, return, approve, withdraw approval,
  release and archive;
- engineering BOM: replace content and validate.

Every command carries actor and idempotency context. Mutating existing
aggregates requires an expected version. Repository `updateMany` compares and
increments that version atomically; stale commands return a conflict. A prior
canonical Outbox fact with the command key is treated as an idempotent replay.

The service contains orchestration and invariant invocation only. All Prisma
reads/writes and transaction ownership remain in `ComponentsRepository`.
Archive accepts owner-contract clearance for Production, QC, Yard, Logistics
and Projects and does not query their persistence.

RFC003 now exposes the approved subset through strict additive command DTOs:
Create Component, Create Revision, replace/validate Engineering BOM, submit
review, approve, release, deprecate and archive. Every HTTP mutation requires
JWT and `Idempotency-Key`; all existing aggregate mutations require the
appropriate positive `expectedVersion`.
