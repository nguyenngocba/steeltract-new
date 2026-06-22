# BOM Intelligence Audit

Date: 2026-06-20

Scope:

- Components
- BOM
- BOM Items
- Work Orders / Production Orders
- Production Material Issues
- Inventory Transactions

## Summary

Sprint 18C removes the temporary `Material Ready = 100%` frontend fallback from the Component Management Cockpit.

The current data model already contains enough information to calculate real material readiness for components that have a linked Production Order and BOM:

```text
Readiness = issuedQty / requiredQty * 100
Remaining = requiredQty - issuedQty
```

The implemented frontend helper uses:

```text
Component
  -> ProductionOrder.componentId
      -> ProductionOrder.bom / ProductionOrder.bomId
          -> BOM.items
              -> BOMItem.materialId
              -> BOMItem.quantity
              -> BOMItem.wastePercent
      -> ProductionOrder.materialIssues
          -> ProductionMaterialIssue.inventoryItemId
          -> ProductionMaterialIssue.issuedQty
          -> ProductionMaterialIssue.returnedQty
```

No backend API change was required for the current cockpit.

## Models Found

### Component

Prisma model:

- `Component`

Relevant fields:

- `id`
- `code`
- `name`
- `projectId`
- `status`
- `estimatedCost`
- `actualCost`

Relations:

- `productionOrders`
- `costing`
- `project`
- `timelines`

### Production Order / Work Order

Prisma model:

- `ProductionOrder`

Relevant fields:

- `id`
- `orderNo`
- `componentId`
- `bomId`
- `quantity`
- `status`
- `plannedStartAt`
- `plannedEndAt`

Relations:

- `component`
- `bom`
- `materialIssues`
- `materialConsumptions`
- `materialReservations`
- `materialLedgers`

### BOM

Prisma model:

- `BOM`

Relevant fields:

- `id`
- `bomNo`
- `productCode`
- `productName`
- `estimatedWeight`
- `version`
- `status`

Relations:

- `items`
- `routingSteps`
- `productionOrders`

### BOM Item

Prisma model:

- `BOMItem`

Relevant fields:

- `bomId`
- `materialId`
- `quantity`
- `wastePercent`
- `category`

Relation:

- `material -> InventoryItem`

Required quantity formula:

```text
requiredQty =
  BOMItem.quantity
  * (1 + BOMItem.wastePercent / 100)
  * ProductionOrder.quantity
```

### Production Material Issue

Prisma model:

- `ProductionMaterialIssue`

Relevant fields:

- `productionOrderId`
- `inventoryItemId`
- `issuedQty`
- `returnedQty`
- `status`
- `warehouseId`
- `zoneId`
- `slotId`
- `level`

Readiness issued quantity:

```text
netIssuedQty = issuedQty - returnedQty
```

Active issue statuses:

- `ISSUED`
- `RETURNED`

`DRAFT` rows are ignored.

### Inventory Transactions

Prisma models:

- `InventoryTransaction`
- `InventoryTransactionItem`

Inventory transactions remain the stock movement and valuation source of truth.

For Component Material Readiness, the direct operational source is `ProductionMaterialIssue`, because it links material issue quantities to the Production Order. Inventory transactions validate physical stock movement but do not provide a simpler Component -> BOM material readiness mapping than Production Material Issue.

## Actual Relationship Mapping

### Component -> BOM

Preferred mapping:

```text
Component.id
  -> ProductionOrder.componentId
  -> ProductionOrder.bomId
  -> BOM.id
```

Fallback mapping:

```text
Component.code
  -> BOM.productCode
```

The fallback exists because older UI flows also create/find BOMs by `productCode`.

### BOM -> Required Materials

```text
BOM.id
  -> BOMItem.bomId
  -> BOMItem.materialId
  -> InventoryItem.id
```

Required per material:

```text
sum(BOMItem.quantity * (1 + wastePercent / 100) * ProductionOrder.quantity)
```

### BOM -> Material Issue

```text
BOMItem.materialId
  -> ProductionMaterialIssue.inventoryItemId
```

Only issues for the same `ProductionOrder.id` are counted.

Issued per material:

```text
sum(max(issuedQty - returnedQty, 0))
```

### Component Readiness

```text
requiredQty = sum(required per BOM material)
issuedQty = sum(min(net issued for BOM material, required for that material))
remainingQty = max(requiredQty - issuedQty, 0)
readinessPercent = requiredQty > 0 ? min(100, issuedQty / requiredQty * 100) : 0
```

## Missing Fields

Backend data:

- No blocking missing field for current readiness calculation.

Frontend type definitions before Sprint 18C:

- `ProductionOrderRecord` did not declare `bomId`.
- `ProductionOrderRecord` did not declare embedded `bom`.
- `ProductionOrderRecord` did not declare embedded `materialIssues`.
- `ProductionBom.items` did not declare `materialId`.

These frontend type gaps were corrected without changing API contracts.

## Minimal API Proposal

No API is required for the current implementation.

Optional future API for performance and consistency:

```text
GET /components/material-readiness
GET /components/:id/material-readiness
```

Suggested response:

```json
{
  "componentId": "string",
  "productionOrderId": "string",
  "bomId": "string",
  "requiredQty": 100,
  "issuedQty": 80,
  "remainingQty": 20,
  "readinessPercent": 80,
  "materials": [
    {
      "materialId": "string",
      "materialCode": "VAL-MAT-001",
      "requiredQty": 100,
      "issuedQty": 80,
      "remainingQty": 20
    }
  ]
}
```

This API would reduce duplicate frontend aggregation once Component Cockpit, Production Cockpit, and Project Components all need the same readiness data.

## Implementation Result

Implemented frontend helper:

- `apps/frontend/src/modules/components/lib/material-readiness.ts`

Integrated in:

- `apps/frontend/src/modules/components/pages/tabs/ComponentsListPage.tsx`

Behavior:

- Components with BOM + MO now show real material readiness.
- Components with no BOM or no required material no longer silently show `100%`.
- Remaining material in the drawer is now based on `requiredQty - issuedQty`.

No backend API, Prisma schema, database migration, or workflow change was introduced.
