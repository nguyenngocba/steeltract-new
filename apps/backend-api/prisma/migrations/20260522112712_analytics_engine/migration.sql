-- CreateTable
CREATE TABLE "analytics_snapshots" (
    "id" TEXT NOT NULL,
    "totalProjects" INTEGER NOT NULL DEFAULT 0,
    "totalComponents" INTEGER NOT NULL DEFAULT 0,
    "completedProjects" INTEGER NOT NULL DEFAULT 0,
    "delayedProjects" INTEGER NOT NULL DEFAULT 0,
    "inventoryValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "purchaseTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_snapshots_pkey" PRIMARY KEY ("id")
);
