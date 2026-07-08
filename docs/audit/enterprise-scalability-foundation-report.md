# EPIC 101 Enterprise Scalability Foundation Report

Date: 2026-07-07

Scope: ARCH.1, ARCH.2, ARCH.3, ARCH.4.

No business logic, workflow, UI, API contract, Prisma schema, or migration changes were made.

## Deliverables

Created:

* `docs/audit/enterprise-performance-gate.md`
* `docs/audit/enterprise-query-audit.md`
* `docs/audit/enterprise-index-audit.md`
* `docs/architecture/data-growth-5-year-plan.md`

Updated:

* `docs/ai-state/CHANGELOG_AI.md`
* `docs/ai-state/CURRENT_STATE.md`
* `docs/ai-state/PROJECT_STATUS.md`
* `docs/ai-state/NEXT_TASKS.md`
* `docs/ai-state/modules/dashboard.md`

## ARCH.1 Performance Gate

Defined query budgets for:

* Dashboard / Cockpit.
* Detail.
* Lookup.
* Search / List.

Key rules:

* No unbounded `findMany()` on transaction/log/ledger/movement/event tables.
* Dashboard endpoints should use read models or persisted snapshots.
* Detail endpoints should load active tab data only.
* Lookup endpoints should return minimal fields and use indexed access.
* Search/list endpoints require pagination and `take`.

## ARCH.2 Query Audit

Key findings:

* Dashboard and runtime endpoints are the primary enterprise-scale risk.
* Projects runtime and executive dashboard services still aggregate broad operational sources.
* Command paths in Logistics receive, Inventory return receipt, and Project template/WBS generation contain query-in-loop patterns that should be batched later.
* Deep Prisma includes are acceptable for detail-by-id reads, but not for cockpit/list endpoints at scale.

## ARCH.3 Index Audit

Existing coverage is solid for base entity lookups.

Future migration priorities:

* Inventory transaction composite indexes by type/date, project/date, supplier/date, and material/date.
* ProjectTask hierarchy/schedule/status composite indexes.
* ReturnRequest status/date/project indexes.
* ActivityLog module/entity/date indexes.
* Snapshot/read-model indexes after persisted read models are introduced.

## ARCH.4 Data Growth Plan

Recommended enterprise direction:

* Partition transaction/log/ledger/event tables by date when volume warrants it.
* Archive old ActivityLog, notification, Yard movement, Dispatch event, and attachment-version records according to audit retention requirements.
* Introduce persisted read models for Inventory, Project runtime, Project task health, Logistics dispatch, and Executive Dashboard.
* Use id-based event contracts to invalidate/rebuild snapshots.

## Recommended Next Three Sprints

1. Add performance instrumentation and enforce the query gate in code review.

   Reason: it prevents new unbounded dashboard/runtime paths while the schema remains stable.

2. Add index migration sprint for Inventory, ProjectTask, ReturnRequest, ActivityLog, and Dispatch composite indexes.

   Reason: these protect current live queries before persisted snapshots are ready.

3. Implement persisted Inventory and Project runtime snapshots behind existing API contracts.

   Reason: these are the largest cockpit/read-model risk areas and can be swapped behind services without UI/workflow changes.

## Known Limitations

* This sprint produced audits and architecture plans only.
* No database indexes were created.
* No persisted snapshot tables were created.
* No query instrumentation was added yet.
* Runtime performance numbers are budget targets, not measured production SLOs.

