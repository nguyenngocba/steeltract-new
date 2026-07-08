# SNAP.1 Snapshot Migration Report

Date: 2026-07-07

## Migration

Created:

```text
apps/backend-api/prisma/migrations/20260707133000_persisted_snapshot_foundation/migration.sql
```

The migration creates:

- `inventory_dashboard_snapshots`
- `project_dashboard_snapshots`
- `dispatch_dashboard_snapshots`

## Migration Status

`prisma migrate deploy` was run and applied the migration successfully.

`prisma migrate status` reports:

```text
Database schema is up to date!
```

## migrate dev Result

`prisma migrate dev --name verify_snapshot_foundation --skip-generate` was attempted as requested.

Result: blocked by pre-existing migration drift.

Prisma reported:

```text
- The migration `20260630100000_project_task_domain` was modified after it was applied.
- Drift detected.
[+] Added tables
  - inventory_location_stocks_backup

We need to reset the "public" schema.
```

No reset was executed because it would drop data.

## Operational Conclusion

The SNAP.1 migration itself is present, applied, and the database is up to date according to `migrate status`.

The remaining `migrate dev` blocker is historical drift outside SNAP.1 and should be handled in a separate migration-history cleanup task.

