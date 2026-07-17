# Production Projection Read Models

| Projection | Source events | Key / scope | Purpose |
| --- | --- | --- | --- |
| `ProductionOrderSummary` | `production.order.*` | order / project | Latest order command-side facts |
| `WorkOrderSummary` | `production.work-order.*` | work order / production order | Latest work-order facts |
| `ProductionTimeline` | canonical production families | Outbox event / production order | Append-only event timeline |
| `ProductionExecution` | `production.execution.*` | execution run / production order | Current execution facts |
| `ProductionDashboard` | `production.order.*` | order / project | Dashboard-ready order projection |
| `OperatorWorkQueue` | `production.work-order.*` | work order / production order | Operator queue source |

These projections read AD-019 Outbox envelopes and do not query Production
aggregates. Existing production APIs and snapshot readers remain compatible.

`ProductionDashboard` currently projects one latest document per order. Domain
specific portfolio KPI reducers can be added as a later projection schema
version; this sprint does not invent KPI semantics.
