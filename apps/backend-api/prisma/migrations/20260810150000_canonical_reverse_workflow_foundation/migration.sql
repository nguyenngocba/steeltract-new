ALTER TYPE "DispatchOrderStatus" ADD VALUE IF NOT EXISTS 'RETURN_REQUESTED';
ALTER TYPE "DispatchOrderStatus" ADD VALUE IF NOT EXISTS 'RETURN_IN_TRANSIT';
ALTER TYPE "DispatchOrderStatus" ADD VALUE IF NOT EXISTS 'RETURNED';

ALTER TYPE "DispatchEventType" ADD VALUE IF NOT EXISTS 'RETURN_REQUESTED';
ALTER TYPE "DispatchEventType" ADD VALUE IF NOT EXISTS 'RETURN_DEPARTED';
ALTER TYPE "DispatchEventType" ADD VALUE IF NOT EXISTS 'RETURNED';

ALTER TABLE "ProductionRework"
ADD COLUMN "componentInstanceId" TEXT;

CREATE INDEX "ProductionRework_componentInstanceId_idx"
ON "ProductionRework"("componentInstanceId");

ALTER TABLE "ProductionRework"
ADD CONSTRAINT "ProductionRework_componentInstanceId_fkey"
FOREIGN KEY ("componentInstanceId") REFERENCES "component_instances"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
