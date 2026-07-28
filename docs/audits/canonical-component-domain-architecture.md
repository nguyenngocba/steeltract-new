# Canonical Component Domain Architecture

Date: 2026-07-27

Status: Architecture design only. No code, schema, migration, UI, staging or
commit action.

## Current Model

The current `Component` model is overloaded. It stores engineering identity,
project association, physical workflow status, coarse location fields,
revision ownership, production order linkage, costing, project task allocation
and dispatch item linkage in one row.

Current evidence:

- `Component` has `code`, `name`, `description`, `projectId`, location fields,
  `status`, `lifecycleState`, `currentRevisionId`, revisions, production BOMs,
  production orders, project task allocations and dispatch items.
- `Component.status` defaults to `STOCK`.
- `ComponentLifecycleState` contains `DRAFT`, `ACTIVE`, `DEPRECATED`,
  `ARCHIVED`.
- `ComponentRevision` and `ComponentBomDefinition` already represent the
  approved Engineering Release/BOM model.
- `ProductionOrder` already stores `componentId`, `componentRevisionId`,
  `bomDefinitionId`, `bomId`, `quantity`, and production lifecycle fields.
- `QcInspection` can reference `productionOrderId`, `productionStageId`,
  `componentId`, and `projectId`.
- `YardItemPlacement` stores physical placement by `itemType`, `itemId`,
  `quantity`, slot and stack level.
- `DispatchItem` can reference `componentId`, but today that id points to the
  overloaded `Component` row.

The current model is therefore not just one concept. It is a compatibility
record that mixes:

- engineering component definition
- project component requirement
- production output
- finished goods candidate
- yard item
- delivery/install item

## Problems

1. New Component records can be engineering `DRAFT` and physical `STOCK` at the
   same time.
2. `quantity`, `type` and `profile` are partially encoded in `description`
   JSON rather than durable typed fields.
3. `COUNT(Component)` is used by dashboard/read-model code as if each row were a
   physical manufactured component.
4. `READY` can be reached from production completion before canonical QC PASS.
5. `STOCK` is used for newly-created records and for components staged to Yard.
6. `SHIPPED`, `DELIVERED` and `INSTALLED` can be included in stock-style
   projections.
7. Engineering BOM ownership is clean, but output identity after Production is
   not.
8. Yard placement already represents physical location/custody, so duplicating
   Yard state into `Component.status` creates two sources of truth.
9. Logistics and Projects currently update component/project allocation state
   against the same overloaded `Component` identity.
10. Historical Dashboard and Executive BI cannot distinguish definitions,
    planned quantity, WIP, finished goods, Yard, shipped, delivered and
    installed counts reliably from the current single row.

## Canonical Model

Recommendation: split responsibilities into separate entities while preserving
the existing `Component` aggregate as the engineering definition.

Canonical meaning:

1. `Component` = engineering/manufacturing definition.
2. `ComponentRevision` = immutable versioned engineering definition.
3. `ComponentBomDefinition` = Engineering BOM owned by a revision.
4. `ProjectComponentRequirement` = project demand for a released or draft
   component definition/revision with planned quantity.
5. `ProductionOrder` = manufacturing document for one requirement/revision and
   a planned output quantity.
6. `ComponentInstance` = physical manufactured component identity.
7. QC owns inspection/result/disposition for a Production Order, batch, or
   individual Component Instance.
8. Finished Goods is a projection/state derived from QC PASS evidence on
   physical instances.
9. Yard owns physical location through `YardItemPlacement`.
10. Logistics owns shipment/transport through `DispatchOrder` and
    `DispatchItem`.
11. Projects own site receipt/installation through project task/component
    allocation and installation acceptance.

This keeps the model practical. SteelTrack should not over-normalize every
minor workflow event, but it needs one new physical identity layer because steel
components require traceability through QC, NCR, Yard, delivery and
installation.

## Entity Ownership

| Entity | Owner | Meaning | Notes |
| --- | --- | --- | --- |
| Component | Components | Engineering definition / component family | Keep. Do not count as physical inventory. |
| ComponentRevision | Components | Versioned engineering definition | Keep B1 behavior. |
| ComponentBomDefinition | Components | Engineering BOM for one revision | Keep B1 behavior. |
| BOM / BOMItem | Production | Materialized Production BOM | Keep lineage to Component revision/BOM definition. |
| ProjectComponentRequirement | Projects + Components boundary | Project demand for component definition and quantity | Add. Projects owns demand; Components validates released engineering identity. |
| ProductionOrder | Production | Manufacturing order against requirement/revision | Keep; add requirement linkage. |
| ComponentInstance | Components or Production output registry | Physical manufactured identity | Add; created by Production under Components-owned identity contract. |
| QcInspection / NCR | QC | Quality decision and defect traceability | Keep; add instance-level target where needed. |
| FinishedGoodsProjection | Components read model | QC-passed physical components not shipped/installed | Projection, not manual source. |
| YardItemPlacement | Yard | Physical storage location/custody | Keep; point to ComponentInstance for components. |
| DispatchOrder / DispatchItem | Logistics | Shipment lifecycle | Keep; point component items to ComponentInstance. |
| ProjectTaskComponentAllocation | Projects | Site receipt / installation relation | Evolve to instance-aware allocation. |

## Lifecycle Model

### Engineering Lifecycle

Authoritative owner: Components.

States:

```text
Component DRAFT
  -> ComponentRevision DRAFT
  -> ComponentRevision IN_REVIEW
  -> ComponentRevision APPROVED
  -> ComponentBomDefinition VALIDATED
  -> ComponentRevision RELEASED
  -> Component ACTIVE
  -> DEPRECATED / ARCHIVED
```

`Component.lifecycleState` should stay engineering-only. It should not mean
stock, production, QC, shipping or installation.

### Project Requirement Lifecycle

Authoritative owner: Projects, with Components validation.

Suggested states:

```text
DRAFT
  -> ENGINEERING_SELECTED
  -> RELEASED_REQUIREMENT
  -> PRODUCTION_REQUESTED
  -> IN_PRODUCTION
  -> PARTIALLY_FULFILLED
  -> FULFILLED
  -> CANCELLED
```

Quantity lives here as planned demand. Example:

```text
Project Long Thanh requires:
  Component definition: BEAM-B01
  Revision: R1
  Profile: H500 from revision content
  Planned quantity: 20
```

`BEAM-B01` is one `Component` definition row, not 20 rows. The 20 physical
identities are created later as `ComponentInstance` rows.

### Production Lifecycle

Authoritative owner: Production.

ProductionOrder remains:

```text
DRAFT -> RELEASED -> READY -> IN_PROGRESS -> PAUSED -> COMPLETED -> CLOSED
```

For component output, one Production Order may produce quantity 20. The safest
MES behavior is:

- At Production Order creation: no physical instances yet.
- At Release: reserve output number range optionally, but do not create
  physical inventory.
- At Production Start: no finished instances yet.
- At Production Completion: create or activate 20 `ComponentInstance` rows in
  `PRODUCED_WAITING_QC`.

This avoids fabricating physical stock before production evidence exists while
still preserving traceability before QC.

### Physical Component Instance Lifecycle

Authoritative identity owner: Components. State transitions are caused by
Production, QC, Yard, Logistics and Projects through application services/events.

Suggested states:

```text
PLANNED
  -> IN_PRODUCTION
  -> PRODUCED_WAITING_QC
  -> QC_PASSED
  -> QC_FAILED
  -> REWORK
  -> SCRAPPED
  -> USE_AS_IS
  -> FINISHED_GOODS
  -> IN_YARD
  -> READY_TO_SHIP
  -> LOADED
  -> SHIPPED
  -> DELIVERED
  -> SITE_RECEIVED
  -> INSTALLED
```

For V1, reduce this to persisted milestones and read-model states rather than a
giant mutable enum. The durable facts should be Production completion, QC
decision, Yard placement, dispatch events and project installation.

## BOM Integration

B1 must remain unchanged:

```text
Component
  -> ComponentRevision
  -> ComponentBomDefinition
  -> materialized Production BOM
  -> BOMItem
  -> ProductionOrder
```

Rules:

- Engineering BOM belongs to `ComponentRevision`.
- Production BOM preserves lineage:
  `componentId`, `componentRevisionId`, `bomDefinitionId`,
  `engineeringContentHash`.
- `ComponentInstance` must not own Engineering BOM definitions.
- `ComponentInstance` may store lineage references for traceability:
  `componentId`, `componentRevisionId`, `bomDefinitionId`, `productionOrderId`.
- Production actuals and costing should use materialized Production BOM plus
  actual issue/consumption records, not copy engineering BOM lines into each
  instance.

## Production Integration

Recommended relationships:

```text
ProjectComponentRequirement 1:N ProductionOrder
ProductionOrder 1:N ComponentInstance
ProductionOrder N:1 Component
ProductionOrder N:1 ComponentRevision
ProductionOrder N:1 ComponentBomDefinition
ProductionOrder N:1 BOM
```

One PO may produce quantity 20. For traceability-heavy workflows, each physical
unit becomes:

```text
BEAM-B01-001 ... BEAM-B01-020
```

Instance creation should happen at Production Completion, not at project
requirement creation. If labels/QR codes are required before completion, create
reserved instance numbers at Release with state `PLANNED`, but they must not
count as inventory.

Production Material Stock remains separate:

```text
Material Warehouse
  -> Transfer to Production Warehouse
  -> Production Material Stock
  -> Reservation / Issue
  -> Production Consumption
```

Raw material remains `InventoryItem`; it must not become Component Inventory.

## QC Integration

QC ownership:

- QC owns `QcInspection`, `QcResult`, `QcIssue`, NCR and disposition.
- QC can inspect a Production Order, a batch, a Production Stage or a physical
  Component Instance.

For structural steel, individual traceability is recommended for finished
component lifecycle. If one PO produces 20 beams:

- Batch/order-level inspection may be allowed for shared measurements.
- Failed items must be traceable to specific `ComponentInstance` rows.
- NCR may reference `productionOrderId` and `componentInstanceId`.

Canonical states:

```text
Production Completed
  -> Waiting QC
  -> QC Passed -> Finished Goods
  -> QC Failed -> Rework / Scrap / Use As Is
```

QC PASS must be the gate to Finished Goods. Production completion alone is not
Finished Goods.

## Finished Goods Definition

Finished Goods means:

- Physical Component Instance exists.
- It is linked to Production Order completion evidence.
- It has QC PASS or approved USE_AS_IS disposition.
- It is not scrapped.
- It has not been shipped/delivered/installed.

Finished Goods must not mean:

- Component definition exists.
- Component revision is released.
- Production Order exists.
- Production completed without QC PASS.
- Yard placement alone.

Recommended implementation concept:

- `ComponentInstance` stores physical identity and immutable lineage.
- `FinishedGoodsProjection` or read model derives current finished goods from
  instance state + QC decision + outbound events.
- Avoid a separate inventory balance table for finished components unless
  later capacity/performance demands it. Component instances themselves are the
  countable units.

## Yard Integration

Yard is physical location and custody, not inventory ownership.

Current `YardItemPlacement` already represents:

- item type
- physical item id
- slot
- stack level
- quantity
- placed/removed timestamps
- movement history

Recommendation:

- Keep YardItemPlacement.
- For components, `YardItemPlacement.itemId` should reference
  `ComponentInstance.id`, not the definition-level `Component.id`.
- `IN_YARD` should be a derived read-model state from an active placement.
- Do not use generic `ComponentStatus.STOCK` to mean Yard custody.
- Ready To Ship should be a Yard/Logistics boundary state:
  active Yard placement + loading/release readiness evidence.

## Delivery/Installation Integration

Canonical ownership:

| State | Owner | Source |
| --- | --- | --- |
| Ready To Ship | Yard | active placement + loading readiness |
| Loaded | Logistics/Yard boundary | loading confirmation / dispatch event |
| Shipped | Logistics | DispatchOrder `IN_TRANSIT` / departed event |
| Delivered | Logistics | DispatchOrder `ARRIVED` / `RECEIVED` |
| Site Received | Projects | project/site receipt evidence |
| Installed | Projects | project task/component allocation installation evidence |

Avoid duplicating these as primary `Component.status` values. The Component
read model can expose a current operational status derived from authoritative
module facts.

## Dashboard Source of Truth

| Metric | Source | Rule | COUNT or SUM | Snapshot-safe |
| --- | --- | --- | --- | --- |
| Total Component Definitions | Component | engineering definitions, excluding archived if requested | COUNT(Component) | Yes |
| Required Quantity | ProjectComponentRequirement | active project requirements | SUM(plannedQty) | Yes |
| Released Quantity | ProjectComponentRequirement + ComponentRevision | requirement bound to released revision | SUM(plannedQty) | Yes |
| In Production | ProductionOrder / ComponentInstance | active production orders or instances in production | SUM(order.quantity) or COUNT(instances) | Yes after instance adoption |
| Waiting QC | ComponentInstance + QC | produced instances without final QC decision | COUNT(instances) | Yes |
| Finished Goods | ComponentInstance + QC | QC passed/use-as-is approved, not yard/shipped/installed | COUNT(instances) | Yes |
| At Yard | YardItemPlacement | active placement for component instances | COUNT(DISTINCT itemId) | Yes |
| Ready To Ship | Yard release/loading readiness | active placement marked ready | COUNT(instances) | Yes |
| Shipped | DispatchItem + DispatchOrder | component instances on departed/in-transit dispatch | COUNT(instances) | Yes |
| Delivered | DispatchOrder/Project receipt | arrived/received but not installed | COUNT(instances) | Yes |
| Installed | ProjectTaskComponentAllocation | installedAt not null or installed status | COUNT(instances) | Yes |
| Scrapped | QC/NCR disposition or ProductionScrap | final scrap disposition for instance | COUNT(instances) | Yes |

Snapshot rule: dashboard snapshots should store metric payloads from these
authoritative read models, not from raw `COUNT(Component)` after migration.

## Proposed Prisma Design

Design only. Do not implement yet.

### KEEP

```prisma
model Component
model ComponentRevision
model ComponentBomDefinition
model ComponentReleaseEvidence
model ProductionOrder
model BOM
model BOMItem
model QcInspection
model NonConformanceReport
model YardItemPlacement
model DispatchOrder
model DispatchItem
model ProjectTaskComponentAllocation
```

### ADD

```prisma
enum ProjectComponentRequirementStatus {
  DRAFT
  ENGINEERING_SELECTED
  RELEASED
  PRODUCTION_REQUESTED
  IN_PRODUCTION
  PARTIALLY_FULFILLED
  FULFILLED
  CANCELLED
}

enum ComponentInstanceState {
  PLANNED
  IN_PRODUCTION
  PRODUCED_WAITING_QC
  QC_PASSED
  QC_FAILED
  REWORK
  SCRAPPED
  USE_AS_IS
  FINISHED_GOODS
  IN_YARD
  READY_TO_SHIP
  LOADED
  SHIPPED
  DELIVERED
  SITE_RECEIVED
  INSTALLED
  LEGACY_UNKNOWN
}

model ProjectComponentRequirement {
  id                  String @id @default(cuid())
  projectId           String
  projectTaskId        String?
  componentId          String
  componentRevisionId  String?
  bomDefinitionId      String?
  requirementNo        String @unique
  plannedQty           Float
  producedQty          Float @default(0)
  acceptedQty          Float @default(0)
  installedQty         Float @default(0)
  status               ProjectComponentRequirementStatus @default(DRAFT)
  requiredBy           DateTime?
  metadata             Json?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@index([projectId])
  @@index([projectTaskId])
  @@index([componentId])
  @@index([componentRevisionId])
  @@index([status])
  @@index([projectId, componentId])
}

model ComponentInstance {
  id                   String @id @default(cuid())
  instanceNo           String @unique
  componentId           String
  componentRevisionId   String
  bomDefinitionId       String?
  productionOrderId     String?
  requirementId         String?
  projectId             String?
  projectTaskId         String?
  state                 ComponentInstanceState @default(PLANNED)
  serialSequence        Int?
  producedAt            DateTime?
  qcPassedAt            DateTime?
  scrappedAt            DateTime?
  installedAt           DateTime?
  legacyComponentId     String?
  metadata              Json?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  @@index([componentId])
  @@index([componentRevisionId])
  @@index([productionOrderId])
  @@index([requirementId])
  @@index([projectId])
  @@index([state])
  @@unique([productionOrderId, serialSequence])
}

model ComponentInstanceTimeline {
  id                  String @id @default(cuid())
  componentInstanceId String
  eventType           String
  sourceModule        String
  sourceId            String?
  occurredAt          DateTime @default(now())
  metadata            Json?

  @@index([componentInstanceId, occurredAt])
  @@index([sourceModule, sourceId])
}
```

Optional later:

```prisma
model ComponentInstanceQualityGate {
  id                  String @id @default(cuid())
  componentInstanceId String
  inspectionId        String
  disposition         String
  accepted            Boolean @default(false)
  decidedAt           DateTime?

  @@index([componentInstanceId])
  @@index([inspectionId])
}
```

### MIGRATE

- `ProductionOrder.componentId` remains for compatibility, but new production
  order creation should also bind `requirementId`.
- `QcInspection.componentId` remains for definition-level or legacy inspection,
  but instance-specific inspections should add `componentInstanceId`.
- `NonConformanceReport.componentId` remains legacy; add
  `componentInstanceId`.
- `YardItemPlacement.itemId` remains polymorphic; component placements should
  gradually point to `ComponentInstance.id`.
- `DispatchItem.componentId` remains legacy; add `componentInstanceId` or
  migrate component dispatch lines to instance id.
- `ProjectTaskComponentAllocation.componentId` remains legacy; add
  `componentInstanceId` or requirement/instance bridge.

### DEPRECATE

- `Component.status` as source of truth for production/QC/Yard/logistics.
- `Component.floor`, `zone`, `position`, `x`, `y` as current physical
  location.
- `Component.description` JSON for `type`, `profile`, `quantity`.
- Dashboards using `COUNT(Component)` as physical quantity.

### REMOVE LATER

Only after migration and read-model cutover:

- direct physical meaning of `Component.status`
- legacy component-location fields from operational workflows
- legacy dashboard snapshot fields that imply stock from component rows

## Migration Strategy

No destructive migration.

Classify existing records:

| Existing record | Classification | Migration rule |
| --- | --- | --- |
| `lifecycleState=DRAFT` | Engineering/planning record | Do not create physical instance. |
| `lifecycleState=ACTIVE` with released revision | Engineering definition | Do not create physical instance unless production/Yard/QC evidence exists. |
| Component linked to active/in-progress ProductionOrder | Production-related | Create requirement/instance only after operator review or production evidence. |
| Component status `READY` with completed ProductionOrder | Finished goods candidate | Needs QC evidence before authoritative instance. |
| Active Yard placement for Component | Yard record | Create `ComponentInstance LEGACY_UNKNOWN` candidate linked to placement; mark non-authoritative unless QC/production evidence exists. |
| `DELIVERED` / `INSTALLED` | Delivered/Installed candidate | Preserve legacy state; create reviewed instance candidate only if project/logistics evidence exists. |
| Fixture records | Audit fixtures | Keep as legacy/adopted test namespace; do not fabricate physical history. |
| `STOCK` with `DRAFT` | Engineering/planning conflict | Treat as non-physical definition. |
| `STOCK` with no production/QC/Yard evidence | Ambiguous | `LEGACY_UNKNOWN`, not finished goods. |

If physical instances cannot be inferred safely, use UNKNOWN/LEGACY handling.
Do not fabricate instance history.

## Impact Matrix

| Area | Impact | Reason |
| --- | --- | --- |
| Components | HIGH | Owns definition, revision, physical identity read model. |
| Production | HIGH | Must create/link instances at completion and preserve requirement lineage. |
| Engineering BOM B1 | LOW | Keep as-is; add downstream references only. |
| Inventory | LOW | Material stock workflow remains separate. |
| Production Warehouse | MEDIUM | Reservation/issue remains material-only; dashboards must not confuse material stock with component inventory. |
| QC | HIGH | Needs instance-level quality gate and NCR traceability. |
| Yard | MEDIUM | Component placements should point to instance identity. |
| Logistics | MEDIUM | Dispatch component lines should point to instances. |
| Projects | HIGH | Needs project requirement and installation source of truth. |
| Executive BI | HIGH | Metrics must switch away from raw `COUNT(Component)`. |
| Dashboard Snapshots | MEDIUM | Snapshot payload rules change; storage can remain. |
| Historical Dashboard | MEDIUM | Historical accuracy improves after new events/snapshots; legacy remains non-authoritative. |
| Reports | HIGH | Existing reports need semantic remapping. |
| AI/API future integration | HIGH positive | Clean entity boundaries make AI queries and API contracts reliable. |

## Implementation Roadmap

### DOMAIN.2 Schema Foundation

Add `ProjectComponentRequirement`, `ComponentInstance`,
`ComponentInstanceTimeline`, instance state enums and nullable instance FKs on
QC/Yard/Logistics/Projects where needed. Additive only.

Runnable checkpoint: legacy flows still use old fields.

### DOMAIN.3 Component Create And Project Requirement

Change create UI/API semantics:

- `Component` create = engineering definition draft.
- Project demand creates `ProjectComponentRequirement`.
- Planned quantity lives in requirement, not `Component.description`.

Runnable checkpoint: definitions can still be listed; no physical stock count
from new definitions.

### DOMAIN.4 Production Integration

Production Order binds to requirement/revision/BOM. On completion, create
ComponentInstance rows or activate pre-reserved instance numbers.

Runnable checkpoint: production can produce traceable physical identities.

### DOMAIN.5 QC And Finished Goods

QC can inspect Production Order, batch and individual instances. QC PASS or
approved USE_AS_IS is required before Finished Goods projection.

Runnable checkpoint: Finished Goods count is authoritative for new flows.

### DOMAIN.6 Yard Integration

Yard placement uses ComponentInstance identity for components. Remove use of
`Component.status=STOCK` as Yard marker in new flows.

Runnable checkpoint: At Yard and Ready To Ship are derived from Yard placement.

### DOMAIN.7 Logistics And Installation

Dispatch items and project installation bind to ComponentInstance. Logistics
owns shipped/delivered; Projects owns site received/installed.

Runnable checkpoint: delivery/install traceability works per physical
component.

### DOMAIN.8 Dashboard And Read-Model Conversion

Convert Components, Executive BI, Historical Snapshot payloads and reports to
new source-of-truth metrics.

Runnable checkpoint: no dashboard counts definition rows as stock.

### DOMAIN.9 Legacy Migration

Create operator-reviewed legacy adoption tools. Mark ambiguous rows
`LEGACY_UNKNOWN`; never fabricate production/QC history.

Runnable checkpoint: old records remain visible with explicit confidence.

### DOMAIN.10 Runtime Certification

Certify:

```text
Project requirement -> Engineering release -> Production -> QC PASS
-> Finished Goods -> Yard -> Dispatch -> Site Receipt -> Installed
```

Run backend/frontend builds, targeted tests and authenticated browser workflow.

## Risks

1. Overbuilding instance identity too early could slow operators if UI has to
   manage each unit manually. Mitigation: create instances automatically from
   Production completion quantity and expose batch actions.
2. Legacy data cannot be fully reconstructed. Mitigation: explicit
   `LEGACY_UNKNOWN` state and non-authoritative historical marking.
3. Current dashboards may temporarily show different numbers after semantic
   correction. Mitigation: add labels separating definitions, planned quantity
   and finished goods.
4. Polymorphic Yard/Dispatch item ids are weak. Mitigation: add nullable
   explicit `componentInstanceId` while preserving old fields.
5. Adding both requirement and instance models increases complexity. Mitigation:
   keep requirements quantity-based and instances only physical output.

## Recommendation

Adopt the split model:

```text
Component = engineering definition
ProjectComponentRequirement = project demand and planned quantity
ProductionOrder = manufacturing document against released engineering basis
ComponentInstance = physical manufactured identity
QC = finished goods gate
Yard = physical location/custody
Logistics = shipment lifecycle
Projects = site receipt and installation
```

Do not try to save the long-term architecture with frontend filters or special
`Component.status` mappings. Keep compatibility, but move new workflows to
requirement + instance identity. This is the smallest model that preserves
traceability, avoids duplicated source of truth, supports millions of records
through indexed appendable identities, and remains understandable for a small
steel fabrication company.
