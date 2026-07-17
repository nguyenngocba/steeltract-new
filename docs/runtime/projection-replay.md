# Projection Replay and Resume

`ProjectionReplayService` scans retained Outbox rows in stable
`createdAt, id` order, in batches of 250 by default.

## Operations

- `resume(name)`: scans the durable stream; receipts skip already-applied events.
- `rebuild(name)`: deletes only the named projection's documents, receipts,
  checkpoint and failures, then replays the retained stream.
- Unknown projection names fail before any reset or replay.

Replay is an internal administrative service. No public mutation endpoint was
added; the public Query API remains GET-only.

## Recovery Rules

Projection exceptions are recorded and rethrown. During live dispatch this keeps
the Outbox event retryable. At the Outbox retry boundary, the projection failure
is marked `DEAD_LETTER`. A later successful replay resolves that failure.

## Limitation

Replay can only reconstruct facts retained in `OutboxEvent`. Events published
before durable retention, or payload fields never emitted by the owning domain,
cannot be reconstructed and must not be inferred.
