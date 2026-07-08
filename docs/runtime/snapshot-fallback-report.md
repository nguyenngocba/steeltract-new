# Snapshot Fallback Report

Date: 2026-07-08

## Fallback Reasons

The dashboard reader falls back to runtime aggregate for:

1. `disabled`
2. `missing`
3. `stale`
4. `mismatch`

## Behavior

Fallback is transparent to clients.

Existing API response contracts remain unchanged.

## Module Results

Inventory:

- Snapshot read is active when today's warehouse snapshots exist and parity passes.
- Current smoke test recorded snapshot hits with no fallback.

Projects:

- Snapshot read is active for project progress/delay dashboard values when project snapshots exist and parity passes.
- Current smoke test recorded snapshot hits with no fallback.

Logistics:

- Current dataset has no dispatch orders and no dispatch snapshots.
- The strategy records snapshot miss and fallback to runtime aggregate.

## Safety

Mismatch handling is conservative:

```text
snapshot result
runtime result
  -> compare selected business fields
  -> warning on mismatch
  -> return runtime result
```

This keeps users insulated from stale or divergent snapshots while preserving observability.

