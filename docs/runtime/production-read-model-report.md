# EPIC130 - Production Read Model Report

Date: 2026-07-11
Status: ADR011 CLASSIFICATION COMPLETE

## ADR011 Classification

| Screen / Endpoint | Classification | Current Data Source | ADR011 Result |
| --- | --- | --- | --- |
| `/production` overview cockpit | Dashboard / Hybrid | Live `/production`, `/production/boms`, `/production/material-issues`, `/production/consumptions`, `/production/reservations`, `/production/material-ledger`, `/production/logs`, `/components`, `/inventory/*` | NEEDS FUTURE SNAPSHOT |
| `/production/orders` | Workspace | `GET /production` live order list | PASS, but needs server pagination contract in frontend |
| `/production/boms` | Workspace | `GET /production/boms` live BOM list | PASS, repository gap |
| `/production/planning` | Workspace placeholder/tab | Same cockpit component path; no dedicated backend read model | PARTIAL |
| `/production/warehouse` | Workspace | Production UI combines Production and Inventory data | PASS, but needs dedicated live read model |
| `/production/execution` | Workspace | Live production order/stage data | PASS |
| `/production/reservations` | Workspace | `GET /production/reservations` live reservation list | PASS, repository gap |
| `/production/material-ledger` | Workspace / Audit table | `GET /production/material-ledger` live ledger list | PASS, needs pagination budget |
| `/production/material-issues` | Workspace | `GET /production/material-issues` live issue list | PASS, repository gap |
| `/production/consumptions` | Workspace | `GET /production/consumptions` live consumption list | PASS, repository gap |
| `/production/logs` | Workspace / Activity log | `GET /production/logs` live logs capped at 200 | PASS with scalability warning |
| Machine KPI / OEE / Capacity dashboard | Dashboard | No persisted Production snapshot path found | MISSING |

## Frontend Read Pattern

`useProductionCockpit.ts` currently defines direct React Query hooks:

- `['production', 'orders']` -> `GET /production`
- `['production', 'boms']` -> `GET /production/boms`
- `['production', 'issues']` -> `GET /production/material-issues`
- `['production', 'consumptions', params]` -> `GET /production/consumptions`
- `['production', 'reservations', productionOrderId]` -> `GET /production/reservations`
- `['production', 'material-ledger', params]` -> `GET /production/material-ledger`
- `['production', 'logs']` -> `GET /production/logs`
- `['production', 'machines']` -> `GET /production/machines`

These are live reads, not snapshot reads, which is correct for operator workspaces.

## Current Issues

1. **Cockpit is hybrid.**
   `ProductionCockpitPage` uses the same live datasets to render overview KPIs, analytics, and workspaces. This is acceptable today but does not follow the final Dashboard Snapshot standard.

2. **Frontend filtering is still common.**
   `ProductionCockpitPage` filters orders and BOMs in memory. Production Orders backend can accept `page`/`limit`/filters, but the current frontend hook calls `GET /production` without params.

3. **Several list endpoints are unpaginated or capped.**
   `GET /production/logs` is capped at 200 in the repository. Other list endpoints need explicit pagination metadata before enterprise-scale rollout.

4. **No dedicated Production read-model service exists.**
   The current pattern is service methods returning Prisma-shaped records. Inventory now uses explicit read-model services for high-value workspace/dashboard paths.

## Recommended Read Model Strategy

### Workspace Live Read Models

Implement repository-backed read models for:

- Production Orders list and detail;
- Work Order queue;
- Production BOM list/detail;
- Material Reservation queue;
- Material Issue queue;
- Material Ledger history;
- Consumption history;
- Production Warehouse view;
- Execution board;
- Logs/activity timeline.

Requirements:

- server-side pagination/search/filter/sort;
- stable secondary sort key;
- bounded includes;
- no dashboard snapshot usage;
- mutation invalidation keys aligned to query families.

### Dashboard Snapshot Read Models

Keep dashboard/cockpit analytics out of workspace endpoints once snapshots exist:

- Production Overview KPI snapshot;
- OEE / Machine KPI snapshot;
- Shift Dashboard snapshot;
- Capacity Dashboard snapshot;
- Work Center summary snapshot.

## Conclusion

Production mostly follows ADR011 accidentally because snapshots do not exist yet. It still needs explicit read-model boundaries before it can inherit the Inventory standard safely.

