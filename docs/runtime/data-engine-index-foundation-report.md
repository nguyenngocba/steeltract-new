# EPIC104 / Sprint DE.1 - Data Engine Index Foundation

Date: 2026-07-07

Scope:

- Add high-value composite indexes identified by EPIC101 audits.
- Preserve business logic, workflow, UI, and API contracts.
- Verify migration and query plans with `EXPLAIN ANALYZE`.

## Audit Inputs

Read before implementation:

- `docs/audit/enterprise-index-audit.md`
- `docs/audit/enterprise-query-audit.md`
- `docs/architecture/data-growth-5-year-plan.md`
- Current Prisma schema index definitions.

The highest-risk paths remain Inventory transaction/history queries, Project WBS/runtime queries, Return Request queues, and ActivityLog timelines.

## Migration

Created:

- `apps/backend-api/prisma/migrations/20260707120000_enterprise_index_foundation/migration.sql`

Applied with:

```bash
pnpm -C apps/backend-api exec prisma migrate deploy
```

Result:

- Existing pending migration `20260701090000_dispatch_order_domain` was applied first.
- New migration `20260707120000_enterprise_index_foundation` applied successfully.
- `prisma migrate status` reports database schema is up to date.

## Indexes Added

| Table | Index | Purpose |
| --- | --- | --- |
| `inventory_transactions` | `inventory_transactions_type_transactionDate_idx` | Inventory dashboards and transaction tabs filtered by type and recent date. |
| `inventory_transactions` | `inventory_transactions_projectId_transactionDate_idx` | Project material history and project-scoped inventory movement timelines. |
| `inventory_transaction_items` | `inventory_transaction_items_inventoryItemId_createdAt_idx` | Material Detail history and material trend reads by item and newest rows. |
| `inventory_transaction_items` | `inventory_transaction_items_transactionId_inventoryItemId_idx` | Transaction detail joins and line lookup by transaction/material. |
| `inventory_location_stocks` | `inventory_location_stocks_item_bucket_idx` | Exact stock bucket lookup by material + warehouse + zone + slot + level. |
| `return_requests` | `return_requests_projectId_status_createdAt_idx` | Project pending-return queues and filtered project return history. |
| `return_requests` | `return_requests_flowType_status_createdAt_idx` | Inventory Return Requests workspace by flow/status/date. |
| `project_tasks` | `project_tasks_projectId_parentTaskId_sortOrder_idx` | WBS tree children lookup and ordered hierarchy rendering. |
| `project_tasks` | `project_tasks_projectId_status_scheduledFinishAt_idx` | Project scheduling warnings and task status/date views. |
| `activity_logs` | `activity_logs_module_createdAt_idx` | Module-scoped recent activity timelines. |
| `activity_logs` | `activity_logs_entity_entityId_createdAt_idx` | Entity detail logs by project/task/material/component. |

No dispatch indexes were added in this sprint because the before/after baseline was captured before dispatch tables were available in the active database. Dispatch indexing remains a follow-up candidate from EPIC101.

## EXPLAIN Artifacts

Stored:

- `docs/runtime/de1/explain-before.txt`
- `docs/runtime/de1/explain-after.txt`
- `docs/runtime/de1/explain-after-index-usage.txt`
- `docs/runtime/de1/explain-bucket-exact-after.txt`

Current database row counts are small, so PostgreSQL often correctly chose sequential scans because scanning tens of rows is cheaper than reading indexes. This is expected and is not treated as a failed index. The report therefore records both normal planner behavior and forced index-usability checks.

## Before / After Summary

| Query | Before | After | Improvement / Finding |
| --- | --- | --- | --- |
| Q1 inventory transactions by type/date | Seq Scan + Sort, 0.109 ms | Seq Scan + Sort, 0.112 ms | No timing improvement on 74 rows; forced plan uses `inventory_transactions_type_transactionDate_idx`. |
| Q2 inventory transactions by project/date | Seq Scan + Sort, 0.057 ms | Seq Scan + Sort, 0.054 ms | Slightly lower execution time; forced plan uses `inventory_transactions_projectId_transactionDate_idx`. |
| Q3 transaction items by material/recent | Seq Scan + Sort, 0.071 ms | Seq Scan + Sort, 0.076 ms | No timing improvement on 78 rows; forced plan uses `inventory_transaction_items_inventoryItemId_createdAt_idx`. |
| Q4 transaction items by transaction/material | Seq Scan + Sort, 0.071 ms | Seq Scan + Sort, 0.061 ms | Lower execution time; forced plan uses `inventory_transaction_items_transactionId_inventoryItemId_idx`. |
| Q5 location stock exact bucket | Seq Scan + Sort, 0.037 ms | Seq Scan + Sort, 0.037 ms | Normal tiny-table plan unchanged; exact forced check uses `inventory_location_stocks_item_bucket_idx`. |
| Q6 return requests by project/status/date | `return_requests_status_idx`, 0.029 ms | Seq Scan + Sort, 0.021 ms | Tiny-table planner chooses cheapest path on 2 rows; composite indexes exist for queue growth. |
| Q7 activity logs by module/date | `activity_logs_createdAt_idx`, 0.066 ms | `activity_logs_createdAt_idx`, 0.093 ms | Existing date index is still cheapest for non-selective `module IS NOT NULL`; new module/entity indexes protect selective module/entity detail reads. |
| Q8 project task tree | `project_tasks_projectId_sortOrder_idx`, 0.018 ms | `project_tasks_projectId_sortOrder_idx`, 0.031 ms | No project task data yet; new tree index protects parent-child lookups once populated. |
| Q9 project task status schedule | Existing project index + sort, 0.018 ms | `project_tasks_projectId_status_scheduledFinishAt_idx`, 0.028 ms | Planner recognizes the new schedule/status index. |

## Query Plan Evidence

Examples from forced usability checks:

- Q1: `Bitmap Index Scan on "inventory_transactions_type_transactionDate_idx"`.
- Q2: `Bitmap Index Scan on "inventory_transactions_projectId_transactionDate_idx"`.
- Q3: `Bitmap Index Scan on "inventory_transaction_items_inventoryItemId_createdAt_idx"`.
- Q4: `Index Scan using "inventory_transaction_items_transactionId_inventoryItemId_idx"`.
- Q5 exact bucket: `Index Scan using inventory_location_stocks_item_bucket_idx`.
- Q9: `Index Scan using "project_tasks_projectId_status_scheduledFinishAt_idx"`.

Index existence check returned all 11 expected indexes from `pg_indexes`.

## Redundancy Review

Indexes were not added for every single-column filter because many already exist. The new indexes target combined filter + ordering patterns that single-column indexes cannot cover well at scale.

Known overlap:

- `project_tasks_projectId_sortOrder_idx` still exists and may be preferred for root project scans. The new `projectId + parentTaskId + sortOrder` index is for child-node WBS traversal.
- `activity_logs_createdAt_idx` remains useful for global timelines. New module/entity indexes are for selective module/entity timelines.
- `inventory_location_stocks_zoneId_slotId_level_idx` remains useful for location-centric views. New item-bucket index is for material-centric exact bucket validation.

## Result

DE.1 is complete:

- Real Prisma migration created.
- Migration applied successfully.
- Indexes verified in PostgreSQL.
- EXPLAIN ANALYZE before/after captured.
- No API, UI, workflow, or business logic changes were made.

## Follow-Up

- Re-run the same EXPLAIN set after realistic data volume reaches at least 100k+ transaction rows.
- Add dispatch composite indexes in a follow-up after capturing before/after baselines against populated dispatch tables.
- Use runtime metrics from EPIC102/103 to decide whether any newly indexed paths still need persisted snapshots.
