# QC Live Read Model Report

## Result

Status: **APPROVED**

EPIC152 adds repository live read models without changing the existing QC APIs:

- `GET /qc/read-model/workspace`
- `GET /qc/read-model/inspections/:id`
- `GET /qc/read-model/inspections/:id/history`
- `GET /qc/read-model/ncr/summary`

`QcReadModelRepository` owns filtering, stable sorting, pagination, KPI counts,
NCR counts, Production waiting queue mapping and real 30-day trend aggregation.
`QcReadModelService` contains only orchestration and not-found handling.

## Workspace Contract

The workspace query supports `page`, `limit`, `search`, `status`, `sortBy` and
`sortOrder`. Inspection rows are bounded to at most 100. Related Component,
Project and Production rows are loaded by bounded ID sets rather than by loading
entire tables. Checklist, NCR and completed-order support lists retain their
existing caps.

The response includes `meta`, repository-owned `metrics`, real `trend` buckets,
inspection rows, queue rows, checklists, NCRs and contextual category/project
summaries. Existing `/qc/cockpit`, list and mutation contracts remain available.

Inspection detail includes relation counts and caps each embedded relation at
100 rows. Full transition history is retrieved independently through the
paginated history endpoint, preventing detail reads from loading an unlimited
ActivityLog stream.
