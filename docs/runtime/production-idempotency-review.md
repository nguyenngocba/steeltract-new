# Production Idempotency Review

Date: 2026-07-17  
Status: **PASS**

- `Idempotency-Key` is mandatory and bounded to 200 characters.
- Canonical commands persist `<key>:<eventName>` in the repository-atomic
  Outbox together with a stable command hash.
- Exact replay loads and returns the persisted aggregate/record result before
  mutation, timeline, ActivityLog or Outbox creation.
- Reusing one key with a different command hash returns HTTP 409.
- Scrap Draft uses its durable command key/hash because Draft has no canonical
  domain event.
- Scrap Cancel uses its atomic audit Outbox receipt.
- Rework now replays through its canonical Outbox; the same QC request with a
  different command is a conflict rather than a silent replay.

Tests prove an exact Create replay creates one aggregate, one timeline, one
ActivityLog and one pair of audit/domain Outbox rows.
