-- EPIC104 / Sprint DE.1
-- Enterprise Index Foundation.
-- These indexes protect high-value runtime/dashboard/detail query paths
-- identified by EPIC101 query and index audits.

CREATE INDEX "inventory_transactions_type_transactionDate_idx"
  ON "inventory_transactions"("type", "transactionDate" DESC);

CREATE INDEX "inventory_transactions_projectId_transactionDate_idx"
  ON "inventory_transactions"("projectId", "transactionDate" DESC);

CREATE INDEX "inventory_transaction_items_inventoryItemId_createdAt_idx"
  ON "inventory_transaction_items"("inventoryItemId", "createdAt" DESC);

CREATE INDEX "inventory_transaction_items_transactionId_inventoryItemId_idx"
  ON "inventory_transaction_items"("transactionId", "inventoryItemId");

CREATE INDEX "inventory_location_stocks_item_bucket_idx"
  ON "inventory_location_stocks"("inventoryItemId", "warehouseId", "zoneId", "slotId", "level");

CREATE INDEX "return_requests_projectId_status_createdAt_idx"
  ON "return_requests"("projectId", "status", "createdAt" DESC);

CREATE INDEX "return_requests_flowType_status_createdAt_idx"
  ON "return_requests"("flowType", "status", "createdAt" DESC);

CREATE INDEX "project_tasks_projectId_parentTaskId_sortOrder_idx"
  ON "project_tasks"("projectId", "parentTaskId", "sortOrder");

CREATE INDEX "project_tasks_projectId_status_scheduledFinishAt_idx"
  ON "project_tasks"("projectId", "status", "scheduledFinishAt");

CREATE INDEX "activity_logs_module_createdAt_idx"
  ON "activity_logs"("module", "createdAt" DESC);

CREATE INDEX "activity_logs_entity_entityId_createdAt_idx"
  ON "activity_logs"("entity", "entityId", "createdAt" DESC);
