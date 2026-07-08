# Inventory Material Snapshot Report

Date: 2026-07-08

## Objective

EPIC112 INV.CORE.2 adds a persisted Inventory material domain snapshot for heavy Material Detail reads and future cross-module consumers.

This is not a screen-specific snapshot. `InventoryMaterialSnapshot` is a reusable domain read model intended for:

- Inventory Dashboard
- Material Detail
- Project material allocation
- Logistics dispatch/material availability
- Purchasing replenishment
- AI Assistant / Operations Center

## Schema

Model:

- `InventoryMaterialSnapshot`

Table:

- `inventory_material_snapshots`

Important fields:

- `materialId`
- `warehouseId`
- `warehouseCode`
- `scopeKey`
- `currentStock`
- `availableStock`
- `reservedStock`
- `allocatedToProjects`
- `pendingReturn`
- `returnedQuantity`
- `inboundQuantity`
- `outboundQuantity`
- `inventoryValue`
- `attachmentCount`
- `locationCount`
- `lastInboundAt`
- `lastOutboundAt`
- `detailPayload`
- `locationPayload`
- `transactionPayload`
- `updatedAt`

Scope design:

- `scopeKey = ALL`: material-wide snapshot used by Material Detail.
- `scopeKey = warehouse:<warehouseId>`: warehouse slice for dashboard/project/logistics/purchasing consumers.

Unique key:

- `materialId + scopeKey`

## Writer

The writer is implemented in:

- `apps/backend-api/src/core/snapshots/inventory-snapshot.repository.ts`
- `apps/backend-api/src/core/snapshots/snapshot-writer.service.ts`

Source data:

- `inventory_items`
- `inventory_location_stocks`
- `inventory_transactions`
- `inventory_transaction_items`
- `production_material_reservation_lines`
- `project_task_material_allocations`
- `return_requests`
- `return_request_items`
- `attachments`

The writer uses batch reads, groups data by material, and persists snapshots with upsert. It does not mutate business transactions.

## Reader Cutover

Material Detail now uses:

```text
InventoryReadModelService.materialDetail()
↓
SnapshotReaderService.inventoryMaterial()
↓
InventoryMaterialSnapshot
↓ fallback
Repository-backed read model
```

Fallback triggers when:

- snapshot is missing
- snapshot is stale
- snapshot has no `detailPayload`

Fallback also schedules a background snapshot update job through `SnapshotUpdateDispatcher`.

## Runtime Metrics

Metrics added:

- `materialSnapshotHit`
- `materialSnapshotMiss`
- `snapshotAge`
- `snapshotLag`
- `snapshotFallback`
- `snapshotStale`

## Compatibility

No public Material Detail API contract changed. The snapshot stores the same serialized response shape in `detailPayload`, while also exposing structured domain fields for future consumers.

