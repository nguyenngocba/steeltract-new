ALTER TABLE "enterprise_projection_documents"
  ALTER COLUMN "sourceAggregateVersion" TYPE BIGINT;

ALTER TABLE "enterprise_projection_receipts"
  ALTER COLUMN "aggregateVersion" TYPE BIGINT;
