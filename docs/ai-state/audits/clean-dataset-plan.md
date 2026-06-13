# Clean Dataset Plan

Date: 2026-06-12

Goal:

- Determine whether Sprint 8 audit findings come from legacy/demo/test data or active workflow defects.
- Prepare a clean operational dataset for one controlled end-to-end validation.
- Do not modify production code.
- Do not execute cleanup from this document without operator approval and a database backup.

## Operating Assumption

The current inconsistencies are likely mixed:

- Inventory reconciliation mismatches may come from legacy/demo transactions, direct seed data, and older workflow paths that predate `inventory_location_stocks`.
- Production ledger gaps may come from issue rows created before material ledger automation or from non-ledger issue paths.
- Component timeline gaps may come from older generic state updates.

The clean dataset validation below isolates active workflow behavior by clearing operational rows while preserving master/reference data.

## Required Pre-Cleanup Safeguards

1. Take a database backup.
2. Export current audit summaries:
   - `GET /runtime/integrity/inventory-summary`
   - `GET /runtime/integrity/production-summary`
   - `GET /runtime/integrity/project-summary`
3. Confirm the environment is not serving real users.
4. Disable background simulation/import jobs if any are active.
5. Run cleanup inside one transaction.
6. Reset Yard slot occupancy after clearing Yard placements.

## Tables To Keep

Keep master/access/reference data:

- `users`
- `refresh_tokens` can be kept, or optionally cleared only to force re-login
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `master_warehouses`
- `warehouse_zones`
- `yard_zones`
- `yard_rows`
- `yard_slots`
- `cranes`
- `suppliers`
- `projects`
- `inventory_categories`
- `material_types`
- `master_units`
- `master_transaction_types`
- `master_qc_statuses`
- `master_priorities`
- `master_material_statuses`
- `master_supplier_categories`
- `master_project_categories`
- `master_workflow_statuses`
- `qc_checklists`
- `qc_checklist_items`
- `work_centers`
- `machines`
- persisted settings/configuration tables if present

Keep with caution:

- `inventory_items`

Reason:

- The user asked to keep Categories/Units/Suppliers/Projects, not necessarily material items.
- For Scenario A, the cleanest test is to create one controlled material.
- If current material master is production-like and should be retained, do not truncate `inventory_items`; instead clear its stock/transaction rows and create a new clearly named validation material.

Recommended Scenario A approach:

- Keep existing `inventory_items`.
- Create one new validation material such as `VAL-MAT-001`.
- After validation, delete only the validation material if cleanup is needed.

## Tables To Clear

Clear operational Inventory rows:

- `inventory_transaction_items`
- `inventory_transactions`
- `inventory_location_stocks`
- `return_request_items`
- `return_requests`

Clear Production operational rows:

- `ProductionMaterialConsumption`
- `ProductionMaterialLedger`
- `ProductionMaterialIssue`
- `ProductionMaterialReservationLine`
- `ProductionMaterialReservation`
- `production_logs`
- `production_schedules`
- `production_tasks`
- `production_stages`
- `production_orders`
- `BOMRoutingStep`
- `BOMItem`
- `BOM`

Clear Components operational rows:

- `tasks`
- `component_timelines`
- `ComponentCosting`
- `components`

Clear QC operational rows:

- `qc_attachments`
- `non_conformance_reports`
- `qc_issues`
- `qc_results`
- `qc_inspections`

Keep QC master rows:

- `qc_checklists`
- `qc_checklist_items`

Clear Yard operational rows:

- `yard_movements`
- `yard_item_placements`
- `yard_snapshots`

Keep Yard structural rows:

- `yard_zones`
- `yard_rows`
- `yard_slots`
- `cranes`

Reset after clearing Yard operational rows:

- `yard_slots.status = AVAILABLE`
- `yard_slots.currentStackLevel = 0`

Clear optional workflow/noise rows if the goal is a silent audit baseline:

- `activity_logs`
- `outbox_events`
- `background_jobs`
- `job_executions`
- workflow runtime rows if they are generated only by operational tests:
  - `workflow_actions`
  - `workflow_instances`

Do not clear workflow definitions/steps unless intentionally rebuilding workflow configuration:

- `workflow_definitions`
- `workflow_steps`

## Suggested Cleanup Order

Use `TRUNCATE ... RESTART IDENTITY CASCADE` for purely operational rows only after confirming the exact physical table names in the target database.

Recommended order:

1. QC child/operational rows:
   - `qc_attachments`
   - `non_conformance_reports`
   - `qc_issues`
   - `qc_results`
   - `qc_inspections`
2. Yard operational rows:
   - `yard_movements`
   - `yard_item_placements`
   - `yard_snapshots`
3. Component operational rows:
   - `tasks`
   - `component_timelines`
   - `ComponentCosting`
   - `components`
4. Production operational rows:
   - `ProductionMaterialConsumption`
   - `ProductionMaterialLedger`
   - `ProductionMaterialIssue`
   - `ProductionMaterialReservationLine`
   - `ProductionMaterialReservation`
   - `production_logs`
   - `production_schedules`
   - `production_tasks`
   - `production_stages`
   - `production_orders`
   - `BOMRoutingStep`
   - `BOMItem`
   - `BOM`
5. Inventory operational rows:
   - `return_request_items`
   - `return_requests`
   - `inventory_transaction_items`
   - `inventory_transactions`
   - `inventory_location_stocks`
6. Optional audit/noise rows:
   - `activity_logs`
   - `outbox_events`
   - `background_jobs`
   - `job_executions`
7. Reset Yard slot occupancy:
   - `yard_slots.status = AVAILABLE`
   - `yard_slots.currentStackLevel = 0`

## Validation Scenario A

Purpose:

- Validate current active workflows on clean data.
- Prove whether Sprint 8 findings reappear without legacy/test rows.

Scenario records:

- 1 material: `VAL-MAT-001`
- 1 BOM: `VAL-BOM-001`
- 1 Manufacturing Order: `VAL-MO-001`
- 1 reservation
- 1 issue
- 1 return
- 1 consume
- 1 component: `VAL-COMP-001`
- 1 QC inspection
- 1 Yard placement
- 1 shipped transition
- 1 delivered transition
- 1 installed transition with install mapping

Baseline quantities:

- Initial production warehouse stock: 100 kg
- BOM required quantity: 10 kg
- MO quantity: 1
- Reservation quantity: 10 kg
- Issue quantity: 10 kg
- Return quantity: 2 kg
- Consume quantity: 7 kg
- Scrap quantity: 1 kg

Balance equation:

`issued = returned + consumed + scrap`

Expected:

`10 = 2 + 7 + 1`

## Expected Inventory Balances

Assume one production warehouse location:

- Warehouse: `PRODUCTION`
- Zone: validation production zone
- Slot: `SLOT-A`
- Level: `L1`

Step 0 - Clean baseline:

- `inventory_transactions`: 0
- `inventory_transaction_items`: 0
- `inventory_location_stocks` for `VAL-MAT-001`: 0
- Material snapshot quantity may be 0 or unused.

Step 1 - Create material and seed initial stock:

- Action: create/import `VAL-MAT-001` 100 kg into production warehouse location.
- Expected transaction:
  - 1 `IMPORT`
  - 1 transaction item quantity `+100`
- Expected location stock:
  - Production location: 100 kg
- Expected transaction-derived balance:
  - 100 kg

Step 2 - Create BOM:

- Action: create BOM requiring 10 kg of `VAL-MAT-001`.
- Expected inventory change:
  - None
- Expected location stock:
  - 100 kg

Step 3 - Create MO:

- Action: create `VAL-MO-001` from BOM.
- Expected inventory change:
  - None
- Expected location stock:
  - 100 kg

Step 4 - Reserve:

- Action: reserve 10 kg.
- Expected inventory physical stock:
  - 100 kg
- Expected available stock:
  - 90 kg
- Expected reservation:
  - `reservedQty = 10`
  - `issuedQty = 0`
  - `returnedQty = 0`
- Expected ledger:
  - `RESERVE` quantity 10

Step 5 - Issue:

- Action: issue 10 kg from reservation.
- Expected inventory transaction:
  - 1 production `EXPORT`
  - item quantity should reduce stock by 10
- Expected location stock:
  - 90 kg
- Expected reservation line:
  - `reservedQty = 10`
  - `issuedQty = 10`
  - `returnedQty = 0`
- Expected material issue:
  - `issuedQty = 10`
  - `returnedQty = 0`
- Expected ledger:
  - `ISSUE` quantity 10

Step 6 - Return:

- Action: return 2 kg unused material.
- Expected inventory transaction:
  - 1 production `RETURN`
  - item quantity should increase stock by 2
- Expected location stock:
  - 92 kg
- Expected reservation line:
  - `reservedQty = 10`
  - `issuedQty = 10`
  - `returnedQty = 2`
- Expected material issue:
  - `issuedQty = 10`
  - `returnedQty = 2`
- Expected ledger:
  - `RETURN` quantity 2

Step 7 - Consume:

- Action: consume 7 kg and scrap 1 kg.
- Expected inventory stock:
  - 92 kg
  - Consumption does not move warehouse stock because material was already issued out of production stock at Step 5.
- Expected production consumption:
  - `issuedQty = 10`
  - `returnedQty = 2`
  - `consumedQty = 7`
  - `scrapQty = 1`
- Expected ledger:
  - `CONSUME` quantity 8
- Expected balance:
  - `issuedQty - returnedQty - consumedQty - scrapQty = 0`

## Expected Production Balances

After Step 4:

- Reservations: 1
- Reservation lines: 1
- `reservedQty = 10`
- `issuedQty = 0`
- `returnedQty = 0`
- Ledger counts:
  - `RESERVE = 1`

After Step 5:

- Issues: 1
- `issuedQty = 10`
- `returnedQty = 0`
- Reservation line:
  - `issuedQty = 10`
- Ledger counts:
  - `RESERVE = 1`
  - `ISSUE = 1`

After Step 6:

- Issues: 1
- `issuedQty = 10`
- `returnedQty = 2`
- Reservation line:
  - `returnedQty = 2`
- Ledger counts:
  - `RESERVE = 1`
  - `ISSUE = 1`
  - `RETURN = 1`

After Step 7:

- Consumptions: 1
- `consumedQty = 7`
- `scrapQty = 1`
- Ledger counts:
  - `RESERVE = 1`
  - `ISSUE = 1`
  - `RETURN = 1`
  - `CONSUME = 1`
- Costing balance:
  - `issued = returned + consumed + scrap`
  - `10 = 2 + 7 + 1`

## Expected Component/QC/Yard/Project State

Step 8 - Create component from MO:

- Component `VAL-COMP-001`
- Status: `READY`
- `projectId`: existing validation project id
- Expected timeline:
  - `READY`

Step 9 - QC:

- QC inspection: 1
- Status: `PASSED` or `APPROVED`
- Linked to:
  - MO
  - component
  - project

Step 10 - Yard:

- Yard placement: 1 active placement
- Yard slot:
  - `status = OCCUPIED` or equivalent active occupied state
  - `currentStackLevel = 1`
- Component remains ready/staged until outbound.

Step 11 - Shipped:

- Yard placement:
  - `removedAt` set
- Component:
  - `status = SHIPPED`
  - `projectId` retained
- Component timeline:
  - `SHIPPED`

Step 12 - Delivered:

- Component:
  - `status = DELIVERED`
- Component timeline:
  - `DELIVERED`

Step 13 - Installed:

- Install payload:
  - `installZone = Zone A`
  - `installAxis = A-01`
  - `installLevel = L1`
  - `installPosition = Grid A1-B1`
- Component:
  - `status = INSTALLED`
  - `installedDate` set
  - installation mapping fields populated
  - `projectId` retained
- Component timeline:
  - `INSTALLED`
  - note contains installation location

## Pass/Fail Criteria

Inventory pass:

- No negative `inventory_location_stocks`.
- Transaction-derived balance equals location stock for `VAL-MAT-001`.
- Final location stock is 92 kg.

Production pass:

- No reservation line where `issuedQty > reservedQty`.
- No issue where `returnedQty > issuedQty`.
- Ledger has exactly one each of `RESERVE`, `ISSUE`, `RETURN`, `CONSUME`.
- `issued = returned + consumed + scrap`.

Component lifecycle pass:

- Component reaches `READY -> SHIPPED -> DELIVERED -> INSTALLED`.
- Timeline has all four actions.

Project pass:

- Installed component has `projectId`.
- Installed component has all installation mapping fields.

Conclusion rule:

- If Scenario A passes on a clean dataset, current Sprint 8 findings are legacy/test-data contamination or missing historical backfill.
- If Scenario A fails on a clean dataset, the failing step identifies an active workflow defect.
