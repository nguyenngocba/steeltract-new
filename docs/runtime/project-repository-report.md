# EPIC115 - Project Repository Compliance Report

Date: 2026-07-08

## Scope

Audited backend Project command and query paths for Core Platform repository compliance.

## Result

Project service persistence now routes through repository methods for:

- Project template list/create/update/duplicate/import/export support.
- Project component return mutation.
- WBS create, generate, bulk update, update, move, and delete mutation paths.
- ProjectTask relation replacement for dependencies, material allocations, component allocations, resources, inspection, and cost.
- ProjectTask table-readiness checks and task lookup helpers.

`ProjectsService` no longer injects or calls `PrismaService` directly. Direct Prisma access inside `apps/backend-api/src/modules/projects` is confined to `ProjectsRepository`.

## Repository Boundary

Current boundary:

```text
ProjectsController
  -> ProjectsService
    -> ProjectsRepository
      -> Prisma
```

Operations Center reads Project platform health through `OperationsCenterRepository`, which is a system repository and not a Project business service.

## Remaining Risk

`ProjectsService` is still large and owns orchestration plus DTO mapping. This is acceptable for this sprint because behavior and API contract were preserved, but a future cleanup should split read-model composition from command orchestration after regression tests exist.

