# Inventory Multi-material Foundation Report

Date: 2026-07-14  
Status: **APPROVED WITH EXPLICIT LIMITATIONS**

## Scope Completed

- The canonical Inventory command continues to persist one header with N lines.
- Original lines remain immutable audit evidence; stock validation and balance
  mutation now aggregate duplicate material/location buckets first.
- Compatibility item quantity updates are aggregated once per material.
- Location-stock updates and `inventory.stock.changed` events are emitted once
  per affected bucket, not once per duplicate request line.
- Transfer lines are validated and ordered deterministically per material.
- Return metadata, dashboard activity, transaction history/CSV, location
  activity, Inbound history, Transfer reporting and Adjustment summaries no
  longer discard all but the first line.
- `MaterialMovementsService` no longer accesses Prisma directly. Persistence and
  its transaction-created Outbox event use `InventoryRepository.transaction()`.

## Bucket Identity

The current schema supports this key:

`materialId + warehouseId + zoneId + slotId + level`

Lot and serial are not present on `InventoryTransactionItem` or
`InventoryLocationStock`; no unsupported identity was invented. If those fields
are added later, the bucket key must be extended in the same approved migration.

## Preserved Platform Boundaries

- Public API: unchanged; scalar compatibility and canonical `items[]` remain.
- Prisma schema/migrations: unchanged.
- Atomic Outbox and Snapshot Engine: unchanged.
- UI layout, styling, drawer and Pending Items: unchanged.
- Inventory remains the stock source of truth.

## Verification Evidence

- Focused tests: 3 suites, 10 tests PASS.
- Backend build: PASS during implementation.
- Frontend build: PASS during implementation.
- No schema or migration diff.

## Limitations

1. One transfer may contain multiple materials, but each material currently
   supports exactly one source and one destination. Multiple pairs for the same
   material are rejected because no persisted pair/line identifier exists.
2. Stable-reference callers receive idempotency using
   `type + referenceModule + referenceId`. Public requests without a stable
   caller key cannot be made durably idempotent without an additive API/schema
   decision.
3. `MaterialMovementsService` preserves its legacy non-stock movement behavior;
   it is repository-compliant but is not a replacement for the canonical stock
   posting endpoint.

These limitations do not reintroduce one-material assumptions into the
canonical Inventory business path, but they are gates for broader UI rollout.
