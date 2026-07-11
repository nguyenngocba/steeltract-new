# EPIC120 - Workspace Data Source Audit

Date: 2026-07-11

## Audit Rule

```text
Dashboard / Cockpit / Analytics -> Persisted Snapshot -> Eventual Consistency
Workspace / Operator Grid / Queue -> Repository Live Read Model -> Strong Read-after-Write
```

## Summary

| Module | Result | Notes |
| --- | --- | --- |
| Inventory | PASS / Reference | Overview dashboard uses snapshot/read model; Materials/Locations use live read model where read-after-write matters. |
| Production | NO SNAPSHOT VIOLATION | Workspaces use live endpoints; dashboard/cockpit still runtime-derived and needs future snapshot foundation. No code rollout required in EPIC120. |
| Projects | VIOLATION / FUTURE PHASE | Detail tabs `materials`, `components`, `progress`, `command`, `site`, `costs` can read `ProjectDetailSnapshot`; some are operator workspaces under the new rule. Do not fix in EPIC120. |
| QC | MIXED PAYLOAD RISK | `GET /qc/cockpit` feeds both dashboard and operator queues. It is live, not snapshot, but should be split into dashboard snapshot + live queues later. |
| Yard | PASS WITH SCALABILITY RISK | Operator maps/slots/movements are live runtime reads. Yard snapshots exist but are not the primary active workspace source. |
| Logistics | PASS PATTERN | `dispatch-dashboard` is snapshot-first; `dispatch-orders` and detail are live repository reads. Needs pagination hardening later. |
| Suppliers | PARTIAL / FOUNDATION GAP | Supplier list is live; cockpit summary/evaluations are runtime aggregate and not snapshot-backed. No workspace snapshot violation. |
| Operations Center | NOT BUSINESS WORKSPACE | Observability cockpit reads runtime metrics, snapshot health, jobs, outbox, database, and storage. Snapshot reads are intentional telemetry. |

## Screen Classification Matrix

### Inventory

| Screen | Classification | Data Source | Status |
| --- | --- | --- | --- |
| Inventory Overview | Dashboard | `/inventory/overview`, snapshot/read-model path | PASS |
| Inventory Materials | Workspace | `/inventory/materials`, repository live stock rows for row quantities | PASS |
| Inventory Locations | Workspace | location read model with snapshot/live fallback; live location consistency required | PASS after Inventory freeze |
| Inventory Material Detail | Hybrid Detail | Material snapshot summary plus live/paginated history where needed | PASS |
| Inventory Transactions | Workspace | transaction endpoint | PASS |
| Inventory Return Requests | Workspace Queue | return request endpoint | PASS |
| Inbound/Outbound/Transfer/Adjustment/Stock Take | Operator Workspace | transaction APIs + React Query invalidation | PASS with remaining browser smoke pending |

### Production

| Screen | Classification | Data Source | Status |
| --- | --- | --- | --- |
| Production Overview/Cockpit | Dashboard/Hybrid | `useProductionOrders`, logs/reservations/issues/components runtime arrays | WARNING: dashboard snapshot not yet available |
| Production Orders | Workspace | `GET /production` via `ProductionService.findAll()` -> `ProductionRepository.findOrders()` | PASS |
| Production Execution Board | Workspace | live orders/issues/reservations arrays | PASS |
| Production Reservations | Workspace Queue | `GET /production/reservations` | PASS |
| Production Material Ledger | Workspace/Ledger | `GET /production/material-ledger` | PASS |
| Production Material Issues | Workspace Queue | `GET /production/material-issues` | PASS |
| Production Warehouse | Workspace | Inventory audit/items + production orders/reservations runtime data | WARNING: should move to dedicated live read model later |
| Production Logs | Workspace/History | `GET /production/logs` | PASS |

Production pilot conclusion: no persisted snapshot is used as primary workspace source. No EPIC120 code change is required.

### Projects

| Screen | Classification | Data Source | Status |
| --- | --- | --- | --- |
| Projects Runtime Dashboard | Dashboard | `ProjectDashboardSnapshot` through `DashboardReaderService`, fallback runtime | PASS |
| Projects List | Workspace/List | runtime projects payload | WARNING: should be reviewed for server-side pagination |
| Project Detail Overview | Dashboard/Detail Summary | `ProjectDetailSnapshot` when fresh | ACCEPTABLE if read-only summary |
| Project Detail Materials | Workspace | `ProjectDetailSnapshot` when fresh | VIOLATION under ADR011 |
| Project Detail Components | Workspace | `ProjectDetailSnapshot` when fresh | VIOLATION under ADR011 |
| Project Detail Progress | Workspace | `ProjectDetailSnapshot` when fresh | VIOLATION under ADR011 |
| Project Detail Command | Workspace/Control Center | `ProjectDetailSnapshot` when fresh | VIOLATION under ADR011 |
| Project Detail Site | Operator Workspace | `ProjectDetailSnapshot` when fresh | VIOLATION under ADR011 |
| Project Detail Costs | Dashboard/Finance Summary | `ProjectDetailSnapshot` when fresh | ACCEPTABLE if read-only; review if editable cost controls are added |
| Project Detail Documents/Logs | Workspace/History | repository fallback only | PASS |

Projects are explicitly deferred to rollout Phase 5 because Projects Architecture Freeze v1.0 predates ADR011.

### QC

| Screen | Classification | Data Source | Status |
| --- | --- | --- | --- |
| QC Overview/Dashboard | Dashboard | `GET /qc/cockpit` runtime aggregate | WARNING: needs future persisted QC dashboard snapshot |
| QC Inbound/Production/Final Inspection | Workspace Queue | same `GET /qc/cockpit` payload, live repository service | PASS consistency, WARNING mixed payload |
| QC Plan | Workspace Queue | same cockpit payload production queue | PASS consistency, WARNING mixed payload |
| Standards | Workspace/Master Data | same cockpit payload checklists | WARNING: should use dedicated checklist endpoint for scaling |
| NCR/CAPA | Workspace Queue | same cockpit payload NCRs | WARNING: should split live queues |
| Logs/Reports | Dashboard/Report | same cockpit payload | WARNING: snapshot/report read model needed |

### Yard

| Screen | Classification | Data Source | Status |
| --- | --- | --- | --- |
| Yard Overview | Dashboard/Hybrid | live zones/slots/metrics/movements | WARNING: snapshot dashboard can be added later |
| 2D Map | Workspace | live slots/zones/placements | PASS |
| 3D Map | Workspace | live slots preferred, demo fallback only when runtime absent | PASS |
| Locations | Workspace | live slots/movements | PASS |
| Components | Workspace | live slots/placements | PASS |
| Dispatch | Workspace | live slots/movements/metrics | PASS |
| Tracking | Workspace | live zones/slots/movements | PASS |
| Heatmap | Analytics | live slot calculations | WARNING: future snapshot analytics candidate |
| Timeline/History | Workspace/History | live movements | PASS, pagination recommended |

### Logistics

| Screen | Classification | Data Source | Status |
| --- | --- | --- | --- |
| Logistics Overview | Dashboard + embedded table | `GET /logistics/dispatch-dashboard` snapshot-first for charts/KPIs; `GET /logistics/dispatch-orders` live table | PASS |
| Dispatch | Workspace Queue | `GET /logistics/dispatch-orders` | PASS |
| Tracking | Workspace Queue | `GET /logistics/dispatch-orders` filtered client-side | PASS consistency, WARNING scalability |
| History | Workspace/History | `GET /logistics/dispatch-orders` filtered client-side | WARNING pagination/filtering needed |
| Dispatch Detail | Detail Workspace | `GET /logistics/dispatch-orders/:id` live query | PASS |

### Suppliers

| Screen | Classification | Data Source | Status |
| --- | --- | --- | --- |
| Suppliers Overview | Dashboard/Hybrid | `/suppliers/cockpit/summary` runtime aggregate | WARNING: no persisted supplier snapshot |
| Supplier List | Workspace/Master Data | `/suppliers?search=` live Prisma service | PASS consistency, WARNING no repository/pagination |
| Supplier Detail Cockpit | Detail/Analytics | `/suppliers/:id/cockpit` runtime aggregate over inbound history | WARNING: may be heavy as transactions grow |
| Supplier Quality | Dashboard/Workspace Hybrid | `/suppliers/cockpit/evaluations` runtime aggregate | WARNING |
| Quotes/Purchase Orders/Deliveries/Payables/Logs/Reports | Placeholder/Partial | page-level placeholders or reused supplier data | PARTIAL |

### Operations Center

| Screen | Classification | Data Source | Status |
| --- | --- | --- | --- |
| Overview | Operations/Observability Cockpit | `/operations-center/overview` runtime metrics + repository health + snapshot stats | PASS |
| Runtime/API/Performance | Operations Analytics | runtime metrics | PASS |
| Database/Storage | Operations Telemetry | repository/database/system calls | PASS |
| Background Jobs/Events | Operations Workspace | job/outbox repository reads | PASS |
| Snapshot/Cache | Operations Telemetry | snapshot stats + performance counters | PASS |
| Alerts | Operations Queue | computed runtime/system alerts | PASS |

Operations Center is not a business workspace; using snapshot telemetry here is intentional.

## Violations

| Priority | Module | Screen | Violation | Action |
| --- | --- | --- | --- | --- |
| P1 | Projects | Detail Materials/Components/Progress/Command/Site | Fresh ProjectDetailSnapshot may serve operator workspace tabs. | Phase 5: split live workspace tabs from snapshot summaries. |
| P2 | QC | Cockpit payload | Dashboard and workspace queues are combined in one live payload. | Phase 2: split dashboard snapshot from live queues. |
| P2 | Suppliers | Cockpit summary/evaluation/detail | Runtime aggregate cockpit has no snapshot/read-model boundary. | Later supplier core foundation. |

No Production snapshot-workspace violation was found, so EPIC120 made no Production code change.

## Scalability Warnings

- Production still derives many cockpit metrics in frontend from full runtime arrays.
- QC cockpit fetches all major QC surfaces in one payload.
- Yard workspaces poll live runtime data every 5 seconds; acceptable for current partial module, but future scale needs segmented queries.
- Logistics dispatch order list is unpaginated and client-filtered.
- Suppliers service uses Prisma directly and unpaginated master/cockpit queries.

These warnings are rollout backlog items, not EPIC120 code fixes.
