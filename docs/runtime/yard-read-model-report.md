# EPIC162 - Yard Live Read Model

## Implementation Result

**Status: APPROVED**

`GET /yard/read-model/workspace` is an additive repository live read model. It
returns bounded zones, paginated slots and movements, real cranes, actual QC
inspection queue rows, pagination metadata, server-owned summary and analytics.

Server-owned values include total/occupied/available slots, active placements,
weight, movements today, overloaded zones, movement counts by type and day,
30-day movement trend, crane availability, component distribution and zone
utilization. Query parameters support search, zone/status filters, stable sort,
slot pages and independent movement pages plus item/location/date/type filters.

The active Yard page now reads this endpoint. Existing `/yard/zones`,
`/yard/slots`, `/yard/movements`, `/yard/metrics` and `/yard/cranes` endpoints
remain backward compatible.

Spatial grouping needed to draw 2D/3D maps remains a presentation transform;
business KPI, history totals and status classification are repository-owned.

## Bounded Reads

- zones: maximum 100 returned with total metadata;
- slots: default 100, maximum 200, paginated;
- movements: default 30, maximum 100, independently paginated;
- cranes: maximum 100;
- QC queue: only real inspections linked to visible active Component placements.

No Snapshot, Runtime, workflow, schema or business mutation changed.

---

# EPIC160 - Yard Read Model Audit (Superseded)

## ADR011 Assessment

**Status: VIOLATION**

The backend supports optional pagination for zones and slots and mandatory
pagination for placement search, movements and snapshots. The active frontend
does not send pagination for zones/slots, so both endpoints return all rows with
nested placements.

## Active Read Paths

| Workspace | Backend source | Current behavior | Assessment |
| --- | --- | --- | --- |
| Overview | `/yard/zones`, `/yard/slots`, `/yard/metrics`, `/yard/movements`, `/yard/cranes` | five polling queries every 5 seconds; React aggregates KPIs/charts | VIOLATION |
| 2D/3D map | unbounded zones/slots with nested placements | client spatial aggregation | CONDITIONALLY VALID for rendering, unbounded for scale |
| Locations | slots + first 12 movements | client sort/filter/summary | VIOLATION |
| Components | slots with nested placements | client flatten/filter/pagination | VIOLATION |
| Dispatch/tracking/heatmap | slots, metrics, first 12 movements | client-derived workflow views | VIOLATION |
| History/timeline | `/yard/movements?limit=12` | client filters and treats sample as complete history | FAIL |

## Scalability Risks

- Zone and slot responses are unbounded when pagination params are omitted.
- Each slot includes all active placements.
- Five-second polling repeats large payloads across all route tabs.
- History and analytics only see 12 newest movements, causing partial totals.
- Search toolbar controls are presentation-only and do not drive server queries.
- Offset pagination exists in backend but is not used by active workspace UI.

## Recommendation

EPIC162 should introduce additive, bounded live read models for layout,
placements, movement history and operational summaries. Workspace pages must
remain live repository reads; only rendering-specific spatial data should be
returned, with explicit viewport/zone scope and pagination.
