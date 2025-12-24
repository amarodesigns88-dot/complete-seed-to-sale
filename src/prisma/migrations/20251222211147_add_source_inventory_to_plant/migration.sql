-- AlterTable
ALTER TABLE "Plant" ADD COLUMN     "sourceInventoryId" TEXT;

-- AddForeignKey
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_sourceInventoryId_fkey" FOREIGN KEY ("sourceInventoryId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
