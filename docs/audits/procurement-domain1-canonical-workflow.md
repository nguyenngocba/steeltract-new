# PROCUREMENT.DOMAIN.1 - Canonical Purchasing Business Workflow

Date: 2026-08-11  
Status: **IMPLEMENTED AND RUNTIME CERTIFIED**

## Architecture

```text
MaterialRequestsController / PurchaseOrdersController
  -> ProcurementService
  -> ProcurementRepository (Serializable transaction)
  -> MaterialRequest / PurchaseOrder

PurchaseOrder Receipt
  -> ProcurementService
  -> InventoryPostingService RECEIVE (same transaction)
  -> InventoryTransaction + InventoryTransactionItem
  -> InventoryItem quantity + InventoryLocationStock
  -> Inventory Outbox / stock event

Supplier Return
  -> Procurement facade
  -> existing ReturnWorkflowService
  -> InventoryService EXPORT
  -> Inventory balances / ActivityLog / Outbox
```

No `PurchaseReceiving` ledger, direct Procurement stock write, frontend
aggregation, schema change, or migration was introduced.

## Purchase Request

- Typed create/update/list DTOs use canonical Material IDs.
- Lifecycle is `DRAFT -> SUBMITTED -> APPROVED`, with separate `REJECTED` and
  `CANCELLED` terminals.
- Approval accepts only `SUBMITTED`; runtime proved approval of `DRAFT`
  returns HTTP 400.
- Requester/approver identities and lifecycle timestamps are persisted.
- Every transition is serialized under a row lock and writes ActivityLog in
  the same database transaction.

## Purchase Order

- New writes require `supplierId`, `materialId`, `uomId` and `warehouseId`.
- `supplierName` and `itemName` are compatibility snapshots only.
- A PO requires an approved Purchase Request.
- Aggregate quantity across all non-rejected/non-cancelled POs cannot exceed
  approved PR quantity. PR locking and Serializable transactions protect
  concurrent order creation.
- Lifecycle is `DRAFT -> SUBMITTED -> APPROVED -> PARTIALLY_RECEIVED ->
  COMPLETED`, with `REJECTED` and `CANCELLED` commands.
- Actor/timestamp/reason fields are populated by transition commands.

## Goods Receipt And Partial Receipt

- `POST /purchase-orders/:id/receipts` requires `Idempotency-Key`.
- Receipt and PO line/status updates commit in one Serializable transaction.
- Inventory is the only stock writer. The resulting document is:
  - `type = IMPORT`
  - `referenceModule = PURCHASE_ORDER`
  - `referenceId = PurchaseOrder.id`
- Supplied receipt date, unit price/value, Supplier, Warehouse and complete
  location bucket are retained on Inventory transaction lines.
- Over-receipt is rejected. Same key/same payload returns the original receipt;
  same key/different payload returns HTTP 409.

## Supplier Return

- Procurement exposes PO-scoped commands while delegating all stock behavior
  to the existing Inventory Return Workflow.
- Creation requires a source receipt belonging to the same PO and Supplier.
- Cumulative active returns cannot exceed the referenced receipt quantity.
- The return stores canonical PO and source receipt relations.
- At disposition, exact Warehouse/Zone/Slot/Level buckets are reconstructed
  from source receipt lines. This fixed the runtime defect where a return from
  a slotted receipt incorrectly checked a null slot.
- Final disposition posts one idempotent Inventory `EXPORT` with the
  `ReturnRequest` as transaction reference.

## API

### Purchase Requests

- `GET /material-requests`
- `GET /material-requests/:id`
- `POST /material-requests`
- `PATCH /material-requests/:id`
- `PATCH /material-requests/:id/submit`
- `PATCH /material-requests/:id/approve`
- `PATCH /material-requests/:id/reject`
- `PATCH /material-requests/:id/cancel`

### Purchase Orders

- `GET /purchase-orders`
- `GET /purchase-orders/:id`
- `POST /purchase-orders`
- `PATCH /purchase-orders/:id`
- `PATCH /purchase-orders/:id/submit|approve|reject|cancel`
- `POST /purchase-orders/:id/receipts`
- `POST /purchase-orders/:id/supplier-returns`
- `PATCH /purchase-orders/:id/supplier-returns/:returnId/approve|receive|inspect|dispose`

### Read Model

- `GET /procurement/workspace`
- Summary: open PR, open PO, pending receipt and receipt count.
- Supplier performance is grouped from canonical PO Supplier IDs, statuses and
  values. No fake data or frontend aggregation is used.

## RBAC

| Boundary | Permission |
|---|---|
| Read/list/workspace | `procurement.view` |
| PR create/edit/submit | `procurement.request.create` |
| PR approve/reject and PO approval decisions | `procurement.po.approve` |
| PO create/edit/submit | `procurement.po.create` |
| Receipt | `procurement.receipt` |
| Supplier Return commands | `procurement.return` |

Runtime evidence: anonymous request returned 401, `warehouse_demo` returned
403 for Procurement workspace, and Administrator access returned 200.

## Runtime Evidence

Controlled retained fixture:

- PR `PROC-DOM1-PR-20260811051751`: `APPROVED`.
- PO `PROC-DOM1-PO-20260811051751`: `COMPLETED`.
- Ordered/received/remaining: `100 / 100 / 0`.
- Receipts: `40`, `40`, `20`; statuses became `PARTIALLY_RECEIVED`,
  `PARTIALLY_RECEIVED`, `COMPLETED`.
- All three Inventory documents are `IMPORT` and reference the same PO.
- Receipt replay returned the same transaction ID; changed payload returned
  409.
- Supplier Return `HT-NCC-260811-00002`: `DISPOSED`.
- Supplier Return movement: `EXPORT -10`, source slot `PROC-DOM1`, level `L1`.
- Fixture stock delta: `+100 - 10 = +90` exactly.
- Final material snapshot equals summed location balances: `313 = 313`.

The first diagnostic fixture reached `INSPECTED` before exposing the missing
slot/level defect. It was retained rather than deleted directly because this
sprint prohibits bypassing domain services. The successful fixture proves the
corrected canonical path.

## ActivityLog Evidence

The certified fixture contains:

- `PURCHASE_REQUEST_CREATED`
- `PURCHASE_REQUEST_SUBMITTED`
- `PURCHASE_REQUEST_APPROVED`
- `PURCHASE_ORDER_CREATED`
- `PURCHASE_ORDER_SUBMITTED`
- `PURCHASE_ORDER_APPROVED`
- three `PURCHASE_RECEIVED` records
- `SUPPLIER_MATERIAL_RETURN_REQUESTED`
- `SUPPLIER_MATERIAL_RETURN_DISPOSED`

Procurement enum events are populated where defined; transition action names
preserve events whose enum vocabulary intentionally has no dedicated member.

## Verification

| Gate | Result |
|---|---|
| Prisma validate | PASS |
| Prisma migrate status | PASS - 93 migrations, database up to date |
| Targeted tests | PASS - 4 suites, 20 tests |
| Full backend tests | PASS - 96 suites, 327 tests |
| Backend build | PASS |
| Runtime REST | PASS |
| Inventory conservation | PASS |
| RBAC 401/403/authorized | PASS |
| ActivityLog | PASS |

Frontend was not run or changed because this is explicitly a backend-only
sprint.

## Remaining Warnings

- Repeated local application startups can exhaust the small PostgreSQL client
  limit while background workers are active. This did not invalidate the
  completed workflow but requires deployment pool/worker tuning.
- The diagnostic pre-fix Supplier Return remains `INSPECTED`; close it through
  REST when the runtime connection pool is available.
- Procurement UI is outside this sprint.

No stage or commit was performed.
