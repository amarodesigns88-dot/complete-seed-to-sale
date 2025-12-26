# Schema Sync and Build Issues - Resolution Guide

## Current Status

The application has **317 TypeScript compilation errors** due to mismatches between the code and the database schema.

## Root Cause

Many service files were written expecting different field names than what exists in the Prisma schema. The schema is correct and matches the applied migrations, but the code needs to be updated.

## Completed Fixes

1. ✅ Created database reset scripts:
   - `scripts/reset-database.sh` - Interactive script to drop and rebuild database
   - `scripts/drop-all-tables.sql` - SQL script for manual database reset

2. ✅ Fixed minor issues:
   - `user.service.ts` - JSON parsing type error
   - `inventory-type.service.ts` - Added missing `category` field
   - `cultivation.service.ts` - Commented out references to missing fields (isMother, cloneOffspringCount, seedOffspringCount)

3. ✅ Disabled incomplete modules in `app.module.ts` (though they still compile):
   - ConversionModule, TestingModule, LabModule
   - StateDashboardModule, StateReportingModule, LicenseeReportingModule
   - InventoryModule, TransferModule

## Remaining Issues

### 1. AuditLog Field Mismatches (Affects all modules)

**Schema has:**
```prisma
model AuditLog {
  actionType String  // NOT "action"
  entityType String  // NOT "entity"
  details    Json?   // NOT "oldValue", "newValue", or "locationId"
}
```

**Code uses:**
- `action:` instead of `actionType:`
- `entity:` instead of `entityType:`
- `oldValue:`, `newValue:`, `locationId:` (none of which exist in schema)

**Files affected:** ~20+ files across all modules

**Fix:** Search and replace in all .ts files:
```bash
# Replace action: with actionType:
find src -name "*.ts" -exec sed -i "s/action: '/actionType: '/g" {} \;

# Replace entity: with entityType:
find src -name "*.ts" -exec sed -i "s/entity: '/entityType: '/g" {} \;
```

### 2. Inventory Field Mismatches

**Schema has:**
```prisma
model InventoryItem {
  quantity      Float
  unit          String
  usableWeight  Float?   // NOT "usableWeightGrams"
  roomId        String?  // FK only, NO relation
  // NO "quantityGrams", "weightGrams", "strainId", "room" relation
}
```

**Code uses:**
- `quantityGrams` instead of `quantity`
- `weightGrams` instead of `quantity`
- `usableWeightGrams` instead of `usableWeight`
- `room: true` in include (should use roomId only)
- `strainId` field (doesn't exist)

**Files affected:**
- `src/inventory/inventory.service.ts` (~40 errors)
- `src/conversion/conversion.service.ts`
- `src/testing/testing.service.ts`
- Other inventory-related services

### 3. Transfer Field Mismatches

**Schema has:**
```prisma
model Transfer {
  senderLocationId    String
  receiverLocationId  String
  transferItems       TransferItem[] @relation("TransferItems")
  // NO "sourceLocationId", "destinationLocationId", "items", "estimatedArrival", "notes"
}
```

**Code uses:**
- `sourceLocationId` / `destinationLocationId` instead of `senderLocationId` / `receiverLocationId`
- `items` instead of `transferItems`
- `estimatedArrival` field (doesn't exist)
- `notes` field (doesn't exist)

**Files affected:**
- `src/transfer/transfer.service.ts` (~30 errors)

### 4. Plant Field Mismatches

**Schema missing fields** that code expects:
- `isMother` (Boolean)
- `cloneOffspringCount` (Int)
- `seedOffspringCount` (Int)

These are partially fixed with comments/workarounds in cultivation.service.ts, but the features won't work properly without adding these fields to the schema.

### 5. Model Name Mismatch

**Code uses:** `prisma.inventory`  
**Schema has:** `InventoryItem` model

**Files affected:**
- conversion.service.ts
- testing.service.ts
- state-dashboard.service.ts
- state-reporting.service.ts
- licensee-reporting.service.ts

## Recommended Resolution Steps

### Option 1: Fix Code to Match Schema (Recommended)

This is the minimal-change approach since the schema matches the migrations.

1. **Fix AuditLog usage globally:**
   ```bash
   # BE CAREFUL - test in a copy first!
   cd src
   # Fix action -> actionType
   find . -name "*.ts" ! -path "*/node_modules/*" -exec sed -i "s/action: '/actionType: '/g" {} \;
   # Fix entity -> entityType  
   find . -name "*.ts" ! -path "*/node_modules/*" -exec sed -i "s/entity: '/entityType: '/g" {} \;
   ```

2. **Fix inventory.service.ts systematically:**
   - Replace all `quantityGrams` with `quantity`
   - Replace all `weightGrams` with `quantity`
   - Replace all `usableWeightGrams` with `usableWeight`
   - Remove `room: true` from includes, use `roomId` instead
   - Remove references to `strainId`

3. **Fix transfer.service.ts:**
   - Replace `sourceLocationId` with `senderLocationId`
   - Replace `destinationLocationId` with `receiverLocationId`
   - Replace `items` with `transferItems`
   - Remove `estimatedArrival` and `notes` fields

4. **Fix conversion/testing/reporting services:**
   - Replace `prisma.inventory` with `prisma.inventoryItem`
   - Fix field names as per inventory fixes above

### Option 2: Update Schema to Match Code

Only do this if the code is correct and schema is wrong. This requires:

1. Add missing fields to schema:
   ```prisma
   model Plant {
     // Add these:
     isMother              Boolean  @default(false)
     cloneOffspringCount   Int      @default(0)
     seedOffspringCount    Int      @default(0)
   }
   
   model AuditLog {
     // Change these:
     action     String  // was actionType
     entity     String  // was entityType
     oldValue   Json?
     newValue   Json?
     locationId String?
   }
   
   // Rename model:
   model Inventory {  // was InventoryItem
     // Add these:
     quantityGrams      Float
     weightGrams        Float
     usableWeightGrams  Float?
     strainId           String?
     // Add relation:
     room               Room?
   }
   
   model Transfer {
     // Add these:
     sourceLocationId      String
     destinationLocationId String
     estimatedArrival      DateTime?
     notes                 String?
   }
   ```

2. Create and run new migration
3. Update all existing migrations

## Next Steps

1. **Decide on approach** (Option 1 recommended)
2. **Make systematic fixes** using search/replace and careful editing
3. **Test compilation:** `npm run build`
4. **Reset database:** `./scripts/reset-database.sh`
5. **Test application:** `npm run start:dev`
6. **Fix Docker build:** `docker-compose up --build`

## Notes

- The schema appears to be the "correct" version based on migrations
- The code seems to be from an earlier iteration or different branch
- Some features (mother plants, clones, seeds) may need schema additions to work properly
- Consider adding integration tests to catch schema mismatches earlier
