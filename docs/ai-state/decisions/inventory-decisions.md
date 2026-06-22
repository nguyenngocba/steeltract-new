# Inventory Decisions

## INV-001: Inventory Transactions Are Required For Stock Movement

Decision:

- Receiving, outbound, transfer, adjustment, production handoff, and return flows should create Inventory transaction records and transaction item rows.

Rationale:

- Movement auditability is required for warehouse operations.

Current implementation:

- Backend transaction creation updates transaction items, location stock snapshots, and the compatibility `inventory_items.quantity` summary.

## INV-002: `inventory_location_stocks` Drives Slot/Floor Balance

Decision:

- Active slot/floor balance is stored in `inventory_location_stocks`.

Rationale:

- Warehouse 2D views and location-specific validation require real balance by warehouse, zone, slot, and level.

Current implementation:

- `InventoryLocationStock` stores `inventoryItemId`, optional `warehouseId`, `zoneId`, `slotId`, `level`, and `quantity`.
- Active stock mutation and validation use the full bucket `inventoryItemId + warehouseId + zoneId + slotId + level`.
- Material detail and location selectors read positive quantity balances.

## INV-003: Delete Non-Positive Location Rows

Decision:

- When a location balance becomes `quantity <= 0`, the snapshot row is removed.

Rationale:

- Selectors and maps should not show unusable empty balances.

Current implementation:

- `upsertLocationStock` deletes existing rows when the computed next quantity is non-positive and ignores new non-positive rows.

## INV-004: `inventory_items.quantity` Is A Snapshot

Decision:

- `inventory_items.quantity` is maintained only for backward compatibility and high-level summaries.

Rationale:

- Existing pages and modules still read item quantity directly.

Current implementation:

- Transaction creation increments the item quantity snapshot while also updating location stock.

## INV-005: General Transfer Is Main-Warehouse Only

Decision:

- Inventory transfer creation is limited to `Kho chính` locations.

Rationale:

- Production warehouse material movement is handled by production issue/return semantics, not the generic main warehouse transfer modal.

Current implementation:

- Transfer source/destination location options filter real storage zones to `warehouse.code === 'MAIN'`.

## INV-006: Warehouse Location Parent Is Required

Decision:

- New warehouse locations must be assigned to a parent warehouse.

Rationale:

- Location behavior depends on whether the zone belongs to `MAIN` or `PRODUCTION`.

Current implementation:

- Location create/edit shows `Kho chính (MAIN)` and `Kho sản xuất (PRODUCTION)` from real master warehouse data or fallback zone warehouse data, and blocks save when no parent warehouse is selected.

## INV-007: 2D Warehouse View Uses Existing Zone Occupancy

Decision:

- The current 2D warehouse view is a read/select operational view over zone occupancy and location balances.

Rationale:

- The immediate need is accurate slot/floor placement visibility in create, inbound, outbound, and transfer workflows.

Current limitation:

- Drag/drop editing, full warehouse-map management, and 3D/animated behavior are still future work.

## INV-008: Phase 1 Transaction Migration Compatibility

Decision:

- Inventory Phase 1 kept existing `InventoryItem`, `InventoryTransaction`, and `InventoryTransactionItem` entities and avoided a ledger/balance schema redesign.

Rationale:

- The system needed to remove manual stock editing and ship inbound/outbound/detail workflows without breaking existing consumers.

Compatibility strategy:

- `InventoryItem.quantity` remains a legacy snapshot for consumers outside detailed Inventory.
- The snapshot is not edited from Material Master.
- The snapshot is updated only through transaction creation.
- Inventory read paths should prioritize transaction and location-balance data where possible.

Out of scope for Phase 1:

- `InventoryLedgerEntry`.
- `InventoryBalance`.
- Lot tracking.
- Batch costing redesign.

## INV-009: Canonical Inventory Transaction Types

Decision:

- Stock-affecting workflows should map to explicit transaction intent.

Canonical intents:

- `RECEIVE`
- `ISSUE`
- `TRANSFER`
- `RETURN`
- `RESERVE`
- `ADJUSTMENT`
- `CONSUME`
- `PRODUCTION_OUTPUT`

Current implementation note:

- The active Prisma enum and UI labels may use legacy names in places, but new business logic should preserve these canonical meanings.

## INV-010: Inventory Transactions Are Immutable Audit Records

Decision:

- Posted Inventory transactions should be treated as immutable business records.

Rationale:

- Corrections must remain auditable through adjustment, return, transfer, or reversal documents.

Implications:

- Do not implement direct stock edits or silent mutation of posted stock history.
- Audit logs and realtime updates should derive from transaction creation and lifecycle events.

## INV-011: Inventory Item Detail API Rationale

Decision:

- Material detail APIs should expose current stock, inbound/outbound history, average cost, supplier history, and project consumption history from transactions and location balances.

Rationale:

- Material detail is the operational bridge between stock snapshot compatibility and transaction-first auditability.

Historical API note:

- `GET /inventory/items/:id/detail` was introduced in the transaction-first migration plan to avoid overloading simple list endpoints.

## INV-012: Transaction Rollout Risk Controls

Decision:

- Inventory migration work should account for legacy snapshot readers and historical transactions without complete line detail.

Rationale:

- Existing modules may still read `InventoryItem.quantity`; historical data may not fully support reconstructed balances.

Mitigations:

- Keep snapshot auto-sync in transaction service.
- Prefer location balance and transaction aggregates for new Inventory workflows.
- Preserve historical baseline assumptions until a full ledger reconciliation exists.

## INV-013: Transaction Item Valuation Is Persisted At Write Time

Decision:

- `inventory_transaction_items.unitPrice` and `inventory_transaction_items.totalAmount` are required operational valuation data for Inventory transaction lines.

Rationale:

- Inventory value, outbound value, project material cost, supplier history, and component costing should read valuation from transaction items instead of reconstructing it at runtime for normal records.

Current implementation:

- `InventoryService.createTransaction()` applies valuation before insert.
- Provided line `unitPrice` / `totalAmount` is preserved.
- If the client does not provide pricing, the service uses weighted average material cost from existing priced positive transaction lines.
- If no historical cost exists, the line is persisted with `unitPrice = 0` and `totalAmount = 0` so the missing valuation is explicit rather than null.
- Production material issue/return direct Inventory transaction writers and Material Movement direct writer also persist valuation fields.
- Sprint 15B backfilled historical IMPORT, EXPORT, TRANSFER, and RETURN rows with missing valuation fields using `scripts/sql/backfill-inventory-transaction-item-costs.sql`.

Implications:

- New write paths must not insert Inventory transaction items with null `unitPrice` or null `totalAmount`.
- Read-time valuation enrichment may remain as a defensive compatibility fallback, but it should not be required for newly created operational records.

## INV-014: Stock Health Uses Main Warehouse Balance

Decision:

- Inventory stock health, low-stock counts, out-of-stock counts, and purchasing alerts must use `Kho chính` / `MAIN` stock, not total stock across all warehouses.

Rationale:

- Production warehouse material is already allocated to production operations and should not hide main-warehouse purchasing shortages.

Current implementation:

- Inventory Overview and Inventory Materials compute `mainWarehouseStock`, `productionWarehouseStock`, and `totalWarehouseStock` from `item.locationBalances`.
- `MAIN` is detected by `warehouseCode === 'MAIN'` or warehouse name containing `Kho chính`.
- `PRODUCTION` is detected by `warehouseCode === 'PRODUCTION'` or warehouse name containing `sản xuất`.
- `statusOf()` / stock alert logic uses only `mainWarehouseStock`.

Implications:

- A material with `MAIN = 0`, `PRODUCTION = 250`, and `TOTAL = 250` is still `Hết hàng` for purchasing.
- A material with `MAIN <= minimumStock` is `Sắp hết hàng` even if production stock is high.
- Tables and detail views should display main, production, and total stock separately so users can see why the status was assigned.
