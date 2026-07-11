# Enterprise Read Model Rollout

Status: ACTIVE
Date: 2026-07-11

## Mission

Roll out the Inventory-proven consistency rule across SteelTrack:

```text
Dashboard / Cockpit / Analytics -> Persisted Snapshot -> Eventual Consistency
Workspace / Operator Grid / Queue -> Repository Live Read Model -> Strong Read-after-Write
```

No module should copy Inventory code blindly. Each module must classify screens first, then move only the correct surfaces.

## Rollout Phases

### Phase 1 - Production

Priority: highest.

Why:

- Production is the next major business module after Inventory.
- It has many operator workspaces: orders, reservations, material issues, material ledger, warehouse, execution board, logs.
- Current Production workspaces are live-read, which is correct for consistency, but still have scalability debt: unpaginated lists, frontend filtering, 5-second polling on some hooks, and dashboard metrics derived from full order arrays.

Actions:

- Keep workspaces on repository live read models.
- Add/plan persisted dashboard snapshots only for Production cockpit KPIs/trends.
- Add server-side pagination/search/filter/sort to order, issue, reservation, ledger, and log workspaces.
- Remove dashboard-style KPI derivation from workspace list payloads.
- Add Production Operations Center health once snapshot coverage exists.

### Phase 2 - QC

Why:

- QC inspections and production queue are operator queues and must be strongly current.
- Current `GET /qc/cockpit` combines dashboard metrics and workspace queues in one payload.

Actions:

- Split future QC dashboard snapshot from QC inspection/queue live read model.
- Keep `inspections`, `productionQueue`, checklist editing, NCR and CAPA workspaces live.
- Add persisted QC dashboard snapshot later for pass rate, NCR trend, defect distribution, and KPI cards.

### Phase 3 - Yard

Why:

- Yard maps and slot placements are operator-critical and cannot be snapshot-lagged.
- Current Yard runtime hooks read slots/zones/movements/metrics live, which is correct for workspaces.

Actions:

- Keep 2D/3D maps, slot grids, dispatch, tracking, timeline, and movement workspaces live.
- Use snapshots only for yard cockpit analytics, occupancy trends, heatmaps, and executive dashboards.
- Avoid using old `YardSnapshot` visualization rows as the primary operator map source.

### Phase 4 - Logistics

Why:

- Logistics already demonstrates the desired split:
  - `dispatch-dashboard` uses snapshot reader strategy;
  - `dispatch-orders` and dispatch detail are live repository reads.

Actions:

- Preserve this split.
- Add server-side pagination/filtering for dispatch order workspaces.
- Keep driver/dispatch queues live.
- Use snapshots for KPI/trend/status analytics only.

### Phase 5 - Projects

Why:

- Projects has Architecture Freeze v1.0 with dashboard/detail snapshots.
- The new enterprise rule requires reclassifying detail tabs: some Project Detail tabs are dashboards, but some are operator workspaces.

Actions:

- Keep project dashboards and executive summaries snapshot-first.
- Reassess `GET /projects/:id/detail/:tab`:
  - `overview`, `costs`, and executive summary sections may remain snapshot-backed.
  - `materials`, `components`, `progress`, `command`, and `site` should move toward repository live read models if they are used for operator actions.
- Do not change Projects in EPIC120; schedule a focused compatibility sprint.

## Module Status Summary

| Module | Current Status | Next Move |
| --- | --- | --- |
| Inventory | Production-ready reference | Freeze, bug fixes only |
| Production | Live workspace reads, no dashboard snapshot foundation | Phase 1 rollout |
| QC | Mixed cockpit/workspace payload | Phase 2 split |
| Yard | Mostly live runtime workspaces | Phase 3 dashboard snapshot planning |
| Logistics | Good split between dashboard snapshot and live orders | Phase 4 hardening |
| Projects | Snapshot-first detail tabs need reclassification | Phase 5 compatibility |
| Suppliers | Live master workspace and runtime cockpit summary | Later supplier repository/snapshot foundation |
| Operations Center | Observability cockpit, not business workspace | Continue snapshot/runtime telemetry |

## Governance

All future module work must state screen classification in the design or PR summary:

```text
Screen: Production Orders
Classification: Workspace
Read Source: Repository Live Read Model
Consistency: Strong read-after-write
```

or:

```text
Screen: Production Overview
Classification: Dashboard
Read Source: Persisted Snapshot with runtime fallback
Consistency: Eventual
```
