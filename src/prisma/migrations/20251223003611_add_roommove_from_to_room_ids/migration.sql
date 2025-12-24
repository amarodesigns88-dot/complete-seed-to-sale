/*
  Warnings:

  - You are about to drop the column `inputInventoryIds` on the `Conversion` table. All the data in the column will be lost.
  - You are about to drop the column `outputInventoryIds` on the `Conversion` table. All the data in the column will be lost.
  - You are about to drop the column `room` on the `Plant` table. All the data in the column will be lost.
  - You are about to drop the column `fromRoom` on the `RoomMove` table. All the data in the column will be lost.
  - You are about to drop the column `toRoom` on the `RoomMove` table. All the data in the column will be lost.
  - You are about to drop the column `sampleId` on the `Test` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Conversion" DROP COLUMN "inputInventoryIds",
DROP COLUMN "outputInventoryIds";

-- AlterTable
ALTER TABLE "Plant" DROP COLUMN "room",
ADD COLUMN     "roomId" TEXT;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "roomType" TEXT NOT NULL DEFAULT 'cultivation';

-- AlterTable
ALTER TABLE "RoomMove" DROP COLUMN "fromRoom",
DROP COLUMN "toRoom",
ADD COLUMN     "fromRoomId" TEXT,
ADD COLUMN     "toRoomId" TEXT;

-- AlterTable
ALTER TABLE "Test" DROP COLUMN "sampleId",
ADD COLUMN     "inventoryItemId" TEXT;

-- CreateTable
CREATE TABLE "ConversionInput" (
    "id" TEXT NOT NULL,
    "conversionId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ConversionInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversionOutput" (
    "id" TEXT NOT NULL,
    "conversionId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ConversionOutput_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Plant" ADD CONSTRAINT "Plant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMove" ADD CONSTRAINT "RoomMove_fromRoomId_fkey" FOREIGN KEY ("fromRoomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMove" ADD CONSTRAINT "RoomMove_toRoomId_fkey" FOREIGN KEY ("toRoomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversionInput" ADD CONSTRAINT "ConversionInput_conversionId_fkey" FOREIGN KEY ("conversionId") REFERENCES "Conversion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversionInput" ADD CONSTRAINT "ConversionInput_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversionOutput" ADD CONSTRAINT "ConversionOutput_conversionId_fkey" FOREIGN KEY ("conversionId") REFERENCES "Conversion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversionOutput" ADD CONSTRAINT "ConversionOutput_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Test" ADD CONSTRAINT "Test_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
