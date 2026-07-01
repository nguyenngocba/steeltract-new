# Projects Template API Report

Date: 2026-07-01

## Scope

Audited and repaired Projects template runtime readiness for:

- `GET /projects/templates`
- `POST /projects/templates`
- `POST /projects`
- template-backed project creation

## Root Cause

The Project Template Library depended on migration `20260630113000_project_template_library`, but that migration was pending because the earlier ProjectTask migration failed. As a result, the expected `project_templates` table was absent and template APIs could not load or create records safely.

## Fix Applied

- Deployed pending Projects migrations after repairing the ProjectTask migration.
- Confirmed `project_templates` exists.
- Confirmed default template exists:

```text
TPL-NX-5N | Nhà xưởng 5 nhịp | PUBLISHED | isDefault=true
```

- Added `hasProjectTemplateTable()` guard.
- `listTemplates()` now returns `[]` instead of throwing if the table is missing.
- Template mutation APIs now fail with a controlled `BadRequestException` if template tables are not ready.
- Project creation from template now validates that both ProjectTask and ProjectTemplate domain tables are available before applying the template.

## API Behavior

Authenticated users should now be able to load templates once their token and permissions are valid.

Unauthenticated verification:

```text
GET /projects/templates -> 401 Unauthorized
```

This is expected because the endpoint is protected by auth/RBAC. The runtime table/migration issue is fixed separately from authentication.

## Frontend Behavior

The Projects page template query now uses `retry: false`, avoiding noisy retry loops when auth or migration readiness fails. The Templates tab shows a visible empty/error state if the request cannot load.

## Remaining Notes

- Template permission UX should still be checked with a real Admin session.
- If an environment restores an older database without migrations, the API will now degrade gracefully instead of hard-crashing with P2021.

