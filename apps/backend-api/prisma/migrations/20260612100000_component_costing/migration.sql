CREATE TABLE "ComponentCosting" (
    "id" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "estimatedMaterialCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualMaterialCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "laborCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "machineCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overheadCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "varianceCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComponentCosting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ComponentCosting_componentId_key" ON "ComponentCosting"("componentId");

CREATE INDEX "ComponentCosting_componentId_idx" ON "ComponentCosting"("componentId");

CREATE INDEX "ComponentCosting_productionOrderId_idx" ON "ComponentCosting"("productionOrderId");

ALTER TABLE "ComponentCosting" ADD CONSTRAINT "ComponentCosting_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ComponentCosting" ADD CONSTRAINT "ComponentCosting_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "production_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
