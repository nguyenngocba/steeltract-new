# Canonical Event Payload Contract

Date: 2026-07-17  
Status: **APPROVED - ADS004**

## Envelope V1

Every canonical event uses this logical envelope:

```text
eventId: UUID
eventName: canonical string
eventVersion: 1
occurredAt: UTC timestamp
producer: bounded-context name
aggregateType: string
aggregateId: string
aggregateVersion: positive integer
correlationId: string
causationId: string | null
idempotencyKey: string
actorId: string | null
tenantId: string | null
payload: event-specific object
```

`eventId`, `eventName`, `eventVersion`, `occurredAt`, `producer`, aggregate
identity/version, correlation and idempotency are required. `tenantId` is null
until tenant ownership exists and must not be guessed.

## Common Payload Rules

- Identifiers and changed facts only; no full Prisma entity graph.
- Quantity always includes `quantity` and `unit`.
- Money includes decimal-compatible `amount` and `currency`.
- Location uses separate `warehouseId`, `zoneId`, `slotId`, `level` fields.
- Optional fields are explicit `null`, not fabricated defaults.
- Payload excludes secrets, attachment bytes and unrestricted metadata JSON.

## Inventory Schemas

`InventoryStockFactV1` requires:

```text
inventoryTransactionId, transactionCode, materialId, quantity, unit,
warehouseId, zoneId?, slotId?, level?, referenceModule?, referenceId?,
postingKind, postedAt
```

`InventoryTransferFactV1` additionally requires source and destination location
objects and signed/absolute quantities without concatenating slot and level.

`InventoryStocktakeFactV1` requires `stocktakeId`, scope identifiers,
`countedLineCount`, `varianceLineCount`, `completedAt`; detailed lines remain
queryable from Inventory and are not dumped into the event.

## Component Schemas

`ComponentFactV1` requires `componentId`, `code`, resulting `state` and
`changedFields` when applicable.

`ComponentRevisionFactV1` requires `componentId`, `revisionId`, `revisionNo`,
resulting `state`, `baseRevisionId?`, `bomDefinitionId?`, `contentHash?`,
`previousRevisionId?`, `reason?` according to the event.

`ComponentBomFactV1` requires `componentId`, `revisionId`, `bomDefinitionId`,
`contentHash`, resulting validation state and changed section identifiers.

## Production Schemas

`ProductionOrderFactV1` requires `productionOrderId`, `orderNo`, `orderKind`,
resulting `state`, `componentId?`, `componentRevisionId?`, `bomDefinitionId?`
and lifecycle timestamp.

`ProductionWorkOrderFactV1` requires `productionOrderId`, `workOrderId`,
`routingOperationId`, sequence, resulting state, blocker code/reason when
blocked and lifecycle timestamp.

`ProductionExecutionFactV1` requires `productionOrderId`, `workOrderId`,
`executionRunId`, resulting state, `workCenterId?`, `machineId?`, timestamps and
typed abort/pause reason when applicable.

`ProductionCompletionFactV1` requires `completionId`, `productionOrderId`,
`workOrderId?`, `executionRunId?`, quantity/unit, cumulative completed/scrap/
remaining quantities and `reversalOfCompletionId?`.

`ProductionMaterialFactV1` requires `productionOrderId`, `materialId`,
`reservationId?`, `materialIssueId?`, `inventoryTransactionId?`, quantity/unit,
location identifiers when relevant and resulting Production material balance.
It never carries an instruction for a subscriber to mutate Inventory.

`ProductionScrapFactV1` requires `scrapId`, `productionOrderId`, `workOrderId?`,
`executionRunId?`, material/output reference, quantity/unit, reason code,
disposition, `inventoryPostingReceiptId?` and `reversalOfScrapId?`.

`ProductionReworkFactV1` requires `reworkRequestId`, `qcNcrId`,
`originalProductionOrderId`, `reworkProductionOrderId?`, decision/reason and
resulting state.

## QC Schemas

`QcInspectionFactV1` requires `inspectionId`, subject type/id, result,
`ncrId?`, inspector id and completion timestamp.

`QcNcrFactV1` requires `ncrId`, subject type/id, inspection id, defect/reason
code, severity and creation timestamp.

`QcDispositionFactV1` requires `ncrId`, `dispositionId`, disposition type,
approved quantity/unit when applicable, decision actor and completion timestamp.

## Project, Yard And Logistics Schemas

`ProjectMaterialAllocationFactV1` requires allocation/project/task/material
ids, quantity/unit, resulting allocation state and timestamp.

`ProjectAcceptanceFactV1` requires acceptance/project/component or delivery
reference ids, result, accepted quantity/unit when applicable and timestamp.

`YardItemFactV1` requires yard item id/type, source owner reference, placement
id, zone/slot/level and movement timestamp. Move includes separate source and
destination locations.

`YardLoadingFactV1` requires loading task id, shipment/loading-plan reference,
loaded item count/ids (bounded identifiers), completion timestamp and actor.

`LogisticsShipmentFactV1` requires shipment/dispatch ids, resulting state,
project reference, vehicle/driver references when known, lifecycle timestamp
and delivery proof reference only for delivered facts.

