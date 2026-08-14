# SYSTEM.PRODUCT.AUDIT.1 - Dashboard and Data Truth

Audit date: 2026-08-14  
Priority: highest-risk audit layer

## Runtime sources observed

Authenticated read-only calls returned 200 for all audited sources:

- `/inventory/overview`
- `/production/read-model/cockpit`
- `/components/dashboard`
- `/qc/cockpit`
- `/yard/dashboard`
- `/logistics/dispatch-dashboard`
- `/projects/runtime`
- `/procurement/workspace`
- `/suppliers/cockpit/summary`
- `/history/dashboard/latest`
- `/dashboard/cockpit`

## Metric trace matrix

| Metric | Source DB | API/read model | Active UI | Truth status |
|---|---|---|---|---|
| Inventory total stock/value | `inventory_items`, `inventory_location_stocks`, transaction items | `/inventory/overview.summary` | Dashboard and Inventory Overview | GREEN: 3,212 stock; DB/cache/location/ledger agree. |
| Inventory available/reserved | Location stock and Production reservations | Inventory overview/material read models | Inventory pages | GREEN/YELLOW: canonical sources, but executive card does not expose reserved separately. |
| Inbound/outbound value | Signed Inventory transactions and amounts | `/inventory/overview.month`, `.movementTrend` | Dashboard KPI and import/export chart | YELLOW: real source; Dashboard date range does not re-query this aggregate, so selected range can disagree. |
| Production orders/running/waiting material | `production_orders`, executions, reservations, instances | `/production/read-model/cockpit` | Production cockpit; Dashboard loads order list | GREEN/YELLOW: Production page summary is canonical (30 total, 2 in progress, 6 waiting material); Dashboard recomputes running client-side. |
| Component definitions | `components` | Components list/overview | Components list and Executive component card | GREEN only when labeled engineering definitions. Current generic `Tổng cấu kiện` wording is ambiguous. |
| Finished Goods | Eligible `component_instances` and FINAL QC | `/components/instances/finished-goods` | Components Stock | GREEN: one eligible row at audit time. |
| Component stock/ready/shipped | Legacy `components.status` | Components overview/dashboard snapshots | Components Overview/Reports and old Dashboard | RED: physical inventory must not be derived from definitions. |
| QC waiting/pass/fail/rework/scrap | ComponentInstance state + FINAL inspection/NCR | Physical QC workspace / foundation instances | Standalone QC page | GREEN: captured values 16/1/8/4/6 align with physical instance states. |
| QC inspection pass rate/open NCR | `qc_inspections`, NCR | `/qc/cockpit` | Executive Dashboard | YELLOW: 48% and 28 open NCR are real inspection-event aggregates, but not the same population as physical-instance KPI. |
| Project progress/installed | Project/WBS/requirements/instances/dispatch | `/projects/runtime` | Projects and Executive | RED: summary still counts legacy Component status; API reported installed=0 while DB has 2 installed instances. |
| Yard occupancy | `yard_slots`, active placements | `/yard/dashboard`/workspace | Yard | GREEN: 26 occupied of 27 slots at audit time. |
| Logistics status | Dispatch orders/items and ComponentInstance state | `/logistics/dispatch-dashboard` | Logistics and Executive | GREEN/YELLOW: canonical source; Executive label `Giao hàng hôm nay` counts active statuses, not today's completed movements. |
| Procurement open PR/PO/receipts | Material requests, POs, Inventory receipt transactions | `/procurement/workspace` | Routed Procurement page | RED: API says open PR=0, open PO=0, receiptCount=39; UI hardcodes 28 suppliers, 16 PO, 9 inbound, 5 pending. |
| Supplier operational tabs | Supplier master/evaluation only | `/suppliers/cockpit/*` | Suppliers quotes/PO/delivery/payables/logs/reports | RED: rows are synthesized/hardcoded; no authoritative source. |
| Historical latest | `dashboard_snapshots` + projection watermark | `/history/dashboard/latest` | Historical Dashboard | GREEN/YELLOW: authoritative=true, parity=true, lag 4.5s; snapshot age about 7h and two Logistics/Dispatch daily snapshots remain stale. |

## Main Executive Dashboard truth issues

### D-01 - Date filter is presentation-only for several measures

`DashboardPage.tsx` loads current Inventory overview, full/current module lists
and a paginated transaction detail list. It then applies `filterRowsByDate()`
in memory. Specifically:

- `inventoryOverview.month.inboundValue/outboundValue` remain current-month
  values regardless of Today/7D/30D/custom selection.
- Transaction detail is loaded only for activities/detail domains and capped at
  pageSize 200.
- Production, Projects and Dispatch are filtered from current lists, not
  reconstructed as-of data.

This filter can be valid for a current-period analytical view only if each API
supports the same range. It is not a historical dashboard and should not imply
one.

### D-02 - KPI label/formula mismatches

- `Giao hàng hôm nay` uses the count of PLANNED/LOADING/IN_TRANSIT/ARRIVED
  dispatches, not orders created/completed today.
- `QC / NCR mở` renders QC pass rate as the primary value and open NCR only in
  supporting context.
- `Dự án đang thực hiện` treats any project with progress <100 as active even
  if its lifecycle status is not ACTIVE.
- KPI trend deltas are computed from whatever client series happens to be
  loaded; missing history is shown as a dash, but data scope is inconsistent.

### D-03 - Legacy `/dashboard/cockpit` is not canonical

Runtime response reported:

- `components=24`, `completedComponents=0` from Component definitions.
- `logisticsActive=41` from Yard movements.
- project progress from `project.components[].status`.

These fields should not be exposed as canonical executive metrics.

### D-04 - Components snapshot fallback is unhealthy metadata

`/components/dashboard` and `/yard/dashboard` returned runtime fallback wrappers
with `fallbackReason=missing`, confidence 0 and an age represented by
`Number.MAX_SAFE_INTEGER`. The UI still renders fallback data, but operational
metadata is not suitable for executive trust or monitoring.

## Dashboard P0 corrections recommended

1. Connect Procurement UI to `/procurement/workspace`, PR and PO APIs.
2. Remove/generated Supplier operational rows from active routes.
3. Replace Project and Component physical metrics/snapshots with
   ComponentInstance/requirement/QC/dispatch sources.
4. Publish a typed metric catalog: name, business definition, unit, filters,
   endpoint, source tables and freshness.
5. Make global filters server-backed and consistent, or scope/label them per
   widget. Historical selection must use `/history/*`.
6. Retire or canonicalize legacy `/dashboard/*` metric endpoints.
7. Align QC event metrics versus physical-instance state metrics in labels.
8. Repair missing/stale module snapshots and expose a bounded fallback age.

## Dashboard truth score

**Dashboard Truth: 58/100**

Inventory, Production, physical QC, Yard and Logistics have real sources.
Procurement is entirely fake in the active UI, Suppliers contains extensive
synthetic operational data, Project/Component summaries still use legacy
definition status, and the global date filter does not have end-to-end truth.
