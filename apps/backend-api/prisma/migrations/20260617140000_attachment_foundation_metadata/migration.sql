-- Attachment foundation metadata for filesystem-backed storage.
ALTER TYPE "AttachmentCategory" ADD VALUE IF NOT EXISTS 'DATASHEET';
ALTER TYPE "AttachmentCategory" ADD VALUE IF NOT EXISTS 'CO';
ALTER TYPE "AttachmentCategory" ADD VALUE IF NOT EXISTS 'CQ';
ALTER TYPE "AttachmentCategory" ADD VALUE IF NOT EXISTS 'CATALOG';

ALTER TABLE "attachments"
  ADD COLUMN IF NOT EXISTS "module" TEXT,
  ADD COLUMN IF NOT EXISTS "entityType" TEXT,
  ADD COLUMN IF NOT EXISTS "entityId" TEXT,
  ADD COLUMN IF NOT EXISTS "originalName" TEXT,
  ADD COLUMN IF NOT EXISTS "storedName" TEXT,
  ADD COLUMN IF NOT EXISTS "extension" TEXT,
  ADD COLUMN IF NOT EXISTS "checksum" TEXT,
  ADD COLUMN IF NOT EXISTS "storagePath" TEXT,
  ADD COLUMN IF NOT EXISTS "uploadedBy" TEXT;

CREATE INDEX IF NOT EXISTS "attachments_module_idx" ON "attachments"("module");
CREATE INDEX IF NOT EXISTS "attachments_entityType_idx" ON "attachments"("entityType");
CREATE INDEX IF NOT EXISTS "attachments_entityId_idx" ON "attachments"("entityId");
CREATE INDEX IF NOT EXISTS "attachments_module_entityType_entityId_idx" ON "attachments"("module", "entityType", "entityId");
CREATE INDEX IF NOT EXISTS "attachments_checksum_idx" ON "attachments"("checksum");
CREATE INDEX IF NOT EXISTS "attachment_versions_checksum_idx" ON "attachment_versions"("checksum");
