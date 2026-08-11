# Procurement

## Scope

Supplier-owned purchasing foundation from Purchase Request through Purchase
Order approval and Inventory-owned Goods Receipt.

## Implemented Features

- Canonical nullable Supplier, Material, UOM, Warehouse and User identity on
  existing purchasing tables.
- Purchase Request to Purchase Order lineage.
- Additive PO lifecycle vocabulary including submitted and partially received.
- Optional Procurement ActivityLog event vocabulary.
- InventoryTransaction reference contract reserved for future PO Receipt.
- Canonical Purchase Request lifecycle and requester/approval planning fields.
- PO rejection/cancellation audit identities and timestamps.
- Durable InventoryTransaction idempotency contract supporting N partial
  receipts for one Purchase Order without duplicate stock.
- Supplier Return lineage from ReturnRequest to Purchase Order and source
  receipt transaction.
- Six canonical `procurement.*` permissions, runtime-seeded for admin.
- Typed Controller -> Service -> Repository workflows for PR and PO.
- Atomic Inventory-owned partial receipt posting with exact replay protection.
- PO/source-receipt-bound Supplier Return through ReturnWorkflowService.
- Canonical Procurement workspace summary and Supplier performance read model.

## Database Models

- `Supplier`
- `MaterialRequest`
- `MaterialRequestItem`
- `PurchaseOrder`
- `PurchaseOrderItem`
- `InventoryTransaction` (authoritative receipt and return posting)
- `ReturnRequest` (canonical supplier-return lineage)
- `PurchaseReceiving` (legacy candidate, unchanged)

## API Endpoints

- Canonical `/material-requests` CRUD and lifecycle commands.
- Canonical `/purchase-orders` CRUD, lifecycle and partial receipt commands.
- PO-scoped Supplier Return create/approve/receive/inspect/dispose commands.
- `GET /procurement/workspace` authoritative summary/read model.

## Routes

- Backend domain is runtime certified. Frontend Procurement workspace remains a
  later sprint.

## Remaining Tasks

- Build the Procurement UI from these APIs without frontend-side aggregation.
- Tune PostgreSQL connection pooling/background worker concurrency from staging
  measurements.
- Close the retained diagnostic Supplier Return through REST.

Gate report: `docs/audits/procurement-gate1-canonical-approval.md`.
Domain report: `docs/audits/procurement-domain1-canonical-workflow.md`.
