-- Add canonical Production Order lifecycle states without rewriting existing rows.
ALTER TYPE "ProductionOrderStatus" ADD VALUE IF NOT EXISTS 'READY';
ALTER TYPE "ProductionOrderStatus" ADD VALUE IF NOT EXISTS 'PAUSED';
ALTER TYPE "ProductionOrderStatus" ADD VALUE IF NOT EXISTS 'CLOSED';
