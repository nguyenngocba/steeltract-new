-- CreateTable
CREATE TABLE "safety_inspections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "inspector" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "note" TEXT,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "safety_inspections_pkey" PRIMARY KEY ("id")
);
