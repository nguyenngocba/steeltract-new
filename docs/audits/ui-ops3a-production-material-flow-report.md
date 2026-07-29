# UI.OPS.3A - Production Material Flow Canonicalization Report

Date: 2026-07-28
Status: IMPLEMENTED WITH RUNTIME FIXTURE BLOCKED

## Current Flow

Intended flow:

Material Master -> Main Warehouse Inventory -> Inventory TRANSFER -> Production
Warehouse balance -> Production availability -> BOM planning -> Reservation ->
Issue -> Consumption.

Before this sprint, the UI label `Kho vật tư sản xuất` had already been applied,
but several code paths still mixed current production stock with historical
transaction remarks.

## Regression Root Cause

Static trace found two legacy stock derivation paths:

- `BOMService.create()` called `ensureProductionStockForBom()`, which rejected
  Engineering BOM creation when current production stock was lower than BOM
  quantity. The stock calculation used `findProductionInventoryTransactions()`
  and `[COMPONENT_PRODUCTION]` / `[COMPONENT_PRODUCTION_RETURN]` remarks.
- `ProductionService.materialRequirements()` and automatic issue planning used
  a private `productionStockBuckets()` helper that reconstructed Production
  stock from the same remarks-derived transaction history.

This was not canonical because:

- Engineering BOM is a material requirement definition, not an inventory
  reservation.
- Production Material Warehouse current availability must come from
  `inventory_location_stocks`, not from UI remarks.
- Material Master may be selected for BOM even when Production stock is zero.

## Canonical Flow

Canonical source of current Production stock:

- `InventoryLocationStock`
- warehouse code `PRODUCTION`
- positive bucket quantity by material/warehouse/zone/slot/level

Production availability:

- production balance from `InventoryLocationStock`
- minus active reservation quantity
- minus issued production material where appropriate for issue planning

Engineering BOM:

- stores Material Master identity and required quantity/waste/category
- does not create stock
- does not transfer stock
- does not reserve stock
- does not create ComponentInstance
- does not create ProductionOrder

## Source Of Truth

- Material identity: `InventoryItem`
- Current warehouse balance: `InventoryLocationStock`
- Production reservation: `ProductionMaterialReservationLine`
- Production issue: `ProductionMaterialIssue`
- BOM definition: `BOM` / `BOMItem`

## Changes

Backend:

- `InventoryService.createTransaction()` now preserves transfer event metadata
  for net-zero material transfers. `InventoryItem.quantity` remains unchanged,
  while source/destination buckets are posted and `inventory.transferred` can be
  emitted with resulting stock.
- `BOMService.create()` no longer blocks Engineering BOM creation based on
  current Production warehouse stock.
- `ProductionService.productionStockBuckets()` now reads
  `InventoryLocationStock` in warehouse `PRODUCTION` and subtracts issued
  production material instead of reconstructing stock from remarks.

Frontend:

- `ProductionBomModal` uses Material Master identity plus Production stock
  enrichment from `locationBalances`.
- BOM picker rows show material code, name, specification/profile when present,
  unit, Production stock and available quantity.
- BOM side summary shows selected material availability, reserved quantity,
  shortage and Production locations.
- `ComponentsMaterialStockPage` now derives reserved/available from active
  Production reservations and current Production location balances.
- Production material recent/history rows now detect real PRODUCTION
  transaction lines instead of relying on `[COMPONENT_PRODUCTION]` remarks.
- Return from Production stock to Main warehouse now uses transaction
  `TRANSFER`, preserving warehouse-to-warehouse movement semantics.

## Existing Data Handling

No historical records were blindly backfilled.

Attempted read-only runtime DB evidence with PrismaClient failed because the
local Node runtime could not reach PostgreSQL at `localhost:5432`. Therefore no
existing data repair/backfill was attempted.

`prisma migrate status` reported the schema as up to date, but direct
PrismaClient read smoke remained blocked in this shell. Runtime OPS3 fixture
creation must be rerun once the application DB/API runtime is reachable.

## Production Warehouse Results

Source-code result:

- Production stock readers now point to `InventoryLocationStock`.
- Reservation reads already used the same canonical balance model and remained
  unchanged.
- BOM creation is decoupled from physical stock availability.

Runtime result:

- OPS3 real API fixture not executed due DB connectivity blocker.

## BOM Integration

The BOM UI now exposes:

- Material Master identity
- Unit
- Production stock
- Reserved quantity
- Available quantity
- Production locations
- Shortage against the entered BOM line quantity

Zero-stock Material Master rows remain selectable, with explicit
`Ton SX = 0`, `Kha dung = 0`, and shortage shown in the side summary.

## Runtime Fixture

Requested fixture namespace: `OPS3-*`.

Status: BLOCKED.

Reason: direct PrismaClient read smoke failed with
`Can't reach database server at localhost:5432`.

No direct DB writes were performed. No fixture data was fabricated.

## Quantity Reconciliation

Unit coverage verifies the canonical conservation behavior:

- MAIN -> PRODUCTION transfer does not update total `InventoryItem.quantity`.
- Source bucket receives a negative delta.
- Destination bucket receives a positive delta.
- Transfer event payload preserves resulting source and destination balances.

Example tested:

- Starting total snapshot: 100
- Transfer: 40
- Source resulting balance: 60
- Destination resulting balance: 40
- Total material snapshot remains 100

## Tests

Added/updated:

- `inventory.service.multi-material.spec.ts`
  - MAIN -> PRODUCTION transfer quantity conservation
  - source/destination bucket posting
  - transfer event metadata
- `bom.service.spec.ts`
  - Engineering BOM can be created for a Material Master row without requiring
    current Production stock
- `production-material-availability.service.spec.ts`
  - Production material availability reads Production location balances
  - issued production material is subtracted
  - zero Production stock material reports shortage

Verification:

- `pnpm -C apps/backend-api exec prisma validate`: PASS
- `pnpm -C apps/backend-api exec prisma migrate status`: PASS
- targeted backend tests: PASS
- full backend tests: PASS, 81 suites / 252 tests
- `pnpm -C apps/frontend test`: PASS
- `pnpm -C apps/backend-api build`: PASS
- `pnpm -C apps/frontend build`: PASS, existing Vite chunk-size warning only

## Remaining Risks

- Runtime OPS3 fixture must be executed once local/staging DB and API are
  reachable from the shell/browser harness.
- Existing historical `[COMPONENT_PRODUCTION]` records were not reconciled into
  destination balances. A controlled backfill should only be designed after
  proving each historical transfer has authoritative source/destination lines.
- Production material recent transaction display depends on transaction API
  line warehouse/zone enrichment.

## Next Sprint

UI.OPS.3B should focus on operator workflow UX:

- production material transfer smoke through real UI/API
- create Material Master from BOM if the existing Inventory create flow can be
  safely reused
- browser screenshot certification for `Kho vật tư sản xuất` and BOM modal
- controlled OPS3 fixture setup and cleanup procedure
