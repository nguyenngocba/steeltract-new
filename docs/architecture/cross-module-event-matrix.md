# Cross-module Event Ownership Matrix

Date: 2026-07-17  
Status: **OWNERSHIP SUMMARY - CANONICAL CONTRACT SUPERSEDED BY ADS004**

> **ADS004 precedence (2026-07-17):** Payload/versioning is no longer deferred.
> `canonical-event-catalog.md`, `event-payload-contract.md` and
> `event-publisher-subscriber-matrix.md` are normative. This matrix remains an
> ADS001 ownership summary where it does not conflict with ADS004.

The owner publishes a completed fact. ADS004 now freezes payload schemas,
versions and consumer compatibility; ADS001 freezes publisher ownership.

| Fact/event family | Publisher | Primary subscribers | Subscriber action | Forbidden behavior |
| --- | --- | --- | --- | --- |
| `inventory.received/issued/returned/transferred/adjusted` | Inventory | Referenced workflow owners, Operations, snapshots | Reconcile source workflow/read projection | Rewrite Inventory transaction or repeat stock posting |
| `inventory.stocktake.completed` | Inventory | Operations, Finance/reporting | Reconcile variance | Reopen session outside Inventory |
| `component.created/metadata.updated/deprecated/reactivated/archived` | Components | Production, Projects, QC, Yard, Logistics, snapshots | Refresh component identity projection | Change Component lifecycle directly |
| `component.revision.released` | Components | Production, QC, Projects | Consume immutable revision/BOM reference | Modify released revision |
| `production.order.*` | Production | Components, QC, Yard, Projects, snapshots | Project execution state | Change Production lifecycle |
| `production.work-order.completed` / `production.completion.*` | Production | QC, Components projection, Operations | Create/request required inspection; update projection | Mark QC passed |
| `production.material.reserved/released/issued/consumed/returned` | Production | Components costing/read model, Projects, Operations | Update material progress/cost projections | Mutate Inventory stock |
| `production.scrap.posted/reversed` | Production | QC, costing, Operations | Create owned follow-up command/projection | Inventory infers stock without AD-018 posting command |
| `qc.inspection.completed` / `qc.disposition.completed` | QC | Production, Components, Yard, Logistics, Projects | Gate next owned workflow | Mutate source aggregate directly |
| `qc.ncr.created` | QC | Production, Components, Projects | Request/observe disposition and rework | Execute rework in QC context |
| `project.material.allocated` | Projects | Inventory, Production, Components projections | Plan availability/demand | Reserve or decrement stock |
| `project.material-return.requested` | Projects | Inventory | Present/receive return request | Auto-increase stock |
| `project.acceptance.completed` | Projects | Components, Logistics, reporting | Update installation/acceptance projection | Change Logistics proof |
| `yard.item.placed/moved` | Yard | Components, Logistics, Projects, Operations | Update physical-location projections | Change Component identity/QC result |
| `yard.loading.completed` | Yard | Logistics, Components, Projects | Advance Logistics-owned shipment command | Set Dispatch delivered |
| `supplier.purchase/shipment.*` | Suppliers | Inventory, QC, Projects | Prepare receipt/inspection | Post stock or QC result |
| `supplier.return.*` | Suppliers | Inventory, Finance/reporting | Execute owned stock posting/reconciliation | Supplier writes Inventory ledger |
| `logistics.shipment.created/dispatched/delivered` | Logistics | Yard, Components, Projects, Operations | Reserve/release Yard work; update transport projection | Change Yard placement or Project acceptance directly |

## Publisher Invariants

- Domain mutation and Outbox row are atomic.
- Event name uses lowercase `context.entity.past-action`.
- Payload is identifier/version oriented, not an entity dump.
- Idempotency key is stable for the domain fact.
- A subscriber records its own command/event if it changes its aggregate.
- Event consumption never transfers ownership of the source fact.
