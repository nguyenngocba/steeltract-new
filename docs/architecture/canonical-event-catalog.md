# ADS004 Canonical Event Catalog

Date: 2026-07-17  
Status: **APPROVED - NORMATIVE**

All events start at version `1`. Version is carried in the envelope, not the
event name. Events describe completed owner facts and never authorize a
subscriber to write the publisher's aggregate.

## Inventory

| Event | Publisher | Payload schema | Ordering key | Projection impact |
| --- | --- | --- | --- | --- |
| `inventory.received` | Inventory | `InventoryStockFactV1` | `inventory-item:{materialId}` | Inventory stock/value, supplier/project receipt views |
| `inventory.issued` | Inventory | `InventoryStockFactV1` | `inventory-item:{materialId}` | Inventory stock/value, referenced workflow reconciliation |
| `inventory.returned` | Inventory | `InventoryStockFactV1` | `inventory-item:{materialId}` | Inventory stock/value, Production/Project return projection |
| `inventory.transferred` | Inventory | `InventoryTransferFactV1` | `inventory-item:{materialId}` | Source/destination location projections |
| `inventory.adjusted` | Inventory | `InventoryStockFactV1` | `inventory-item:{materialId}` | Stock/value, audit and alert projections |
| `inventory.stocktake.completed` | Inventory | `InventoryStocktakeFactV1` | `stocktake:{stocktakeId}` | Stocktake, variance and Operations projections |

## Components

| Event family | Canonical events | Payload schema | Ordering key | Projection impact |
| --- | --- | --- | --- | --- |
| Identity | `component.created`, `component.metadata.updated`, `component.deprecated`, `component.reactivated`, `component.archived` | `ComponentFactV1` | `component:{componentId}` | Component identity/catalog projections |
| Revision | `component.revision.created`, `component.revision.content.updated`, `component.revision.review.submitted`, `component.revision.review.returned`, `component.revision.approved`, `component.revision.approval.withdrawn`, `component.revision.released`, `component.revision.superseded`, `component.revision.archived` | `ComponentRevisionFactV1` | `component:{componentId}` | Engineering revision/BOM consumers |
| BOM definition | `component.bom.definition.updated`, `component.bom.definition.validated`, `component.bom.definition.invalidated` | `ComponentBomFactV1` | `component:{componentId}` | Engineering review projections only |

`component.revision.released` is the sole release fact. `component.released` is
not canonical.

## Production

| Event family | Canonical events | Payload schema | Ordering key | Projection impact |
| --- | --- | --- | --- | --- |
| Order | `production.order.created`, `production.order.released`, `production.order.ready`, `production.order.started`, `production.order.paused`, `production.order.resumed`, `production.order.completed`, `production.order.closed`, `production.order.cancelled` | `ProductionOrderFactV1` | `production-order:{productionOrderId}` | Order, Component/Project progress, snapshots |
| Work Order | `production.work-order.created`, `production.work-order.ready`, `production.work-order.started`, `production.work-order.paused`, `production.work-order.resumed`, `production.work-order.blocked`, `production.work-order.completed`, `production.work-order.cancelled` | `ProductionWorkOrderFactV1` | `work-order:{workOrderId}` | Shopfloor queue/execution projections |
| Execution | `production.execution.started`, `paused`, `resumed`, `completed`, `aborted` | `ProductionExecutionFactV1` | `execution:{executionRunId}` | Runtime/OEE/timeline projections |
| Completion | `production.completion.recorded`, `reversed`, `finalized` | `ProductionCompletionFactV1` | `production-order:{productionOrderId}` | Quantity/WIP and QC request projections |
| Material | `production.material.reserved`, `released`, `issued`, `consumed`, `returned` | `ProductionMaterialFactV1` | `production-order:{productionOrderId}:material:{materialId}` | Material progress/costing; never stock mutation |
| Scrap | `production.scrap.posted`, `production.scrap.reversed` | `ProductionScrapFactV1` | `production-order:{productionOrderId}:scrap:{scrapId}` | Scrap/cost/QC projections; no inferred Inventory adjustment |
| Rework | `production.rework.accepted`, `production.rework.rejected`, `production.rework.completed` | `ProductionReworkFactV1` | `rework-request:{reworkRequestId}` | QC/Production traceability projections |

## QC

| Event | Publisher | Payload schema | Ordering key | Projection impact |
| --- | --- | --- | --- | --- |
| `qc.inspection.completed` | QC | `QcInspectionFactV1` | `qc-inspection:{inspectionId}` | Production/Yard/Component quality gates |
| `qc.ncr.created` | QC | `QcNcrFactV1` | `qc-ncr:{ncrId}` | NCR/Rework request projections |
| `qc.disposition.completed` | QC | `QcDispositionFactV1` | `qc-ncr:{ncrId}` | Production rework/scrap and release decisions |

## Projects

| Event | Publisher | Payload schema | Ordering key | Projection impact |
| --- | --- | --- | --- | --- |
| `project.material.allocated` | Projects | `ProjectMaterialAllocationFactV1` | `project:{projectId}:material:{materialId}` | Demand/availability planning only |
| `project.acceptance.completed` | Projects | `ProjectAcceptanceFactV1` | `project-acceptance:{acceptanceId}` | Component/site and Logistics handoff projections |

## Yard

| Event | Publisher | Payload schema | Ordering key | Projection impact |
| --- | --- | --- | --- | --- |
| `yard.item.placed` | Yard | `YardItemFactV1` | `yard-item:{yardItemId}` | Yard location, Components/Logistics projections |
| `yard.item.moved` | Yard | `YardItemFactV1` | `yard-item:{yardItemId}` | Current placement and movement history |
| `yard.loading.completed` | Yard | `YardLoadingFactV1` | `yard-loading:{loadingTaskId}` | Logistics shipment advancement command readiness |

## Logistics

| Event | Publisher | Payload schema | Ordering key | Projection impact |
| --- | --- | --- | --- | --- |
| `logistics.shipment.created` | Logistics | `LogisticsShipmentFactV1` | `shipment:{shipmentId}` | Yard loading and Project transport projections |
| `logistics.shipment.dispatched` | Logistics | `LogisticsShipmentFactV1` | `shipment:{shipmentId}` | ETA/transit projections |
| `logistics.shipment.delivered` | Logistics | `LogisticsShipmentFactV1` | `shipment:{shipmentId}` | Project acceptance readiness; not automatic acceptance |

## Non-canonical Names

| Name | Classification | Canonical replacement |
| --- | --- | --- |
| `inventory.transaction.created` | Broad compatibility signal | One typed `inventory.*` fact based on committed intent |
| `inventory.stock.changed`, `inventory.stock_bucket.updated` | Internal projection signal | No cross-module publication |
| `component.updated` | Compatibility signal | `component.metadata.updated` or exact revision fact |
| `component.released` | Forbidden ambiguous alias | `component.revision.released` |
| `production.started`, `production.completed` | Legacy compatibility | `production.order.started/completed` |
| `production.issue.completed` | Forbidden duplicate | `production.material.issued` |
| `production.return.completed` | Forbidden duplicate | `production.material.returned` |
| `production.scrap.recorded` | Superseded candidate | `production.scrap.posted` |
| `yard.material.placed/moved` | Ambiguous alias | `yard.item.placed/moved` |
| `shipment.created/dispatched/delivered` | Missing owner prefix | `logistics.shipment.*` |
