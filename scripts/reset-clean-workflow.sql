-- Reset operational data for a clean end-to-end workflow test.
-- Preserves users, roles, permissions, settings, master dictionaries, units,
-- suppliers, QC checklist standards, warehouse/yard zones and slots.

BEGIN;

TRUNCATE TABLE
  "ProductionMaterialIssue",
  production_logs,
  production_schedules,
  production_tasks,
  production_stages,
  production_orders,
  "BOMRoutingStep",
  "BOMItem",
  "BOM",
  qc_attachments,
  non_conformance_reports,
  qc_issues,
  qc_results,
  qc_inspections,
  yard_movements,
  yard_item_placements,
  yard_snapshots,
  component_timelines,
  components,
  return_request_items,
  return_requests,
  inventory_transaction_items,
  inventory_transactions,
  "PurchaseReceiving",
  purchase_order_items,
  purchase_orders,
  material_request_items,
  material_requests,
  projects,
  outbox_events,
  activity_logs
RESTART IDENTITY CASCADE;

DELETE FROM inventory_items;

UPDATE yard_slots
SET
  status = 'AVAILABLE',
  "currentStackLevel" = 0,
  "updatedAt" = NOW();

COMMIT;
