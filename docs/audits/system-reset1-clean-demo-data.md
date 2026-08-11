# SYSTEM.RESET.1 - Clean Demo Data & Preserve Canonical Master Data

Date: 2026-08-10  
Status: **COMPLETE - READY FOR A NEW SAMPLE DATASET**

## Scope And Safety

The local `steeltrack` PostgreSQL database was cleaned without dropping the
database, dropping tables, resetting the schema, truncating tables or creating
a migration. Cleanup used an explicit table allowlist, PostgreSQL foreign-key
metadata, child-before-parent `DELETE` ordering, table locks and one serializable
transaction. The transaction verified every cleanup target was zero and every
preserved table retained its pre-reset row count before commit.

Reusable maintenance utility:

`apps/backend-api/scripts/system-reset1-clean-demo-data.ts`

The utility defaults to read-only dry-run mode. Execution requires both
`--execute` and a non-empty `--backup=<path>` file. It fails closed on schema
drift, an unknown preserved-table reference, a non-nullable FK cycle, a non-zero
postcondition or a changed preserved count.

## Backup Gate

| Evidence | Result |
| --- | --- |
| Backup | `/tmp/steeltrack-system-reset1-before-20260810-150450.dump` |
| Format | PostgreSQL custom archive |
| Size | 2,106,204 bytes |
| SHA-256 | `e85d39a26d5700c538a2357bdc6a7d70856ffc66f0725526e29f222296a13bf4` |
| Archive catalog | PASS (`pg_restore --list`) |

This backup is local and is rollback evidence for this reset. It is not a
substitute for the still-open off-host backup and restore certification gate.

## Records Deleted

The initial transaction deleted **21,678** rows. Runtime verification then
created 16 expected authentication/snapshot artifacts; these were removed in a
second transaction. High-value initial counts were:

| Domain | Deleted evidence |
| --- | --- |
| Inventory | 113 items, 194 location balances, 256 transactions, 343 lines, 12 return rows |
| Projects | 44 projects, 64 component requirements, 345 project snapshots |
| Components | 68 definitions, 66 physical instances, 51 revisions, 51 BOM definitions, 529 timeline/execution rows |
| Production | 52 orders, 47 work orders, 35 executions, 23 stages, 39 BOMs, 104 BOM lines/routes, 221 material records, 470 logs |
| QC | 24 inspections, 16 results, 5 NCRs, 8 checklist/template rows, 24 snapshots |
| Yard | 8 zones, 93 slots, 14 placements, 24 movements, 19 warehouse zones, 19 dashboard/workspace snapshots |
| Logistics | 11 dispatches, 11 items, 72 events |
| Warehouses | 8 warehouse masters and 19 warehouse zones |
| Projections/runtime | 2,470 documents, 3,973 receipts, 26 checkpoints, 5 failures, 2,543 outbox events |
| Historical data | 1,881 inventory balances, 29 dashboard snapshots, 44 jobs and 132 job logs |
| Other business master/runtime | 1 supplier, 4 machines, 3 work centers, 2 cranes, 1 project template, 28 attachments and versions |
| Security session/runtime noise | 1,474 refresh tokens and 2,459 pre-reset activity logs |

Attachments were removed from the database. Physical files under storage were
not recursively deleted because the repository has no certified bulk storage
delete contract; they are unreachable orphan candidates and should be handled
by a separately reviewed storage-retention job.

## Records Preserved

Counts were identical before and after both transactions:

| Canonical data | Preserved |
| --- | ---: |
| Users | 40 |
| Roles | 18 |
| Permissions | 29 |
| User-role assignments | 40 |
| Role-permission assignments | 89 |
| Material categories | 30 |
| Material usage types | 3 |
| Material types / technical groups | 35 |
| Units of measure | 30 |
| Other `master_*` status/category dictionaries | 51 |
| Workflow definitions / steps | 1 / 1 |
| Prisma migrations | 92 records; 90 migrations current |

`SnapshotMetadata` configuration was preserved. Its last-job pointer,
watermark and stale date were reset because the referenced business history was
deleted.

## Final Database State

Read-only database evidence after cleanup:

| Required invariant | Count |
| --- | ---: |
| Inventory items / stock / transactions | 0 / 0 / 0 |
| Projects / requirements | 0 / 0 |
| Production orders / executions | 0 / 0 |
| Component definitions / instances | 0 / 0 |
| QC inspections / NCRs | 0 / 0 |
| Yard placements / movements / zones | 0 / 0 / 0 |
| Warehouses | 0 |
| Dispatch orders | 0 |

An already-running application scheduler recreated three completed daily jobs
and two current-date snapshots after the verification cleanup. Both snapshots
are authoritative zero-state records: `rowCount=0`, `warningCount=0`; Inventory
KPIs are all zero and Yard reports zero zones/placements. They contain no old
demo data and are expected to remain/reappear while the scheduler is enabled.

## Runtime Verification

Backend was started on port 3100 against the cleaned database. Results:

| Check | Result |
| --- | --- |
| `/health/live`, `/health/ready`, `/health/startup` | PASS, HTTP 200 |
| Administrator login | PASS, HTTP 201 and real JWT |
| `/auth/me` | PASS, HTTP 200 |
| Roles / permissions | PASS, 18 / 29 |
| Settings catalog | PASS, HTTP 200 |
| Material categories | PASS, 30 |
| Material usage types | PASS, 3 |
| Material types | PASS, 35 |
| UOM | PASS, 30 |
| Inventory / Projects / Production lists | PASS, total 0 |
| Finished Goods / Dispatch lists | PASS, total 0 |
| Yard dashboard | PASS, HTTP 200 with zero state |

The runtime smoke created one refresh token and one login ActivityLog. They were
removed afterward so the handoff does not retain certification-session data.

## Verification

- Prisma validate: PASS.
- Prisma migrate status: PASS, schema current.
- Backend build: PASS.
- Frontend build: PASS.
- `git diff --check`: PASS after documentation update.
- Stage/commit: none.

## Remaining Master Data

The system is ready for operators to create warehouses, warehouse zones/slots,
Yard layout, suppliers, material masters and all operational workflow data from
the preserved taxonomy and RBAC foundation.

Known limitation: physical attachment binaries were not purged. Also, because
the Snapshot Engine is enabled, zero-state daily jobs/snapshots are expected to
exist even when all business aggregates are zero.

