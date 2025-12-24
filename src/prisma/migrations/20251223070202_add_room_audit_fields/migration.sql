/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `Cure` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Cure` table. All the data in the column will be lost.
  - Added the required column `plantId` to the `Cure` table without a default value. This is not possible if the table is not empty.
  - Made the column `dryOtherMaterialWeight` on table `Cure` required. This step will fail if there are existing NULL values in that column.
  - Made the column `dryWasteWeight` on table `Cure` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Cure" DROP COLUMN "deletedAt",
DROP COLUMN "status",
ADD COLUMN     "plantId" TEXT NOT NULL,
ALTER COLUMN "dryOtherMaterialWeight" SET NOT NULL,
ALTER COLUMN "dryWasteWeight" SET NOT NULL;

-- AlterTable
ALTER TABLE "Harvest" ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "Plant" ADD COLUMN     "harvestDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "deletedBy" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "updatedBy" TEXT;

-- AddForeignKey
ALTER TABLE "Cure" ADD CONSTRAINT "Cure_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
