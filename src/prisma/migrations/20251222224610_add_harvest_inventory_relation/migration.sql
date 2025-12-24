-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "harvestId" TEXT;

-- CreateIndex
CREATE INDEX "InventoryItem_harvestId_idx" ON "InventoryItem"("harvestId");

-- CreateIndex
CREATE INDEX "InventoryItem_harvestedPlantId_idx" ON "InventoryItem"("harvestedPlantId");

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_harvestId_fkey" FOREIGN KEY ("harvestId") REFERENCES "Harvest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
