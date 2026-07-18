-- Online additive indexes for bounded history, replay and queue query shapes.
-- This migration must run outside an explicit transaction because PostgreSQL
-- does not allow CREATE INDEX CONCURRENTLY inside a transaction block.
SET lock_timeout = '5s';
SET statement_timeout = '0';

CREATE INDEX CONCURRENTLY IF NOT EXISTS "inventory_transactions_transactionDate_id_idx"
  ON "inventory_transactions" ("transactionDate" DESC, "id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "inventory_transactions_reference_idx"
  ON "inventory_transactions" ("type", "referenceModule", "referenceId");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "dispatch_events_order_createdAt_id_idx"
  ON "dispatch_events" ("dispatchOrderId", "createdAt" DESC, "id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "outbox_events_claim_idx"
  ON "outbox_events" ("status", "nextAttemptAt", "createdAt", "id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "outbox_events_createdAt_id_idx"
  ON "outbox_events" ("createdAt", "id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "outbox_events_updatedAt_id_idx"
  ON "outbox_events" ("updatedAt" DESC, "id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "background_jobs_claim_idx"
  ON "background_jobs" ("status", "priority" DESC, "runAt", "id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "background_jobs_updatedAt_id_idx"
  ON "background_jobs" ("updatedAt" DESC, "id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "job_executions_jobId_startedAt_id_idx"
  ON "job_executions" ("jobId", "startedAt" DESC, "id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "projection_documents_name_occurredAt_id_idx"
  ON "enterprise_projection_documents" ("projectionName", "sourceOccurredAt" DESC, "id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "projection_documents_scope_occurredAt_id_idx"
  ON "enterprise_projection_documents" ("projectionName", "scopeKey", "sourceOccurredAt" DESC, "id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "production_material_ledger_order_eventDate_id_idx"
  ON "ProductionMaterialLedger" ("productionOrderId", "eventDate" DESC, "id");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "production_material_ledger_item_eventDate_id_idx"
  ON "ProductionMaterialLedger" ("inventoryItemId", "eventDate" DESC, "id");
