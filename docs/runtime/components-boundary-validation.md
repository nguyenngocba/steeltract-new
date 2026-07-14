# Components Boundary Validation

Date: 2026-07-12

## Approved Boundary

```text
ComponentsController
  -> ComponentsService
     -> ComponentsRepository
        -> Prisma

ComponentsController / Production orchestration
  -> ComponentCostingService
     -> ComponentCostingRepository
        -> Prisma
```

## Static Validation

The following patterns return no matches under
`apps/backend-api/src/modules/components/services`:

- `PrismaService`;
- `this.prisma`;
- direct `tx.component*`, `tx.activityLog`, consumption, or Inventory transaction
  item model calls.

`Prisma.InputJsonObject` remains a type-only service dependency for ActivityLog
metadata. It does not provide database access and is not a repository violation.

## Scope Boundary

EPIC141 validates ownership inside the Components module. Existing cross-module
Component writes in Production, Projects, Yard, and QC were identified in
EPIC140 and are not moved here because doing so requires a separately approved
cross-module command boundary. No Inventory or Production code was changed.

## Contract Safety

- Controller routes: unchanged.
- DTO and response shapes: unchanged.
- Business formulas and workflow: unchanged.
- UI and React Query: unchanged.
- Schema and migrations: unchanged.

Repository Boundary: **PASS**.

