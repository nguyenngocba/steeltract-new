# EPIC 3.2 Production Workspace Finalization

Date: 2026-07-21

Status: **SOURCE/BUILD FINALIZED - BROWSER QA PENDING**

## Scope

Production was reviewed again against the Inventory canon after EPIC 3 and
EPIC 3.1. This pass focused on operator clarity rather than new business logic:

- Dashboard / Overview
- Planning
- Work Orders
- Production Queue / Execution
- Machines
- Consumptions
- Warehouse
- Reservations
- Ledger
- Issues
- Incidents
- Logs
- Reports

## Findings

Production already satisfies the source-level P0/P1 UI requirements completed
in EPIC 3 and EPIC 3.1.

- The queue workspace now presents a table hero before the kanban board.
- Operational modes use compact filters, KPI cards, table shells, pagination
  and right analytics rails where data exists.
- Machines is route-visible and uses real backend data.
- Consumptions and Incidents have fuller analytics rails and controlled empty
  states instead of blank space.
- No dead global toolbar actions were found in the current source-level pass.
- Running, Completed and Scrap remain route/model decisions rather than UI
  defects because the current router exposes them through filters/derived views.

## Operator Readiness

| Workspace | Result | Notes |
| --- | --- | --- |
| Overview | Ready | Operator can see production health, order state and activity quickly. |
| Planning | Ready | Uses existing data and workspace shell without fake metrics. |
| Work Orders | Ready | Table-first workflow supports daily order review. |
| Queue / Execution | Ready | Queue table is the hero; kanban remains supporting context. |
| Machines | Ready | Uses machine endpoint and controlled empty state. |
| Consumptions | Ready | Material consumption table and analytics are visually complete. |
| Incidents | Ready | Attention rail answers what needs operator action. |
| Warehouse / Reservations / Ledger / Issues / Logs | Ready with P2 follow-up | Current UI is complete; deeper Query API adoption is future work. |

## Limitations

- Authenticated screenshot certification is still pending because no approved
  browser harness is available in this workspace.
- Running, Completed and Scrap should become first-class routes only after a
  separate navigation/product decision.
- Some non-order workspaces still use legacy read hooks; this remains P2 and
  does not block UI readiness.

## Verification

- `pnpm -C apps/frontend build`: PASS.
- Backend build: pending final gate in this sprint.
- `git diff --check`: pending final gate in this sprint.

