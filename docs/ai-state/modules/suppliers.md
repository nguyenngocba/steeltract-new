# Supplier & Purchasing Module

## Scope

This module covers the Supplier Master Registry, Supplier Evaluations, and the Purchasing & Procurement workflows (Purchase Requisitions, RFQs, Supplier Quotations, Purchase Orders, Goods Receipts, Approval Workflows, and Budget Controls).

## Current Status

* **Design**: 100% Completed (Approved Master Blueprint for Purchasing at [purchasing-blueprint.md](file:///opt/projects/steeltrack/docs/architecture/purchasing-blueprint.md)).
* **Implementation**:
  * Supplier Master: 55% (Supplier Master CRUD, Supplier Cockpit, and basic evaluation metrics are completed).
  * Purchasing & Procurement: 0% (Designed but not yet implemented; scheduled for the upcoming purchasing implementation sprints).

## Implemented Features (Supplier Master)

* Supplier master CRUD.
* Supplier cockpit dashboard.
* Supplier detail workspace (Overview, Materials, Inbound History, Ratings, Files).
* Inventory-derived supplier usage and inbound transaction history.
* Read-only supplier scorecard evaluation tab (linking SupplierScore by name and counts).
* Layout aligns with the shared cockpit WMS design.
* EPIC 5.0 aligns Supplier Overview/List and Quality with the enterprise UI
  canon: KPI-first, compact filter, paginated hero table, right analytics rail,
  bottom analytics and truthful empty capability workspaces for unavailable
  purchasing data.

## Database Models

The Purchasing blueprint defines the following data models to be added:

* `PurchaseRequest`: Internal purchase requisition (PR) details.
* `PurchaseRequestItem`: Individual material items requested.
* `RFQ`: Request for Quotation event metadata and deadlines.
* `SupplierQuotation`: Quotations submitted by suppliers for an RFQ.
* `SupplierQuotationItem`: Pricing and lead times per quotation item.
* `PurchaseOrder`: Official Purchase Order (PO) document.
* `PurchaseOrderItem`: Materials, ordered quantities, prices, and received progress.
* `GoodsReceipt`: Goods receipt (GR) record matching WMS inbound transactions.
* `GoodsReceiptItem`: Quantities received, accepted, and rejected per GR line.
* `PurchaseBudget`: Project-level budget limit checks.
* `ApprovalStep`: Dynamic multi-stage approval signature record.
* `SupplierPerformance`: Supplier evaluation rating per PO/GR transaction.

## API Endpoints

Designed endpoints in the blueprint include:

* `POST /purchasing/requests` - Create purchase requests
* `POST /purchasing/rfqs` - Create RFQs
* `POST /purchasing/quotations` - Submit quotation bids
* `POST /purchasing/orders` - Draft a new PO
* `POST /purchasing/orders/:id/approve` - Sign/approve a PO step
* `POST /purchasing/goods-receipts` - Receive goods against a PO

## Remaining Tasks (Phased Sprints)

* **Sprint 1**: Set up Prisma models and implement `PurchaseBudgetService` for project budget checking.
* **Sprint 2**: Implement RFQ creation and supplier quotation submissions APIs.
* **Sprint 3**: Build PO draft and dynamic multi-level approval workflow with budget validation checks.
* **Sprint 4**: Integrate Goods Receipt with WMS receiving transactions and trigger Supplier Performance calculations.
* **Sprint 5**: Build Purchasing Cockpit, implement background `snapshot.purchasing.rebuild` job, and wire AI quotation anomaly scorer.
