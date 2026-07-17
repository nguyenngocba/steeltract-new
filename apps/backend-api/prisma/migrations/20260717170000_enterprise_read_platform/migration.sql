CREATE TABLE "enterprise_projection_documents" (
    "id" TEXT NOT NULL,
    "projectionName" TEXT NOT NULL,
    "entityKey" TEXT NOT NULL,
    "scopeKey" TEXT,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "data" JSONB NOT NULL,
    "sourceEventId" TEXT NOT NULL,
    "sourceEventName" TEXT NOT NULL,
    "sourceAggregateVersion" INTEGER,
    "sourceOccurredAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "enterprise_projection_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "enterprise_projection_checkpoints" (
    "projectionName" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "lastOutboxEventId" TEXT,
    "lastOccurredAt" TIMESTAMP(3),
    "lastProcessedAt" TIMESTAMP(3),
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "lagMs" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'HEALTHY',
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "enterprise_projection_checkpoints_pkey" PRIMARY KEY ("projectionName")
);

CREATE TABLE "enterprise_projection_receipts" (
    "id" TEXT NOT NULL,
    "projectionName" TEXT NOT NULL,
    "outboxEventId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "aggregateId" TEXT,
    "aggregateVersion" INTEGER,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "enterprise_projection_receipts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "enterprise_projection_failures" (
    "id" TEXT NOT NULL,
    "projectionName" TEXT NOT NULL,
    "outboxEventId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "error" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'RETRYING',
    "lastAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "enterprise_projection_failures_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "enterprise_projection_documents_projectionName_entityKey_key"
ON "enterprise_projection_documents"("projectionName", "entityKey");
CREATE INDEX "enterprise_projection_documents_projectionName_scopeKey_idx"
ON "enterprise_projection_documents"("projectionName", "scopeKey");
CREATE INDEX "enterprise_projection_documents_projectionName_updatedAt_idx"
ON "enterprise_projection_documents"("projectionName", "updatedAt");
CREATE INDEX "enterprise_projection_documents_sourceEventId_idx"
ON "enterprise_projection_documents"("sourceEventId");

CREATE INDEX "enterprise_projection_checkpoints_status_idx"
ON "enterprise_projection_checkpoints"("status");
CREATE INDEX "enterprise_projection_checkpoints_updatedAt_idx"
ON "enterprise_projection_checkpoints"("updatedAt");

CREATE UNIQUE INDEX "enterprise_projection_receipts_projectionName_outboxEventId_key"
ON "enterprise_projection_receipts"("projectionName", "outboxEventId");
CREATE INDEX "enterprise_projection_receipts_projectionName_processedAt_idx"
ON "enterprise_projection_receipts"("projectionName", "processedAt");
CREATE INDEX "enterprise_projection_receipts_eventName_idx"
ON "enterprise_projection_receipts"("eventName");

CREATE UNIQUE INDEX "enterprise_projection_failures_projectionName_outboxEventId_key"
ON "enterprise_projection_failures"("projectionName", "outboxEventId");
CREATE INDEX "enterprise_projection_failures_status_lastAttemptAt_idx"
ON "enterprise_projection_failures"("status", "lastAttemptAt");
CREATE INDEX "enterprise_projection_failures_projectionName_status_idx"
ON "enterprise_projection_failures"("projectionName", "status");
