# Production Operator Validation Checklist

Date: 2026-07-12

Use only a designated test Production Order and test material/location. Record
IDs, timestamps, screenshots, Outbox IDs, job IDs, and snapshot timestamps after
every step. Do not reuse the existing completed business order.

## Preconditions

- Operator has Production and Inventory permissions.
- Test Component, BOM, Production Order, PRODUCTION warehouse stock, exact
  zone/slot/level, MAIN return destination, and worker access are available.
- Capture initial item quantity, exact location balances, snapshots, Outbox and
  background job counts.
- Confirm `USE_PRODUCTION_SNAPSHOT` effective value in the running process.

## Validation Matrix

| Step | Input condition | Operator action | Expected business result | Ledger / Inventory | Snapshot / Runtime |
|---|---|---|---|---|---|
| Create | Valid Component/BOM | Create order | `DRAFT` | No material ledger or stock change | `production.order.created`; snapshot job queued after dispatch |
| Release | Order `DRAFT` | Release | `RELEASED` | No stock change | `production.order.released`; order snapshot reflects status |
| Ready | Order `RELEASED` | Mark ready | `READY` | No stock change | `production.order.ready`; hit/miss/age observable |
| Start | Order `READY` | Start | `IN_PROGRESS` | No unapproved direct stock write | `production.order.started`; dashboard/order snapshot refresh |
| Pause | Order `IN_PROGRESS` | Pause | `PAUSED` | No material change | `production.order.paused`; one Outbox event/job |
| Resume | Order `PAUSED` | Resume | `IN_PROGRESS` | No material change | `production.order.resumed`; no duplicate event |
| Draft reservation | Active order/BOM | Create without auto-reserve | `DRAFT` reservation | No `RESERVE` ledger; stock unchanged | No material event |
| Reserve | Draft reservation, sufficient free stock | Reserve | `RESERVED` | One positive `RESERVE`; physical stock unchanged | `production.material.reserved`; Production snapshot refresh |
| Issue | Reserved line, exact stock sufficient | Issue quantity | Issue `ISSUED` | Positive `ISSUE`; Inventory `EXPORT`; item/location stock decreases by exact quantity | Production and Inventory Outbox events; both snapshot jobs |
| Consume | Net issued quantity available | Consume quantity | Consumption row created | Positive `CONSUME` for consumed quantity only; no second Inventory decrement | `production.material.consumed`; Production snapshot consumed total |
| Return | Unconsumed issued quantity available | Return quantity | Issue returned quantity increments | Positive `RETURN`; Inventory `RETURN`; MAIN stock increases | `production.material.returned` plus Inventory events/jobs |
| Complete | Order `IN_PROGRESS` and approved completion conditions | Complete | `COMPLETED` | Final ledger equation holds | `production.order.completed`; order/dashboard snapshot refresh |
| Close | Order `COMPLETED` | Close | `CLOSED` terminal | No hidden stock change | `production.order.closed`; snapshot status `CLOSED` |

## Required Reconciliation

```text
issued = consumed + scrap + returned + remaining
Inventory Issue quantity = -Production issued quantity
Inventory Return quantity = +Production returned quantity
inventory_items.quantity = SUM(inventory_location_stocks.quantity)
```

All unchecked or failed rows block Business Certification.

