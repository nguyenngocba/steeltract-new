# EPIC140 Components Core Platform Foundation Audit

Date: 2026-07-12

## Executive Result

```text
Components feature maturity: high
Components Core Platform compliance: 28%
Status: FOUNDATION BLOCKED
```

The module has useful Component master, delivery/install, timeline and costing
business behavior, but it does not yet inherit the complete Inventory/Production
Core Platform.

## Compliance Matrix

| Area | Score | Evidence |
|---|---:|---|
| Controller/API boundary | 80% | Zod for list/create/update/install; uploads remain controller-local disk concerns |
| Repository boundary | 55% | ComponentsService uses repository; ComponentCostingService uses Prisma directly |
| Workspace live read model | 45% | Live repository list exists, but UI requests all rows and aggregates client-side |
| Dashboard snapshot | 0% | No Component snapshot models/repository/reader/writer |
| Runtime metrics | 25% | Generic HTTP/Prisma instrumentation only; no Component counters |
| Event/Outbox | 15% | Ephemeral `component.updated` only, emitted after commit |
| Background engine | 0% | No Component event routing or snapshot jobs |
| Operations Center | 0% | No Components Platform Health block |

## Existing Domain

- `Component`
- `ComponentTimeline`
- `ComponentCosting`
- links to Project, ProductionOrder, Task, ProjectTask allocation and Dispatch
- lifecycle values: `STOCK`, `CUTTING`, `WELDING`, `PAINTING`, `READY`,
  `SHIPPED`, `DELIVERED`, `INSTALLED`

There is no ComponentRevision entity and no approved `RELEASED` or `ARCHIVED`
component state. Event names involving revision/release/archive require domain
alignment before implementation.

## Critical Findings

1. Component costing bypasses `ComponentsRepository` and reads/writes Component,
   Production consumption and Inventory transaction data through Prisma.
2. Components Overview is a dashboard assembled from unbounded Components,
   Production and Yard live queries in React.
3. Components List/Stock use unbounded `GET /components`, then search/filter/sort/
   paginate in the browser.
4. QC Internal and History contain hardcoded rows and hardcoded KPI totals.
   `/components/reports` aliases the same History page.
5. Cross-module Component writes exist in Production, Projects and Yard ownership
   paths. Their transaction requirements must be preserved when defining the
   Components command boundary.

No application code or schema was changed during EPIC140.

