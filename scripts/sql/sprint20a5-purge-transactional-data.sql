-- SteelTrack Sprint 20A.5 demo dataset transactional purge
-- Generated: 2026-06-23
--
-- Purpose:
--   Clear operational/transactional data before loading the Sprint 20A.5
--   demo dataset. Master reference tables are preserved.
--
-- Preserved:
--   users, roles, permissions, master_warehouses, warehouse_zones,
--   inventory_categories, material_types, master_units, suppliers, projects,
--   settings/reference data.
--
-- Cleared:
--   inventory movements/balances, components, BOMs, production orders,
--   production reservations/issues/consumptions/ledger, costing rows,
--   QC operational rows, Yard placements/movements, workflow/runtime noise.

BEGIN;

TRUNCATE TABLE
  "qc_attachments",
  "non_conformance_reports",
  "qc_issues",
  "qc_results",
  "qc_inspections",
  "yard_movements",
  "yard_item_placements",
  "yard_snapshots",
  "tasks",
  "component_timelines",
  "ComponentCosting",
  "components",
  "ProductionMaterialConsumption",
  "ProductionMaterialLedger",
  "ProductionMaterialIssue",
  "ProductionMaterialReservationLine",
  "ProductionMaterialReservation",
  "production_logs",
  "production_schedules",
  "production_tasks",
  "production_stages",
  "production_orders",
  "BOMRoutingStep",
  "BOMItem",
  "BOM",
  "return_request_items",
  "return_requests",
  "inventory_transaction_items",
  "inventory_transactions",
  "inventory_location_stocks",
  "activity_logs",
  "outbox_events",
  "background_jobs",
  "job_executions",
  "workflow_actions",
  "workflow_instances"
RESTART IDENTITY CASCADE;

UPDATE "yard_slots"
SET
  "status" = 'AVAILABLE',
  "currentStackLevel" = 0,
  "updatedAt" = NOW();

-- `inventory_items.quantity` is a compatibility snapshot only.
-- Reset it after clearing transaction/location balances so old snapshot values
-- do not pollute demo dashboards.
UPDATE "inventory_items"
SET
  "quantity" = 0,
  "updatedAt" = NOW();

COMMIT;
