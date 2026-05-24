-- CreateEnum
CREATE TYPE "AttachmentCategory" AS ENUM ('DOCUMENT', 'DRAWING', 'PHOTO', 'QC', 'CONTRACT', 'OTHER');

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "AttachmentCategory" NOT NULL DEFAULT 'OTHER',
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploaderId" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "currentVersionId" TEXT,
    "thumbnailUrl" TEXT,
    "ocrStatus" TEXT,
    "metadata" JSONB,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachment_versions" (
    "id" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "originalName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "publicUrl" TEXT,
    "signedUrlExpiresAt" TIMESTAMP(3),
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "checksum" TEXT,
    "uploadedById" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachment_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachment_links" (
    "id" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "purpose" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attachment_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attachments_category_idx" ON "attachments"("category");

-- CreateIndex
CREATE INDEX "attachments_mimeType_idx" ON "attachments"("mimeType");

-- CreateIndex
CREATE INDEX "attachments_uploaderId_idx" ON "attachments"("uploaderId");

-- CreateIndex
CREATE INDEX "attachments_deletedAt_idx" ON "attachments"("deletedAt");

-- CreateIndex
CREATE INDEX "attachment_versions_attachmentId_idx" ON "attachment_versions"("attachmentId");

-- CreateIndex
CREATE INDEX "attachment_versions_storageKey_idx" ON "attachment_versions"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "attachment_versions_attachmentId_version_key" ON "attachment_versions"("attachmentId", "version");

-- CreateIndex
CREATE INDEX "attachment_links_module_entityId_idx" ON "attachment_links"("module", "entityId");

-- CreateIndex
CREATE INDEX "attachment_links_attachmentId_idx" ON "attachment_links"("attachmentId");

-- CreateIndex
CREATE UNIQUE INDEX "attachment_links_attachmentId_module_entityId_purpose_key" ON "attachment_links"("attachmentId", "module", "entityId", "purpose");

-- AddForeignKey
ALTER TABLE "attachment_versions" ADD CONSTRAINT "attachment_versions_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "attachments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachment_links" ADD CONSTRAINT "attachment_links_attachmentId_fkey" FOREIGN KEY ("attachmentId") REFERENCES "attachments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
