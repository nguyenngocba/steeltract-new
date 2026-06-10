-- AlterTable
ALTER TABLE "BOM" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "inventory_transaction_items" ADD COLUMN     "level" TEXT;
