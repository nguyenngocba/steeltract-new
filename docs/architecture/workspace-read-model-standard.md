# Workspace Live Read Model Standard

Status: ACTIVE
Date: 2026-07-11

## Rule

Operator workspaces must read from **Repository Live Read Models**.

```text
Workspace đang thao tác
-> Repository Live Read Model
-> Strong read-after-write
```

This rule was validated by Inventory EPIC118.5.1. The Materials table failed read-after-write consistency when a workspace row mapper preferred a persisted snapshot that was fresh by age but stale relative to the latest mutation. The corrected path uses live repository-backed stock buckets for workspace rows and keeps snapshots for dashboard/analytics only.

## Applies To

Use Repository Live Read Models for:

- editable grids;
- transaction forms;
- operator workspaces;
- material lists;
- production order lists;
- QC inspection queues;
- dispatch queues;
- yard slot/placement workspaces;
- return request queues;
- detail drawers where an operator can act immediately after a mutation.

## Forbidden For Workspaces

Do not use persisted snapshots as the primary source for:

- inventory lists;
- production order workspaces;
- QC inspection queues;
- logistics dispatch queues;
- yard operation maps;
- supplier master lists;
- forms that depend on exact availability;
- allocation or reservation workspaces;
- any view where the user expects the just-created/updated record to appear immediately.

## Acceptable Workspace Pattern

```text
Controller
-> Service / Read Model Service
-> Repository
-> Prisma
-> response
```

The repository may compose multiple live tables, but the response must be current with respect to committed writes.

## Freshness Contract

Workspace pages target **strong read-after-write** within the same committed database state:

- mutation succeeds;
- active query is invalidated/refetched;
- workspace endpoint reads the repository live model;
- UI displays the committed state without browser refresh or tab switching.

## Performance Contract

Live workspace reads still need enterprise constraints:

- server-side pagination for lists;
- server-side search/filter/sort;
- stable sort keys;
- bounded includes;
- tab-scoped detail queries;
- no unbounded transaction history;
- no frontend aggregation over capped datasets;
- no N+1 query loops.

## Allowed Fallbacks

Workspace fallbacks should be live read-model fallbacks, not snapshot fallbacks.

Allowed:

```text
Repository optimized read model
-> repository fallback query
```

Not allowed:

```text
Workspace list
-> persisted dashboard snapshot
-> eventual consistency
```

## Inventory Reference

Inventory Materials now follows this pattern:

```text
GET /inventory/materials
-> InventoryReadModelService.materialList()
-> InventoryRepository.listMaterialSnapshotPage()
-> include live inventory_location_stocks
-> row currentStock = sum(live locationStocks.quantity)
```

The endpoint may use snapshot metadata for valuation context, but operational row quantities come from live location stock.

## Review Checklist

Before approving a workspace:

- Does the active table/queue read live repository data?
- Does mutation success invalidate the exact query family?
- Does the API payload reflect committed writes before background snapshots run?
- Are dashboard snapshots kept out of editable/operator grids?
- Is pagination/search/filter/sort server-side for large lists?
- Are detail tabs lazy and scoped?

If any answer is no, mark the workspace as a consistency violation or scalability risk.
