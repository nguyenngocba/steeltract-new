# Rollback And Restore Procedure

## Principles

- Prefer application rollback to the previous immutable image.
- Keep additive compatible migrations in place during application rollback.
- Never run destructive schema/data rollback automatically.
- Restore only into a new database first; never test restore over the source.
- Preserve Outbox, projection checkpoint and audit evidence before intervention.

## Decision Matrix

| Failure | First action | Database action |
| --- | --- | --- |
| API/image regression | Stop rollout; route to previous digest | None for additive compatible migrations |
| Readiness failure | Remove new replicas; inspect dependency/config | None until root cause is known |
| Migration still running but over budget | Cancel migration job safely | Inspect invalid indexes |
| Failed concurrent index | Keep API on compatible image | Drop only invalid artifact concurrently |
| Projection corruption | Stop replay; preserve evidence | Restore/rebuild projection only |
| Confirmed business-data corruption | Freeze writes and escalate | Point-in-time restore into new database |

## Pre-migration Backup

Use staging secret injection; do not place credentials in shell history:

```bash
pg_dump --format=custom --no-owner --no-acl \
  --file="steeltrack-${VALIDATION_ID}.dump" "$DATABASE_URL"
sha256sum "steeltrack-${VALIDATION_ID}.dump" \
  > "steeltrack-${VALIDATION_ID}.dump.sha256"
pg_dumpall --globals-only > "steeltrack-${VALIDATION_ID}-globals.sql"
```

Encrypt and store the backup according to the environment retention policy.
Record size, checksum, source LSN/time and tool version.

## Restore Drill

Create a new empty target database owned by the staging database owner, then:

```bash
sha256sum -c "steeltrack-${VALIDATION_ID}.dump.sha256"
pg_restore --exit-on-error --no-owner --no-acl \
  --dbname="$RESTORE_DATABASE_URL" \
  "steeltrack-${VALIDATION_ID}.dump"
```

Run Prisma status, row-count/invariant comparisons, application readiness and
authenticated read smoke against the restored URL. Measure restore duration and
compare it with RTO. The source database must remain untouched.

## Failed Concurrent Index Recovery

1. Stop the migration job and confirm no index build remains in
   `pg_stat_progress_create_index`.
2. List invalid/not-ready indexes using the query in
   [migration-validation.md](./migration-validation.md).
3. Match each artifact to the pending migration. Never drop a valid pre-existing
   index with a similar name.
4. Execute one reviewed statement at a time:

```sql
DROP INDEX CONCURRENTLY IF EXISTS "<confirmed_invalid_index_name>";
```

5. If Prisma recorded a failed migration, and only after cleanup:

```bash
pnpm -C apps/backend-api exec prisma migrate resolve \
  --rolled-back 20260717190000_enterprise_data_scalability_indexes
pnpm -C apps/backend-api exec prisma migrate status
```

Do not use `--applied` unless the migration is fully present and independently
verified. Retry only after the original capacity/lock cause is corrected.

## Application Rollback

1. Stop promotion and remove new replicas from service.
2. Deploy the previous immutable digest with its matching environment contract.
3. Keep worker count bounded; avoid old/new workers processing incompatible
   payloads simultaneously.
4. Verify liveness, readiness, login, one read, one authorized idempotent write,
   Outbox age and projection health.
5. Preserve the failed image logs and correlation IDs.

## Catastrophic Data Recovery

Freeze all writes and workers, capture current WAL/forensic evidence, and restore
the last verified backup/PITR target into a new database. Validate invariants and
reconcile accepted commands after the recovery point before traffic cutover.
Never delete the failed database until incident review and audit retention allow
it.

## Rollback Completion

- [ ] Stable previous image serves traffic.
- [ ] Database is ready and migration state is understood.
- [ ] No invalid index or stale lease remains.
- [ ] Outbox/projection lag is recovering, not increasing.
- [ ] Data invariants and idempotency checks pass.
- [ ] Incident timeline, decision owner and follow-up are recorded.

