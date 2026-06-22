# Production Decisions

## PROD-001: Production Warehouse Is Separate From Main Warehouse

Decision:

- Production material stock is managed under `PRODUCTION` / `Kho sản xuất`, separate from `MAIN` / `Kho chính`.

Rationale:

- Materials issued to production must be isolated from general warehouse stock before they are consumed by Manufacturing Orders.

Implications:

- BOM material selection and availability checks use production warehouse stock.
- Main warehouse transfer does not operate on production warehouse locations.

## PROD-002: BOM Validation Uses Production Warehouse Stock

Decision:

- BOM creation validates required quantity plus waste against real available `Kho vật tư SX` stock.

Rationale:

- Production should not create BOM demand that cannot be supplied from staged production material.

Current implementation:

- Backend BOM service scans production-tagged Inventory transactions and only counts lines assigned to the production warehouse.

## PROD-003: Manufacturing Order Start Auto-Issues Missing BOM Materials

Decision:

- Starting an MO auto-creates `ISSUED` ProductionMaterialIssue rows for missing BOM material quantities.

Rationale:

- Material consumption must reduce production warehouse stock when production starts.

Current implementation:

- MO start plans issue quantities before the state transition and creates issue rows only after the start transition succeeds.
- Auto-issued materials also create outbound Inventory movements from the production warehouse location.

## PROD-004: Production Stock Calculation Filters Production Warehouse Lines

Decision:

- Production material balance only counts transaction lines that belong to the production warehouse.

Rationale:

- Historical `[COMPONENT_PRODUCTION]` transfer documents may include both main-warehouse outbound and production-warehouse inbound lines; counting both would distort availability.

Current implementation:

- Production services detect production lines by `warehouse.code === 'PRODUCTION'` or warehouse name containing `sản xuất`.

## PROD-005: QC Gate Required Before Yard Staging

Decision:

- Finished components cannot be staged to Yard unless linked QC inspection is `PASSED` or `APPROVED`.

Rationale:

- Yard staging should represent released finished goods, not unverified production output.

Current implementation:

- `POST /production/:id/stage-to-yard` enforces the linked QC status gate.

## PROD-006: Production Reservation Does Not Move Stock

Decision:

- Production reservation is a planning lock only. It does not create Inventory outbound movements and does not decrement stock.

Rationale:

- Inventory must remain the audited stock movement system. Reservation explains intent and protects production warehouse availability before issue.

Current implementation:

- `ProductionMaterialReservation` and `ProductionMaterialReservationLine` persist reservation state.
- Reservation preview validates BOM required quantity plus waste and MO quantity against production warehouse stock minus active reservations.
- Reservation allocation is stored by `warehouseId + zoneId + slotId + level`.
- Active reservation statuses are `RESERVED` and `PARTIALLY_ISSUED`.

Implications:

- Inventory outbound must occur only when the future material issue posting workflow runs.
- Reservation lines should be linked to future issue lines so `issuedQty` and remaining reservation can be tracked.

## PROD-007: Costing Builds From Production Actuals

Decision:

- Finished-component costing must build from production actuals rather than static BOM estimates alone.

Rationale:

- BOM estimates explain planned material demand. Actual cost must use material actually consumed or scrapped during Production.

Current implementation:

- Sprint 5 adds `ComponentCosting` as the persisted component costing breakdown.
- Material actual cost is calculated from `ProductionMaterialConsumption`.
- Labor, machine, overhead, QC rework, and Yard handling are currently zero/future inputs.

## PROD-008: Production Material Ledger Explains Production Intent

Decision:

- Production material ledger records production-side material intent and lifecycle events, but does not replace Inventory transactions.

Rationale:

- Inventory remains the audited stock movement system. Production needs its own ledger to explain reservation, release, future issue, return, consume, and adjustment events by MO, reservation, material, and location.

Current implementation:

- `ProductionMaterialLedger` stores `productionOrderId`, optional `reservationId`, `inventoryItemId`, `warehouseId`, `zoneId`, `slotId`, `level`, signed `quantity`, `eventType`, `eventDate`, `remark`, and `createdBy`.
- Supported event enum values are `RESERVE`, `RELEASE`, `ISSUE`, `RETURN`, `CONSUME`, and `ADJUST`.
- Sprint 2 writes ledger rows for reservation create/reserve/release/expire.
- Release and expire write `RELEASE` events with negative quantities.
- Sprint 3 writes `ISSUE` and `RETURN` events when material is issued from or returned to a reservation.
- Sprint 4 writes `CONSUME` events when actual production material consumption or scrap is posted.

Implications:

- Future material adjustment flows must write ledger rows in the same model.
- Inventory stock movement still requires Inventory transactions, especially for posted issue and return documents.

## PROD-009: Production Issue And Return Use Reservation Lines

Decision:

- Production material issue must be created from active reservation lines.
- Returns must be created from issued material issue rows.
- Returned unused material is received back into `MAIN` / `Kho chính`; the original issue already reduced `PRODUCTION` / `Kho vật tư SX` stock.

Rationale:

- Reservation lines carry the approved material, warehouse, zone, slot, and level allocation. Issue and return must preserve that location traceability and prevent over-issue/over-return.
- After issue, consumed and scrap quantities are production-side usage records, not additional Inventory decrements. Only the unconsumed remainder is returnable to Main Warehouse.

Current implementation:

- `POST /production/reservations/:id/issue` issues remaining reserved quantities or requested reservation line quantities.
- Issue validates `issuedQty <= reservedQty - issuedQty + returnedQty`.
- Issue validates exact `inventory_location_stocks` bucket before reducing stock.
- `POST /production/material-issues/:id/return` validates against the aggregate MO/material balance:
  `returnQty <= issuedQty - consumedQty - scrapQty - returnedQty`.
- Return creates an Inventory `RETURN` transaction into Main Warehouse and adds stock to the selected/default main warehouse bucket.
- Direct `PATCH /production/material-issues/:id` status changes to `RETURNED` are routed through the same return validation instead of the legacy stock movement path.
- Both flows update reservation line balances and write Production Material Ledger rows.

Implications:

- Future manual issue UI should still select reservation lines or explicitly create a reservation first.
- Generic stock mutation remains disallowed; Inventory location stock must not become negative.
- Production return smoke tests should verify:
  `Issued = Consumed + Scrap + Returned` for closed issue material.

## PROD-010: Component Output Requires Production Context

Decision:

- Production output component creation must require a valid Manufacturing Order with issued material.

Rationale:

- A finished/ready component should not appear from Production without material execution evidence.

Current implementation:

- `POST /production/:id/component` updates the linked component to `READY` or creates/links a component if missing.
- The endpoint rejects MOs whose net issued material quantity is zero.

## PROD-011: Production Consumption Tracks Actual Usage After Issue

Decision:

- Production material consumption is recorded after issue and does not mutate Inventory stock again.

Rationale:

- Inventory stock was already reduced at issue time. Consumption explains actual usage and scrap inside Production, while return restores only unused issued material to Main Warehouse.

Current implementation:

- `ProductionMaterialConsumption` stores `productionOrderId`, `inventoryItemId`, issued snapshot, consumed quantity, scrap quantity, returned snapshot, remark, actor, and creation time.
- `POST /production/:id/consume` validates against issued material for the same MO/material.
- Validation enforces:
  consumed quantity cannot exceed net issued quantity;
  scrap quantity cannot exceed remaining quantity;
  returned plus consumed plus scrap cannot exceed issued quantity.
- Posting consumption writes `ProductionMaterialLedger` rows with event type `CONSUME`, allocated across issued material location buckets.

Implications:

- Consumption is the basis for future component costing.
- Production adjustments remain a separate future workflow and should use `ADJUST` ledger events.

## PROD-012: Component Costing Uses Consumption Times Inventory Average Cost

Decision:

- Component actual material cost is calculated as:
  `(consumedQty + scrapQty) * inventory average cost`.

Rationale:

- Consumed quantity and scrap quantity are both material used by the Manufacturing Order.
- Inventory average cost is already the operational cost basis for material valuation.

Current implementation:

- `POST /components/:id/costing/recalculate` selects the latest Production Order for the Component.
- The endpoint requires that the Component has a Production Order and that the selected Production Order has `ProductionMaterialConsumption` rows.
- Inventory average cost is calculated from positive inbound `InventoryTransactionItem` quantity/value:
  inbound value divided by inbound quantity.
- Recalculation upserts `ComponentCosting`, updates `Component.estimatedCost` and `Component.actualCost`, and writes an ActivityLog row.

Implications:

- Project component Actual Cost reads the synchronized `Component.actualCost`.
- Future labor, machine, overhead, QC rework, and Yard handling cost should extend `ComponentCosting` rather than replacing the material-cost formula.

## PROD-013: Costing Engine Read Models Do Not Mutate Workflow State

Decision:

- Sprint 20A Costing Engine exposes read-only cost summaries for Production Orders, Components, and Projects.
- These summaries do not overwrite `ComponentCosting`, `Component.actualCost`, Inventory transactions, Production issues, or workflow status.

Rationale:

- Operators need a reliable cost aggregation layer before adding costing UI and project cost control.
- Read models allow verification against real Inventory transaction valuation without changing closed production or inventory records.

Current implementation:

- `GET /production/orders/:id/cost` calculates Production Order material cost from Production Material Issues.
- `GET /components/:id/cost` aggregates linked Production Order cost summaries for the Component.
- `GET /projects/:id/cost` aggregates project-linked Components and direct project Production Orders.
- Material cost uses actual Production Material Issue Inventory `EXPORT` transaction items when available:
  `SUM(abs(quantity) * unitPrice)` or persisted `totalAmount`.
- If issue transaction valuation is missing, the engine falls back to weighted average Inventory cost from positive `inventory_transaction_items` quantity/value rows.

Implications:

- Sprint 20B should compare this read model with persisted `ComponentCosting` and decide what should become the official accounting snapshot.
- Sprint 20C should build Project Cost Control on the read model first, then add persisted project cost snapshots only after variance rules are approved.
