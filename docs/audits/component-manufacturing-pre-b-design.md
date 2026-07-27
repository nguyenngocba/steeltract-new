# Component Manufacturing Workflow Pre-B Design

Status: READ-ONLY VERIFICATION + IMPLEMENTATION DESIGN  
Scope: Sprint PRE-B before Sprint B implementation  
Date: 2026-07-27

## 1. SHIPPED Verification

Result: **ComponentStatus.SHIPPED exists in the authoritative schema and generated Prisma client.**

Evidence:

- `apps/backend-api/prisma/schema.prisma`
  - `enum ComponentStatus` includes:
    - `STOCK`
    - `CUTTING`
    - `WELDING`
    - `PAINTING`
    - `READY`
    - `SHIPPED`
    - `DELIVERED`
    - `INSTALLED`
- Generated Prisma client under pnpm store includes:
  - `ComponentStatus.SHIPPED: 'SHIPPED'`
- Backend references are therefore valid against the current schema.

Current references:

- Components:
  - `ComponentsService.deliver()` transitions `SHIPPED -> DELIVERED`.
  - `ComponentsReadModelRepository` groups `SHIPPED` into transferring/inventory-like views.
  - Component snapshots count shipped components.
- Yard:
  - Yard removal/loading paths mark components as `SHIPPED`.
- Dashboard/runtime:
  - Dashboard and runtime integrity count `SHIPPED`.
- Projects:
  - Projects read models and project progress treat `SHIPPED` as an in-progress delivery state.
- Frontend:
  - Components and Projects API contracts include `SHIPPED`.

Classification: **No P0 bug**.

The previous audit warning should be downgraded to **P2 documentation/audit correction**. It came from an incomplete/stale enum excerpt, not from current authoritative schema.

Does this currently compile?

- The current Prisma schema and generated Prisma client agree on `SHIPPED`.
- Existing code references are not stale generated artifacts.
- No fix should be made for `SHIPPED` in Sprint B.

Lifecycle interpretation:

- `SHIPPED` is an existing shipping/transit state between Yard/Logistics and Project delivery.
- It should remain distinct from `DELIVERED` and `INSTALLED`.

## 2. Engineering BOM Contract

Models:

- `Component`
  - `lifecycleState`
  - `aggregateVersion`
  - `currentRevisionId`
- `ComponentRevision`
  - `componentId`
  - `revisionNo`
  - `state`
  - `content`
  - `contentHash`
  - approval/release timestamps and actors
- `ComponentBomDefinition`
  - `componentRevisionId`
  - `state`
  - `lines Json`
  - `routing Json`
  - `contentHash`
  - `aggregateVersion`
  - validation timestamps and actor
- `ComponentReleaseEvidence`
  - `componentId`
  - `revisionId`
  - `previousRevisionId`
  - `contentHash`
  - `releasedBy`
  - `releasedAt`

Command flow:

1. `createRevision`
   - Creates `ComponentRevision`.
   - Creates empty `ComponentBomDefinition`.
2. `replaceBom`
   - Allowed only while revision content is mutable.
   - Computes `contentHash = stableHash({ lines, routing })`.
   - Rejects if supplied hash does not match content.
   - Stores `lines` and `routing` as JSON.
   - Resets BOM state to `DRAFT`.
3. `validateBom`
   - Requires BOM state `DRAFT`.
   - Requires stored `bom.contentHash === command.contentHash`.
   - Moves BOM state to `VALIDATED`.
4. `submitForReview`
   - Requires validated BOM.
5. `approve`
   - Moves revision to `APPROVED`.
6. `releaseRevision`
   - Requires approved revision.
   - Requires validated BOM.
   - Requires `bom.contentHash === revision.contentHash`.
   - Moves revision to `RELEASED`.
   - Moves BOM to `RELEASED`.
   - Moves component to `ACTIVE`.
   - Sets `currentRevisionId`.
   - Creates `ComponentReleaseEvidence`.
   - Supersedes previous revision/BOM when applicable.

Exact `ComponentBomDefinition.lines` structure:

- Current DTO contract is **not structurally typed**.
- `replaceEngineeringBomCommandSchema` defines:
  - `lines: unknown` but required
  - `routing: unknown` but required
  - `contentHash: string`
- Domain command type defines:
  - `lines: unknown`
  - `routing: unknown`
- Service stores `lines` directly as JSON.

Therefore the exact current contract is:

```ts
type ComponentBomDefinitionLines = unknown; // required JSON payload
type ComponentBomDefinitionRouting = unknown; // required JSON payload
```

Line-level fields currently enforced by backend: **none**.

| Field | Current enforcement |
| --- | --- |
| material identity | Not enforced |
| material code/id | Not enforced |
| quantity | Not enforced |
| UOM | Not enforced |
| waste % | Not enforced |
| category/type | Not enforced |
| alternative materials | Not enforced |
| metadata | Allowed implicitly by JSON |
| revision relationship | Enforced at BOM definition level through `componentRevisionId` |
| validation rules | Hash integrity and lifecycle only |

What becomes immutable at Engineering Release:

- Released `ComponentRevision` can no longer update content through aggregate rules.
- Released `ComponentBomDefinition` cannot be replaced through `ComponentBomAggregate.replace`, which allows only `DRAFT` and `VALIDATED`.
- Released revision and BOM are bound by `contentHash`.
- `ComponentReleaseEvidence` records released revision and hash.

Important implication:

- Engineering release currently proves payload integrity, not material-line semantic validity.
- Sprint B must introduce a materialization contract before Production can safely consume engineering BOM lines.

## 3. Production BOM Contract

Models:

- `BOM`
  - `id`
  - `bomNo`
  - `productCode`
  - `productName`
  - `structureType`
  - `projectId`
  - `unit`
  - `estimatedWeight`
  - `version`
  - `status String`
  - relations: `items`, `routingSteps`, `productionOrders`, `materialReservations`
- `BOMItem`
  - `bomId`
  - `materialId`
  - `quantity`
  - `wastePercent`
  - `category String`
  - relation to `InventoryItem`
  - relation to `ProductionMaterialReservationLine`
- `BOMRoutingStep`
  - `bomId`
  - `stepNo`
  - `stepName`
  - `workshop`
  - `expectedHours`
  - `qcRequired`

DTO contract:

```ts
type BomItemInput = {
  materialId: string;
  quantity: number;
  wastePercent: number; // 0..100, default 0
  category: 'MAIN_MATERIAL' | 'SECONDARY_MATERIAL' | 'CONSUMABLE';
};

type BomRoutingStepInput = {
  stepNo: number;
  stepName: string;
  workshop?: string;
  expectedHours: number;
  qcRequired: boolean;
};
```

Lifecycle:

- `BOM.status` is free text.
- Common values observed through service:
  - `ACTIVE`
  - `DRAFT`
  - `ARCHIVED`
- There is no Prisma enum for production BOM status.

Ownership:

- Production owns production BOM execution data.
- Current production BOM can be manually created/updated/cloned/archived through `/production/boms`.

Relation to Component:

- No direct `componentId` relation on `BOM`.
- Current legacy relation is by `productCode`.
- `ProductionService.create()` validates:
  - if component and BOM are both selected, `bom.productCode === component.code`.

Relation to ProductionOrder:

- `ProductionOrder.bomId` points to `BOM`.
- `ProductionOrder` also has `componentRevisionId` and `bomDefinitionId` for canonical engineering basis, but existing `BOM` does not preserve those IDs.

## 4. Current Reservation Dependency

Reservation depends on production `BOM/BOMItem`, not engineering `ComponentBomDefinition`.

Flow:

```text
ProductionOrder.bomId
  -> BOM.items
  -> BOMItem.materialId
  -> InventoryItem
  -> InventoryLocationStock in production warehouse
  -> active ProductionMaterialReservationLine quantities
  -> required/reservable/shortage preview
```

Required quantity formula:

```ts
requiredQty = bomItem.quantity * (1 + bomItem.wastePercent / 100) * productionOrder.quantity
```

Availability:

- On hand source: `InventoryLocationStock` buckets in production warehouse.
- Reserved source: active `ProductionMaterialReservationLine` rows whose reservation status is `RESERVED` or `PARTIALLY_ISSUED`.
- Available/reservable quantity is computed by subtracting active reserved quantities from production stock buckets.

Issue dependency:

- `issueFromReservation` consumes active reservation lines.
- It creates `ProductionMaterialIssue`.
- It posts Inventory `EXPORT` through `InventoryPostingService.issueMaterial`.

## 5. Proposed BOM Bridge

Bridge target:

```text
ComponentRevision
  -> ComponentBomDefinition RELEASED
  -> Production BOM Materialization
  -> BOM
  -> BOMItem
  -> ProductionOrder
  -> Reservation
  -> Issue
```

Minimum bridge responsibilities:

- Preserve:
  - `componentId`
  - `componentRevisionId`
  - `bomDefinitionId`
  - engineering `contentHash`
  - production `BOM.id`
  - production `BOM.bomNo`
  - production `BOM.version`
- Convert engineering lines to production `BOMItem`.
- Convert engineering routing to `BOMRoutingStep`.
- Enforce idempotency: same released `bomDefinitionId` materializes to one production BOM.
- Ensure reservation always consumes a production BOM matching the released engineering basis.

Required engineering line materialization contract for B1:

```ts
type ReleasedEngineeringBomLine = {
  materialId?: string;
  materialCode?: string;
  quantity: number;
  uom?: string;
  unit?: string;
  unitId?: string;
  wastePercent?: number;
  category?: 'MAIN_MATERIAL' | 'SECONDARY_MATERIAL' | 'CONSUMABLE' | string;
  alternatives?: Array<{
    materialId?: string;
    materialCode?: string;
    priority?: number;
    substitutionRatio?: number;
  }>;
  metadata?: Record<string, unknown>;
};
```

Mapping:

| Engineering field | Production target | Rule |
| --- | --- | --- |
| `materialId` | `BOMItem.materialId` | Prefer direct ID |
| `materialCode` | `BOMItem.materialId` | Resolve through `InventoryItem.code` if ID absent |
| `quantity` | `BOMItem.quantity` | Required positive number |
| `wastePercent` | `BOMItem.wastePercent` | Default 0 |
| `category/type` | `BOMItem.category` | Map to allowed production categories |
| `routing[].stepNo` | `BOMRoutingStep.stepNo` | Required/derived sequence |
| `routing[].stepName` | `BOMRoutingStep.stepName` | Required |
| `routing[].workshop` | `BOMRoutingStep.workshop` | Optional |
| `routing[].expectedHours` | `BOMRoutingStep.expectedHours` | Default 0 |
| `routing[].qcRequired` | `BOMRoutingStep.qcRequired` | Default false |

Alternatives:

- Current production `BOMItem` has no relational alternative material support.
- In B1, alternatives can be validated and preserved in materialization metadata only if a metadata field exists.
- Because `BOM` currently lacks metadata, robust alternative material support likely requires a later additive schema design.
- For B1, alternatives should be documented as **not executable by reservation** unless materialized to primary selected material.

## 6. Materialization Timing Decision

Recommended timing: **B. during Production Order creation**.

Reason:

- Engineering Release should remain engineering-owned and should not create Production-owned execution records automatically.
- Production Order creation is the first moment a released engineering basis is selected for manufacturing.
- Reservation already depends on `ProductionOrder.bomId`, so materializing before or during order creation gives reservation a stable relational BOM.
- Historical Production Orders need to keep their exact production BOM identity even after newer revisions are released.
- Materializing lazily before reservation would make order creation look successful while still missing the relational BOM needed by the first material operation.
- Materializing during release could create production BOMs for revisions that never enter production, increasing noise at scale.

Chosen boundary:

```text
Create Production Order command/service
  -> verify released engineering basis
  -> materialize or find production BOM for bomDefinitionId
  -> attach ProductionOrder.bomId
  -> store componentRevisionId/bomDefinitionId on ProductionOrder
```

Legacy `/production` path:

- Should use the same materialization service when `componentId` is provided and `bomId` is absent.
- If caller supplies `bomId`, backend must verify that BOM lineage matches the released engineering basis.

## 7. Idempotency Strategy

Materialization idempotency key:

```text
production-bom-materialization:{bomDefinitionId}:{contentHash}
```

Required behavior:

- Same `bomDefinitionId + contentHash` returns existing `BOM`.
- Same `bomDefinitionId` with different content hash is a conflict because a released BOM definition is immutable.
- New component revision produces a new `ComponentBomDefinition` and therefore a new production BOM.
- Replayed Production Order creation should not duplicate BOM, BOM items, or routing steps.

Concurrency:

- Use transaction around:
  - find materialized BOM by `bomDefinitionId`
  - create BOM
  - create BOM items/routing
  - create Production Order
- Database uniqueness on `BOM.bomDefinitionId` is recommended to make concurrent creation safe.

## 8. Revision / Hash Traceability

Traceability required for every production BOM:

- `componentId`
- `componentRevisionId`
- `bomDefinitionId`
- `engineeringContentHash`
- `materializedAt`
- `materializedBy`

Why this matters:

- Production orders must remain historically tied to the exact released engineering definition.
- Reservation/issue/costing must be explainable even after a component revision is superseded.
- Rebuilding read models or audits must not infer lineage from mutable `productCode`/`version` strings.

## 9. Migration Decision

Decision: **ADDITIVE MIGRATION RECOMMENDED**.

Why existing BOM cannot reliably preserve lineage without schema changes:

- `BOM` has no `metadata` JSON field.
- `BOM` has no `componentId`, `componentRevisionId`, or `bomDefinitionId`.
- `BOM.productCode` is not a stable foreign key and can collide with legacy/manual records.
- `BOM.version` is a human string, not a reliable queryable lineage carrier.
- `BOM.status` is free text and should not carry source identity.
- At scale, querying materialized BOM by parsing strings or matching product code/version is unsafe and slow.

No migration should be created in Pre-B. This is only the design decision for Sprint B.

## 10. Required Indexes If Applicable

Recommended additive fields on `BOM`:

```text
componentId String?
componentRevisionId String?
bomDefinitionId String?
engineeringContentHash String?
source String? default/manual indicator if enums are deferred
materializedAt DateTime?
materializedBy String?
```

Recommended constraints/indexes:

```text
UNIQUE (bomDefinitionId) WHERE bomDefinitionId IS NOT NULL
INDEX (componentId)
INDEX (componentRevisionId)
INDEX (bomDefinitionId)
INDEX (engineeringContentHash)
INDEX (componentId, status)
```

If Prisma cannot express the partial unique index, Sprint B migration plan should mark it as raw SQL TODO:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS "BOM_bomDefinitionId_unique_not_null"
ON "BOM" ("bomDefinitionId")
WHERE "bomDefinitionId" IS NOT NULL;
```

Foreign keys:

- Recommended but optional depending migration risk:
  - `componentId -> components.id`
  - `componentRevisionId -> component_revisions.id`
  - `bomDefinitionId -> component_bom_definitions.id`

If FK lock risk is unacceptable in first rollout, use indexed string lineage fields first, then add FKs after data backfill validation.

## 11. Business Invariants

Engineering Release:

1. Component must be `DRAFT` or `ACTIVE` to release a revision.
2. Revision must be `APPROVED`.
3. BOM definition must be `VALIDATED`.
4. Revision content hash must equal BOM definition content hash.
5. Released revision and BOM are immutable.

Production BOM materialization:

1. Only `ComponentBomDefinition.RELEASED` can be materialized.
2. Materialization must preserve `componentId`, `componentRevisionId`, `bomDefinitionId`, and `contentHash`.
3. One released BOM definition maps to one production BOM.
4. Production BOM cannot be silently edited after it is bound to a production order.
5. Manual production BOMs remain supported for legacy/non-component production only.

Production Order creation:

1. Component-bound Production Order requires released Engineering basis.
2. Production Order must attach the production BOM materialized from the same released BOM definition.
3. Caller-supplied `bomId` is valid only if it matches the released Engineering basis.
4. Creation is not release/start.

Reservation:

1. Reservation uses production BOM items.
2. Reservation reduces `AVAILABLE`, not `ON HAND`.
3. Reservation quantity cannot exceed `ON HAND - active RESERVED`.
4. Reservation lines must preserve warehouse/zone/slot/level.

Issue:

1. Issue should be from active reservation lines.
2. Issue reduces `ON HAND` through Inventory posting.
3. Issue creates `InventoryTransaction` and `InventoryTransactionItem`.
4. Issue updates Production Material Ledger.
5. Issue cannot exceed reserved remaining quantity.

Production Start:

1. Start requires authoritative backend-computed material gate.
2. Caller-supplied boolean cannot be authoritative.
3. Required material issue must be complete for mandatory BOM items.
4. `ISSUED` is production-side proof; Inventory transaction is stock proof.

Quantity definitions:

| Quantity | Owner | Definition |
| --- | --- | --- |
| ON HAND | Inventory | Current physical stock in `InventoryLocationStock` and item snapshot |
| RESERVED | Production | Active `ProductionMaterialReservationLine.reservedQty - issuedQty + returnedQty` |
| AVAILABLE | Derived | `ON HAND - active RESERVED` for selected production buckets |
| ISSUED | Production + Inventory | Production issue rows backed by Inventory `EXPORT` |
| CONSUMED | Production | Actual usage in `ProductionMaterialConsumption`; no second Inventory decrement |

## 12. Sprint B1 Exact Implementation Plan

Do not implement until this design is accepted.

Expected steps:

1. Add additive BOM lineage fields and indexes if migration is approved.
2. Add `ProductionBomMaterializationService`.
3. Add parser/validator for `ComponentBomDefinition.lines` and `routing`.
4. Resolve `materialId` directly or through `InventoryItem.code`.
5. Materialize `BOM`, `BOMItem`, and `BOMRoutingStep` in one transaction.
6. Enforce idempotency by `bomDefinitionId`.
7. Update canonical Production Order create path to materialize/find production BOM before create.
8. Update legacy Production create path:
   - If `bomId` omitted and `componentId` supplied, materialize from current released revision.
   - If `bomId` supplied, validate lineage.
9. Add tests:
   - Current released engineering BOM materializes once.
   - Replay returns same BOM.
   - Mismatched content hash rejects.
   - Production Order cannot bind a BOM from another component/revision.
   - Reservation preview consumes materialized `BOMItem`.

## 13. Risks

| Risk | Severity | Why | Mitigation |
| --- | --- | --- | --- |
| Engineering BOM line shape is currently `unknown` | P1 | Production cannot safely materialize arbitrary JSON | Add strict B1 parser/validator |
| Production BOM lacks lineage | P1 | Cannot prove BOM came from released engineering basis | Add additive lineage fields |
| Manual and materialized BOMs coexist | P2 | Operators may bind wrong BOM | Validate BOM lineage at Production Order creation |
| Alternatives unsupported by production BOM | P2 | Engineering can describe alternatives but reservation cannot choose them | Treat alternatives as future extension or metadata-only |
| Production BOM status is free text | P2 | Lifecycle rules weaker than enum | Defer enum; avoid broad migration in B1 |
| Concurrent materialization | P1 | Duplicate BOMs possible without unique key | Add unique index on non-null `bomDefinitionId` |

## 14. Files Expected To Change In B1

Expected backend/schema files if Sprint B1 is approved:

- `apps/backend-api/prisma/schema.prisma`
  - Add BOM lineage fields and indexes.
- Prisma migration SQL
  - Add fields/indexes; partial unique index likely raw SQL.
- `apps/backend-api/src/modules/production/services/production-bom-materialization.service.ts`
  - New bridge service.
- `apps/backend-api/src/modules/production/repositories/bom.repository.ts`
  - Find by `bomDefinitionId`; create materialized BOM transaction helpers.
- `apps/backend-api/src/modules/production/services/bom.service.ts`
  - Preserve manual BOM behavior; possibly expose internal materialization helper.
- `apps/backend-api/src/modules/production/services/production-command.service.ts`
  - Materialize/validate BOM during canonical create.
- `apps/backend-api/src/modules/production/services/production.service.ts`
  - Materialize/validate BOM during legacy create.
- `apps/backend-api/src/modules/production/production.module.ts`
  - Register bridge service.
- Tests:
  - `production-bom-materialization.service.spec.ts`
  - production create tests for lineage and reservation preview.

Files not expected to change in B1:

- Inventory services.
- QC services.
- Yard services.
- Logistics services.
- Frontend.
- Historical Dashboard.
- Snapshot Engine.
