# PROCUREMENT.SCHEMA.1 - Canonical Purchasing Data Model

Date: 2026-08-11  
Status: **IMPLEMENTED AND DEPLOYED**

## Scope

This sprint changes only the Prisma data model and its additive PostgreSQL
migration. It does not implement Purchasing services, controllers, UI, Receipt
posting or lifecycle commands.

## Current Schema Audit

### Supplier

`Supplier` is the canonical supplier master and uses a UUID primary key. Before
this sprint, Purchase Order stored only `supplierName`, so Supplier identity was
not preserved.

### MaterialRequest / MaterialRequestItem

The existing `material_requests` tables are retained as the Purchase Request
storage foundation. Existing lines identify material through free-text
`itemName`; there was no Material Master foreign key.

### PurchaseOrder / PurchaseOrderItem

The existing PO tables are retained. Legacy header identity uses
`supplierName`, `projectName` and `requestedBy`. Legacy lines use `itemName` and
`quantity`. No Request, Supplier, Material, UOM, Warehouse or approving User
relations existed.

### PurchaseReceiving

`PurchaseReceiving` contains string `supplierId` and `materialId` values but no
declared relations and no PO/Inventory transaction lineage. Its service is not
registered as a canonical runtime module. The table is retained unchanged and
documented as a legacy candidate.

### InventoryTransaction

Inventory transactions already contain `supplierId`, `referenceModule` and
`referenceId`. These fields are sufficient for future canonical Receipt
posting:

```text
referenceModule = PURCHASE_ORDER
referenceId     = PurchaseOrder.id
supplierId      = PurchaseOrder.supplierId
```

No Inventory schema or behavior changed.

### ActivityLog

ActivityLog keeps generic `action`, `entity`, `module` and JSON metadata. It had
no constrained Purchasing event vocabulary.

### Current Text/Hardcoded Consumers

- `PurchaseOrdersController` writes `supplierName` and PO line `itemName` from
  untyped request bodies.
- Dashboard activity/notifications render `PurchaseOrder.supplierName`.
- Operational sample data seeds name-only purchase orders.
- `/procurement` renders hardcoded Purchase Order rows.
- Supplier purchase-order/delivery tabs contain hardcoded fallback datasets.
- PurchaseReceiving service accepts free string supplier/material identities.

These consumers were audited but not changed in this schema-only sprint.

## Target Schema

### Purchase Order Lifecycle

`PurchaseOrderStatus` now supports:

- `DRAFT`
- `SUBMITTED`
- `PENDING` (legacy compatibility)
- `APPROVED`
- `PARTIALLY_RECEIVED`
- `COMPLETED`
- `CANCELLED`

No status transition logic was added.

### MaterialRequestItem

| Field | Type | Rule |
|---|---|---|
| `materialId` | `String?` | Nullable FK to `InventoryItem.id` |

Legacy `itemName`, `quantity` and `unit` remain unchanged. Indexes now cover
`requestId` and `materialId`.

### PurchaseOrder Header

| Field | Type | Relation/Meaning |
|---|---|---|
| `supplierId` | `String?` | Canonical `Supplier` identity |
| `materialRequestId` | `String?` | Source Purchase Request |
| `requestedById` | `String?` | Requesting `User` |
| `approvedById` | `String?` | Approving `User` |
| `submittedAt` | `DateTime?` | Submission timestamp |
| `approvedAt` | `DateTime?` | Approval timestamp |
| `expectedDeliveryDate` | `DateTime?` | Header delivery commitment |

Legacy `supplierName` and `requestedBy` remain required for backward
compatibility. Optional FKs use `ON DELETE SET NULL` so master deactivation or
controlled deletion does not destroy historical PO records.

### PurchaseOrderItem

| Field | Type | Meaning |
|---|---|---|
| `materialId` | `String?` | Canonical Material Master identity |
| `uomId` | `String?` | Canonical Master Unit identity |
| `warehouseId` | `String?` | Planned receiving warehouse |
| `requestedQty` | `Float?` | Requested quantity |
| `orderedQty` | `Float?` | Ordered quantity |
| `receivedQty` | `Float?` | Accepted received quantity |
| `rejectedQty` | `Float?` | Rejected quantity |
| `remainingQty` | `Float?` | Remaining receivable quantity |
| `discount` | `Float?` | Discount value/rate contract for later domain sprint |
| `tax` | `Float?` | Tax value/rate contract for later domain sprint |
| `amount` | `Float?` | Canonical line amount |
| `expectedDate` | `DateTime?` | Line delivery date |

Existing `quantity`, `unitPrice` and `totalPrice` remain unchanged. Material,
UOM and Warehouse relations use `ON DELETE RESTRICT` to protect referenced
master data.

### Activity Events

The optional `ProcurementActivityEvent` field supports:

- `PURCHASE_REQUEST_CREATED`
- `PURCHASE_REQUEST_APPROVED`
- `PURCHASE_ORDER_CREATED`
- `PURCHASE_ORDER_APPROVED`
- `PURCHASE_ORDER_CANCELLED`
- `PURCHASE_RECEIVED`
- `SUPPLIER_RETURN`

No event-writing logic was implemented. Existing ActivityLog rows remain valid
with `procurementEvent = NULL`.

## ER Diagram

```text
Supplier
  | 1
  |<------------------------------ PurchaseOrder.supplierId
  |                                 |
  |                                 | *
MaterialRequest                     PurchaseOrderItem
  | 1                               |  |  |  |
  |                                 |  |  |  +--> MasterWarehouse
  +----< MaterialRequestItem        |  |  +-----> MasterUnit
  |          |                      |  +--------> InventoryItem
  |          +--> InventoryItem     |
  |                                 +--> InventoryTransaction
  +------------< PurchaseOrder           referenceModule=PURCHASE_ORDER
                                          referenceId=PurchaseOrder.id
                                                   |
                                                   +--> InventoryTransactionItem
                                                          |
                                                          +--> InventoryLocationStock
                                                                 |
                                                                 +--> Production
                                                                        |
                                                                        +--> ComponentInstance
```

`InventoryTransaction.referenceId` remains intentionally polymorphic; Prisma
does not declare a direct FK from it to PurchaseOrder.

## Indexes

- Request lines: `requestId`, `materialId`.
- PO headers: `supplierId`, `materialRequestId`, `requestedById`,
  `approvedById`, and `(status, expectedDeliveryDate)`.
- PO lines: `purchaseOrderId`, `materialId`, `uomId`, `warehouseId`, and
  `(purchaseOrderId, materialId)`.
- ActivityLog: `(procurementEvent, createdAt DESC)`.

The standalone PO-line `purchaseOrderId` index supports relation joins and
cascade-free parent lookups; the composite index supports line lookup by order
and material.

## Compatibility

- All new columns are nullable.
- Existing text identity fields remain present.
- Existing `PENDING` enum value remains valid.
- Existing PO controller payloads still compile.
- Existing PO-line FK delete behavior remains unchanged.
- Supplier uses UUID while PO remains CUID; the nullable FK scalar is `String`
  on both sides and is type-compatible in Prisma/PostgreSQL.
- No legacy data was matched by supplier/material name.
- PurchaseReceiving remains available to existing callers.
- InventoryTransaction and InventoryLocationStock were not modified.

## Migration Strategy

Migration:
`20260811103000_canonical_procurement_schema`

Operations performed:

1. Add two PO status enum values.
2. Create Procurement Activity event enum.
3. Add nullable columns.
4. Backfill only deterministic aliases:
   - `orderedQty = quantity`
   - `amount = totalPrice`
5. Add indexes.
6. Add nullable foreign keys.

The SQL contains no table/column DROP, TRUNCATE, DELETE or RENAME operation.
`ON DELETE` clauses are FK referential actions only.

Historical `supplierId`, `materialId`, receipt/rejection quantities and
remaining quantities were not backfilled because runtime identity cannot be
proven from free-text values.

## Runtime Certification

After deployment:

```text
Supplier                 1
MaterialRequest          0
MaterialRequestItem      0
PurchaseOrder            0
PurchaseOrderItem        0
PurchaseReceiving        0
InventoryTransaction     2
ActivityLog            367
```

PO lines with null deterministic backfill values: `0`.

There were no historical PR/PO rows requiring identity conversion. The first
parallel read probe hit PostgreSQL's existing connection ceiling; the same
certification passed using one sequential read-only transaction.

## Certification

| Gate | Result |
|---|---|
| Prisma format | PASS |
| Prisma validate | PASS |
| Prisma generate | PASS, 6.19.3 |
| Migration deploy | PASS |
| Migration status | PASS, 92 migrations, up to date |
| Backend build | PASS |
| Frontend | Not run; explicitly out of scope |

A full datasource-to-datamodel drift check still reports pre-existing drift in
Warehouse, WorkOrder, Component, Project and backup-table objects. After
removing an unintended PO-line cascade declaration from the datamodel, no
Procurement-specific behavior drift remains. Baseline drift must be handled in
a separate database reliability sprint.

## Future Domain Sprint Dependencies

1. Implement typed DTO/service/repository/controller for Purchase Request and
   Purchase Order; remove direct Prisma access from the legacy controller.
2. Require canonical Supplier and Material IDs for new writes while retaining
   text snapshots for legacy reads.
3. Implement lifecycle guards for submit, approve, partial receipt, completion
   and cancellation.
4. Implement Inventory-owned Receipt against approved PO lines using
   `referenceModule/referenceId`; do not write PurchaseReceiving as a second
   stock ledger.
5. Define discount/tax units before calculations are implemented.
6. Derive received/rejected/remaining quantities transactionally from canonical
   receipt events and protect against over-receipt.
7. Add Procurement RBAC and ActivityLog event emission in the workflow sprint.
8. Replace hardcoded Procurement/Supplier purchasing UI datasets only after the
   canonical read APIs exist.

