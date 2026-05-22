-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "requester" TEXT NOT NULL,
    "approver" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);
