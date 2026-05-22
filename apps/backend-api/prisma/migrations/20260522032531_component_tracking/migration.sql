-- AlterTable
ALTER TABLE "components" ADD COLUMN     "floor" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "position" TEXT,
ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "status" TEXT DEFAULT 'STOCK',
ADD COLUMN     "zone" TEXT;

-- AddForeignKey
ALTER TABLE "components" ADD CONSTRAINT "components_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
