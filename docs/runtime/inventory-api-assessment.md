# Inventory API Assessment

Date: 2026-07-14  
Status: **ARRAY CONTRACT PRESENT; ROLLOUT HARDENING REQUIRED**

## Canonical Endpoint

`POST /inventory/transactions` validates through `createTransactionSchema` and
calls `InventoryService.createTransaction()`.

The current contract accepts both:

```json
{
  "type": "INBOUND",
  "materialId": "legacy-material-id",
  "quantity": 10
}
```

and the preferred array form:

```json
{
  "type": "INBOUND",
  "items": [
    {
      "inventoryItemId": "material-a",
      "quantity": 10,
      "warehouseId": "warehouse-id",
      "zoneId": "zone-id",
      "slotId": "A01",
      "level": "L2",
      "unitPrice": 18500
    }
  ]
}
```

The legacy scalar fields are normalized into one line. Keeping them during an
additive rollout preserves backward compatibility.

## Endpoint Impact

| Endpoint/path | Current capability | Required change |
|---|---|---|
| `POST /inventory/transactions` | Accepts `items[]` | Add batch limits, idempotency, duplicate-bucket validation, structured line errors |
| `GET /inventory/transactions` | Header pagination; returns included lines | Keep; define list summary semantics for N lines |
| `GET /inventory/transactions/:id` | Returns all lines | Keep; add stable line order if persisted |
| material history via transaction query | Filters headers by `items.some`, returns matching material lines | Keep material-scoped behavior; detail fetch retains full document context |
| Return Request APIs | Already accept item arrays | Remove first-item-only summaries; no breaking contract required |
| internal `InventoryPostingService` | Accepts `lines[]` | Harden batch stock validation; no public API change |
| Material Movement runtime path | Single-line direct writer | Route to canonical command in later sprint |

## Additive Command Shape

Transfer should not ask clients to construct anonymous signed rows. A safer
additive command adapter is:

```json
{
  "type": "TRANSFER",
  "transferItems": [
    {
      "inventoryItemId": "material-a",
      "quantity": 10,
      "source": { "zoneId": "z1", "slotId": "A01", "level": "L1" },
      "destination": { "zoneId": "z2", "slotId": "B02", "level": "L2" }
    }
  ]
}
```

The service can normalize this into the existing signed transaction lines. The
existing raw `items[]` form remains valid for compatibility until consumers are
migrated.

## Validation Requirements

- Set an explicit maximum lines per request after measurement.
- Reject zero, non-finite, duplicate-invalid, or unsupported signed quantities.
- Validate location fields for each applicable line, not only at header level.
- Group source deductions by complete stock bucket before availability checks.
- Return line-indexed errors so Pending Items can focus the failing material.
- Define whether duplicate material/bucket lines merge or are rejected.
- Add a client idempotency token without changing existing response fields.
- Keep one response header containing the complete persisted `items[]` array.

## Compatibility Conclusion

The API can evolve **additively**. No route removal or response break is needed.
The current untyped frontend `createTransaction(payload: any)` should eventually
adopt the existing `TransactionPayload` array type, but that is implementation
scope rather than an RFC change.

