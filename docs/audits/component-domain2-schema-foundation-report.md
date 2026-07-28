# Component DOMAIN.2 Schema Foundation Report

Date: 2026-07-27

Status: Implemented - migration/test/build pass.

## Architecture Implemented

DOMAIN.2 establishes the permanent canonical data foundation from
`docs/audits/canonical-component-domain-architecture.md`:

- `Component` remains the engineering definition.
- `ComponentRevision` remains the versioned engineering definition.
- `ComponentBomDefinition` remains the Engineering BOM for one revision.
- `ProjectComponentRequirement` now represents project demand/planning:
  Project requires Component Definition x Quantity.
- `ComponentInstance` now represents one physical manufactured component
  identity.

No downstream conversion was performed. Inventory, Production Warehouse, QC,
Yard, Logistics, Historical Dashboard, Snapshot Engine and frontend flows were
not redesigned.

## Schema Added

Migration:

`apps/backend-api/prisma/migrations/20260727220000_component_domain2_schema_foundation/migration.sql`

Added enums:

- `ProjectComponentRequirementStatus`
- `ComponentInstanceState`

Added tables:

- `project_component_requirements`
- `component_instances`
- `component_instance_timelines`

Added optional column:

- `production_orders.componentRequirementId`

No legacy `Component` fields were removed.

## Relations

`ProjectComponentRequirement` links to:

- `Project`
- optional `ProjectTask`
- `Component`
- optional `ComponentRevision`
- optional `ComponentBomDefinition`
- future `ProductionOrder`
- future `ComponentInstance`

`ComponentInstance` links to:

- `Component`
- `ComponentRevision`
- optional `ComponentBomDefinition`
- optional `ProductionOrder`
- optional `ProjectComponentRequirement`
- optional `Project`
- optional `ProjectTask`
- optional legacy `Component`

`ProductionOrder` now has optional `componentRequirementId` for future
Production integration. Existing Production Order creation and B1 BOM
materialization remain compatible.

## Indexes

Requirement indexes support:

- project requirements
- project task requirements
- component definition requirements
- component revision lookup
- BOM definition lookup
- status filtering
- project + component planning queries

Instance indexes support:

- physical code lookup through unique `instanceNo`
- component definition lookup
- component revision lookup
- BOM definition lookup
- production order lookup
- requirement lookup
- project/project task lookup
- state filtering
- createdAt ordering for future high-volume lists

The migration intentionally avoids over-indexing downstream module state that is
not converted in DOMAIN.2.

## Migration

Pre-migration checks:

- Prisma migrate status: up to date before schema change.
- Existing row counts:
  - Components: 8
  - Projects: 2
  - Component Revisions: 8
  - Component BOM Definitions: 8
  - Production Orders: 4
  - QC Inspections: 1
  - Yard Placements: 0
  - Dispatch Items: 0
  - STABILITY7 Components: 6

Backup:

- Valid backup: `/tmp/steeltrack-domain2-before-20260727-143754.dump`

Migration SQL review:

- No destructive statements.
- No `DROP`.
- No `TRUNCATE`.
- No `DELETE`.
- No data mutation of legacy rows.

Migration apply:

- `pnpm -C apps/backend-api exec prisma migrate deploy`: Pass.
- `pnpm -C apps/backend-api exec prisma migrate status`: Pass, database schema
  is up to date.

## Legacy Compatibility

Existing `Component` rows remain readable. No ambiguous legacy Component record
was converted into a `ComponentInstance`.

The current overloaded `Component.status` remains in place for compatibility
only. New foundation tables allow future sprints to move physical semantics out
of `Component.status` without deleting legacy fields.

## B1 Compatibility

B1 lineage remains intact:

```text
Component
  -> ComponentRevision
  -> ComponentBomDefinition
  -> materialized Production BOM
  -> ProductionOrder
```

Runtime smoke created a controlled requirement against a released B1 BOM:

- Namespace: `DOMAIN2-B1-1785138414848`
- Component code: `STABILITY7-1785129114051-COMP`
- BOM state: `RELEASED`
- Required quantity: 1

No Production BOM lineage was altered.

## Runtime Verification

Controlled DB smoke namespace:

- `DOMAIN2-1785138375225`

Runtime facts:

- Created two `ProjectComponentRequirement` rows for the same Component across
  two different Projects.
- Confirmed one Component definition can support multiple project requirements.
- Confirmed requirement creation did not create `ComponentInstance` rows.
- Confirmed requirement creation did not change `InventoryItem` count.
- Created one `ComponentInstance` with state `PLANNED`.
- Confirmed creating a `ComponentInstance` did not set `qcPassedAt`.
- Confirmed creating a `ComponentInstance` did not mean Finished Goods.
- Confirmed STABILITY7 fixture components remained readable.

Runtime count evidence:

| Step | Components | ComponentInstances | InventoryItems |
| --- | ---: | ---: | ---: |
| Before requirement | 8 | 0 | 38 |
| After requirements | 8 | 0 | 38 |
| After instance | 8 | 1 | 38 |

## Tests Added

Added:

- `component-domain-foundation.dto.spec.ts`
- `component-domain-foundation.service.spec.ts`

Updated:

- `components-api-compatibility.spec.ts`

Coverage:

- positive requirement quantity
- rejection of non-positive requirement quantity
- create-instance DTO cannot accept `state`
- requirement creation validates Component/Revision/BOM lineage
- requirement creation does not create instances
- revision mismatch rejected
- instance creation preserves lineage
- instance creation does not directly become QC PASS or Finished Goods
- legacy `/components` route remains unchanged
- command namespace remains unchanged
- foundation namespace is additive

## Backend Tests

`pnpm -C apps/backend-api test`: Pass.

Result:

- 78 test suites passed
- 223 tests passed

## Backend Build

`pnpm -C apps/backend-api build`: Pass.

## Frontend Build

`pnpm -C apps/frontend build`: Pass.

Existing Vite warning remains:

- Some chunks are larger than 500 kB.

No frontend source was modified.

## Migration Status

`pnpm -C apps/backend-api exec prisma migrate status`: Pass.

Result:

- 80 migrations found.
- Database schema is up to date.

## Existing Data Preservation

No existing business rows were deleted, truncated, reset or transformed.

Controlled DOMAIN.2 smoke rows were added intentionally for runtime
verification and are retained for audit traceability.

## Remaining P0

None for DOMAIN.2 schema foundation.

## Remaining P1

- Convert Component create/project planning UI to create requirements instead
  of treating required quantity as stock.
- Connect Production Order creation to `componentRequirementId`.
- Create ComponentInstances at the approved Production completion point.
- Add QC instance-level gate before Finished Goods.
- Convert Yard placement to ComponentInstance identity for new flows.
- Convert Logistics dispatch and Project installation to ComponentInstance
  identity for new flows.
- Convert dashboards/read models away from raw `COUNT(Component)` for physical
  inventory metrics.

## Next Sprint Recommendation

Start `COMPONENT DOMAIN.3 - Component Create And Project Requirement`.

Scope:

- Keep legacy `/components` readable.
- Add canonical project requirement create/read workflow.
- Update backend semantics so required quantity is stored in
  `ProjectComponentRequirement.requiredQuantity`.
- Do not create ComponentInstances yet.
- Do not convert Production/QC/Yard/Logistics before DOMAIN.4+.
