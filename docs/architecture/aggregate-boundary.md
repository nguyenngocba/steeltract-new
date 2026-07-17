# SteelTrack Aggregate Boundary Standard

Date: 2026-07-17  
Status: **APPROVED - ADS001**

## Aggregate Catalog

### Inventory

- `InventoryItem`: material identity and inventory-specific master attributes.
- `InventoryTransaction`: immutable header/lines for every stock movement.
- `StockTakeSession`: count, variance, approval and posting decision.
- Inventory location balance and material snapshots are projections, not
  independently writable business aggregates.

### Components

- `Component`: fabricated-object identity and approved handoff lifecycle.
- `ComponentRevision`: future design revision aggregate.
- `ComponentCosting`: cost projection/persistence tied to approved Production
  and Inventory facts.
- Components does not own material Reservation, Issue, Consumption or Return.

### Production

- `WorkOrder`: parent manufacturing release/batch.
- `ProductionOrder`: executable component/lot order.
- `ProductionStage`/Task: execution children controlled by Production.
- `ProductionMaterialReservation`, Issue, Consumption and immutable material
  ledger: production intent and usage.
- `ProductionScrap` and rework execution: future Production-owned aggregates.

### QC

- `QcInspection`: inspection lifecycle and result.
- `NCR`: non-conformance, disposition and rework request.
- QC owns quality truth; it does not execute Production or mutate Components.

### Projects

- `Project` and `ProjectTask`: WBS, progress and site acceptance.
- Material and Component Allocation: project demand/commitment.
- Site Return Request: project return intent, not stock posting.

### Yard

- Yard Location/Zone/Slot: physical topology.
- Yard Allocation/Placement: current placement and reservation.
- Yard Movement/Loading Task: physical movement execution.

### Suppliers

- Supplier: commercial identity and qualification.
- RFQ, Quotation, Purchase Commitment and Supplier Return: sourcing/commercial
  documents until a dedicated Purchasing context is introduced.

### Logistics

- Dispatch Order, Loading Plan, Shipment and Delivery Proof: transport intent
  and execution.

## Invariants

1. An aggregate is changed only through its owning application service.
2. Repository access is private to its bounded context.
3. Cross-context identifiers are references, not ownership transfer.
4. Cross-context read composition never authorizes cross-context writes.
5. Snapshots and read models are disposable projections and cannot become
   command sources.
6. Domain mutation, ActivityLog/audit and domain Outbox commit atomically.
7. A consumer never republishes a source fact as though it owns that fact.

## Local Atomic Collaboration

SteelTrack is a modular monolith on one PostgreSQL database. For invariants such
as Production Issue plus Inventory posting:

```text
Production command
  -> Production transaction orchestration
  -> InventoryPostingService(owner-exported, same tx context)
  -> Inventory validates and writes Inventory tables/outbox
  -> Production writes Production tables/outbox
  -> one commit
```

The caller may pass transaction context, but may not call Inventory repository
models or write Inventory tables. This is a local atomic collaboration, not a
distributed transaction and not shared aggregate ownership.

## Eventual Collaboration

Use Outbox events when immediate atomic consistency is not required, including
Production completion -> QC inspection request, QC release -> Yard readiness,
Yard loading -> Logistics shipment advancement and Logistics delivery ->
Project site acceptance readiness.

## Legacy Data

Current foreign repository writes or mixed status fields remain compatibility
debt. ADS001 does not authorize automatic migration or reinterpretation.

