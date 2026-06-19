-- Inventory transaction attachment categories.
ALTER TYPE "AttachmentCategory" ADD VALUE IF NOT EXISTS 'INVOICE';
ALTER TYPE "AttachmentCategory" ADD VALUE IF NOT EXISTS 'DELIVERY_NOTE';
ALTER TYPE "AttachmentCategory" ADD VALUE IF NOT EXISTS 'PACKING_LIST';
ALTER TYPE "AttachmentCategory" ADD VALUE IF NOT EXISTS 'REPORT';
