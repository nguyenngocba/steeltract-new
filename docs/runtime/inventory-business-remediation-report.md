# EPIC117.1 Inventory Business P0 Remediation

Date: 2026-07-09

## Scope

This sprint remediated the four P0 findings from EPIC117 without changing the
frontend, public API shape, Prisma schema, or Inventory workflow.

## P0 Results

### P0.1 Material Snapshot Reconciliation

Root cause:

`InventoryMaterialSnapshot.currentStock` was calculated from the sum of
historical `inventory_transaction_items`. The canonical live stock source is
`inventory_location_stocks`. Legacy transactions do not contain a complete
opening-balance history, so transaction reconstruction produced stale values.

Fix:

- Material snapshot `currentStock`, `availableStock`, and inventory value now
  use live location balances.
- Inbound/outbound history and cost remain transaction-derived.
- No snapshot row was manually updated.
- Reconciliation used `inventory.material.updated` persistent outbox events,
  `snapshot.inventory.update` background jobs, and the existing snapshot writer.

Runtime evidence:

- 3 reconciliation outbox events: `DISPATCHED`.
- 3 inventory snapshot jobs: `COMPLETED`.
- Material parity: 23 checked, 0 mismatches.
- `inventory_items.quantity` parity: 23 checked, 0 mismatches.

### P0.2 Formal Validation

Inventory command bodies now use parameter-scoped `ZodValidationPipe` and typed
DTOs. `InventoryController`, category, unit, and material-type controllers no
longer contain `@Body() any`.

Invalid inbound lines return HTTP 400 with:

`Vui lòng chọn vị trí lưu kho cho tất cả vật tư nhập.`

### P0.3 Transaction Line Contract

The transaction schema now preserves and validates:

- `warehouseId`
- `zoneId`
- `slotId`
- `level`
- `unitPrice`
- `totalAmount`

Compatibility is retained for `INBOUND`/`OUTBOUND` aliases, line arrays, and
the legacy single-material payload. Backend-owned document numbering remains
unchanged.

### P0.4 Stock Take Decision

The existing stock-take screen posts auditable `ADJUSTMENT` transactions. It is
retained for Business Freeze v1.0 because replacing it would change workflow.

Enterprise Phase 2 proposal:

`StockTakeSession -> OPEN -> COUNTING -> REVIEW -> APPROVED -> ADJUSTMENT_POSTED -> CLOSED`

The future model should freeze a location scope, preserve count lines and
recounts, require approval before posting variance, and link the resulting
immutable adjustment transaction. See the freeze report for the trade-offs.

## Boundary Check

- Repository boundary: preserved.
- Event/outbox: preserved.
- Background snapshot writer: preserved.
- Snapshot-first read path: preserved.
- UI/API response contract: unchanged.
- Prisma schema/migration: unchanged.

