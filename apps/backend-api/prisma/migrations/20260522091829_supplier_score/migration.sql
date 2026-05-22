-- CreateTable
CREATE TABLE "supplier_scores" (
    "id" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "quality" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "delivery" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pricing" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "overall" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_scores_pkey" PRIMARY KEY ("id")
);
