# Production ADR011 Validation

Date: 2026-07-13

Status: **PASS for Production Cockpit order workspace**

## Evidence

| ADR011 control | Evidence | Result |
|---|---|---|
| Workspace uses live repository data | `/production/read-model/cockpit` delegates to `ProductionRepository` | PASS |
| Workspace does not use persisted snapshot | No Snapshot Reader in Cockpit read path | PASS |
| KPI owned by backend | `summary`, `overview`, `orderAnalytics`, `queue`, `workCenters` are repository outputs | PASS |
| Filtering/sorting/pagination server-owned | Validated DTO plus repository `where/orderBy/skip/take` | PASS |
| React does not aggregate Cockpit order KPI | Overview/Orders bind read-model fields | PASS |
| Dashboard remains snapshot-first | `/production/metrics` unchanged | PASS |
| Legacy API remains compatible | `GET /production` unchanged | PASS |

## Query Dependency

```text
['production', 'read-model', 'cockpit', params]
  -> productionApi.cockpit(params)
  -> GET /production/read-model/cockpit
```

Production mutations already invalidate the `['production']` family, which
matches the new Cockpit key and preserves strong workspace refresh behavior.

## Conclusion

The P0 ADR011 violation identified by EPIC170 for Production Cockpit order KPI
and unbounded order loading is remediated. This report does not certify the
separate EPIC173 dashboard cutover or EPIC174 Outbox/runtime naming gates.
