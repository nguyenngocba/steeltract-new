# Components Read Model Design Assessment

Date: 2026-07-17  
Status: **CORE PATH PASS - SECONDARY WORKSPACES INCOMPLETE**

## ADR011 Boundary

```text
Workspace -> Repository Live Read Model
Dashboard/analytics -> Persisted Snapshot -> Repository fallback
```

## Existing Compliant Paths

| Surface | Path | Result |
| --- | --- | --- |
| Components List | `/components/read-model/list` | PASS |
| Components Overview rows | `/components/read-model/overview` | PASS |
| Components History | `/components/read-model/history` | PASS |
| Component Detail | Repository live read | PASS |
| Costing | Repository live calculation/persistence | PASS |
| Dashboard KPI | `/components/dashboard` snapshot-first | PASS |

## Remaining Workspace Gaps

| Surface | Current behavior | Required read model |
| --- | --- | --- |
| Production | Full Production array, React KPI/filter/page/trend | Component-scoped Production live projection |
| Stock | React joins Components, Yard, Production and Inventory | Component stock/location live projection |
| Material Stock | React reconstructs Inventory/Issue balances | Production material balance projection |
| Transfers | React filters/pages Yard movements | Component movement projection |
| Internal QC | Static rows/KPI | QC-owned component inspection projection |
| Reports | History alias | Explicit approved report projection |

## Projection Ownership

- Component master/list projection belongs to Components.
- Production status/material balance belongs to Production read models.
- Physical placement/movement belongs to Yard.
- Inventory quantities and values belong to Inventory.
- QC results belong to QC.

Components may compose these through stable module contracts. It should not
query or reconstruct every module's ledger in React.

## Dashboard Dependencies

`ComponentDashboardSnapshot` currently projects status counts and costs from
Component data. The active Overview combines those KPI with a paginated live
table, which is a valid Dashboard + Workspace composition. However:

- QC failure is hardcoded to zero;
- top-profile data is empty;
- snapshot freshness is limited by `component.updated` coverage;
- direct status writes by other modules may not produce Components events.

## Pagination and Scale

Core list/history paths are bounded. Secondary Production, Stock, Material
Stock and Transfers workspaces still load full/capped cross-module datasets and
paginate in the browser. Large-data readiness is therefore conditional, not
certified.

