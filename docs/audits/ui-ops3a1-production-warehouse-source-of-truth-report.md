# UI.OPS.3A.1 - Production Warehouse Source-of-Truth Fix

Date: 2026-07-29

Status: **IMPLEMENTED - TEST/BUILD PASS, RUNTIME HTTP SMOKE BLOCKED BY DB CONNECTIVITY**

## Objective

Fix the remaining mismatch between Material Master, Main Warehouse stock and
Production Warehouse stock before UI.OPS.3C.

Canonical V1 rule:

```text
Material Master
  -> MAIN warehouse stock
  -> transfer / issue to PRODUCTION warehouse
  -> Production Warehouse material stock
  -> BOM planning / reservation
  -> issue / consumption
```

`PRODUCTION` stock is physical/logical material custody for manufacturing. It
is not Component Inventory and it must not be derived from transaction remarks.

## Root Cause

The visible empty state in **Kho vật tư sản xuất** and the weak BOM picker
source was caused by `GET /inventory/items`.

Before this sprint:

- `/inventory/items` returned item identity and aggregate quantity.
- it did **not** expose canonical `InventoryLocationStock` balances.
- frontend pages already expected `item.locationBalances` and filtered for
  warehouse `PRODUCTION`.
- because the API omitted `locationBalances`, Production Warehouse stock was
  invisible even when `InventoryLocationStock` rows existed.

This was a source/data contract gap, not a layout or empty-state bug.

## Canonical Source Implemented

Production material stock now uses:

```text
InventoryLocationStock
WHERE warehouse.code = 'PRODUCTION'
```

Derived fields:

- `productionOnHand = SUM(quantity in PRODUCTION)`
- `productionReserved = active production reservation quantity`
- `productionAvailable = productionOnHand - productionReserved`

The fix does not restore or depend on legacy remark reconstruction such as
`[COMPONENT_PRODUCTION]`.

## Inventory API Fix

`GET /inventory/items` now returns `locationBalances` built from
`InventoryLocationStock`.

Each balance includes:

- `warehouseId`
- `warehouseCode`
- `warehouseName`
- `zoneId`
- `zoneCode`
- `zoneName`
- `row`
- `column`
- `slotId`
- `level`
- `quantity`

This lets frontend consumers distinguish:

- `MAIN` stock: informational source warehouse stock
- `PRODUCTION` stock: manufacturing custody stock

## BOM Picker Fix

The Production BOM picker now keeps Material Master identity as the primary
selection source.

Displayed enrichment:

- Production stock
- active reserved quantity
- Production available quantity
- Production location labels
- Main warehouse stock as informational context only
- Main warehouse location labels

Important behavior preserved:

- Engineering BOM can be authored with zero Production stock.
- Main Warehouse stock is not treated as production-available.
- BOM creation does not create reservation, issue, consumption or inventory
  movement.

## Production Readiness Fix

Production material readiness now reports:

- `requiredQty`
- `onHandQty`
- `reservedQty`
- `availableQty`
- `reservableQty`
- `issuedQty`
- `shortageQty`

`onHandQty` comes from `InventoryLocationStock(PRODUCTION)` without subtracting
historical issue rows a second time.

`reservedQty` comes from active reservation lines:

```text
RESERVED
PARTIALLY_ISSUED
```

with:

```text
active reserved = reservedQty - issuedQty - returnedQty
```

`availableQty = onHandQty - reservedQty`

`shortageQty = remainingRequiredQty - availableQty`

## Components Production Warehouse UI

The Components tab remains semantically:

```text
Kho vật tư sản xuất
```

It shows only materials with positive `PRODUCTION` location balances. It now
receives those balances from the canonical Inventory API instead of needing
frontend transaction reconstruction.

Reserved quantity was aligned with backend semantics by subtracting returned
reservation quantity as well as issued quantity.

## MAIN -> PRODUCTION Transfer

The previous UI.OPS.3A transfer conservation fix remains the write-side
behavior:

- source MAIN bucket receives a negative location-stock delta
- destination PRODUCTION bucket receives a positive location-stock delta
- item aggregate quantity is conserved for transfers

UI.OPS.3A.1 makes those destination buckets visible through `/inventory/items`.

## Historical Data

No historical reconciliation or backfill was performed.

If old transfers exist as transaction lines without matching
`InventoryLocationStock` destination buckets, they require a separate audited
reconciliation sprint. This sprint intentionally does not infer current
production stock from historical remarks or transaction text.

## Files Changed

- `apps/backend-api/src/modules/inventory/inventory.repository.ts`
- `apps/backend-api/src/modules/inventory/inventory.service.ts`
- `apps/backend-api/src/modules/inventory/inventory.service.multi-material.spec.ts`
- `apps/backend-api/src/modules/production/repositories/production.repository.ts`
- `apps/backend-api/src/modules/production/services/production.service.ts`
- `apps/backend-api/src/modules/production/services/production-material-availability.service.spec.ts`
- `apps/frontend/src/modules/components/pages/tabs/ComponentsMaterialStockPage.tsx`
- `apps/frontend/src/modules/production/api/production.api.ts`
- `apps/frontend/src/modules/production/components/ProductionBomModal.tsx`
- `apps/frontend/src/modules/production/pages/ProductionCockpitPage.tsx`

## Verification

Passed:

- `pnpm -C apps/backend-api exec prisma validate`
- `pnpm -C apps/backend-api exec prisma migrate status`
- `pnpm -C apps/backend-api test -- inventory.service.multi-material.spec.ts`
- `pnpm -C apps/backend-api test -- production-material-availability.service.spec.ts`
- `pnpm -C apps/backend-api test -- bom.service.spec.ts production-reservation.service.spec.ts material-issue.service.spec.ts`
- `pnpm -C apps/backend-api test -- production-bom-materialization.service.spec.ts production-command.service.spec.ts`
- `pnpm -C apps/backend-api test`
- `pnpm -C apps/backend-api build`
- `pnpm -C apps/frontend test`
- `pnpm -C apps/frontend build`
- `git diff --check`

Runtime HTTP smoke:

- **BLOCKED**
- Attempted `PORT=3010 pnpm -C apps/backend-api start:prod`.
- Nest route registration started, but Prisma runtime failed with:

```text
PrismaClientInitializationError: Can't reach database server at `localhost:5432`
```

No direct Prisma mutation was used to manufacture runtime data.

## Remaining Work

P1:

- Rerun authenticated runtime API smoke after PostgreSQL runtime connectivity is
  available.
- If production stock still appears empty in live data, audit whether old
  transfer rows lack matching `InventoryLocationStock` destination buckets.

P2:

- Add a dedicated read-model endpoint for Production Warehouse material stock if
  `/inventory/items` becomes too broad for high-volume operational use.
