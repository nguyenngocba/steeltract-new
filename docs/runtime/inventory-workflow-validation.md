# Inventory Workflow Validation

Date: 2026-07-08

## Nhập kho

Status: PASS with validation-contract warning.

Evidence:

* `InventoryService.createTransaction()` normalizes inbound lines to positive quantity.
* `assertInboundStorageLocations()` rejects positive IMPORT lines without `zoneId`, `slotId`, or `level`.
* Transaction write updates:
  * `inventory_transactions`
  * `inventory_transaction_items`
  * `inventory_items.quantity`
  * `inventory_location_stocks`
  * realtime event
  * persistent inventory events/outbox

Warning:

* `InventoryController.createTransaction()` accepts raw `@Body() any`.
* `createTransactionSchema` is not applied to this endpoint.
* `createTransactionSchema.items[]` does not include line-level location or valuation fields.

## Xuất kho

Status: PASS.

Evidence:

* EXPORT lines are signed negative.
* Selected bucket stock is checked when location data exists.
* Total material stock is checked when no location is supplied.
* Location stock is decremented and non-positive rows are removed by repository behavior.

## Điều chuyển

Status: PASS.

Evidence:

* Transfer uses transaction items and location stock movement.
* Existing pages expose transfer detail, routes, and source/destination location analytics.

## Điều chỉnh

Status: PASS with workflow warning.

Evidence:

* Adjustment posts through `TransactionType.ADJUSTMENT`.
* Adjustment events are published through Inventory event service.

Warning:

* Formal approval workflow for adjustments is not present.

## Kiểm kê

Status: PARTIAL.

Evidence:

* Stocktake UI and adjustment preview exist.
* Backend emits stocktake-related event when transaction type code/payload indicates stock.

Gap:

* First-class stocktake session lifecycle is not confirmed as complete.
* Stocktake currently depends on transaction markers and adjustment semantics.

## Trả vật tư

Status: PARTIAL but operational.

Evidence:

* Return request creation validates project return availability.
* Receive creates `TransactionType.RETURN` with `PROJECT_RETURN_RECEIVED`.
* Receive updates Project task material allocations.
* Reject creates activity log and return rejected event.

Current data:

```text
Return requests: 2
RECEIVED: 1
CANCELLED: 1
Pending quantity: 0
Received quantity: 1111
```

Warning:

* Business label says Rejected, enum/status path currently stores cancelled.
* Acceptance/disposition reporting needs operator validation.

## Snapshot / Background Flow

Status: PASS with parity warning.

Inventory transaction and return flows publish events and request snapshot updates through the platform foundation.

Blocking warning:

* Material snapshot parity has 3 mismatches in current database.

## Result

Workflow validation: BLOCKED for Business Freeze due to stocktake lifecycle and material snapshot parity, not because core transaction flows are broken.
