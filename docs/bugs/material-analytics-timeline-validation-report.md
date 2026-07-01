# Material Analytics Timeline Validation Report

Date: 2026-06-30

Scope: `InventoryMaterialDetailModal.tsx`, tab `Phân tích`, charts:

- `Xu hướng nhập kho`
- `Xu hướng xuất kho`
- `Xu hướng tồn kho`

No Inventory transaction workflow, Prisma schema, migration, package, or backend business logic was changed.

## Root Cause

Sprint BUG.1 corrected `buildMovementTrend()` so movement buckets were sorted chronologically by `dateKey`:

```ts
.sort((a, b) => a.dateKey.localeCompare(b.dateKey))
```

That means data is already:

```text
oldest date -> newest date
```

However `MaterialAnalyticsCockpit` still reversed all series:

```ts
const inboundRows = [...analytics.inboundTrend].reverse()
const outboundRows = [...analytics.outboundTrend].reverse()
const inventoryRows = [...analytics.inventoryTrend].reverse()
```

This made charts render:

```text
newest date -> oldest date
```

and made `getTrend()` compare an older day as `last` against a newer day as `previous`, so trend percentages could point in the wrong direction.

Additional issues found:

- Missing dates between the first and last real transaction date were not represented as zero buckets.
- `FoundationLineChart` tooltip reconstructed the year from the current browser year and a `MM-DD` label, instead of using the real transaction date.
- Outbound quantities already used `Math.abs(quantity)` after BUG.1 and remain non-negative.

## Timeline Before

For real buckets:

```text
2026-06-20 = 10
2026-06-21 = 20
2026-06-22 = 30
```

`buildMovementTrend()` returned:

```text
20/06 -> 21/06 -> 22/06
```

but `MaterialAnalyticsCockpit` reversed it:

```text
22/06 -> 21/06 -> 20/06
```

Chart direction and percentage trend were therefore inverted.

## Timeline After

The chart receives chronological rows directly:

```text
20/06 -> 21/06 -> 22/06
```

`getTrend()` now compares:

```text
previous = 21/06
last = 22/06
```

For:

```text
21/06 = 20
22/06 = 30
```

Result:

```text
↑ (50.0%)
```

## Missing Date Buckets

`buildMovementTrend()` now builds zero buckets only inside the real transaction range.

Example:

```text
2026-06-20 inbound 100
2026-06-25 inbound 50
```

Output:

```text
20/06 = 100
21/06 = 0
22/06 = 0
23/06 = 0
24/06 = 0
25/06 = 50
```

This is not fabricated operational data. It is a zero-activity bucket for actual calendar days between the material's first and last transaction dates.

## Validation Cases

### Inbound Trend

Input:

```text
20/06 = 10
21/06 = 20
22/06 = 30
23/06 = 40
```

Expected chart:

```text
10 -> 20 -> 30 -> 40
```

Status: fixed by removing `.reverse()`.

### Outbound Trend

Input:

```text
20/06 = -5
21/06 = -10
22/06 = -15
```

Expected chart:

```text
5 -> 10 -> 15
```

Status: already normalized through `Math.abs(quantity)` in `buildMovementTrend()` and preserved.

### Inventory Trend

Given final/current stock is reconstructed backward from all movement buckets:

```text
Starting stock before visible range: 100
20/06 inbound 20
21/06 outbound 30
22/06 inbound 10
```

Expected chart:

```text
120 -> 90 -> 100
```

Status: preserved. `buildMaterialAnalytics()` computes:

```ts
runningStock = currentStock - netMovement
runningStock += inbound - outbound
```

with buckets now in oldest-to-newest order.

### Trend Percentage

Input:

```text
20/06 = 10
21/06 = 20
22/06 = 30
```

Expected:

```text
previous = 20
last = 30
↑ (50.0%)
```

Status: fixed by preserving chronological rows before calling `getTrend()`.

### Tooltip

Rows now carry `dateKey = yyyy-MM-dd`.

Tooltip now renders:

```text
Ngày: dd/MM/yyyy
Số lượng: <quantity> <unit>
```

Example:

```text
Ngày: 30/06/2026
Số lượng: 120 cây
```

## Affected Areas

### Inbound Trend

- Direction is now left-to-right, past-to-present.
- Missing days show zero inbound.

### Outbound Trend

- Direction is now left-to-right, past-to-present.
- Negative stock movement signs do not distort the chart.

### Inventory Trend

- Running stock is calculated over the full filled calendar range.
- Zero-movement days keep the previous running stock value.

### Tooltip

- Uses real `dateKey` from transaction dates.
- No longer guesses the year from `new Date().getFullYear()`.

### Trend Percentage

- Compares the newest day against the immediately preceding calendar day in the displayed series.

## Stability

The fix does not use:

- `Math.random()`
- fake transactions
- artificial timestamps
- generated future history

The chart output is deterministic for a given transaction payload.

## Verification

Required commands:

```bash
pnpm -C apps/frontend build
pnpm -C apps/backend-api build
git diff --check
```

Expected runtime check:

1. Open `InventoryMaterialDetailModal`.
2. Open tab `Phân tích`.
3. Verify left-to-right chart direction is past-to-present.
4. Create a new inbound/outbound/transfer transaction.
5. Confirm query invalidation refreshes the modal and the newest day appears at the right edge.
