# Projects Migration Status Report

Date: 2026-07-01

## Initial Status

Command:

```bash
pnpm --dir apps/backend-api exec prisma migrate status
```

Initial result:

```text
Pending migrations:
20260630100000_project_task_domain
20260630113000_project_template_library
```

Attempting deploy initially failed:

```text
P3018
ERROR: column component.id does not exist
Migration: 20260630100000_project_task_domain
```

## Migration Failure Cause

The ProjectTask migration component allocation backfill used a confusing SQL alias pattern around `component` / `components`. PostgreSQL resolved the expression incorrectly during the backfill query, causing the migration to fail before creating the full Projects domain tables.

## Repair

Updated the component allocation backfill aliases:

- CTE alias: `components` -> `legacy_components`
- joined table alias: `component` -> `comp`

Then repaired the migration state:

```bash
pnpm --dir apps/backend-api exec prisma migrate resolve --rolled-back 20260630100000_project_task_domain
pnpm --dir apps/backend-api exec prisma migrate deploy
```

Applied migrations:

```text
20260630100000_project_task_domain
20260630113000_project_template_library
```

## Final Status

Command:

```bash
pnpm --dir apps/backend-api exec prisma migrate status
```

Final result:

```text
Database schema is up to date!
```

Verified tables:

- `project_tasks`
- `project_task_dependencies`
- `project_task_material_allocations`
- `project_task_component_allocations`
- `project_task_resources`
- `project_task_inspections`
- `project_task_costs`
- `project_templates`

## Verification

- `pnpm -C apps/backend-api build` passed.
- `pnpm -C apps/frontend build` passed.
- `pnpm -C apps/backend-api start:dev` compiled successfully, then failed to bind because port `3000` was already in use.
- Existing server on `localhost:3000` returned:
  - `GET /projects/runtime -> 200`
  - `GET /projects -> 200`
  - `GET /projects/:id/wbs -> 200`

