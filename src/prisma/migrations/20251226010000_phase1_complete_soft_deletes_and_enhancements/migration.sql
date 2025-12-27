-- Phase 1 Completion: Add soft deletes to remaining entities and enhancements

-- Add deletedAt to Role
ALTER TABLE "Role" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Add deletedAt to UserPermission  
ALTER TABLE "UserPermission" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Add deletedAt to Cure
ALTER TABLE "Cure" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Add deletedAt to TransferItem
ALTER TABLE "TransferItem" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Add deletedAt to ConversionInput
ALTER TABLE "ConversionInput" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Add deletedAt to ConversionOutput
ALTER TABLE "ConversionOutput" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Add deletedAt to TestingPanel
ALTER TABLE "TestingPanel" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Add deletedAt to Test
ALTER TABLE "Test" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Add deletedAt to Customer
ALTER TABLE "Customer" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Add deletedAt to Sale
ALTER TABLE "Sale" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Add deletedAt to SaleItem
ALTER TABLE "SaleItem" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Add deletedAt to Refund
ALTER TABLE "Refund" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Add deletedAt to AuditLog (for soft delete of logs)
ALTER TABLE "AuditLog" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Add deletedAt to TransferDriver
ALTER TABLE "TransferDriver" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Add deletedAt to TransferVehicle
ALTER TABLE "TransferVehicle" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Add deletedAt to TestResult
ALTER TABLE "TestResult" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Add deletedAt to StateRequest
ALTER TABLE "StateRequest" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Enhance Sale entity for order types (Regular, Pickup, Delivery)
ALTER TABLE "Sale" ADD COLUMN "orderType" TEXT NOT NULL DEFAULT 'regular';
ALTER TABLE "Sale" ADD COLUMN "pickupDate" TIMESTAMP(3);
ALTER TABLE "Sale" ADD COLUMN "deliveryAddress" TEXT;
ALTER TABLE "Sale" ADD COLUMN "deliveryDate" TIMESTAMP(3);
ALTER TABLE "Sale" ADD COLUMN "deliveryManifestId" TEXT;
ALTER TABLE "Sale" ADD COLUMN "reservationId" TEXT;

-- Add index for order type filtering
CREATE INDEX "Sale_orderType_idx" ON "Sale"("orderType");

-- Enhance Room for better inventory management
-- Note: roomType already exists from migration 20251223003611, so we update it instead
ALTER TABLE "Room" ALTER COLUMN "roomType" SET DEFAULT 'general';
ALTER TABLE "Room" ADD COLUMN "maxCapacity" INTEGER;
ALTER TABLE "Room" ADD COLUMN "currentCapacity" INTEGER DEFAULT 0;
ALTER TABLE "Room" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- Add index for room type (if not exists)
CREATE INDEX IF NOT EXISTS "Room_roomType_idx" ON "Room"("roomType");

-- Enhance AuditLog for comprehensive tracking
-- Note: entityType and entityId already exist from init migration, so we skip them
-- ALTER TABLE "AuditLog" ADD COLUMN "entityType" TEXT NOT NULL DEFAULT 'unknown'; -- Already exists
-- ALTER TABLE "AuditLog" ADD COLUMN "entityId" TEXT; -- Already exists
ALTER TABLE "AuditLog" ADD COLUMN "oldValues" JSONB;
ALTER TABLE "AuditLog" ADD COLUMN "newValues" JSONB;
ALTER TABLE "AuditLog" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "userAgent" TEXT;

-- Add indexes for audit log querying (use IF NOT EXISTS for idempotency)
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_idx" ON "AuditLog"("entityType");
CREATE INDEX IF NOT EXISTS "AuditLog_entityId_idx" ON "AuditLog"("entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- Add harvest type tracking to Plant
ALTER TABLE "Plant" ADD COLUMN "harvestType" TEXT;

-- Add mother plant functionality
ALTER TABLE "Plant" ADD COLUMN "isMotherPlant" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Plant" ADD COLUMN "clonesGenerated" INTEGER DEFAULT 0;
ALTER TABLE "Plant" ADD COLUMN "seedsGenerated" INTEGER DEFAULT 0;

-- Add room to InventoryItem for better tracking
ALTER TABLE "InventoryItem" ADD COLUMN "currentRoomId" TEXT;
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_currentRoomId_fkey" 
  FOREIGN KEY ("currentRoomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for inventory room lookups
CREATE INDEX "InventoryItem_currentRoomId_idx" ON "InventoryItem"("currentRoomId");

-- Add indexes for lot tracking
CREATE INDEX "InventoryItem_lotId_idx" ON "InventoryItem"("lotId");

-- Comments for documentation
COMMENT ON COLUMN "Sale"."orderType" IS 'Type of sale: regular, pickup, delivery';
COMMENT ON COLUMN "Room"."roomType" IS 'Type of room: vegetation, flowering, drying, curing, storage, processing, etc.';
COMMENT ON COLUMN "AuditLog"."entityType" IS 'Type of entity being audited: User, Plant, InventoryItem, Transfer, etc.';
COMMENT ON COLUMN "Plant"."harvestType" IS 'Type of harvest: whole_plant, regular, additional_collection';
COMMENT ON COLUMN "Plant"."isMotherPlant" IS 'Whether this plant is designated as a mother plant for cloning';
