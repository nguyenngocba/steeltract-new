# Production Workspace Boundary Report

Date: 2026-07-13

## Classification

| Surface | Classification | Source | Result |
|---|---|---|---|
| Production Overview order table/KPI | Operator workspace | Repository live read model | PASS |
| Production Orders | Operator workspace | Repository live read model | PASS |
| Production Planning orders | Operator workspace | Repository live read model | PASS |
| Queue summary | Operator workspace | Repository live read model | PASS |
| Work Center summary | Operator workspace | Repository live read model | PASS |
| Production dashboard metrics | Dashboard/analytics | Snapshot reader with repository fallback | PASS, unchanged |

## Boundary Controls

The Cockpit endpoint does not call a persisted Production snapshot. Its result is
computed from current Production repository data and is therefore suitable for
operator read-after-write behavior. Production dashboard metrics continue to use
`DashboardReaderService`; the two sources are not mixed.

Frontend presentation, route structure, table markup, cards, charts and drawer
behavior are unchanged. Only query activation and data binding changed.

## Specialized Workspaces

BOM, Material Issue, Consumption, Reservation, Ledger, Warehouse and Execution
remain live operator APIs. Their broader pagination modernization is not part of
the EPIC172 Production order Cockpit gate and must not be confused with a
snapshot cutover.
