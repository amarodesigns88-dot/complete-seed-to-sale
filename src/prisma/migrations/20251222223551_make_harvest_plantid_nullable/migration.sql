-- DropForeignKey
ALTER TABLE "Harvest" DROP CONSTRAINT "Harvest_plantId_fkey";

-- AlterTable
ALTER TABLE "Harvest" ALTER COLUMN "plantId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Harvest" ADD CONSTRAINT "Harvest_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
