-- Enforce AD-017: a Work Order has at most one active Execution Run.
CREATE UNIQUE INDEX "production_executions_one_active_per_work_order_idx"
  ON "production_executions"("workOrderId")
  WHERE "state" IN ('CREATED', 'RUNNING', 'PAUSED');
