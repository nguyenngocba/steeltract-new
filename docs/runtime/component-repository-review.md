# Component Repository Review

Date: 2026-07-17  
Status: **PASS**

`ComponentsRepository` remains the only Prisma boundary for Component command
handling. It now provides:

- aggregate/revision/BOM reads;
- transaction ownership;
- optimistic Component/Revision/BOM updates;
- revision, BOM and release-evidence creation;
- release-history and idempotency lookup;
- timeline, ActivityLog and Outbox persistence.

`ComponentCommandService` has no direct model access through Prisma or a
transaction client. Release updates the prior Revision/BOM, new Revision/BOM,
Component current release, immutable evidence, timeline/audit and Outbox before
one commit. A version conflict rolls the complete command back.

Repository methods contain persistence and concurrency mechanics only; state
transition decisions remain in domain aggregates.

`ComponentCommandController` performs authentication, strict request validation
and command-context construction only. It has no Prisma dependency and cannot
bypass `ComponentCommandService -> ComponentsRepository`.
