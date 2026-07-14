# Inventory Database Assessment

Date: 2026-07-14  
Status: **HEADER/LINE PRESENT; NO SCHEMA CHANGE PERFORMED**

## Existing Relationships

```text
InventoryTransaction 1 --- N InventoryTransactionItem
InventoryItem        1 --- N InventoryTransactionItem
InventoryItem        1 --- N InventoryLocationStock
```

There is no `InventoryMovement` Prisma model. The movement ledger is represented
by immutable transaction headers and signed transaction lines; current location
balance is represented by `InventoryLocationStock`.

## Model Assessment

### InventoryTransaction

Header fields include document number, type, direction, transaction date,
project/supplier/reference, optional header warehouse/zone, remarks, performer,
and approver. `items InventoryTransactionItem[]` is already the line relation.

### InventoryTransactionItem

Each line owns:

- `inventoryItemId`
- signed `quantity`
- `unitPrice` and `totalAmount`
- `unitId`
- `warehouseId`, `zoneId`, `slotId`, and `level`

Indexes already support material history and transaction/material lookup:

- `(inventoryItemId, createdAt DESC)`
- `(transactionId, inventoryItemId)`

### InventoryLocationStock

Balance is bucketed by material and location dimensions. The index
`(inventoryItemId, warehouseId, zoneId, slotId, level)` supports exact-bucket
lookup but is not declared unique. The repository implements find/update/create
semantics and should remain the only mutation boundary.

## Data Observation

| Type | Headers | Lines | Headers with >1 line | Max distinct materials |
|---|---:|---:|---:|---:|
| IMPORT | 58 | 58 | 0 | 1 |
| EXPORT | 26 | 26 | 0 | 1 |
| TRANSFER | 10 | 20 | 10 | 1 |
| RETURN | 4 | 4 | 0 | 1 |
| ADJUSTMENT | 1 | 1 | 0 | 1 |

The database can store N lines today. Current real data does not prove N
distinct materials per document.

## Additive Extension Assessment

No new header/line tables are needed. Potential additive fields must be decided
only after command semantics are frozen:

| Candidate | Reason | Priority |
|---|---|---|
| `lineNo` | Stable ordering and user-facing line reference | Recommended |
| `lineGroupId` or movement-pair key | Reconstruct source/destination pairs for repeated material transfers | Conditional |
| per-line reason/audit JSON or typed fields | Different adjustment/count reasons and evidence per material | Conditional |
| request idempotency key on header | Prevent duplicate document creation on retry | Recommended |

Stock Take currently stores system/actual/variance evidence outside the
transaction line model. A formal Stock Take domain remains a separate business
decision; it should not force replacement of the transaction Header/Line model.

## Database Risks

1. Nested `items` currently have no explicit order; read order is not a stable
   document line order.
2. The location bucket index is non-unique, so correctness relies on repository
   behavior and existing data parity.
3. Multi-line writes increase lock duration and query count.
4. Same-bucket negative lines must be aggregated before validation.
5. Any additive migration requires a dual-write/backfill policy for old rows,
   but no migration is justified during this RFC.

## Conclusion

Database readiness is **CONDITIONALLY READY**. Header/Line is already deployed;
Option C redesign is not warranted. Option B can remain additive.

