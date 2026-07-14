# Inventory Read Model Assessment

Date: 2026-07-14  
Status: **CORE READS LINE-AWARE; PRESENTATION GAPS REMAIN**

## Read Path Matrix

| Surface | Current source/behavior | Multi-material impact |
|---|---|---|
| Transaction History API | Repository header pagination with `items[]` | API ready |
| Transaction Detail | Loads all lines | Ready; stable line order recommended |
| Material Detail/History | Filters by `materialId` and flattens matching lines | Ready; sibling lines intentionally hidden in material-scoped view |
| Inventory Dashboard | Aggregates transaction items and counts distinct headers | Mostly ready |
| Materials workspace | Live location/material read model | No document-model change |
| Locations workspace | Some recent movement widgets use `items[0]` | Must flatten/display line-aware summaries |
| Transactions table/CSV | Main table and CSV export use `items[0]` | Must show document summary or export one row per line |
| Overview recent movement helpers | A helper returns the first line | Must be line-aware or explicitly label `+N vật tư` |
| Return workflow summaries | Uses first material name/metadata | Must use count/summary or line collection |
| Executive activity | Sums all lines but labels first material only | Must add multi-material description semantics |

## Correct Aggregation Semantics

For a five-material document:

- **Document count** is one (`COUNT(DISTINCT transaction.id)`).
- **Line count** is five, or more for paired transfers.
- **Material count** is distinct `inventoryItemId`, not line count.
- **Quantity** is meaningful only with compatible units. A document-wide sum
  across kg, pcs, and liters must not be presented as one physical quantity.
- **Value** is the sum of absolute line amounts according to transaction type.
- **Transfer value** must count one side only; current dashboard SQL already
  excludes negative transfer lines for value.
- **Transfer quantity** currently sums absolute source and destination lines,
  which doubles moved quantity. This existing semantic must be clarified before
  certification of multi-material transfer KPI.

## History and Detail Contract

Transaction list should remain header-paginated. A row can show:

- first material plus `+N vật tư`, or
- document material count and total value,

while the existing drawer displays all lines. CSV/report exports should provide
either a header export plus a separate line export or one row per line with the
header number repeated. Exporting only `items[0]` is incorrect.

Material history remains line-scoped and server-paginated. Selecting a material
should not multiply the transaction header; the detail endpoint is the path for
seeing sibling materials in the same document.

## Dashboard Impact

Inventory Overview already uses repository SQL over transaction lines and
persisted snapshots. It does not need a new read model. It does need semantic
tests for:

- one header with multiple inbound lines;
- mixed units;
- transfer source/destination pairs;
- document count versus line/material count;
- total value parity with line totals.

## Conclusion

Read-model readiness is **CONDITIONALLY READY**. Backend list/detail/material
paths are structurally compatible; first-line UI/report consumers and ambiguous
cross-unit totals must be remediated before rollout.

