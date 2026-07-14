# EPIC154 - QC Operations Center Integration

## Integration

The existing Operations Center repository now reads real QC domain, snapshot, outbox, and background-job state. The service combines those values with the existing shared runtime metrics.

The integration exposes:

- inspection, result, issue, and NCR counts;
- dashboard and inspection snapshot counts and latest update times;
- snapshot freshness, hit/miss ratio, average age, and average lag;
- repository fallback and read-model hit counters;
- `USE_QC_SNAPSHOT` state;
- pending/failed QC outbox counts;
- active/failed QC snapshot jobs;
- parity readiness and event coverage status.

## Compatibility

- No route or existing response field changed.
- No frontend or Operations Center presentation code changed.
- All database access stays in `OperationsCenterRepository`.
- No workflow action or automatic repair was added.

