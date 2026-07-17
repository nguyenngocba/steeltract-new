# Components Repository Review

Date: 2026-07-17  
Status: **LOCAL BOUNDARY PASS - AGGREGATE OWNERSHIP PARTIAL**

## Local Repository Boundary

- `ComponentsService -> ComponentsRepository -> Prisma`: PASS.
- `ComponentCostingService -> ComponentCostingRepository -> Prisma`: PASS.
- `ComponentsReadModelService -> ComponentsReadModelRepository -> Prisma`:
  PASS.
- Components service files contain no direct `PrismaService` access.

## Transaction Review

| Path | Transaction content | Result |
| --- | --- | --- |
| Update | Component + Timeline + ActivityLog + audit/domain Outbox | PASS |
| Deliver/install | Component + Timeline + ActivityLog + audit/domain Outbox | PASS |
| Create | Component + ActivityLog + audit Outbox | PARTIAL; no domain event |
| Delete | Hard delete + ActivityLog + audit Outbox | PARTIAL; no domain event/archive policy |
| Cost recalculate | Costing + Component costs + ActivityLog | PARTIAL; no Outbox |

## Idempotency

- Outbox upserts use stable persisted idempotency keys.
- Create has uniqueness through Component code, but no request idempotency
  contract.
- Generic update has no expected-version/optimistic-concurrency contract.
- Deliver/install are repeat-safe only by rejection after state changed, not by
  returning the prior command result.
- Cost recalculation is an upsert but command retry semantics are not defined.

## Cross-module Ownership

Production, Yard, Projects and Logistics repositories update Component rows
directly. These writes remain inside repositories and can be atomic with their
own workflows, but they bypass one Component command/state authority and do not
consistently produce Components domain events.

This is not a Service -> Prisma violation. It is an aggregate ownership and
event consistency gap requiring an internal transaction-aware Component command
boundary.

## Inventory Integration

Components costing repositories read Production consumption and Inventory
valuation rows directly. They do not mutate Inventory stock, but this creates a
schema-level read dependency. A stable Inventory valuation/read contract is
preferred before accounting semantics evolve.

The active Components material-return UI directly posts generic Inventory
transactions. That path bypasses Production material return semantics and must
be remediated in a later authorized implementation sprint.

