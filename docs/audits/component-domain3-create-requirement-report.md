# COMPONENT DOMAIN.3 - Component Create & Project Requirement Conversion

Status: **IMPLEMENTED - MIGRATION/TEST/BUILD PASS**

Date: 2026-07-27

## Previous Create Semantics

- Frontend generated `CPL-*` codes client-side.
- `Tao cau kien moi` submitted legacy `POST /components`.
- New records were created with `status=STOCK`.
- `type`, `profile`, `quantity` and `qcQuantity` were stored inside
  `Component.description` JSON.
- `quantity` was ambiguous and could be read as physical Component inventory.

## Canonical Create Semantics

- `Component` is the engineering definition.
- `ProjectComponentRequirement` is the Project demand/planned quantity.
- New canonical create produces exactly:
  - 1 `Component`
  - 1 `ProjectComponentRequirement`
  - 0 `ComponentInstance`
  - 0 inventory quantity
  - 0 `ProductionOrder`

## Architecture Implemented

- Added additive typed engineering fields to `Component`:
  - `componentType String?`
  - `profile String?`
  - `@@index([componentType])`
- Added additive route:
  - `POST /components/foundation/definition-requirements`
- The service creates Component definition and Project requirement in one
  Prisma transaction.
- Component code and requirement number are backend-generated with unique
  constraint retry.
- Legacy `/components` remains readable and unchanged.

## Files Changed

- `apps/backend-api/prisma/schema.prisma`
- `apps/backend-api/prisma/migrations/20260727223000_component_domain3_typed_definition_fields/migration.sql`
- `apps/backend-api/src/modules/components/component-domain-foundation.controller.ts`
- `apps/backend-api/src/modules/components/dto/component-domain-foundation.dto.ts`
- `apps/backend-api/src/modules/components/dto/component-domain-foundation.dto.spec.ts`
- `apps/backend-api/src/modules/components/repositories/component-domain-foundation.repository.ts`
- `apps/backend-api/src/modules/components/repositories/components-read-model.repository.ts`
- `apps/backend-api/src/modules/components/services/component-domain-foundation.service.ts`
- `apps/backend-api/src/modules/components/services/component-domain-foundation.service.spec.ts`
- `apps/frontend/src/modules/components/api/contracts/components.contract.ts`
- `apps/frontend/src/modules/components/services/api/components.api.ts`
- `apps/frontend/src/modules/components/hooks/queries/useComponents.ts`
- `apps/frontend/src/modules/components/context/ComponentsActionContext.tsx`
- `apps/frontend/src/modules/components/pages/tabs/ComponentsListPage.tsx`

## API Changes

Additive only.

Request:

```json
{
  "name": "BEAM-B01",
  "componentType": "Dầm (Beam)",
  "profile": "H300",
  "projectId": "project-id",
  "requiredQuantity": 20,
  "requiredBy": "2026-08-15T00:00:00.000Z",
  "note": "Optional planning note"
}
```

Response:

```json
{
  "component": {
    "code": "CPL-YYYYMMDD-XXXXXXXX",
    "lifecycleState": "DRAFT"
  },
  "requirement": {
    "requirementNo": "PCR-YYYYMMDD-XXXXXXXX",
    "requiredQuantity": 20
  }
}
```

## UI Changes

- Create modal title changed to `Tạo hồ sơ cấu kiện`.
- Project selector is explicit: `Công trình / Dự án *`.
- Quantity label changed to `Số lượng yêu cầu *`.
- Component code is shown as backend-generated.
- Submit toast communicates Draft engineering status and Project requirement
  quantity.
- Component list now presents required quantity/BOM/engineering status more
  clearly.

## Project Binding

- Canonical source: `ProjectComponentRequirement.projectId`.
- Compatibility mirror: `Component.projectId` remains populated for legacy
  read paths and existing filters.

## Quantity Semantics

- New canonical quantity is persisted only to
  `ProjectComponentRequirement.requiredQuantity`.
- New create no longer stores canonical quantity in `Component.description`.

## Component Code Strategy

- Backend-owned human-readable code:
  `CPL-YYYYMMDD-XXXXXXXX`.
- `Component.code` unique constraint remains the final concurrency guard.
- The service retries identity generation on unique collision.

## Legacy Compatibility

- Existing records remain readable.
- Existing `description` JSON is preserved.
- Read model uses:
  - `Component.componentType` -> fallback `description.type`
  - `Component.profile` -> fallback `description.profile`
  - requirement total -> fallback `description.quantity`
- Legacy `/components` was not removed or redefined.

## Runtime Verification

- Prisma validation: PASS.
- Prisma generate: PASS.
- Backend tests: PASS, 78 suites / 227 tests.
- Backend build: PASS.
- Frontend build: PASS with existing Vite chunk-size warning.
- Migration SQL destructive review: PASS, no `DROP`, `TRUNCATE` or `DELETE`.

## Migration Status

- Backup gate: PASS.
- Backup file:
  `/tmp/steeltrack-domain3-before-20260727.dump`.
- Backup size: 822318 bytes.
- Backup verification: PASS, `pg_restore --list` read the custom archive.
- Database identity:
  - database: `steeltrack`
  - schema: `public`
  - server: `localhost:5432`
  - PostgreSQL: `17.10`
- Migration deployed:
  `20260727223000_component_domain3_typed_definition_fields`.
- Prisma migrate status: PASS, database schema is up to date.
- Live DB verification: PASS, `components.componentType`,
  `components.profile` and `components_componentType_idx` exist.

The earlier backup blocker was environmental rather than database-level:
native PostgreSQL clients and Prisma runtime could not reach
`localhost:5432` inside the restricted sandbox, while the approved escalated
native-client path connected successfully and produced a verified backup.

## Migration SQL Review

The deployed SQL is additive only:

```sql
ALTER TABLE "components"
ADD COLUMN "componentType" TEXT,
ADD COLUMN "profile" TEXT;

CREATE INDEX "components_componentType_idx" ON "components"("componentType");
```

No `DROP`, `TRUNCATE`, `DELETE`, backfill, `SET NOT NULL` or destructive
constraint change was present.

## Runtime Smoke

Controlled namespace: `DOMAIN3-1785144581343`.

Runtime API result:

- Created Project: `DOMAIN3-1785144581343-PRJ`.
- Created Component definition: `CPL-20260727-BDC4F6F3`.
- Component lifecycle state: `DRAFT`.
- Typed fields persisted:
  - `componentType`: `Dầm (Beam)`
  - `profile`: `H300x150`
- Created ProjectComponentRequirement:
  `PCR-20260727-BDC4F6F3`.
- Required quantity persisted: `20`.
- ComponentInstances created: `0`.
- ProductionOrders created: `0`.
- InventoryTransactions created: `0`.

The Components read model returns the new canonical values:
`type = Dầm (Beam)`, `profile = H300x150`, `qty = 20`,
`status = Draft`. The legacy `Component.status` still reports `STOCK` for
compatibility, but the canonical lifecycle/read model does not treat this as
Finished Goods or physical inventory.

## Data Preservation

Pre-migration row counts:

```json
{
  "Component": 8,
  "ProjectComponentRequirement": 3,
  "ComponentInstance": 1,
  "ProductionOrder": 4,
  "BOM": 4,
  "BOMItem": 7
}
```

Post-migration row counts before the DOMAIN3 runtime fixture:

```json
{
  "Component": 8,
  "ProjectComponentRequirement": 3,
  "ComponentInstance": 1,
  "ProductionOrder": 4,
  "BOM": 4,
  "BOMItem": 7,
  "legacyTypedNulls": 8
}
```

Post-smoke row counts:

```json
{
  "Component": 9,
  "ProjectComponentRequirement": 4,
  "ComponentInstance": 1,
  "ProductionOrder": 4,
  "BOM": 4,
  "BOMItem": 7
}
```

Existing rows were not backfilled. The runtime fixture increased only
`Component` and `ProjectComponentRequirement`, as intended.

## STABILITY7 / B1 Regression

- STABILITY7 fixture readability: PASS, 6 matching Components readable.
- Released B1 BOM definitions: PASS, 2 readable.
- Component -> Production BOM lineage: PASS, 2 lineage rows readable.

## Regression Results

- DOMAIN.2 foundation tests: PASS.
- Components API compatibility test: PASS.
- Full backend Jest suite: PASS.
- Frontend build/typecheck: PASS.

## Remaining P0

- None for DOMAIN.3 migration deployment and canonical create runtime smoke.

## Remaining P1

- Convert dashboard/read-model physical inventory metrics away from
  `COUNT(Component)` after ComponentInstance/QC/Yard gates are implemented.
- Decide when to retire legacy `description` structured metadata fallback.
- Later sprint should decide when to retire or remap legacy
  `Component.status=STOCK` compatibility semantics so it cannot be confused
  with Finished Goods.

## Next Sprint Recommendation

Start DOMAIN.4: Production integration against `componentRequirementId` and
released revision/BOM lineage. At the approved completion point, activate or
create `ComponentInstance` physical identities without marking them QC-passed
or Finished Goods.
