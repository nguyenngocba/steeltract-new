# Production Migration Validation

## Scope

Validate migrations on a production-size staging clone before production. The
current known pending migration is
`20260717190000_enterprise_data_scalability_indexes`: 13 additive PostgreSQL
indexes created concurrently with a five-second lock timeout. It must not be
wrapped in an explicit transaction.

## Preflight

1. Record image digest, Git SHA, PostgreSQL version and Prisma version.
2. Require a verified backup and a dedicated restored clone.
3. Confirm no other migration process, DDL maintenance or long transaction is
   active.
4. Capture table/index sizes, free disk, write latency, connection saturation,
   WAL position/rate and replica lag.
5. Agree numeric abort thresholds before starting. Do not invent thresholds
   during an incident.

```bash
pnpm -C apps/backend-api exec prisma validate
pnpm -C apps/backend-api exec prisma migrate status
```

Useful PostgreSQL evidence queries:

```sql
SELECT version();
SELECT pg_size_pretty(pg_database_size(current_database()));
SELECT now(), pg_current_wal_lsn();
SELECT pid, now() - xact_start AS age, state, wait_event_type, wait_event,
       left(query, 160) AS query
FROM pg_stat_activity
WHERE xact_start IS NOT NULL
ORDER BY xact_start;

SELECT relname, n_live_tup, n_dead_tup, seq_scan, idx_scan
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

## Execution

Run one migration container/job using the exact release image:

```bash
pnpm -C apps/backend-api exec prisma migrate deploy
```

During every concurrent index build, collect at a fixed interval:

```sql
SELECT pid, datname, relid::regclass AS table_name,
       index_relid::regclass AS index_name, phase,
       lockers_total, lockers_done, blocks_total, blocks_done,
       tuples_total, tuples_done
FROM pg_stat_progress_create_index;

SELECT blocked.pid AS blocked_pid, blocker.pid AS blocker_pid,
       now() - blocked.query_start AS blocked_for,
       left(blocked.query, 120) AS blocked_query,
       left(blocker.query, 120) AS blocker_query
FROM pg_stat_activity blocked
JOIN pg_locks blocked_lock ON blocked_lock.pid = blocked.pid
JOIN pg_locks blocker_lock
  ON blocker_lock.locktype = blocked_lock.locktype
 AND blocker_lock.database IS NOT DISTINCT FROM blocked_lock.database
 AND blocker_lock.relation IS NOT DISTINCT FROM blocked_lock.relation
 AND blocker_lock.pid <> blocked_lock.pid
JOIN pg_stat_activity blocker ON blocker.pid = blocker_lock.pid
WHERE NOT blocked_lock.granted AND blocker_lock.granted;

SELECT now(), pg_current_wal_lsn();
```

Also capture API p95/p99, database query p95, error rate, disk throughput/queue,
CPU, memory, connections and replica replay lag from the staging monitoring
system.

## Abort Rules

Cancel the migration job when any pre-approved limit is exceeded for its
defined duration, free disk approaches the safety reserve, replica lag threatens
RPO, blocked writes exceed the lock budget, or database health deteriorates.
Do not terminate PostgreSQL. Concurrent cancellation may leave an invalid index.

After interruption inspect:

```sql
SELECT c.relname AS index_name, i.indisvalid, i.indisready
FROM pg_index i
JOIN pg_class c ON c.oid = i.indexrelid
WHERE NOT i.indisvalid OR NOT i.indisready;
```

Follow [rollback-procedure.md](./rollback-procedure.md) before retrying.

## Postflight

```bash
pnpm -C apps/backend-api exec prisma migrate status
```

- Require no pending/failed migration.
- Require no invalid index.
- Compare index definitions with the migration SQL.
- Run representative `EXPLAIN (ANALYZE, BUFFERS)` only on the isolated clone.
- Verify `/health/live`, `/health/ready`, authenticated business reads and one
  idempotent mutation smoke.
- Compare baseline versus post-migration latency, WAL, disk and replica lag.
- Observe at least one normal workload window before approval.

## Evidence And Approval

Record start/end/duration per index, peak lock wait, peak write latency, WAL
bytes generated, peak replica lag, disk delta, query plans, invalid-index check,
Prisma status and approvers. Migration validation is **FAIL** if any measurement
is absent; a successful command exit alone is insufficient.

