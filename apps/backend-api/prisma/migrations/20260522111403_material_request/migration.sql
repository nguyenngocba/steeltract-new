-- CreateTable
CREATE TABLE "material_requests" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_request_items" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "material_requests_requestNumber_key" ON "material_requests"("requestNumber");

-- AddForeignKey
ALTER TABLE "material_request_items" ADD CONSTRAINT "material_request_items_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "material_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
