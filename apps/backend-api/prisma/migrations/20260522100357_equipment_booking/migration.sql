-- CreateTable
CREATE TABLE "equipment_bookings" (
    "id" TEXT NOT NULL,
    "equipmentName" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipment_bookings_pkey" PRIMARY KEY ("id")
);
