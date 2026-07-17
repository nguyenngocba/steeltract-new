# Event Publisher-Subscriber Matrix

Date: 2026-07-17  
Status: **APPROVED - ADS004**

Subscribers listed here may update only their own projection or invoke their
own command after validating local invariants.

| Event/family | Sole publisher | Primary subscribers | Allowed effect | Forbidden effect |
| --- | --- | --- | --- | --- |
| `inventory.received` | Inventory | Suppliers/Purchasing, QC, Projects, Operations, Inventory snapshots | Reconcile receipt/read projection; request QC | Write Inventory stock/transaction |
| `inventory.issued` | Inventory | Production, Projects, Logistics, Operations, Inventory snapshots | Reconcile source intent/receipt | Consume material or issue stock again |
| `inventory.returned` | Inventory | Production, Projects, Suppliers, Operations | Reconcile return intent | Repeat receipt posting |
| `inventory.transferred/adjusted` | Inventory | Operations, reporting, Inventory snapshots | Refresh stock/location projections | Treat as Production usage |
| `inventory.stocktake.completed` | Inventory | Operations, Finance/reporting | Reconcile variance projection | Reopen or alter stocktake |
| `component.*` identity | Components | Production, Projects, QC, Yard, Logistics, Components snapshots | Refresh identity eligibility | Write Component aggregate |
| `component.revision.*` / BOM | Components | Production, Projects, QC, Components snapshots | Consume immutable released engineering reference | Modify/supersede revision outside Components |
| `production.order.*` | Production | Components, Projects, QC, Yard, Operations, Production snapshots | Track execution; request owner workflow | Change Production lifecycle |
| `production.work-order.*` / execution | Production | QC, Components/Projects projections, Operations | Queue inspection/runtime projection | Complete Work Order from subscriber |
| `production.completion.*` | Production | QC, Components, Projects, Yard readiness, Operations | Create inspection request/projection | Mark QC passed or Yard placed |
| `production.material.*` | Production | Components costing, Projects, Operations, Production snapshots | Material progress/cost projection | Mutate Inventory stock |
| `production.scrap.*` | Production | QC, Costing/Reporting, Operations | Inspection/disposition/cost projection | Infer Inventory Adjustment |
| `production.rework.*` | Production | QC, Components, Projects, Operations | Correlate linked execution/re-inspection | Rewrite NCR |
| `qc.inspection.completed` | QC | Production, Components, Yard, Logistics, Projects, QC snapshots | Gate local owner command/projection | Change QC result |
| `qc.ncr.created` | QC | Production, Components, Projects, Operations | Offer rework/disposition workflow | Create Production execution without owner command |
| `qc.disposition.completed` | QC | Production, Yard, Components, Projects | Invoke validated local rework/release/scrap command | Write foreign aggregate directly |
| `project.material.allocated` | Projects | Inventory, Production, Components, Operations | Plan availability/demand | Reserve/decrement stock automatically |
| `project.acceptance.completed` | Projects | Components, Logistics, Operations | Update acceptance/handoff projection | Rewrite delivery proof |
| `yard.item.placed/moved` | Yard | Components, Logistics, Projects, Operations, Yard snapshots | Update physical-location projection | Change Component/QC/Shipment state |
| `yard.loading.completed` | Yard | Logistics, Components, Projects, Operations | Invoke Logistics shipment advancement command | Set shipment delivered |
| `logistics.shipment.*` | Logistics | Yard, Projects, Components, Operations | Transport/acceptance readiness projection | Move Yard item or mark Project accepted |

Inventory does not subscribe to Production material events to execute stock
posting. AD-018 owner commands and PostingReceipts perform Issue/Return stock
mutation before events are published.

