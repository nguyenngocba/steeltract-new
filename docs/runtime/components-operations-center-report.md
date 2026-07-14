# Components Operations Center Integration

## Data Flow

```text
PerformanceMetricsService
  -> component snapshot/read-model counters
OperationsCenterRepository
  -> Component snapshot, Outbox and job health (read-only)
OperationsCenterService
  -> additive components Platform Health payload
```

The integration reuses the Inventory/Production conventions and introduces no
new route or UI. Snapshot status is `critical` when absent, `warning` when older
than one hour, and `healthy` otherwise. Parity status is reported as `prepared`;
the validator warns but never repairs data.

Background job matching uses canonical dispatcher names
`snapshot.components.update` and `snapshot.components.rebuild`. Event health is
scoped to existing `component.*` Outbox rows.

