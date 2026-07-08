# EPIC112 INV.CORE.1 - Inventory Event Compliance Report

Date: 2026-07-08

## Scope

No user workflow or API contract changed.

Inventory lifecycle events now publish through the persistent Outbox/Event Engine while preserving existing runtime gateway and event-store behavior.

## Implemented

Added:

- `InventoryEventService`

The service wraps `EventPublisherService.publishPersistent()` and applies Inventory module metadata and idempotency keys.

## Event Coverage

| Workflow | Event |
| --- | --- |
| Nhập kho / Import | `inventory.transaction.created`, `inventory.stock_bucket.updated` |
| Xuất kho / Export | `inventory.transaction.created`, `inventory.stock_bucket.updated` |
| Điều chuyển / Transfer | `inventory.transaction.created`, `inventory.stock_bucket.updated` |
| Điều chỉnh / Adjustment | `inventory.transaction.created`, `inventory.stock_bucket.updated`, `inventory.adjustment.posted` |
| Trả vật tư / Return received | `inventory.transaction.created`, `inventory.stock_bucket.updated`, `inventory.return.received` |
| Phiếu trả requested | `inventory.return.requested` |
| Phiếu trả received | `inventory.return.received` |
| Phiếu trả rejected | `inventory.return.rejected` |
| Phiếu trả accepted/disposed | `inventory.return.accepted` |
| Kiểm kê / Stock take | `inventory.stocktake.completed` when stocktake payload/type markers are present |
| Material create/update/delete | `inventory.material.updated` |

## Outbox Behavior

Events are persisted through `EventPublisherService.publishPersistent()`.

Idempotency key format:

```text
<eventName>:<payload.id>:<payload.status or payload.type or default>
```

## Compatibility

Existing behavior remains:

- `EventStoreService.append()` still records `inventory.transaction.created`.
- `RuntimeGateway.emit()` still emits realtime transaction notifications.
- `TelemetryService.track()` still tracks Inventory transaction count.

## Limitations

- Event consumers are not introduced in this sprint.
- Stocktake event detection relies on transaction payload/type markers because there is no separate stocktake domain event model yet.
- Background snapshot update subscriptions should be added in a later sprint.

## Verification

- Backend build passed.

