# Projection Replay Validation

## Preconditions

- Use an isolated restored staging database and verified backup.
- Disable normal worker processing for controlled replay where required.
- Record the projection catalog, schema versions, document counts, checkpoints,
  active failures and Outbox boundary before replay.
- Confirm adequate database/WAL/disk capacity.
- Never invoke rebuild on production as an exploratory test.

```bash
curl --fail-with-body -H "Authorization: Bearer $ACCESS_TOKEN" \
  "$BASE_URL/query-api/projections"
curl --fail-with-body -H "Authorization: Bearer $ACCESS_TOKEN" \
  "$BASE_URL/query-api/projections/health"
```

The current public Query API is GET-only; replay is an internal application
service. Execute it only through an approved one-off staging runner built from
the same image. Do not add a public replay route.

## Resume Test

For each registered projection:

1. Capture checkpoint and document hashes/counts.
2. Run `resume` with a bounded batch (start with 250) and event ceiling.
3. Interrupt the runner between batches.
4. Restart with the same projection and resume mode.
5. Require cursor advancement without duplicate receipts/documents.
6. Record scanned, matched, truncated, duration and events/second.

The implementation bounds batch size to 10-2000 and one invocation to at most
1,000,000 events. Start low and increase only after database/WAL evidence.

## Rebuild Test

Rebuild resets one projection. Run only after backup and on isolated staging:

1. Export the projection's documents/checkpoint/receipt metadata for evidence.
2. Stop dependent benchmark reads or expect temporary no-data behavior.
3. Rebuild from the beginning with bounded runs until `truncated=false`.
4. Require active failures = 0 and checkpoint status healthy.
5. Compare canonicalized document hashes with the pre-rebuild authoritative
   result. Explain expected differences caused by newly retained events only.

## Idempotency And Determinism

- Resume twice from the completed checkpoint: no document/receipt change.
- Replay the same Outbox range twice: reducer result hashes remain equal.
- Restart after a forced process kill: checkpoint resumes after the last durable
  batch and duplicate event receipts are ignored.
- Run two replay attempts for the same projection only if the controlled test is
  designed to prove receipt uniqueness; normal operations must serialize them.
- Confirm replay performs no Aggregate or business-table mutation.

## Failure And Poison Event

Inject a staging-only malformed copy through the approved fixture mechanism,
not by altering a real domain event. Verify failure persistence, retry bounds,
health degradation and operator visibility. Correct or quarantine the fixture,
then prove resume continues. Never silently advance a failed authoritative fact.

## Parity And Acceptance

For every projection record classification (`AUTHORITATIVE` or known
`NON-AUTHORITATIVE`), source event range, documents, processed/failed counts,
lag, throughput and parity result. PASS requires deterministic hashes,
idempotent receipts, resumability, zero active failure, no Aggregate reads and
recovery of query latency after rebuild.

