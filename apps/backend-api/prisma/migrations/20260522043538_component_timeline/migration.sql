-- CreateTable
CREATE TABLE "component_timelines" (
    "id" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "component_timelines_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "component_timelines" ADD CONSTRAINT "component_timelines_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "components"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
