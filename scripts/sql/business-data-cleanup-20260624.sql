-- SteelTrack real business data cleanup
-- Generated: 2026-06-24
--
-- Purpose:
--   Clear real/demo business data so operators can recreate clean data by hand.
--
-- Preserved:
--   users, roles, permissions, refresh tokens, system/master settings,
--   categories, material types, units, transaction types, warehouses,
--   warehouse zones, yard layout zones/rows/slots/cranes, QC checklist templates,
--   workflow definitions/steps, work centers, and machines.
--
-- Cleared:
--   materials, inventory movements/balances, components, projects, suppliers,
--   purchase/material requests, production BOM/MO/material activity, QC runtime,
--   yard placements/movements/snapshots, vehicles, attachments, notifications,
--   analytics/runtime/audit noise.

BEGIN;

-- Runtime and generated analytics/notification data.
TRUNCATE TABLE
  "job_executions",
  "background_jobs",
  "outbox_events",
  "analytics_predictions",
  "analytics_alerts",
  "analytics_aggregations",
  "analytics_metrics",
  "analytics_snapshots",
  "notifications",
  "activity_logs"
RESTART IDENTITY CASCADE;

-- Workflow instances are operational history. Workflow definitions/steps are preserved.
TRUNCATE TABLE
  "workflow_actions",
  "workflow_instances"
RESTART IDENTITY CASCADE;

-- Attachments belong to business entities being cleaned. Physical files are not removed by SQL.
TRUNCATE TABLE
  "qc_attachments",
  "attachment_links",
  "attachment_versions",
  "attachments"
RESTART IDENTITY CASCADE;

-- QC operational data only. Keeps qc_checklists and qc_checklist_items.
TRUNCATE TABLE
  "non_conformance_reports",
  "qc_issues",
  "qc_results",
  "qc_inspections"
RESTART IDENTITY CASCADE;

-- Yard operational data only. Keeps yard_zones, yard_rows, yard_slots, and cranes.
TRUNCATE TABLE
  "yard_movements",
  "yard_item_placements",
  "yard_snapshots"
RESTART IDENTITY CASCADE;

UPDATE "yard_slots"
SET
  "status" = 'AVAILABLE',
  "currentStackLevel" = 0,
  "updatedAt" = NOW();

-- Component lifecycle/output data.
TRUNCATE TABLE
  "tasks",
  "component_timelines",
  "ComponentCosting",
  "components"
RESTART IDENTITY CASCADE;

-- Production execution, material, BOM, MO, and legacy WorkOrder data.
-- Keeps work_centers and machines.
TRUNCATE TABLE
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
  "WorkOrder"
RESTART IDENTITY CASCADE;

-- Inventory operational movement, returns, purchase/procurement, and balances.
TRUNCATE TABLE
  "return_request_items",
  "return_requests",
  "inventory_transaction_items",
  "inventory_transactions",
  "inventory_location_stocks",
  "PurchaseReceiving",
  "purchase_order_items",
  "purchase_orders",
  "material_request_items",
  "material_requests"
RESTART IDENTITY CASCADE;

-- Business master data requested for cleanup.
-- Reference configuration is preserved separately in master/category/unit tables.
TRUNCATE TABLE
  "inventory_items",
  "projects",
  "Supplier",
  "supplier_scores",
  "vehicles",
  "approvals",
  "site_logs",
  "safety_inspections",
  "equipment_bookings",
  "workers",
  "attendance"
RESTART IDENTITY CASCADE;

COMMIT;
