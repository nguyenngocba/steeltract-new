# Project Cost Real Data Report

Date: 2026-07-01

## Data Sources

- `ProjectTaskCost`
- `ProjectTaskMaterialAllocation`
- `ProjectTaskComponentAllocation`
- `ProjectTaskResource`
- project-linked component costs
- project-linked inventory transaction item values

## UI

- Replaced the top-level `Chi phí` placeholder with a real Project Cost workspace.
- Added portfolio cost KPIs:
  - contract value
  - budget
  - actual cost
  - profit
  - margin
- Added charts:
  - Cost Breakdown
  - Budget vs Actual
  - Profitability
- Added project cost table with per-project budget/actual/profit/margin.

## Rule

- No fake values are generated.
- Empty state appears when no project/cost data exists.
