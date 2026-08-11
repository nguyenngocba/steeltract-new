# SteelTrack V1 RC1 Rollback Guide

## Principles

- Prefer application rollback to the previous immutable digest.
- Keep additive compatible migrations in place.
- Never use `git reset --hard`, ad hoc SQL deletion or direct Prisma mutation as
  a production recovery mechanism.
- Restore into a new database first; preserve the failed database and WAL.
- Stop workers/replay before investigating duplicate or corrupt projections.

## Trigger Matrix

| Trigger | Immediate action | Data action |
| --- | --- | --- |
| Frontend/API regression | Remove new digest from traffic | None |
| Readiness/restart loop | Stop rollout; inspect dependency/config | None |
| Critical auth/RBAC defect | Block external traffic | Revoke tokens/secrets if needed |
| Migration failure | Keep old app, stop migration retry | Inspect locks and migration state |
| Duplicate business mutation | Freeze writes and workers | Preserve idempotency/Outbox evidence |
| Projection mismatch | Disable affected snapshot/read model | Rebuild only after approved backup |
| Confirmed data corruption | Freeze all writes | Restore/PITR into new database |

## Application Rollback

1. Declare incident and record correlation IDs, image digests and timestamps.
2. Remove new frontend/backend replicas from service.
3. Deploy previous compatible immutable image digest.
4. Keep workers disabled until API/read readiness is stable.
5. Verify live/ready/startup, login, authorized read, 401 and 403.
6. Enable one worker and verify Outbox/job/projection recovery.
7. Run inventory and ComponentInstance lineage invariants.
8. Close rollback only after dashboards and ActivityLog agree with DB.

## Migration Failure

- Do not automatically reverse an applied migration.
- Inspect `prisma migrate status`, PostgreSQL locks and invalid indexes.
- If a concurrent index failed, identify the exact invalid artifact before
  dropping it concurrently.
- Use `prisma migrate resolve` only after DBA review and evidence that schema
  state matches the selected resolution.
- Escalate any destructive or incompatible migration to database recovery.

## Disaster Recovery

1. Freeze traffic, workers, replay and scheduled snapshot jobs.
2. Record source database LSN, timeline, replication state and incident time.
3. Verify backup checksum and WAL availability.
4. Create a new isolated target database.
5. Restore custom dump/base backup and apply WAL to approved recovery point.
6. Run migration status and compare critical row counts.
7. Verify inventory conservation, idempotency receipts, Outbox/checkpoints,
   physical ComponentInstance lineage and ActivityLog continuity.
8. Start one backend with workers disabled against restored DB.
9. Complete health, auth, read and browser smoke.
10. Reconcile accepted commands after the recovery point before cutover.

## Rollback Checklist

- [ ] Previous images are available and digest-verified.
- [ ] New replicas receive no traffic.
- [ ] Database migration state is understood.
- [ ] No stale worker lease or replay remains active.
- [ ] Outbox/projection lag is stable or decreasing.
- [ ] Inventory and physical lineage invariants pass.
- [ ] ActivityLog and incident timeline are preserved.
- [ ] Security/database/operations owners approve closure.

## Current RC1 Limitation

The repository has not completed a clean restore/PITR timing drill. Therefore
this guide is a required procedure, not evidence that disaster recovery works.
Production deployment remains blocked until the procedure is executed in an
isolated staging environment and measured against approved RPO/RTO.
