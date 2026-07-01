# Historical Import Readiness Report

Date: 2026-06-29

## Readiness Summary

| Import Area | Readiness | Notes |
|---|---:|---|
| Master Data Import | Partial Ready | Categories, units, suppliers, projects, warehouses, zones, work centers, machines can be imported with validation. |
| Transaction Import | Not Ready | Must define transaction replay and valuation rules before importing operational history. |
| Movement Import | Partial | Yard movements and inventory transfers exist, but location identity and chronology need strict mapping. |
| Ledger Rebuild | Not Ready | Inventory slot-level ledger rebuild is missing; Production ledger rebuild needs formal rules. |
| Snapshot Rebuild | Not Ready | Analytics and stock snapshots are not rebuildable through a supported command. |

## Tables That Can Be Imported Early

- `InventoryCategory`
- `MaterialType`
- `MasterUnit`
- `MasterWarehouse`
- `WarehouseZone`
- `Supplier`
- `Project`
- `WorkCenter`
- `Machine`
- `Vehicle` as reference only
- QC checklist templates

## Tables That Need Strict Rebuild Rules

- `InventoryItem`
- `InventoryTransaction`
- `InventoryTransactionItem`
- `InventoryLocationStock`
- `ProductionOrder`
- `BOM`
- `BOMItem`
- `ProductionMaterialReservation`
- `ProductionMaterialIssue`
- `ProductionMaterialConsumption`
- `ProductionMaterialLedger`
- `Component`
- `ComponentTimeline`
- `ComponentCosting`
- `YardItemPlacement`
- `YardMovement`
- `QcInspection`
- `NonConformanceReport`

## Import Blockers

1. Inventory opening balance policy is not formalized.
2. Exact bucket identity must be stable: `warehouseId + zoneId + slotId + level`.
3. `InventoryItem.quantity` is a snapshot/cache and must be rebuilt, not imported as source of truth.
4. Historical document numbering can collide unless backend numbering/import override policy exists.
5. Production ledger rebuild needs deterministic mapping from reservations/issues/returns/consumptions.
6. Component lifecycle import must preserve timelines.
7. Costing import must label cost sources and fallback rules.
8. Attachments require filesystem copy plus metadata import.
9. Analytics snapshots require rebuild or quarantine.

## Recommended Historical Import Strategy

Phase 1:

- Import master data only.
- Validate codes, units, warehouses, zones, suppliers, projects.

Phase 2:

- Import opening Inventory balances as controlled IMPORT/ADJUSTMENT transactions.
- Generate `InventoryLocationStock` from transactions.
- Rebuild `InventoryItem.quantity`.

Phase 3:

- Import BOM, Production Orders, Components.
- Import Production material activity.
- Rebuild ProductionMaterialLedger.
- Recalculate ComponentCosting.

Phase 4:

- Import Yard/QC/Project history.
- Rebuild Dashboard/Analytics snapshots.

Do not allow direct table dumps into operational tables without replay/rebuild verification.

