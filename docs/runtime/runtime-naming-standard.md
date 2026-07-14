# Runtime Naming Standard

## Canonical Contract

Every certified module publishes the following keys in the shared Runtime
Metrics snapshot:

```text
<module>SnapshotHit
<module>SnapshotMiss
<module>ReadModelHit
<module>FallbackCount
<module>AverageAgeSeconds
<module>AverageLagMs
```

The module token is singular and lowercase: `inventory`, `component`,
`production`, `qc`, `yard`.

| Module | Hit | Miss | Read Model | Fallback | Age | Lag |
| --- | --- | --- | --- | --- | --- | --- |
| Inventory | `inventorySnapshotHit` | `inventorySnapshotMiss` | `inventoryReadModelHit` | `inventoryFallbackCount` | `inventoryAverageAgeSeconds` | `inventoryAverageLagMs` |
| Components | `componentSnapshotHit` | `componentSnapshotMiss` | `componentReadModelHit` | `componentFallbackCount` | `componentAverageAgeSeconds` | `componentAverageLagMs` |
| Production | `productionSnapshotHit` | `productionSnapshotMiss` | `productionReadModelHit` | `productionFallbackCount` | `productionAverageAgeSeconds` | `productionAverageLagMs` |
| QC | `qcSnapshotHit` | `qcSnapshotMiss` | `qcReadModelHit` | `qcFallbackCount` | `qcAverageAgeSeconds` | `qcAverageLagMs` |
| Yard | `yardSnapshotHit` | `yardSnapshotMiss` | `yardReadModelHit` | `yardFallbackCount` | `yardAverageAgeSeconds` | `yardAverageLagMs` |

Inventory material/location counters remain additive compatibility detail. They
feed the Inventory module family without double-counting the global snapshot
counter. Metric semantics and retention windows are unchanged.
