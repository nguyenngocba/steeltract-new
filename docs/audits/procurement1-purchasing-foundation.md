# PROCUREMENT.1 - Purchasing Foundation

Date: 2026-08-11  
Status: **SCHEMA GATE - IMPLEMENTATION NOT STARTED**

## Objective

Establish the canonical purchasing boundary:

```text
Purchasing
  -> Supplier Master
  -> Purchase Request
  -> Purchase Order
  -> Approval
Warehouse
  -> Goods Receipt against approved Purchase Order
  -> Inventory transaction and location balance
```

Warehouse users must not create Supplier master data. Supplier ownership remains
with Purchasing/Master Data. Receipt must select an approved Purchase Order and
derive Supplier from that order.

## Current Audit

### Supplier

- Canonical `Supplier` exists with UUID identity, code and name.
- Canonical Supplier CRUD exists under Master Data.
- Warehouse Operator currently cannot access Supplier administration. This is
  correct for the requested ownership boundary.

### Purchase Request

- Prisma contains legacy `MaterialRequest` and `MaterialRequestItem` tables.
- The request stores `projectName`, `requestedBy` and free-text `itemName`.
- Request lines do not reference `InventoryItem` Material Master.
- There is no active canonical Purchase Request controller/service/repository.

Classification: **PARTIAL / LEGACY**.

### Purchase Order

- Prisma contains `PurchaseOrder` and `PurchaseOrderItem`.
- `PurchaseOrder.supplierName` is free text and has no `supplierId` foreign key.
- `PurchaseOrderItem.itemName` is free text and has no `inventoryItemId`.
- The order has no Purchase Request lineage, expected delivery date or approval
  actor/timestamp.
- `PurchaseOrdersController` accesses Prisma directly, accepts `any`, validates
  neither lifecycle nor references, and is guarded only by JWT.

Classification: **REAL STORAGE / NON-CANONICAL CONTRACT**.

### Goods Receipt

- `PurchaseReceiving` stores one `supplierId`, `materialId` and quantity but has
  no relation to Purchase Order, Inventory transaction, warehouse or location.
- `PurchaseReceivingService` is not registered in an active module/controller.
- Inventory Receipt creates canonical Inventory transactions and location
  balances but currently receives Supplier directly from the user.
- Inventory transactions already provide `referenceModule`, `referenceId` and
  `supplierId`, which can carry PO lineage without duplicating stock logic.

Classification: **INVENTORY RECEIPT REAL / PURCHASING RECEIPT DEAD-PARTIAL**.

### Frontend

- `/procurement` exists but presents a large legacy hero and hardcoded PO rows.
- No real Purchase Request or Purchase Order forms are connected to APIs.
- Inventory Receipt exposes a manual Supplier picker.

Classification: **PLACEHOLDER / HARDCODED**.

## Why UI/API-Only Is Unsafe

Persisting a selected `supplierId` back into `supplierName` would lose canonical
identity. Supplier rename or duplicate names would break PO-to-Supplier lineage.
Similarly, material name matching cannot safely connect request/order lines to
Material Master. A Goods Receipt could visually show a PO while the database
has no authoritative PO/Supplier/Material relationship.

This would satisfy the screen flow but not the ERP domain requirement.

## Minimal Additive Schema Proposal

Reuse existing tables; do not create parallel Purchase Request/PO models.

### `MaterialRequest`

- Add `neededBy DateTime?`.
- Optionally add `projectId String?` only if Project linkage is required in V1.
- Retain `projectName` for legacy compatibility.

### `MaterialRequestItem`

- Add `inventoryItemId String?`.
- Add relation to `InventoryItem` with `onDelete: Restrict`.
- Add index on `inventoryItemId`.
- Retain `itemName` for existing records and display snapshots.

### `PurchaseOrder`

- Add `supplierId String?` with relation to canonical `Supplier`.
- Add `materialRequestId String?` with relation to `MaterialRequest`.
- Add `expectedDeliveryDate DateTime?`.
- Add `approvedBy String?` and `approvedAt DateTime?`.
- Add indexes on `supplierId`, `materialRequestId`, and
  `[status, expectedDeliveryDate]`.
- Keep `supplierName` for legacy records and immutable display snapshot.

### `PurchaseOrderItem`

- Add `inventoryItemId String?` with relation to `InventoryItem` and
  `onDelete: Restrict`.
- Add `unitId String?` with relation to `MasterUnit` where applicable.
- Add indexes on `inventoryItemId` and `purchaseOrderId`.
- Keep `itemName` for legacy records and order-line description.

### Goods Receipt

Do not create a second stock posting implementation. The authoritative receipt
remains an Inventory transaction created by Inventory's posting service:

```text
referenceModule = PURCHASE_ORDER
referenceId     = PurchaseOrder.id
supplierId      = PurchaseOrder.supplierId
```

`PurchaseReceiving` should be audited for controlled deprecation or converted
later into a receipt-header projection. It must not become a parallel inventory
ledger in this sprint.

## Migration Safety

- Additive and forward-only.
- Existing rows keep new foreign keys as `NULL`.
- No DROP, DELETE, TRUNCATE or blind name-based backfill.
- New API writes require canonical IDs.
- Legacy reads use typed FK first, then existing name snapshot.
- Migration SQL must be reviewed before deployment.

## Planned Application Architecture

```text
ProcurementController
  -> ProcurementService
     -> ProcurementRepository
        -> MaterialRequest / PurchaseOrder / Supplier / InventoryItem

Inventory Receipt UI
  -> approved Purchase Order picker
  -> Purchase Order detail (supplier and remaining lines)
  -> existing Inventory transaction command
  -> existing Inventory location-balance posting
```

Lifecycle rules:

- Purchase Request: `PENDING -> APPROVED | REJECTED` using existing approval
  vocabulary.
- Purchase Order: `DRAFT -> PENDING -> APPROVED -> COMPLETED`, with cancellation
  from non-completed states.
- Only `APPROVED` Purchase Orders are receivable.
- Receipt Supplier is always derived server-side from PO.
- Receipt material/quantity must be an order line and cannot exceed remaining
  quantity.
- Receipt does not alter Issue, Transfer or Count semantics.

## Authorization Plan

- Purchasing read/create/approve actions require canonical procurement
  permissions added additively to the existing permission catalog.
- Supplier create/edit remains outside Warehouse Operator permissions.
- Goods Receipt remains protected by `inventory.receive`.
- Backend guards remain authoritative; frontend gates only hide unavailable
  actions.

## Schema Gate

Approval is required before modifying Prisma or generating a migration.

Requested approval:

1. Extend existing `MaterialRequest`/`PurchaseOrder` models with the nullable
   canonical foreign keys and approval fields above.
2. Use Inventory transactions as the authoritative Goods Receipt posting and PO
   receipt lineage.
3. Leave `PurchaseReceiving` unchanged and unused pending a later deprecation
   decision.

No source code, Prisma schema or migration has been changed in this gate.
