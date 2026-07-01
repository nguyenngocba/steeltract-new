# Projects Runtime Recovery Report

Date: 2026-07-01

## Root Cause

Projects runtime crashed because Prisma queried normalized ProjectTask tables before they existed in the active database.

Observed runtime error:

```text
Prisma P2021: table public.project_tasks does not exist
```

The database had two pending Projects migrations:

- `20260630100000_project_task_domain`
- `20260630113000_project_template_library`

The first migration had previously failed during SQL backfill. Because the migration failed, none of the ProjectTask tables were available at runtime, so `GET /projects/runtime` and `GET /projects/:id/wbs` could crash.

## Fix Applied

- Repaired the failing SQL in `20260630100000_project_task_domain/migration.sql` by removing the ambiguous `component` / `components` alias collision in the component allocation backfill.
- Marked the failed migration as rolled back with Prisma migrate resolve.
- Re-ran Prisma migrate deploy.
- Added backend compatibility guards:
  - `hasProjectTaskTable()`
  - `hasProjectTemplateTable()`
- Added safe fallbacks:
  - runtime dashboard returns an empty runtime DTO if ProjectTask tables are missing.
  - WBS returns `[]` if ProjectTask tables are missing.
- Added temporary Projects debug logging for runtime, templates, project creation, template build, and WBS paths.
- Updated frontend Projects queries to avoid infinite retries and show visible empty/error states instead of crashing.

## Runtime Verification

After migration deploy:

```text
GET /projects/runtime -> 200
GET /projects -> 200
GET /projects/:id/wbs -> 200
```

`GET /projects/templates` returned `401` without an auth token, which is expected because template APIs are protected by auth/RBAC.

## Rejected Hypotheses

- Frontend-only crash: rejected. The primary failure was backend Prisma P2021 from a missing database table.
- Template UI mapping bug: rejected as the first cause. Template API could not work reliably while `project_templates` was missing.
- Prisma Client generation bug: rejected. The client knew the models; the active database lacked the tables.

## Current Status

Projects runtime no longer crashes when ProjectTask tables exist, and it now degrades safely if those tables are absent in another environment.

