# ADS001 SteelTrack Domain Ownership Matrix

Date: 2026-07-17  
Status: **APPROVED - NORMATIVE**

## Rules

1. One business fact has one owning bounded context.
2. Only the owner validates and persists commands for its aggregate.
3. The owner publishes the fact after an atomic domain mutation and Outbox write.
4. Other modules consume an API/query contract, event, or local projection.
5. No module writes another context's tables or reimplements its ledger.
6. A cross-context command may use an owner-exported application service. A
   shared local transaction context is allowed only when one-database atomicity
   is required; the owner service still performs its own writes.

## Capability Matrix

| Capability | Owner aggregate/context | Command owner | Event publisher | Read model / query owner | Allowed readers/subscribers | Direct writers forbidden |
| --- | --- | --- | --- | --- | --- | --- |
| Material master | `InventoryItem` / Inventory | Inventory | Inventory | Inventory | Components, Production, Projects, Suppliers, QC | All except Inventory |
| Physical stock and valuation | `InventoryTransaction` / Inventory | Inventory | Inventory | Inventory | Production, Projects, Suppliers, Finance/reporting | All except Inventory |
| Location balance | Inventory location balance projection / Inventory | Inventory posting only | Inventory | Inventory | Production, Yard analytics, Components projections | All except Inventory |
| Inventory inbound/outbound | `InventoryTransaction` / Inventory | Inventory | Inventory | Inventory | Suppliers, Production, Logistics, Projects | All except Inventory |
| Inventory transfer | `InventoryTransaction` / Inventory | Inventory | Inventory | Inventory | Production and warehouse consumers | All except Inventory |
| Stock adjustment | `InventoryTransaction` / Inventory | Inventory | Inventory | Inventory | Operations/Finance projections | All except Inventory |
| Stock take | `StockTakeSession` decision, Inventory transaction posting / Inventory | Inventory | Inventory | Inventory | Operations/Finance projections | All except Inventory |
| Production material reservation | `ProductionMaterialReservation` / Production | Production | Production | Production | Inventory availability query; Components/Projects read projection | Inventory, Components, Projects, QC, Yard, Logistics |
| Production material issue | `ProductionMaterialIssue` / Production plus Inventory posting | Production orchestrates; Inventory owns stock subcommand | Production publishes issue fact; Inventory publishes stock transaction fact | Production owns issue view; Inventory owns stock view | Components, Projects, Costing, Operations | No foreign table writes in either context |
| Production material consumption | `ProductionMaterialConsumption` and material ledger / Production | Production | Production | Production | Components costing, Projects costing, Operations | Inventory and all non-Production modules |
| Production material return | Production issue/return lifecycle plus Inventory receipt posting | Production orchestrates; Inventory owns stock subcommand | Production publishes returned fact; Inventory publishes receipt fact | Production owns return balance; Inventory owns returned stock | Components, Projects, Costing | No foreign table writes in either context |
| Project/site material return intent | `ProjectMaterialReturnRequest` / Projects | Projects | Projects | Projects | Inventory receives approved request | Inventory must not rewrite request; Projects must not post stock |
| Project/site return receipt | Inventory return receipt/transaction / Inventory | Inventory | Inventory | Inventory | Projects subscribes and reconciles allocation | All except Inventory |
| Supplier return intent | Supplier return document / Suppliers | Suppliers | Suppliers | Suppliers | Inventory posts outbound/receipt consequence as applicable | Inventory must not own supplier commercial decision |
| Component identity | `Component` / Components | Components | Components | Components | Projects, Production, QC, Yard, Logistics | All except Components |
| Component revision | `ComponentRevision` / Components | Components | Components | Components | Production, QC, Projects | All except Components |
| Engineering BOM revision | Component/BOM revision / Components | Components | Components | Components | Production consumes only released revision | Production and all other modules |
| Manufacturing routing/order BOM copy | Production Order/Routing / Production | Production | Production | Production | Components and Projects projections | All except Production |
| Production Order lifecycle | `ProductionOrder` / Production | Production | Production | Production | Components, QC, Yard, Projects, Operations | All except Production |
| Work Order lifecycle | `WorkOrder` / Production | Production | Production | Production | Components, QC, Projects, Operations | All except Production |
| Production completion | Production Order/Stage result / Production | Production | Production | Production | Components, QC, Yard, Projects | All except Production |
| Scrap | `ProductionScrap` / Production | Production | Production | Production | Inventory only if recovered stock is posted; QC/Costing subscribe | All except Production; Inventory owns only resulting stock receipt |
| NCR and rework request | `NCR` / QC | QC | QC | QC | Production subscribes | Production must not rewrite NCR |
| Rework execution | Rework Production Order / Production | Production | Production | Production | QC re-inspects; Components/Projects observe | QC must not execute Production state |
| Inspection | `QcInspection` / QC | QC | QC | QC | Production, Components, Yard, Logistics, Projects | All except QC |
| Quality status/result | Inspection/NCR / QC | QC | QC | QC | Components exposes projection only; Production/Yard gate on event/query | All except QC |
| Project/WBS | Project and ProjectTask / Projects | Projects | Projects | Projects | Components, Production, Logistics | All except Projects |
| Material allocation to project/task | Project material allocation / Projects | Projects | Projects | Projects | Inventory supplies availability/actual issue reads | Inventory and other modules must not rewrite allocation |
| Component allocation to project/task | Project component allocation / Projects | Projects | Projects | Projects | Components and Logistics observe | Components must not own WBS allocation |
| Installation acceptance | Project installation record / Projects | Projects | Projects | Projects | Components projects operational projection | Components/Logistics must not mark project acceptance directly |
| Yard location/slot | Yard location aggregate / Yard | Yard | Yard | Yard | QC, Logistics, Projects analytics | All except Yard |
| Yard allocation/placement | Yard allocation/placement / Yard | Yard | Yard | Yard | Components, QC, Logistics | All except Yard |
| Yard movement | Yard movement / Yard | Yard | Yard | Yard | Components, Logistics, Operations | All except Yard |
| Loading plan | Dispatch/loading plan / Logistics | Logistics | Logistics | Logistics | Yard executes physical tasks | Yard must not alter plan; other modules read only |
| Physical loading execution | Yard loading task/movement / Yard | Yard | Yard | Yard | Logistics subscribes and advances shipment | Logistics must not write Yard placement/movement |
| Dispatch/shipment | Dispatch Order/Shipment / Logistics | Logistics | Logistics | Logistics | Yard, Projects, Components | All except Logistics |
| Delivery proof | Delivery/Proof of Delivery / Logistics | Logistics | Logistics | Logistics | Projects accepts handoff; Components projects projection | Projects must not rewrite Logistics proof |
| Supplier master | Supplier aggregate / Suppliers | Suppliers | Suppliers | Suppliers | Inventory, Projects, Logistics, QC | All except Suppliers |
| RFQ/quotation/purchase commitment | Procurement documents / Suppliers until a dedicated Purchasing context exists | Suppliers | Suppliers | Suppliers | Inventory, Projects, Finance/reporting | All except Suppliers |
| Incoming quality inspection | Inspection / QC | QC | QC | QC | Inventory gates usability; Suppliers receives performance signal | Inventory/Suppliers must not write inspection result |

## Status Ownership

- **Inventory status**: Inventory owns material master lifecycle and computed
  stock status. Other modules must not persist their own stock truth.
- **Component status**: Components owns identity/revision/handoff lifecycle.
  Production stage, QC result, Yard placement and Logistics delivery remain
  separate source facts projected into Component views.
- **Production status**: Production owns Work Order, Production Order, Stage and
  Task execution state.
- **QC status**: QC exclusively owns Inspection and NCR state.
- **Yard status**: Yard owns placement, allocation and physical movement state.
- **Logistics status**: Logistics owns loading plan, dispatch, shipment and
  delivery state.
- **Project status**: Projects owns WBS allocation, site acceptance and
  installation state.

## Precedence

ADS001 supersedes any earlier guidance that permits a module to call or write a
foreign repository directly. Existing compatibility paths are technical debt,
not an exception to ownership.

