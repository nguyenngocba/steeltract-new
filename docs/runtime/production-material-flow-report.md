# EPIC135B Production Material Flow

Date: 2026-07-11

## Result

The Production material command path now uses the EPIC135A boundary end to end:

```text
Production service
  -> Production repository transaction
  -> InventoryPostingService (Issue/Return only)
  -> Production material ledger
  -> Production canonical Outbox
  -> commit
```

## Flow Coverage

| Flow | Inventory stock | Production ledger | Canonical event | Result |
|---|---|---|---|---|
| Draft reservation | Unchanged | None | None | PASS |
| Reserve | Unchanged | `RESERVE` | `production.material.reserved` | PASS |
| Release/expire allocated quantity | Unchanged | `RELEASE` | `production.material.released` | PASS |
| Issue | Reduced by InventoryPostingService | `ISSUE` | `production.material.issued` | PASS |
| Consume | Unchanged (already issued) | `CONSUME` consumed quantity only | `production.material.consumed` | PASS |
| Return | Increased by InventoryPostingService | `RETURN` | `production.material.returned` | PASS |

Manual Issue and Draft-to-Issued paths now write the same Production ledger
semantic as Reservation Issue. Scrap remains persisted in the existing
consumption record for compatibility but is excluded from the `CONSUME` ledger,
canonical consumed event, and Production snapshot consumed quantity.

## Boundary Safety

Production does not write Inventory tables. Issue and Return reuse the
Inventory-owned posting service with the same Prisma transaction client.
Inventory transaction, valuation, item/location stock, and Inventory Outbox
remain Inventory-owned.

