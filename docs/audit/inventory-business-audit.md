# Inventory Business Audit

Date: 2026-07-08

## Scope

EPIC117 audits Inventory business readiness before Business Freeze.

Reviewed workspaces:

| Workspace | Status | Notes |
| --- | --- | --- |
| Tổng quan kho | Partial | Real data cockpit exists. Requires snapshot parity cleanup before freeze. |
| Giao dịch | Complete | Transaction list/detail exists, attachment display exists, values aggregate from transaction lines. |
| Phiếu trả vật tư | Partial | Requested/received/rejected lifecycle works. Acceptance/disposition UX and reporting should be validated with operators. |
| Vật tư & Tồn kho | Partial | Main/production/total stock columns exist. Material snapshot parity has 3 mismatches in current DB. |
| Vị trí kho | Complete with warning | Location snapshot quantity equals live location stock quantity in current DB. Some older UI modal wrappers remain visual debt but not business blockers. |
| Nhập kho | Complete with warning | Backend rejects inbound without Zone/Slot/Level; controller DTO contract does not formally include per-line location fields. |
| Xuất kho | Complete | Stock check prevents negative stock at selected location or material total. |
| Điều chuyển | Complete | Transfer route exists and uses transaction/location stock flow. |
| Kiểm kê | Partial | Stocktake uses adjustment/transaction markers; first-class stocktake session lifecycle is still not complete. |
| Điều chỉnh | Complete with warning | Adjustment posts through transaction flow; reason/audit metadata should be validated with operators. |
| Cảnh báo | Partial | Low/out rules exist from MAIN stock. Missing report-grade exception queues for negative stock, slow-moving stock, and aging. |

## Business Workflows

### Nhập kho

Current flow:

```text
Inbound request
-> InventoryService.createTransaction()
-> InventoryRepository
-> inventory_transactions / inventory_transaction_items
-> inventory_items.quantity compatibility snapshot
-> inventory_location_stocks
-> InventoryEventService
-> Outbox / Background snapshot request
-> Material Detail / Dashboard fallback or snapshot reads
```

Status: complete enough for operation.

Gap:

* `InventoryController.createTransaction()` accepts `@Body() any`; `createTransactionSchema` is not attached to the controller.
* `createTransactionSchema.items[]` currently lists only `inventoryItemId` and `quantity`, while real inbound lines require `warehouseId`, `zoneId`, `slotId`, `level`, `unitPrice`, and `totalAmount`.
* Service-level validation is active and blocks missing inbound locations, but API contract validation is not formally hardened.

### Xuất kho

Current flow:

```text
Outbound request
-> signed negative transaction line
-> total or bucket stock check
-> transaction write
-> location stock decrement/delete
-> event/outbox
```

Status: complete.

Gap:

* Formal allocation/reservation approval is outside current Inventory freeze scope and belongs to Production/Projects/Logistics integration.

### Điều chuyển

Current flow:

```text
Transfer request
-> signed transaction lines
-> location stock decrement/increment
-> event/outbox
-> snapshots
```

Status: complete.

Gap:

* Transfer-specific approval and transfer document reporting remain Phase 2.

### Kiểm kê

Current implementation uses Inventory transaction semantics and stocktake markers.

Status: partial.

Gap:

* No first-class stocktake session approval lifecycle was found in the current audit.
* Stocktake event emission uses transaction payload/type markers.

### Điều chỉnh

Status: complete enough for current operation.

Gap:

* Adjustment reason/reporting should be validated against operator expectations.
* Adjustment approval workflow is not present.

### Trả vật tư

Current flow:

```text
Requested
-> Approved or Received
-> Inventory RETURN transaction on received site return
-> Project allocation reconciliation
-> ActivityLog
-> Inventory events
```

Status: partial but operational.

Current DB:

```text
Return Requests: 2
RECEIVED: 1
CANCELLED: 1
Pending quantity: 0
Received quantity: 1111
```

Gaps:

* `REJECTED` is represented by `CANCELLED` status in current enum/status behavior.
* Formal accepted/rejected reporting needs business-language cleanup before Business Freeze.
* Photos/evidence are not part of the return lifecycle acceptance criteria yet.

## Data Quality Evidence

Read-only audit result from the current database:

```text
Inventory items: 23
Inventory transactions: 74
Inventory transaction items: 78
Location stock buckets: 51
Inventory material snapshots: 48
Inventory location snapshots: 50
Inventory dashboard snapshots: 4
Negative location stocks: 0
Item snapshot mismatch count: 0
Location bucket mismatch count: 0
Transaction items missing valuation: 0
Transaction items with zero valuation: 0
```

Transaction type counts:

```text
IMPORT: 48
EXPORT: 20
TRANSFER: 4
ADJUSTMENT: 1
RETURN: 1
```

## Business Gap Report

### Complete

* Transaction-first stock movement.
* Line valuation persisted for all audited transaction items.
* Location stock quantity equals transaction-derived bucket quantity.
* `inventory_items.quantity` compatibility snapshot equals location stock total.
* MAIN warehouse stock rule is implemented in Inventory Overview and Materials.
* Return request creation/receive/reject paths exist.
* Operations Center has Inventory platform health.

### P0 Before Business Freeze

1. Reconcile Material Snapshot parity.
   * Current DB has 3 material snapshot mismatches.
   * Material Detail can still fallback, but Business Freeze requires no mismatch between snapshot and live source.

2. Formalize inbound transaction DTO validation.
   * Service-level validation works.
   * Controller-level Zod validation is not attached to `POST /inventory/transactions`.
   * DTO does not model per-line Zone/Slot/Level even though the business requires them.

3. Validate Stocktake lifecycle.
   * Current implementation uses transaction markers.
   * Business Freeze needs a decision: accept current adjustment-backed stocktake, or implement first-class stocktake sessions before freeze.

### P1 Phase 2

* Return request business labels: map rejected/cancelled semantics cleanly.
* Inventory reporting pages: inbound by day, outbound by day, stock by warehouse, stock by location.
* Inventory aging and slow-moving materials.
* Negative material/exception dashboard.
* Approval workflows for adjustment, stocktake, and returns.

### P2 Later

* Lot/batch tracking.
* Full immutable Inventory Ledger table separate from transaction items.
* Advanced warehouse optimization / slot recommendation.
* Dedicated report export center.

## Freeze Recommendation

Inventory Business Freeze: BLOCKED.

Reason:

* Snapshot/live parity is not clean: 3 material snapshot mismatches.
* API validation contract for inbound location requirement is not formal enough.
* Stocktake lifecycle is not yet confirmed as business-complete.

Estimated remaining work:

* 1 focused sprint for P0 parity + validation + stocktake decision.
