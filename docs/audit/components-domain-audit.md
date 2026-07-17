# EPIC186 Components Domain Audit

Date: 2026-07-17  
Status: **DOMAIN NOT ALIGNED - IMPLEMENTATION STOPPED**

## Scope

This is a read-only architecture assessment of Component, lifecycle, material
flows, history, repositories, read models, events, API contracts, dashboard
dependencies, Inventory ownership and Production integration. No application
code, API, schema, migration, workflow or data changed.

## Executive Result

Components is Core Platform compliant but not domain complete. Repository,
ADR011 live reads, snapshots, runtime metrics and Operations Center integration
are present. The aggregate lifecycle and cross-module command ownership are not
yet coherent enough for additional business implementation.

| Area | Current state | Result |
| --- | --- | --- |
| Component aggregate | Master record, Project/Production links, timeline and costing | PARTIAL |
| Component lifecycle | Enum exists, but no complete state machine | FAIL |
| Revision/release/archive | No entities or approved workflow | NOT IMPLEMENTED |
| Material reservation/issue/consumption/return | Production-owned domain records | PASS OUTSIDE COMPONENTS |
| Inventory ownership | Backend Production posting boundary exists | PASS |
| Components material return UI | Calls generic Inventory transaction directly | VIOLATION |
| Repository boundary | Components services use repositories | PASS |
| Aggregate ownership | Production, Yard, Projects and Logistics repositories write Component directly | FAIL |
| Atomic mutation/audit | Components update/deliver/install are atomic | PASS |
| Domain event coverage | Atomic `component.updated` only | PARTIAL |
| Live read model | List, Overview, History, Detail and Costing | PASS/PARTIAL |
| Dashboard snapshot | Snapshot-first with fallback | PASS |
| Runtime/Operations Center | Shared platform integrated | PASS WITH EVENT LIMITATION |

## Domain Inventory

### Existing Entities

- `Component`: identity, Project link, physical location fields, status, image,
  estimated/actual cost and Production Order relation.
- `ComponentTimeline`: free-text `action`, note and optional photo.
- `ComponentCosting`: one persisted costing row linked to one selected
  Production Order.
- `ComponentSummarySnapshot` and `ComponentDashboardSnapshot`: read-side
  projections, not command aggregates.

### Entities That Do Not Exist

- Component Revision.
- Component Reservation.
- Component Issue.
- Component Return.
- Component Consumption.
- Component release/archive record.

Reservation, Issue, Consumption and Return records currently belong to the
Production material aggregate and reference Inventory items. They must not be
duplicated under Components.

## Lifecycle Findings

`ComponentStatus` combines several different concepts:

- fabrication execution: `CUTTING`, `WELDING`, `PAINTING`;
- completion/readiness: `READY`;
- stock/location: `STOCK`;
- delivery/installation: `SHIPPED`, `DELIVERED`, `INSTALLED`.

Only two transitions are guarded in `ComponentsService`:

```text
SHIPPED -> DELIVERED -> INSTALLED
```

Create and generic update accept any enum status. Production, Yard, Projects
and Logistics repositories also update Component status directly. There is no
single state machine, aggregate version, transition authority, cancellation,
rejection, hold, archive or revision policy.

## Material-flow Ownership

Correct target boundary:

```text
Components -> read Production material projection
Production -> Reserve / Issue / Consume / Return commands
Inventory -> stock validation, transaction, location stock and ledger
```

Current active `ComponentsMaterialStockPage` instead loads Inventory audit,
items and transactions plus Production issues, reconstructs balances in React,
and posts a generic Inventory `RETURN` transaction. This bypasses the approved
Production Return command and its reservation/material ledger/event semantics.
It is a P0 architecture issue, but was not changed in this audit.

## History and Audit

- Timeline is persisted and supports server-side pagination.
- `action` is an unconstrained string, so it is not a canonical domain event
  history.
- Components update/deliver/install write Timeline, ActivityLog, audit Outbox
  and `component.updated` atomically.
- Create writes ActivityLog/audit Outbox but no Component domain event.
- Delete writes ActivityLog/audit Outbox but no Component domain event and uses
  hard delete.
- Cost recalculation updates costing and ActivityLog in one transaction but has
  no domain/audit Outbox row.

## UI/Data Dependencies Found

- Overview correctly uses dashboard snapshot KPI plus live paginated table.
- Overview hardcodes QC fail to zero and exposes no top-profile data.
- Production tab loads the full Production list, aggregates/paginates in React
  and displays synthetic trend arrays.
- Stock tab aggregates Components, Yard, Production and Inventory in React.
- Material Stock reconstructs balances and returns from client-side arrays.
- Transfers filters/paginates Yard movements in React.
- Internal QC contains static rows and hardcoded KPI values.
- Reports aliases History rather than a report domain.

These findings do not invalidate existing Core Platform infrastructure, but do
block a claim that the Components business domain is mature like Inventory.

## Decision Gates

1. Define Component aggregate ownership and a canonical lifecycle.
2. Decide whether fabrication statuses are Component state or derived from the
   latest Production Order/Stage.
3. Decide hard delete versus archive and revision identity rules.
4. Define cross-module commands so Production/Yard/Projects/Logistics do not
   mutate Component directly.
5. Move material return intent to the Production command boundary; Inventory
   remains stock owner.
6. Define canonical create/update/deliver/install/archive/revision events before
   adding publishers.

## Conclusion

```text
Components Domain Audit: COMPLETE
Components Domain Foundation: BLOCKED
```

EPIC187 must begin with domain alignment, not broad implementation.

