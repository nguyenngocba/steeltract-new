# Supplier Module

## Scope

Supplier Phase S1 implements Supplier Master Cockpit only.

Included:

* Supplier master CRUD.
* Supplier cockpit dashboard.
* Supplier detail workspace.
* Inventory-derived supplier usage.
* Inbound history by supplier.
* Read-only material history derived from inbound transactions.
* Read-only supplier score summary.
* Files placeholder for future document management.

Excluded in S1:

* Procurement.
* Purchase Orders.
* Contracts.
* Approval workflow.
* Supplier-Material persisted mapping.
* SupplierContact and Contract schema changes.

## Routes

* `/suppliers`

The existing route is retained and now renders the Supplier Master Cockpit.

## API

Existing:

* `GET /suppliers`
* `GET /suppliers/:id`
* `POST /suppliers`
* `PUT /suppliers/:id`

Added in S1:

* `GET /suppliers/cockpit/summary`
  Returns total suppliers, active/inactive counters, suppliers used in Inventory, top suppliers, recent suppliers, and most-used suppliers.

* `GET /suppliers/:id/cockpit`
  Returns supplier profile, inbound-derived materials, inbound history, and latest supplier-score ratings.

Related existing integration:

* `GET /supplier-score`
* Inventory transactions with `supplierId`.

## Implemented Features

* Replaced simple CRUD page with Supplier Master Cockpit.
* Added top-level Supplier module tabs:
  * Danh sách nhà cung cấp.
  * Đánh giá nhà cung cấp.
* KPI strip:
  * Total Suppliers.
  * Active Suppliers.
  * Inactive Suppliers.
  * Suppliers Used In Inventory.
* Filter bar with search and status filter placeholder.
* Main supplier table:
  * STT.
  * Supplier Code.
  * Supplier Name.
  * Contact.
  * Phone.
  * Email.
  * Status.
  * Created Date.
  * Actions.
* Right insight panel:
  * Top Suppliers.
  * Recent Suppliers.
  * Most Used Suppliers.
  * Placeholder analytics cards.
* Slide-over detail workspace.
* Detail tabs:
  * Overview.
  * Materials.
  * Inbound History.
  * Ratings.
  * Files.
* Materials tab is read-only and derived from inbound inventory transactions.
* Inbound History tab filters by supplier through backend cockpit detail.
* Ratings tab uses `supplier-score` data matched by supplier name.
* Files tab shows a placeholder for future Contract, Quotation, Catalogue, and CO/CQ documents.
* Supplier evaluation tab links:
  * Supplier master records.
  * Latest SupplierScore by supplier name.
  * Inventory usage count by supplierId.
* Supplier evaluation tab includes evaluation KPIs, filter bar, evaluation table, selected supplier scoring panel, trend chart, classification panel, and recent evaluation list.

## Remaining Features

* Add persisted Supplier-Material mapping.
* Add supplier status lifecycle when schema supports it.
* Add score history and rating events instead of latest score only.
* Add document upload and attachment links.
* Add contract, quotation, catalogue, and CO/CQ document types.
* Add spend analytics, delivery SLA, quality analytics, and material mix analytics.
* Add persisted supplier scoring events with evaluator, cycle, next review date, and criteria weights.
* Add direct route support for `/suppliers/:id` if deep-linking becomes required.

## Integration Points

* Inventory inbound transactions:
  Supplier usage, inbound history, material list, quantities, prices, and amounts are derived from Inventory transactions.
* Supplier Score:
  Quality, Delivery, Pricing, and Overall values are read from `supplier-score`.
* Future Procurement:
  Supplier cockpit is ready to link to PO, receiving, contracts, and approval workflow later, but none of those scopes are implemented in S1.
* Future Documents:
  Files tab is prepared for contracts, quotations, catalogues, and CO/CQ documents.
