# SNAP.1 Snapshot Validator Report

Date: 2026-07-07

## Validator Components

Implemented:

- `SnapshotValidatorService.validateInventory`
- `SnapshotValidatorService.validateProject`
- `SnapshotValidatorService.validateDispatch`

## Validation Strategy

Validation recalculates source rows and compares them to persisted snapshot rows.

Warnings are emitted for:

- missing snapshot rows
- value mismatches

The validator does not auto-repair data.

## Warning-Only Policy

SNAP.1 intentionally avoids automatic correction.

```text
source data
  -> calculate expected snapshot
  -> compare persisted snapshot
  -> return warnings
  -> no mutation
```

This keeps the engine safe while the dashboard still uses the current runtime aggregate paths.

## Compared Fields

Inventory:

- totalStock
- availableStock
- reservedStock
- movementToday
- movementMonth
- inventoryValue
- totalMaterials
- lowStockCount

Projects:

- progress
- delayedTaskCount
- completedTaskCount
- activeTaskCount
- materialProgress
- componentProgress
- logisticsProgress
- costProgress
- healthScore

Dispatch:

- loadingCount
- inTransitCount
- arrivedCount
- completedCount
- delayCount

