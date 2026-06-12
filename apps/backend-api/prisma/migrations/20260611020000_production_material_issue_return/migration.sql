-- AlterTable
ALTER TABLE "ProductionMaterialIssue" ADD COLUMN     "level" TEXT,
ADD COLUMN     "reservationId" TEXT,
ADD COLUMN     "reservationLineId" TEXT,
ADD COLUMN     "returnedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "slotId" TEXT;

-- CreateIndex
CREATE INDEX "ProductionMaterialIssue_reservationId_idx" ON "ProductionMaterialIssue"("reservationId");

-- CreateIndex
CREATE INDEX "ProductionMaterialIssue_reservationLineId_idx" ON "ProductionMaterialIssue"("reservationLineId");

-- AddForeignKey
ALTER TABLE "ProductionMaterialIssue" ADD CONSTRAINT "ProductionMaterialIssue_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "ProductionMaterialReservation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionMaterialIssue" ADD CONSTRAINT "ProductionMaterialIssue_reservationLineId_fkey" FOREIGN KEY ("reservationLineId") REFERENCES "ProductionMaterialReservationLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

