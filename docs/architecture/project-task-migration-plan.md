# Project Task Migration Plan

Migration `20260630100000_project_task_domain` creates the normalized Project Task domain tables and backfills legacy WBS metadata.

## Strategy

1. Create new enums and tables.
2. Read legacy rows from `tasks.description` where `steeltrackProjectWbs = true`.
3. Insert into `project_tasks` while preserving old `Task.id` as `ProjectTask.id`.
4. Backfill:
   * parent hierarchy
   * predecessors
   * material allocations when `inventory_items.id` or `inventory_items.code` matches
   * component allocations when `components.id` or `components.code` matches
   * worker/machine resources
   * inspection status
   * cost buckets

## Non-Destructive Rule

The migration does not delete legacy `tasks` rows. This keeps rollback and audit possible.

## Runtime Rule

After Sprint 40PROJ.7, active Projects APIs use `project_tasks`. The old JSON bridge is no longer the runtime source of truth.

## Validation

After applying migration:

```sql
SELECT COUNT(*) FROM project_tasks;
SELECT COUNT(*) FROM project_task_dependencies;
SELECT COUNT(*) FROM project_task_material_allocations;
SELECT COUNT(*) FROM project_task_component_allocations;
```

Compare against legacy rows:

```sql
SELECT COUNT(*)
FROM tasks
WHERE description LIKE '%"steeltrackProjectWbs":true%';
```
