-- Project template library for low-data-entry project creation.

CREATE TYPE "ProjectTemplateStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'INACTIVE');

CREATE TABLE "project_templates" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "ProjectTemplateStatus" NOT NULL DEFAULT 'DRAFT',
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "structure" JSONB NOT NULL DEFAULT '{}',
  "createdBy" TEXT,
  "updatedBy" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "project_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_templates_code_key" ON "project_templates"("code");
CREATE INDEX "project_templates_status_idx" ON "project_templates"("status");
CREATE INDEX "project_templates_isDefault_idx" ON "project_templates"("isDefault");

INSERT INTO "project_templates" (
  "id",
  "code",
  "name",
  "description",
  "status",
  "isDefault",
  "structure",
  "publishedAt",
  "createdAt",
  "updatedAt"
)
VALUES (
  'tpl_factory_5_bay',
  'TPL-NX-5N',
  'Nhà xưởng 5 nhịp',
  'Template chuẩn cho công trình nhà xưởng kết cấu thép 5 nhịp.',
  'PUBLISHED',
  true,
  '{
    "version": 1,
    "tasks": [
      { "key": "prepare", "name": "Chuẩn bị", "durationDays": 3, "resources": [{ "type": "WORKER", "name": "Kỹ sư công trường", "quantity": 1 }] },
      { "key": "foundation", "name": "Móng", "durationDays": 7, "dependsOn": [{ "key": "prepare", "type": "FS" }], "resources": [{ "type": "WORKER", "name": "Công nhân", "quantity": 4 }, { "type": "MACHINE", "name": "Máy đào", "quantity": 1 }] },
      { "key": "fabrication", "name": "Gia công", "durationDays": 20, "dependsOn": [{ "key": "foundation", "type": "FS" }], "suggestedComponents": ["Cột", "Dầm", "Giằng"], "resources": [{ "type": "WORKER", "name": "Tổ gia công", "quantity": 8 }] },
      { "key": "painting", "name": "Sơn", "durationDays": 5, "dependsOn": [{ "key": "fabrication", "type": "FS" }], "resources": [{ "type": "WORKER", "name": "Tổ sơn", "quantity": 4 }] },
      { "key": "transport", "name": "Vận chuyển", "durationDays": 3, "dependsOn": [{ "key": "painting", "type": "FS" }], "resources": [{ "type": "MACHINE", "name": "Xe tải", "quantity": 2 }] },
      { "key": "installation", "name": "Lắp dựng", "durationDays": 15, "dependsOn": [{ "key": "transport", "type": "FS" }], "suggestedMaterials": ["Bulong M20", "Bản mã", "Long đền"], "suggestedComponents": ["Cột", "Dầm", "Giằng"], "resources": [{ "type": "WORKER", "name": "Công nhân lắp dựng", "quantity": 6 }, { "type": "WORKER", "name": "Kỹ sư", "quantity": 1 }, { "type": "MACHINE", "name": "Cẩu", "quantity": 1 }] },
      { "key": "finishing", "name": "Hoàn thiện", "durationDays": 5, "dependsOn": [{ "key": "installation", "type": "FS" }] },
      { "key": "qc", "name": "QC", "durationDays": 2, "dependsOn": [{ "key": "finishing", "type": "FS" }] },
      { "key": "handover", "name": "Bàn giao", "durationDays": 1, "dependsOn": [{ "key": "qc", "type": "FS" }] }
    ]
  }'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "status" = EXCLUDED."status",
  "isDefault" = EXCLUDED."isDefault",
  "structure" = EXCLUDED."structure",
  "publishedAt" = EXCLUDED."publishedAt",
  "updatedAt" = CURRENT_TIMESTAMP;
