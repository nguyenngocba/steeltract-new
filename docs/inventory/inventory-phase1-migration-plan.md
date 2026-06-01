# SteelTrack Inventory Phase 1 Migration Plan

## Scope
Phase 1 keeps current entities:
- `InventoryItem`
- `InventoryTransaction`
- `InventoryTransactionItem`

Out of scope:
- `InventoryLedgerEntry`
- `InventoryBalance`
- Lot tracking / batch costing redesign

## Goals
1. Remove manual stock editing from material master flow.
2. Enforce stock mutation through transactions only.
3. Track transaction cost with `unitPrice` and `totalAmount`.
4. Support `supplierId` on inbound transactions.
5. Support `projectId` on outbound transactions.
6. Ship inbound and outbound operation pages.
7. Ship material detail page with current stock, inbound/outbound history, average cost.
8. Keep backward compatibility with existing repository and consumers.

## Data Compatibility Strategy
No Prisma schema change is required for this phase.

Existing fields reused:
- `inventory_transaction_items.unitPrice`
- `inventory_transaction_items.totalAmount`
- `inventory_transactions.supplierId`
- `inventory_transactions.projectId`

Compatibility bridge:
- `InventoryItem.quantity` remains as legacy snapshot for existing modules.
- Snapshot is no longer editable from UI item master.
- Snapshot is updated only inside transaction creation flow.
- Read paths in inventory module now prioritize transaction history aggregates.

## Transaction Rules (Phase 1)
- Inbound (`IMPORT`): positive quantity.
- Outbound (`EXPORT`): negative quantity.
- Cost fields:
  - `unitPrice`: optional.
  - `totalAmount`: if absent and `unitPrice` present, computed as `unitPrice * quantity`.
- Outbound validation checks available stock before posting.

## API Changes
- Existing route remains: `POST /inventory/transactions`
- Existing route remains: `GET /inventory/transactions`
- New route: `GET /inventory/items/:id/detail`

`GET /inventory/items/:id/detail` returns:
- current stock (from transaction item aggregate)
- inbound history
- outbound history
- average cost (weighted by inbound value / inbound quantity)
- supplier history
- project consumption history

## Frontend Changes
- `MaterialDrawer`:
  - Remove quantity edit field.
  - Keep master-data fields only.
- Inbound page:
  - Material, quantity, supplier, invoiceNo, unitPrice.
- Outbound page:
  - Material, quantity, project.
- Material detail page:
  - Current stock
  - Average cost
  - Inbound history
  - Outbound history

## Rollout Sequence
1. Deploy backend transaction-first logic.
2. Deploy UI changes (material drawer + inbound/outbound + detail page).
3. Monitor transaction creation and compare item snapshot vs aggregated stock.
4. After stable period, proceed to Phase 2 ledger/balance architecture.

## Risks and Mitigations
- Legacy modules still reading `InventoryItem.quantity`:
  - Mitigation: keep snapshot auto-sync in transaction service.
- Historical transactions without items:
  - Mitigation: stock now reflects transactions going forward; legacy baseline remains in snapshot.
- Supplier relation not enforced by FK:
  - Mitigation: preserve existing compatibility, validate IDs at service layer in next phase.
