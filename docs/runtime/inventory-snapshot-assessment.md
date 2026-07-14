# Inventory Snapshot and Runtime Assessment

Date: 2026-07-14  
Status: **NO NEW SNAPSHOT MODEL REQUIRED**

## Snapshot Model Classification

| Snapshot | Grain | Multi-material impact |
|---|---|---|
| `InventoryDashboardSnapshot` | Warehouse/day aggregate | Recalculation consumes line facts; no schema change |
| `InventoryMaterialSnapshot` | Material and optional warehouse scope | One affected material per domain snapshot; fan-out required |
| `InventoryLocationSnapshot` | Warehouse/zone/slot/level aggregate | Rebuilt from location balances; no header/line coupling |

Snapshots do not persist a transaction header or transaction line copy. They
are aggregates/read models derived from Inventory source-of-truth tables.

## Current Event and Writer Behavior

The canonical create path writes:

- one `inventory.transaction.created` event with `itemCount`;
- one `inventory.stock_bucket.updated` event per affected line/bucket.

The shared event consumer routes these events through
`SnapshotUpdateDispatcher`. `SnapshotWriterService` recalculates Dashboard,
material, and location snapshots in the background. This remains compatible
with multiple materials because bucket events carry `inventoryItemId`.

## Risks to Validate

1. Duplicate lines can generate duplicate bucket events. Event idempotency keys
   include transaction/material/location, so duplicate identical bucket lines
   can collide. Lines must be grouped or event IDs must represent normalized
   affected buckets intentionally.
2. The transaction-level event has only `itemCount`, not all material IDs. This
   is acceptable only because per-bucket events are guaranteed atomically.
3. Inventory writer currently recalculates all location snapshots and dashboard
   rows for an update. Large multi-line documents can amplify background work
   and should be measured before choosing the line cap.
4. Snapshot freshness remains eventual. Operator workspaces must continue to
   use repository live read models under ADR011.
5. Snapshot parity must compare each affected material and bucket after a batch,
   not only the first line.

## Runtime Metrics

Existing request latency, SQL count/time, snapshot hit/miss/age/lag, fallback,
read-model hit, Outbox, and background-job metrics remain valid. No new Runtime
framework or Operations Center screen is required.

Implementation validation should report:

- line count and distinct material count per tested document;
- request latency and SQL count by line-count bands;
- Outbox rows and unique affected buckets;
- snapshot jobs enqueued/coalesced;
- max snapshot lag and parity result for every affected material/location.

These are dimensions/reporting additions, not new metric semantics.

## Operations Center

Existing Inventory Platform Health remains applicable. Optional future detail
may expose batch size or failed line validation counts, but multi-material
support does not require an Operations Center contract or UI change.

## Conclusion

Snapshot/Runtime readiness is **CONDITIONALLY READY**. Keep the current shared
engine and harden event fan-out/idempotency tests; do not create a snapshot per
transaction screen.

