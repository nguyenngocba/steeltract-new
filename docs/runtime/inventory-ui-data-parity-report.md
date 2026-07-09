# Inventory UI Data Parity Report

## Persisted Data

Read-only Prisma validation:

| Comparison | Checked | Mismatches | Result |
|---|---:|---:|---|
| Item quantity vs location stock | 23 | 0 | PASS |
| Material snapshot vs location stock | 23 | 0 | PASS |

## Binding Matrix

| UI | Hook | Endpoint | API field | Backend source | Result |
|---|---|---|---|---|---|
| Overview totals | `useInventoryOverview` | `/inventory/overview` | `summary.*` | material snapshots | PASS |
| Today movement cards | `useInventoryOverview` | `/inventory/overview` | `today.*` | bounded repository aggregate | PASS |
| Overview material table | `useInventoryMaterials` | `/inventory/materials` | `items` | snapshot list/read fallback | PASS |
| Materials KPIs | `useInventoryOverview` | `/inventory/overview` | `summary.*` | material snapshots | PASS |
| Search/filter/sort/page | `useInventoryMaterials` | `/inventory/materials` | query + metadata | repository query | PASS |
| Material Detail summary | `useMaterialDetail` | `/items/:id/detail` | detail payload | snapshot-first | PASS |
| Material transaction history | `useMaterialTransactions` | `/transactions` | paginated `data` | repository query | PASS |
| Location detail | `useZones` | `/inventory/zones` | location payload | snapshot-first | PASS |
| Transaction attachments | lazy click query | `/attachments` | transaction-scoped rows | attachment repository | PASS |

## Business Freeze Regression

- No write endpoint changed.
- No transaction semantics changed.
- No snapshot write behavior changed.
- No schema or migration changed.
- Material/location parity remains 23/23.

## Conclusion

**Inventory UI/Data Binding v1.0: APPROVED WITH LIMITATIONS**

Correctness blockers from EPIC118 are removed. The accepted limitations are offset
pagination pending measured deep-page evidence, and unavailable SQL-count telemetry
from the current runtime profiler. Neither limitation causes partial UI totals or
fabricated data.

