# Components Transaction Boundary Report

Date: 2026-07-12

## Costing Recalculation

The recalculation transaction is now opened by `ComponentCostingRepository`.
The service calculates values first, then orchestrates these writes with one
repository-supplied `Prisma.TransactionClient`:

```text
ComponentCostingRepository.transaction
  -> componentCosting.upsert
  -> component.update (estimatedCost, actualCost)
  -> activityLog.create
  -> commit
```

An exception in any step rolls back all three writes. The service cannot issue a
Prisma write independently.

## Other Component Mutations

Component create/update/delete and timeline/activity writes already use
`ComponentsRepository`. Existing multi-write flows continue to use its
transaction wrapper and were not behaviorally changed.

No distinct Revision or Release persistence service/model exists in the current
Components module. History is represented by `ComponentTimeline` and
`ActivityLog`, both repository-backed. Therefore no placeholder repository or
new workflow was introduced.

## Automated Evidence

`component-costing.service.spec.ts` verifies that costing upsert, Component
summary update, and ActivityLog receive the same transaction client and that the
existing material-cost arithmetic is preserved for the fixture.

Transaction Boundary: **PASS**.

