# STABILITY.OPS3A2 - BOM Production Stock Picker & Component Production Warehouse Fix

Date: 2026-07-29

Status: IMPLEMENTED - FRONTEND SOURCE FIX, RUNTIME API CERTIFIED

## Root Cause

`ComponentsMaterialStockPage` was already using `InventoryLocationStock(PRODUCTION)` through `/inventory/items.locationBalances` and was not reconstructing production balance from transaction remarks.

The remaining inconsistency was in `ProductionBomModal`:

- The modal calculated `productionStock`, `reservedQty`, `availableQty`, and `mainStock` from real `locationBalances`.
- However, the material dropdown still grouped every Material Master row, including MAIN-only materials with `productionStock = 0`.
- That made MAIN-only materials selectable in the operational BOM picker even though they were not available in production custody.

This was a presentation/source-filtering bug, not a backend/schema bug.

## Production Warehouse Source

Authoritative source:

`GET /inventory/items`

Canonical balance:

`item.locationBalances[]` where:

- `warehouseCode = PRODUCTION`, or
- `warehouseName` contains `sản xuất` / `san xuat`

The Components Production Warehouse page shows only rows with positive PRODUCTION location balance.

It displays:

- Material code
- Material name
- Material usage/type
- UOM
- Production warehouse
- Production zone/location
- Slot/level
- Production on-hand
- Reserved
- Available
- Average cost
- Inventory value
- Status

It does not use MAIN stock as fallback.

## BOM Picker Source

Active operational BOM entry point:

`apps/frontend/src/modules/production/components/ProductionBomModal.tsx`

Used by:

- Production action context
- Production BOM workspace
- Components action context
- Components list action

The picker now uses:

`productionMaterialOptions = materialOptions.filter(productionStock > 0)`

The modal still persists only BOM requirement data:

- `materialId`
- `quantity`
- `wastePercent`
- `category`
- routing fields

It does not persist stock quantity into BOM.

## Main Balance

MAIN warehouse balance remains secondary context only.

UI wording changed from ambiguous stock wording to:

- `Tồn kho SX`
- `Đã giữ chỗ`
- `Khả dụng`
- `Kho vật tư`

`Kho vật tư` is shown as reference information and is not included in production availability.

## Production Balance

Runtime API evidence from authenticated `GET /inventory/items`:

| Material | MAIN | PRODUCTION | Reserved | Available | Picker Eligible |
| --- | ---: | ---: | ---: | ---: | --- |
| `OPS3A1-RT-20260729030209` | 100 | 0 | 0 | 0 | No |
| `new-vt-2026` | 11 | 0 | 0 | 0 | No |
| `56536` | 478 | 0 | 0 | 0 | No |
| `OPS3C-20260729032211-MAT-D` | 70 | 78 | 0 | 78 | Yes |
| `OPS3C-20260729032211-MAT-B` | 65 | 15 | 0 | 15 | Yes |
| `OPS3C-20260729032211-MAT-A` | 80 | 115 | 0 | 115 | Yes |

Runtime summary:

- `/inventory/items` returned 71 materials.
- MAIN-only material examples existed and were not picker eligible.
- PRODUCTION-stock material examples existed and were picker eligible.
- Calculated picker options: 27.
- MAIN-only rows in picker: 0.

## Reserved

Reservation source:

`GET /production/reservations`

Reserved formula:

`reservedQty - issuedQty - returnedQty`

Only active reservation states are counted:

- `RESERVED`
- `PARTIALLY_ISSUED`

Runtime reserved evidence:

| Material | MAIN | PRODUCTION On Hand | Reserved | Available |
| --- | ---: | ---: | ---: | ---: |
| `OPS3A1-RT-20260729030324` | 60 | 40 | 20 | 20 |
| `OPS3C-20260729032120-MAT-A` | 80 | 120 | 5 | 115 |
| `OPS3C-20260729032120-MAT-D` | 70 | 80 | 2 | 78 |

The Components Production Warehouse page and BOM picker now use the same production/reserved/available calculation.

## Runtime Fixture

No new fixture was required.

The sprint reused existing certified runtime data:

- `OPS3A1-RT-20260729030324`
- `OPS3C-20260729032211`

Authenticated runtime API used:

- `POST /auth/login`
- `GET /inventory/items`
- `GET /production/reservations`

The sandbox blocked localhost runtime access with `EPERM`, so the API evidence command was rerun outside the sandbox with approval.

## Regression

Expected transfer invariant remains represented by the certified fixture:

- Receipt 100
- Transfer 40
- MAIN 60
- PRODUCTION 40
- TOTAL 100
- Reserved 20
- Available 20

BOM creation remains a requirement-definition operation. This sprint did not add any inventory transaction or stock movement to BOM creation.

## Files Changed

- `apps/frontend/src/modules/production/components/ProductionBomModal.tsx`
- `docs/audits/stability-ops3a2-bom-production-stock-picker-fix.md`
- `docs/ai-state/CHANGELOG_AI.md`
- `docs/ai-state/CURRENT_STATE.md`
- `docs/ai-state/PROJECT_STATUS.md`
- `docs/ai-state/NEXT_TASKS.md`

## Remaining Issues

P1:

- Browser smoke should open the BOM modal and confirm the rendered dropdown no longer contains MAIN-only materials.
- If Engineering BOM authoring later needs full Material Master search, it should be separated from this operational Production BOM modal and explicitly mark `Kho SX = 0 / Không khả dụng cho sản xuất`.

P2:

- Extract the repeated frontend production-stock calculation into a shared typed helper if another active surface starts using it. This sprint kept the fix scoped to avoid broad refactor.
