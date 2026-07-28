# COMPONENT DOMAIN.4 - Production Integration & Physical Instance Creation

Status: **IMPLEMENTED - RUNTIME SMOKE PASS**

Date: 2026-07-27

## Previous Production Semantics

- Canonical Production command create accepted released Engineering basis but
  did not accept or persist `ProjectComponentRequirement` lineage.
- `ProductionOrder.componentRequirementId` existed from DOMAIN.2 but was not
  written by the command boundary.
- Production Order release created Work Orders and emitted
  `production.order.released`, but did not create `ComponentInstance` rows.
- Legacy `createComponentFromProductionOrder` can still update/create overloaded
  legacy `Component.status=READY`; DOMAIN.4 did not expand that path.
- Requirement quantity, Production Order quantity and physical Component
  identity were therefore not connected in the canonical command path.

## Canonical Production Semantics

- `ProjectComponentRequirement` is project demand.
- `ProductionOrder` is manufacturing authorization against a requirement,
  released Component Revision and materialized Production BOM.
- `ComponentInstance` is one physical manufactured steel component identity.
- Requirement creation and draft Production Order creation create zero
  ComponentInstances.
- Production Order `RELEASED` creates planned physical identities for
  requirement-bound Production Orders only.
- Created ComponentInstances are manufacturing identities, not inventory,
  Finished Goods, QC PASS, Yard stock or ready-to-ship items.

## Requirement -> PO Architecture

The additive command DTO now accepts:

```json
{
  "componentRequirementId": "project-component-requirement-id"
}
```

When supplied, create validates:

- Requirement exists and is not `CANCELLED`.
- Requirement Component matches the Engineering basis Component.
- Requirement Revision/BOM match the Engineering basis when already specified.
- Request Project matches the Requirement Project when supplied.
- Production quantity is a positive integer.
- Current non-cancelled Production Order quantities for the requirement plus
  the new quantity do not exceed `requiredQuantity`.

Legacy command calls without `componentRequirementId` remain compatible and do
not generate ComponentInstances on release.

## Engineering Release Gate

Create still uses the Sprint A gate:

- Component lifecycle must be `ACTIVE`.
- Current ComponentRevision must be `RELEASED`.
- Current ComponentBomDefinition must be `RELEASED`.
- Caller content hash must match the released revision and BOM.

Release uses persisted Production Order lineage instead of requiring the
revision to still be current. This preserves historical correctness when R2 is
released after a draft PO was created from R1.

## BOM Lineage

Release requires valid materialized Production BOM lineage:

- `ProductionOrder.bomId`
- `ProductionOrder.componentId`
- `ProductionOrder.componentRevisionId`
- `ProductionOrder.bomDefinitionId`
- `BOM.componentId`
- `BOM.componentRevisionId`
- `BOM.bomDefinitionId`
- `BOM.source = ENGINEERING`

The Engineering BOM lines are not copied into ComponentInstance rows.
Instance traceability goes through ProductionOrder and materialized Production
BOM.

## Production Quantity Rules

- Requirement allocation is derived from non-cancelled Production Orders.
- Cancelled orders do not consume requirement allocation.
- A requirement of 20 can be split into multiple active Production Orders, for
  example 8 + 7, leaving 5.
- A later order that would exceed the requirement is rejected.
- Produced/accepted/installed counters on `ProjectComponentRequirement` remain
  untouched in DOMAIN.4 because those counters belong to later Production
  completion, QC and installation conversion sprints.

## Instance Creation Timing

DOMAIN.4 creates ComponentInstances when a requirement-bound Production Order
successfully transitions from `DRAFT` to `RELEASED`.

It does not create instances when:

- Component definition is created.
- ProjectComponentRequirement is created.
- Draft Production Order is created.
- Legacy Production Orders without a requirement are released.

## Instance Identity

Instance numbers are generated server-side:

```text
<ComponentCode>-<ProductionOrderNo>-001
<ComponentCode>-<ProductionOrderNo>-002
```

This keeps the code human-readable while avoiding collisions between multiple
Production Orders for the same Component definition. The database unique
constraints on `instanceNo` and `(productionOrderId, serialSequence)` remain
the final concurrency guards.

## Instance Lineage

Every created ComponentInstance stores:

- `componentId`
- `componentRevisionId`
- `bomDefinitionId`
- `productionOrderId`
- `requirementId`
- `projectId`
- `projectTaskId` when the requirement has one
- `state = PLANNED`
- `serialSequence`

Every created instance also receives a `ComponentInstanceTimeline` row:

- `eventType = component.instance.planned`
- `sourceModule = production`
- `sourceId = ProductionOrder.id`

## Idempotency

Release remains protected by the existing command idempotency/outbox replay.
Replaying the same `Idempotency-Key` returns the prior release result and does
not create duplicate Work Orders or ComponentInstances.

Instance creation is also defensive:

- Existing serial sequences are read before insert.
- Only missing sequences are inserted.
- `createMany(..., skipDuplicates: true)` is used against existing unique
  constraints.

## Concurrency

Release still uses optimistic concurrency on `ProductionOrder.aggregateVersion`.
Only one concurrent release with the expected version can update the order.

ComponentInstance over-creation is additionally guarded by:

- `(productionOrderId, serialSequence)` uniqueness.
- `instanceNo` uniqueness.
- missing-sequence generation inside the release transaction.

## Cancellation Behavior

- Cancelling a DRAFT Production Order creates no ComponentInstances because
  draft orders have none.
- Released orders preserve planned physical identities for traceability.
- DOMAIN.4 does not hard-delete ComponentInstances on cancellation.
- Rich instance cancellation states are left for the Production Execution / QC
  conversion sprint because the frozen DOMAIN.2 `ComponentInstanceState` enum
  has no dedicated `CANCELLED` state.

## Material Boundary

DOMAIN.4 does not change material workflow.

Preserved boundary:

```text
Material Warehouse
  -> Production Warehouse / Production Material Stock
  -> Reservation
  -> Issue
  -> Consumption
```

Creating ComponentInstances does not create InventoryTransactions, stock
balances, production material issue rows, Yard placements, QC inspections or
Finished Goods.

## Legacy Compatibility

- Existing Production Orders remain readable.
- Existing Components remain readable.
- No ComponentInstances were fabricated for historical Production Orders.
- Legacy Production routes remain compatible.
- Legacy `Component.status` remains in place for compatibility and is not used
  as a Finished Goods gate in DOMAIN.4.
- STABILITY7, DOMAIN3 and B1 fixtures remain readable.

## UI Changes

No broad Production UI redesign was performed.

Backend command semantics are now available for a future minimal UI action:
`Tạo lệnh sản xuất` from a ProjectComponentRequirement, showing Component,
Project, required quantity, allocated quantity, remaining quantity, released
Revision/BOM and requested Production quantity.

## Runtime Fixture

Controlled namespace: `DOMAIN4-1785146027125`.

Released Engineering basis:

- Component: `STABILITY7-1785129114051-COMP`
- Revision: `cms2rs8ek001ipvyv685h44by`
- BOM definition: `cms2rs8en001kpvyvsgkejpxt`

Runtime API flow:

1. Created `ProjectComponentRequirement(requiredQuantity=20)`.
2. Created PO-A quantity 8.
3. Before release, PO-A ComponentInstances = 0.
4. Released PO-A.
5. After release, PO-A ComponentInstances = 8.
6. Replayed release PO-A with the same idempotency key.
7. PO-A ComponentInstances stayed 8.
8. Created and released PO-B quantity 7.
9. Requirement total ComponentInstances = 15.
10. Attempted PO-C quantity 6.
11. PO-C was rejected with HTTP 400:
    `Active Production Order quantity exceeds Project component requirement quantity`.

DB verification:

```json
{
  "requirement": {
    "requiredQuantity": 20,
    "productionOrders": 2,
    "componentInstances": 15
  },
  "states": ["PLANNED"],
  "qcPassedCount": 0,
  "producedAtCount": 0,
  "timelines": 15,
  "inventoryTransactions": 0,
  "yardPlacements": 0
}
```

First and last instances preserve Component, Revision, BOM definition,
Production Order, Requirement and Project lineage. No Finished Goods, QC,
Inventory or Yard side effects were created.

## Regression Results

- Targeted Production command service tests: PASS, 9 tests.
- Full backend Jest suite: PASS, 78 suites / 230 tests.
- Prisma validate/generate/migrate status: PASS.
- Backend build: PASS.
- Frontend build: PASS with existing Vite chunk-size warning.
- Runtime authenticated API smoke: PASS.

## Backend Tests

PASS, 78 suites / 230 tests.

## Backend Build

PASS.

## Frontend Build

PASS with existing Vite chunk-size warning.

## Migration Status

No Prisma schema change and no migration were created in DOMAIN.4.
`prisma migrate status` reports the database schema is up to date.

## Remaining P0

None identified for DOMAIN.4 backend command integration.

## Remaining P1

- Add the minimal Production UI action from requirement context:
  `Tạo lệnh sản xuất`.
- Add a read API/view exposing requirement allocated quantity and remaining
  quantity for operator UX.
- Convert Production completion/QC handoff so planned ComponentInstances move
  to production/QC states without becoming Finished Goods prematurely.
- Define how released-but-cancelled instance identities should be displayed
  while preserving audit traceability, since DOMAIN.2 has no `CANCELLED`
  instance enum.
- Retire legacy `createComponentFromProductionOrder` READY semantics in a
  controlled compatibility sprint.

## Next Sprint Recommendation

Start DOMAIN.5: Production completion + QC handoff. Planned ComponentInstances
should move from manufacturing authorization into produced/QC evidence without
creating Finished Goods until QC PASS or approved Use-As-Is.
