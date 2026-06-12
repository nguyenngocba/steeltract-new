# Production Phase Next Design

Planning date: 2026-06-11

Implementation note:

- Sprint 1 Production Reservation was implemented on 2026-06-11.
- Implemented scope: reservation models, preview, create, reserve, release, expire, `/production/reservations`, and MO detail reservation preview/create action.
- Sprint 2 Production Material Ledger was implemented on 2026-06-11.
- Implemented Sprint 2 scope: `ProductionMaterialLedger`, ledger APIs, reservation lifecycle ledger writes, and `/production/material-ledger`.
- Sprint 3 Production Execution was implemented on 2026-06-11.
- Implemented Sprint 3 scope: issue-from-reservation, material return, exact production location stock updates, `ISSUE`/`RETURN` ledger writers, and production-context component creation.
- Not implemented yet: approval-oriented issue/return documents, consume/adjust ledger writers, and component costing.

Scope:

- Production Reservation workflow.
- Material Issue workflow.
- Material Return workflow.
- Production Material Ledger.
- Component Costing workflow.

Inputs:

- `docs/ai-state/audits/module-coverage-audit.md`
- `docs/ai-state/modules/production.md`
- `docs/ai-state/decisions/production-decisions.md`

Current baseline:

- Production warehouse is separate from main warehouse: `PRODUCTION` / `Kho sản xuất`.
- BOM validation uses production warehouse stock.
- MO start currently auto-issues missing BOM material quantities by creating `ProductionMaterialIssue` rows and outbound Inventory movements.
- Formal reservations, manual issue/return approvals, production-material ledger, and component costing are not yet implemented.

Design principle:

- Keep Inventory as the audited stock movement system.
- Add Production documents for reservation, issue, return, ledger, and costing so Production can explain why Inventory movements happened.
- Do not silently mutate material quantity. Use Inventory transactions for stock movement and Production ledgers/documents for production intent and traceability.

## 1. Production Reservation Workflow

Sprint 1 status: implemented.

Purpose:

- Reserve production warehouse material for a Manufacturing Order before production starts.
- Prevent another MO from consuming staged material that has already been planned.
- Replace derived reservation state with formal documents.

### Database Changes

Add `ProductionMaterialReservation`:

- `id`
- `reservationNo` unique
- `productionOrderId`
- `bomId`
- `status`: `DRAFT`, `RESERVED`, `PARTIALLY_ISSUED`, `ISSUED`, `CANCELLED`, `EXPIRED`
- `reservedBy`
- `reservedAt`
- `expiresAt`
- `releasedAt`
- `note`
- `createdAt`
- `updatedAt`

Add `ProductionMaterialReservationLine`:

- `id`
- `reservationId`
- `inventoryItemId`
- `bomItemId`
- `warehouseId`
- `zoneId`
- `slotId`
- `level`
- `requiredQty`
- `reservedQty`
- `issuedQty`
- `returnedQty`
- `status`: `OPEN`, `PARTIAL`, `FULFILLED`, `RELEASED`, `SHORTAGE`
- `createdAt`
- `updatedAt`

Recommended indexes:

- `productionOrderId`
- `reservationId`
- `inventoryItemId`
- `warehouseId, zoneId, slotId, level`
- `status`

Optional later:

- Add reservation references on `ProductionMaterialIssue` and future ledger rows.

### Backend APIs

Add reservation endpoints:

- `GET /production/reservations`
- `GET /production/reservations/:id`
- `POST /production/:id/reservations`
- `POST /production/reservations/:id/reserve`
- `POST /production/reservations/:id/release`
- `POST /production/reservations/:id/expire`
- `GET /production/:id/reservation-preview`

Behavior:

- Preview computes BOM required quantity with waste and MO quantity.
- Reserve validates available production warehouse stock minus existing active reservations.
- Reserve allocates by location bucket: `warehouseId + zoneId + slotId + level`.
- Release frees remaining reserved quantity.

### Frontend Pages

Add/extend:

- `/production/reservations`
- Reservation tab inside `ProductionPage`.
- Reservation detail drawer/modal on MO detail.
- Reservation preview in MO creation/start workflow.

UI elements:

- Required vs available vs already reserved.
- Location allocation table.
- Shortage badges.
- Actions: reserve, release, expire, create issue from reservation.

### Workflow Steps

1. Planner creates or opens an MO linked to a BOM.
2. System calculates required materials from BOM lines, waste percent, and MO quantity.
3. User opens reservation preview.
4. Backend checks `PRODUCTION` stock and subtracts active reservations.
5. User confirms reservation.
6. Backend creates reservation header and lines.
7. MO can start only when reservation is `RESERVED` or explicit override is approved.
8. Reservation lines are consumed by material issue workflow.
9. Remaining unissued reservation is released when MO completes, cancels, or is revised.

### Integration With Inventory

- Reservation does not move stock.
- Reservation uses Inventory production warehouse location balances as availability input.
- Inventory outbound occurs only when issue is posted.
- If Inventory stock changes independently, reservation preview should detect shortages before issue.

## 2. Material Issue Workflow

Sprint 3 status: basic issue-from-reservation implemented.

Purpose:

- Formalize production material issue as a document-driven workflow.
- Support manual issue, partial issue, issue approval, and issue from reservation.

### Database Changes

Extend `ProductionMaterialIssue` or add issue header/line split.

Preferred next schema:

Add `ProductionMaterialIssueDocument`:

- `id`
- `issueNo` unique
- `productionOrderId`
- `reservationId`
- `status`: `DRAFT`, `PENDING_APPROVAL`, `APPROVED`, `ISSUED`, `CANCELLED`
- `requestedBy`
- `approvedBy`
- `issuedBy`
- `requestedAt`
- `approvedAt`
- `issuedAt`
- `note`
- `inventoryTransactionId`
- `createdAt`
- `updatedAt`

Add `ProductionMaterialIssueLine`:

- `id`
- `issueDocumentId`
- `reservationLineId`
- `inventoryItemId`
- `warehouseId`
- `zoneId`
- `slotId`
- `level`
- `requestedQty`
- `approvedQty`
- `issuedQty`
- `unitCostSnapshot`
- `createdAt`
- `updatedAt`

Compatibility:

- Existing `ProductionMaterialIssue` can either be migrated into header/line structure or retained as a denormalized compatibility view/table during transition.

### Backend APIs

Add issue endpoints:

- `GET /production/material-issues`
- `GET /production/material-issues/:id`
- `POST /production/:id/material-issues`
- `POST /production/material-issues/from-reservation/:reservationId`
- `POST /production/reservations/:id/issue`
- `PATCH /production/material-issues/:id`
- `POST /production/material-issues/:id/submit`
- `POST /production/material-issues/:id/approve`
- `POST /production/material-issues/:id/issue`
- `POST /production/material-issues/:id/cancel`

Posting issue:

- Validates reservation if provided.
- Validates production warehouse location stock.
- Creates Inventory transaction:
  - Type/intent: production consumption/outbound.
  - Negative line from `PRODUCTION` warehouse location.
  - Reference to production order and issue document.
- Writes production material ledger rows.
- Updates reservation line `issuedQty`.

### Frontend Pages

Add/extend:

- `/production/material-issues`
- Issue creation modal from MO detail.
- Issue detail drawer with approval timeline.
- Location selector using production warehouse stock buckets.

UI elements:

- Reservation coverage.
- Requested/approved/issued quantities.
- Source zone/slot/level.
- Approval action bar.
- Inventory transaction link.

### Workflow Steps

1. User creates issue from reservation or manually from MO.
2. User selects material, quantity, and production warehouse location.
3. Document is saved as `DRAFT`.
4. User submits for approval if approval is required.
5. Approver approves quantities.
6. Warehouse/production user posts issue.
7. Backend creates Inventory outbound transaction and ledger rows.
8. Issue status becomes `ISSUED`.
9. MO material requirement view reflects issued quantity.

### Integration With Inventory

- Material issue is the Production intent document.
- Inventory transaction is the stock movement document.
- Issue posting must be atomic with Inventory transaction creation.
- If Inventory movement fails, issue must remain unposted or rollback.

## 3. Material Return Workflow

Sprint 3 status: basic return-from-issue implemented.

Purpose:

- Return unused production material from MO back to production warehouse stock or main warehouse according to business decision.
- Keep returned quantity linked to original issue and MO.

### Database Changes

Add `ProductionMaterialReturnDocument`:

- `id`
- `returnNo` unique
- `productionOrderId`
- `issueDocumentId`
- `status`: `DRAFT`, `PENDING_INSPECTION`, `APPROVED`, `RETURNED`, `SCRAPPED`, `CANCELLED`
- `returnedBy`
- `approvedBy`
- `returnedAt`
- `approvedAt`
- `reason`
- `inventoryTransactionId`
- `createdAt`
- `updatedAt`

Add `ProductionMaterialReturnLine`:

- `id`
- `returnDocumentId`
- `issueLineId`
- `inventoryItemId`
- `warehouseId`
- `zoneId`
- `slotId`
- `level`
- `returnQty`
- `acceptedQty`
- `scrapQty`
- `condition`: `GOOD`, `DAMAGED`, `SCRAP`, `REWORK`
- `unitCostSnapshot`
- `createdAt`
- `updatedAt`

### Backend APIs

Add return endpoints:

- `GET /production/material-returns`
- `GET /production/material-returns/:id`
- `POST /production/:id/material-returns`
- `POST /production/material-returns/from-issue/:issueId`
- `POST /production/material-issues/:id/return`
- `PATCH /production/material-returns/:id`
- `POST /production/material-returns/:id/inspect`
- `POST /production/material-returns/:id/approve`
- `POST /production/material-returns/:id/post`
- `POST /production/material-returns/:id/scrap`
- `POST /production/material-returns/:id/cancel`

Posting return:

- Validates return does not exceed issued minus already returned quantity.
- Creates Inventory transaction:
  - Positive line into selected warehouse/location for accepted quantity.
  - Optional scrap line or adjustment for scrapped quantity if Inventory tracks scrap.
- Writes ledger rows with `RETURN` or `SCRAP` movement type.
- Updates issue/reservation returned quantity.

### Frontend Pages

Add:

- `/production/material-returns`
- Return modal from material issue detail.
- Return inspection/condition panel.
- Return history tab in MO detail.

UI elements:

- Issued vs already returned vs returnable quantity.
- Condition selection.
- Destination warehouse/location selector.
- Inventory transaction link.

### Workflow Steps

1. User opens an issued material document or MO material tab.
2. User creates return from selected issue line.
3. Backend calculates returnable quantity.
4. User enters quantity, condition, and destination location.
5. Optional inspector confirms accepted/scrap quantities.
6. Approver approves return.
7. Backend posts Inventory inbound/adjustment transaction.
8. Return status becomes `RETURNED` or `SCRAPPED`.
9. Production material ledger and costing update.

### Integration With Inventory

- Accepted returns create positive Inventory transaction lines.
- Destination can be `PRODUCTION` warehouse by default.
- Return to `MAIN` warehouse should be explicit and may require separate approval.
- Scrapped quantity should not silently increase stock.

## 4. Production Material Ledger

Sprint 2 status: partially implemented.

Purpose:

- Provide auditable production material balance independent of derived transaction scans.
- Link reservation, issue, return, Inventory transaction, and costing.

### Database Changes

Implemented in Sprint 2: `ProductionMaterialLedger`:

- `id`
- `productionOrderId`
- `reservationId`
- `inventoryItemId`
- `warehouseId`
- `zoneId`
- `slotId`
- `level`
- `quantity`
- `eventType`: `RESERVE`, `RELEASE`, `ISSUE`, `RETURN`, `CONSUME`, `ADJUST`
- `eventDate`
- `remark`
- `createdBy`
- `createdAt`

Later extensions:

- Link issue, return, Inventory transaction, and Inventory transaction item IDs when those documents are implemented.
- Add cost snapshots and balance snapshots if costing/reconciliation require them.

Add optional `ProductionMaterialBalance`:

- `id`
- `inventoryItemId`
- `warehouseId`
- `zoneId`
- `slotId`
- `level`
- `productionOrderId` nullable
- `reservedQty`
- `issuedQty`
- `returnedQty`
- `availableQty`
- `updatedAt`

Ledger is source of production-material audit; balance is a performance snapshot.

### Backend APIs

Add ledger endpoints:

- `GET /production/material-ledger`
- `GET /production/:id/material-ledger`
- `GET /production/material-ledger/:id`

Future endpoints:

- `GET /production/material-balances`
- `POST /production/material-ledger/reconcile`

Ledger writes:

- Reservation creates `RESERVE` entries.
- Reservation release and expiry create signed `RELEASE` entries.
- Issue posting creates `ISSUE` entries.
- Return posting creates `RETURN` entries.
- Reconciliation compares production ledger to Inventory location stock and transaction history.

### Frontend Pages

Add:

- `/production/material-ledger`
- MO material ledger tab.
- Reconciliation panel for production warehouse material balances.

UI elements:

- Movement timeline.
- Material/location filters.
- Linked document chips.
- Balance by material/location.
- Reconciliation warnings.

### Workflow Steps

1. Every production material document posts ledger entries transactionally.
2. Ledger entries reference Inventory transaction items when stock movement occurs.
3. Balance snapshot updates after each entry.
4. Requirements endpoint reads ledger/balance instead of scanning raw transactions.
5. Reconciliation job verifies production balance against Inventory location stock.

### Integration With Inventory

- Inventory remains stock source for physical quantity.
- Production ledger explains production intent and consumption.
- Ledger entries reference Inventory transaction items for stock movement.
- Reconciliation flags divergence rather than silently correcting.

## 5. Component Costing Workflow

Purpose:

- Persist actual finished component cost from material issues, returns/scrap, labor, machine, overhead, QC rework, and Yard handling.

### Database Changes

Add `ComponentCosting`:

- `id`
- `componentId`
- `productionOrderId`
- `status`: `DRAFT`, `CALCULATED`, `APPROVED`, `LOCKED`, `REOPENED`
- `materialCost`
- `laborCost`
- `machineCost`
- `overheadCost`
- `qcReworkCost`
- `yardHandlingCost`
- `scrapCost`
- `totalCost`
- `unitCost`
- `calculatedAt`
- `approvedBy`
- `approvedAt`
- `lockedAt`
- `createdAt`
- `updatedAt`

Add `ComponentCostingLine`:

- `id`
- `costingId`
- `sourceType`: `MATERIAL_ISSUE`, `MATERIAL_RETURN`, `LABOR_LOG`, `MACHINE_LOG`, `OVERHEAD`, `QC_REWORK`, `YARD_HANDLING`, `SCRAP`
- `sourceId`
- `description`
- `quantity`
- `unitCost`
- `totalCost`
- `createdAt`

Optional:

- `ProductionLaborActual`
- `ProductionMachineActual`
- `ProductionOverheadRate`
- `QcReworkCost`
- `YardHandlingCost`

### Backend APIs

Add costing endpoints:

- `GET /production/:id/costing`
- `POST /production/:id/costing/calculate`
- `POST /production/:id/costing/approve`
- `POST /production/:id/costing/lock`
- `POST /production/:id/costing/reopen`
- `GET /components/:id/costing`

Calculation:

- Material cost from production material ledger `ISSUE - RETURN + SCRAP`.
- Labor/machine from production logs or future actual tables.
- QC rework from NCR/rework records when available.
- Yard handling from Yard movement/staging records when available.
- Overhead from configured rates.

### Frontend Pages

Add:

- Production costing tab in MO detail.
- Component costing page/tab.
- Costing approval drawer.
- Cost breakdown chart/table.

UI elements:

- Estimated BOM cost vs actual material cost.
- Labor/machine/overhead/QC/Yard cost groups.
- Linked source documents.
- Approve/lock/reopen actions.

### Workflow Steps

1. MO reaches completed or QC passed state.
2. User runs costing calculation.
3. Backend collects material ledger actuals and other cost inputs.
4. System creates costing header and lines.
5. User reviews differences between BOM estimate and actual.
6. Approver approves costing.
7. Costing locks after component release/shipment.
8. Dashboard/Components can show approved actual cost.

### Integration With Inventory

- Material cost uses Inventory-linked production material ledger entries.
- Unit cost snapshots should come from Inventory transaction items or accepted costing policy.
- Material returns reduce net consumed material cost when accepted back into stock.
- Scrap remains costed to production/component unless business policy says otherwise.

## Implementation Sequence

Recommended order:

1. Production Material Ledger schema and read APIs.
2. Reservation document schema and reservation APIs.
3. Issue document header/line workflow with Inventory posting.
4. Return document workflow with Inventory posting.
5. Requirements endpoint migration to ledger/balance.
6. Component costing schema and calculation APIs.
7. Frontend reservation/issue/return/ledger/costing pages.

## Non-Goals For This Phase

- Replacing Inventory as the physical stock system.
- Implementing full accounting/GL.
- Implementing advanced scheduling optimization.
- Implementing multi-company costing rules.
- Changing QC/Yard workflows except for reading their cost inputs.

## Open Questions

- Should accepted production returns default to `PRODUCTION` warehouse or allow return to `MAIN` with approval?
- Should reservations block MO start, warn only, or allow manager override?
- Should production issue approval be mandatory for all issues or only manual/non-reserved issues?
- What cost source should be authoritative for material unit cost: Inventory transaction item, moving average, FIFO layer, or BOM estimate fallback?
- Should component costing lock at QC approval, Yard staging, or final shipment?
