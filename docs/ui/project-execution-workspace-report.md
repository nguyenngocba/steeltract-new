# Sprint 40PROJ.3 – Project Execution Workspace Report

Date: 2026-06-30

## Scope

Implemented a Projects execution foundation without Prisma schema changes or migrations.

Changed code:

* `apps/backend-api/src/modules/projects/services/projects.service.ts`
* `apps/frontend/src/modules/projects/api/projects.api.ts`
* `apps/frontend/src/modules/projects/pages/ProjectsPage.tsx`

## Runtime Additions

`GET /projects/runtime` now returns additional read models:

* `wbs`
* `financial`
* `health`
* `returnRequests`

These are derived from existing records:

* `projects`
* `components`
* `tasks`
* `inventory_transactions`
* `inventory_transaction_items`
* `return_requests`

## Workspace Additions

Project Detail now includes:

* Financial KPI cards
* Project Health panel
* WBS tree grid
* Material return entry point
* Return request visibility through health/open-return counters

## Current Foundation

The execution workspace can answer:

* Which projects are delayed or risky
* Which components are not delivered/installed
* Which materials remain issued to a project
* Whether a project has open return requests
* Whether material costs are above project value

## Limitations

* WBS is a derived read model, not a persisted project task hierarchy.
* Existing `Task` only links to `Component`, not directly to `Project` or parent tasks.
* Add/edit/delete/move WBS actions show the required entry points but need a future `ProjectTask` API to persist changes.
* Component return remains future work because no formal Project Component Return workflow exists.

## Verification

* `pnpm -C apps/frontend build` passed.
* `pnpm -C apps/backend-api build` passed.

