-- Phase 1: Database Schema Expansion
-- Comprehensive Seed-to-Sale System Implementation

-- Add new fields to InventoryType table
ALTER TABLE "InventoryType" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "InventoryType" ADD COLUMN IF NOT EXISTS "isWaste" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "InventoryType" ADD COLUMN IF NOT EXISTS "canConvert" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "InventoryType" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);
ALTER TABLE "InventoryType" ALTER COLUMN "isSource" SET DEFAULT false;

-- Update existing InventoryType records to have categories
-- This will be done via seed script for flexibility

-- Add new fields to InventoryItem table
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "usableWeight" DOUBLE PRECISION;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "lotId" TEXT;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "sublotIdentifier" TEXT;
ALTER TABLE "InventoryItem" ADD COLUMN IF NOT EXISTS "roomId" TEXT;

-- Create LicenseType table
CREATE TABLE IF NOT EXISTS "LicenseType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "canTransfer" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LicenseType_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LicenseType_name_key" ON "LicenseType"("name");

-- Create Lot table
CREATE TABLE IF NOT EXISTS "Lot" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "inventoryTypeId" TEXT NOT NULL,
    "totalQuantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "sourceInventoryIds" JSONB,

    CONSTRAINT "Lot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Lot_batchNumber_key" ON "Lot"("batchNumber");

-- Create Product table
CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inventoryItemId" TEXT,
    "category" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "discountPrice" DOUBLE PRECISION,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Product_locationId_idx" ON "Product"("locationId");

-- Create Driver table
CREATE TABLE IF NOT EXISTS "Driver" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Driver_locationId_idx" ON "Driver"("locationId");

-- Create Vehicle table
CREATE TABLE IF NOT EXISTS "Vehicle" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Vehicle_locationId_idx" ON "Vehicle"("locationId");

-- Create TransferDriver junction table
CREATE TABLE IF NOT EXISTS "TransferDriver" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferDriver_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TransferDriver_transferId_idx" ON "TransferDriver"("transferId");

-- Create TransferVehicle junction table
CREATE TABLE IF NOT EXISTS "TransferVehicle" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransferVehicle_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TransferVehicle_transferId_idx" ON "TransferVehicle"("transferId");

-- Create Sample table
CREATE TABLE IF NOT EXISTS "Sample" (
    "id" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "labLocationId" TEXT,
    "sampleBarcode" TEXT NOT NULL,
    "panelId" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT,
    "remediationStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Sample_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Sample_sampleBarcode_key" ON "Sample"("sampleBarcode");
CREATE INDEX IF NOT EXISTS "Sample_inventoryItemId_idx" ON "Sample"("inventoryItemId");
CREATE INDEX IF NOT EXISTS "Sample_labLocationId_idx" ON "Sample"("labLocationId");

-- Create TestResult table
CREATE TABLE IF NOT EXISTS "TestResult" (
    "id" TEXT NOT NULL,
    "sampleId" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "pass" BOOLEAN NOT NULL,
    "coaUrl" TEXT,
    "testedBy" TEXT,
    "testedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestResult_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TestResult_sampleId_idx" ON "TestResult"("sampleId");

-- Create StateRequest table
CREATE TABLE IF NOT EXISTS "StateRequest" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "sampleId" TEXT,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StateRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StateRequest_locationId_idx" ON "StateRequest"("locationId");
CREATE INDEX IF NOT EXISTS "StateRequest_status_idx" ON "StateRequest"("status");

-- Create InventoryAdjustment table
CREATE TABLE IF NOT EXISTS "InventoryAdjustment" (
    "id" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "adjustmentType" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "isRedFlagged" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "InventoryAdjustment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InventoryAdjustment_inventoryItemId_idx" ON "InventoryAdjustment"("inventoryItemId");

-- Create InventorySplit table
CREATE TABLE IF NOT EXISTS "InventorySplit" (
    "id" TEXT NOT NULL,
    "parentInventoryId" TEXT NOT NULL,
    "childInventoryIds" JSONB NOT NULL,
    "splitReason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "InventorySplit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InventorySplit_parentInventoryId_idx" ON "InventorySplit"("parentInventoryId");

-- Create InventoryCombination table
CREATE TABLE IF NOT EXISTS "InventoryCombination" (
    "id" TEXT NOT NULL,
    "sourceInventoryIds" JSONB NOT NULL,
    "targetInventoryId" TEXT,
    "newInventoryId" TEXT,
    "combinationType" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "InventoryCombination_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "TransferDriver" ADD CONSTRAINT "TransferDriver_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TransferVehicle" ADD CONSTRAINT "TransferVehicle_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "Sample"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
