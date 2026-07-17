# Production-Inventory Command And Response Contract

Date: 2026-07-17  
Status: **APPROVED - ADS003.5; IMPLEMENTATION CONTRACT DEFERRED**

## Inventory Query Contract

Production may request live availability using:

```text
GetInventoryAvailability(materialId, warehouseId, zoneId, slotId, level)
```

The response contains the exact bucket identifiers, physical on-hand quantity,
unit, query timestamp and consistency/version token when supported. It does not
subtract Production reservations; Production owns that allocation projection.

## Inventory Posting Commands

The internal owner-exported commands are conceptual contracts. ADS003.5 does
not change the current API or TypeScript interface.

### IssueInventoryMaterial

Required semantics:

- `referenceModule = production`;
- stable Production issue/domain record reference;
- actor and reason;
- one or more exact material/location/quantity lines;
- stable idempotency key.

### ReturnInventoryMaterial

Required semantics are the same, with an approved Inventory destination bucket
and correlation to the original Production Issue.

### ReceiveRecoveredScrap

Used only when an approved recoverable Scrap disposition becomes Inventory
stock. It requires the Production Scrap id, approved Inventory item identity,
destination bucket, quantity/unit, valuation basis and idempotency key.

## Posting Receipt

Inventory returns a bounded receipt, not a full entity graph:

```text
InventoryPostingReceipt
  postingId / inventoryTransactionId
  transactionCode
  referenceModule
  referenceId
  postingKind
  postedAt
  lines[]:
    materialId
    warehouseId / zoneId / slotId / level
    postedQuantity
    unitPrice / totalAmount when applicable
    resultingBucketQuantity
  inventoryAggregateVersion or consistency token when supported
```

Production stores only required identifiers and quantities for traceability. It
does not copy Inventory balance as its own source of truth.

## Idempotency

The caller provides a stable key based on the immutable Production domain
record, for example `production:issue:<issueId>` or
`production:return:<returnId>`. Repeating the same key and semantic payload
returns the original receipt without a second stock movement. Reusing a key
with different semantics is a conflict.

## Failure Contract

Inventory returns typed owner errors:

- material or location not found;
- insufficient exact-bucket stock;
- invalid destination/warehouse policy;
- invalid quantity/unit;
- valuation unavailable or invalid;
- idempotency conflict;
- optimistic/concurrency conflict.

Any Inventory posting failure aborts the shared transaction. Production must
not write a successful ledger/event, retry silently with another bucket or
apply a compensating stock mutation.

## API Boundary

These are internal application contracts. They do not introduce a public HTTP
endpoint, change current request/response JSON or authorize direct Repository
dependency. A later implementation RFC must map them additively.

