# Production Concurrency Review

Date: 2026-07-17  
Status: **PASS**

Command DTOs require positive `expectedVersion` for every command targeting an
existing Production Order, Work Order, Completion, Scrap or Rework aggregate.
Repository updates use
`WHERE id = ? AND aggregateVersion = ?` and increment the version atomically.

Append commands also establish an explicit concurrency boundary. Completion
recording and Scrap Draft creation atomically increment the parent Production
Order version before inserting the child record. Rework accept/reject atomically
increment the original Production Order version. Completion reversal checks the
Completion version, while Scrap and Rework transitions update their own version.

If no row matches, `ProductionCommandService` raises `ConflictException`.
Because the exception occurs inside the repository transaction, no timeline,
ActivityLog, audit Outbox or domain Outbox is committed.

Create Order is the only command without `expectedVersion`; its aggregate does
not exist yet. It is protected by the durable idempotency key and unique order
number.

Regression coverage confirms stale Order cancellation returns Conflict and
writes no Outbox event. DTO coverage also rejects append commands that omit the
parent aggregate version.
