# Production-Inventory Boundary Report

Date: 2026-07-11

Status: **APPROVED**

## Ownership

Inventory remains the sole writer for:

* `inventory_items`
* `inventory_location_stocks`
* `inventory_transactions`
* Inventory Outbox events associated with stock posting

Production repositories no longer create, update, or delete rows in those
tables. Production may still read Inventory data for BOM availability,
reservation preview, costing, and return-location selection. All stock mutation
is delegated to `InventoryPostingService`, which validates and persists through
`InventoryRepository`.

## Boundary

```text
Production application service
  -> Production repository transaction
     -> Production records
     -> InventoryPostingService
        -> InventoryRepository validation
        -> InventoryTransaction
        -> Inventory item compatibility quantity
        -> Inventory location stock
        -> Inventory Outbox
     -> Production ledger/status
  -> commit or rollback as one unit
```

No public Inventory API, Inventory business rule, Production lifecycle, schema,
UI, snapshot framework, runtime platform, or Operations Center behavior changed.

## Ownership Audit Result

The Production module still contains Inventory table reads. The write audit for
`inventoryItem`, `inventoryLocationStock`, and `inventoryTransaction` returns no
Production repository/service mutation. This sprint intentionally does not move
read-model queries; its acceptance boundary is write ownership.
