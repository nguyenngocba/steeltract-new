# Inventory `items[]` Remediation

Date: 2026-07-14

## Remediated Paths

| Path | Previous behavior | EPIC181 behavior |
|---|---|---|
| Stock validation | Validated each duplicate line against the same balance | Validates the aggregate bucket delta once |
| Item compatibility quantity | Updated once per request line | Updates once per material delta |
| Location stock | Updated once per request line | Updates once per material/location bucket |
| Stock Outbox | One event per request line | One event per affected bucket |
| Dashboard activity | Named the first transaction item | Lists all unique material names |
| Recent Transactions widget | Displayed first material and quantity | Displays all materials and document quantity |
| Return activity/metadata | Used first return item | Preserves arrays and singular metadata only for one-line returns |
| Transaction CSV | Exported one row per header using first line | Exports one row per transaction line |
| Transaction list | Displayed first material/location/value | Displays line-aware material/location and document totals |
| Inbound history | Used first line unit and price | Shows all units and only a genuinely shared unit price |
| Transfer reporting | Used first source/destination for filters, routes and rankings | Aggregates every material pair and location |
| Location activity | Displayed first line only | Emits an activity row for every line |
| Adjustment summary | Displayed first line only | Summarizes all materials/locations and keeps line detail |

## Intentional First-element Access

- `inventory-read-model.adr011.spec.ts` indexes the first returned test row to
  assert its read source. It is not transaction business logic.
- Single-line metadata is read with `at(0)` only after an explicit
  `items.length === 1` guard.
- Transfer source and destination use `at(0)` only after validation proves
  exactly one source and one destination for that material.

## Persistence Rule

Duplicate request lines are **not merged in the ledger**. Every submitted line
is persisted for audit compatibility. Only availability validation, balance
mutation, compatibility totals and bucket event fan-out are aggregated. This
implements RFC-001 without silently changing document evidence.

## Result

No active Inventory business/report path uses `transaction.items[0]` as a
document-wide truth. The canonical command can process multiple distinct
materials and duplicate buckets without partial or repeated balance effects.
