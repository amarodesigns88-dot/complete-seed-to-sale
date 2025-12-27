import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

function generate16DigitBarcode(): string {
  const left = randomInt(0, 100_000_000).toString().padStart(8, '0');
  const right = randomInt(0, 100_000_000).toString().padStart(8, '0');
  return `${left}${right}`;
}

async function main() {
  // Generate UUIDs for primary records
  const locationId = uuidv4();
  const roomId = uuidv4();
  const plantId = uuidv4();
  const userId = uuidv4();
  const permId = uuidv4();
  const invCloneId = uuidv4();
  const invSeedId = uuidv4();
  const invMotherId = uuidv4();
  const invTissueId = uuidv4();

  // Legacy IDs used previously (optional cleanup)
  const legacyIds = {
    location: ['ubi-123'],
    rooms: ['room-veg-1'],
    plants: ['plant-1'],
    users: ['user-123'],
    perms: ['perm-1'],
    inventory: ['inv-clone-1', 'inv-seed-1', 'inv-mother-1', 'inv-tissue-1'],
  };

  // --- Cleanup legacy dev records (safe in local/dev only) ---
  // Note: Skip this block if you want to preserve old test data.
  await prisma.auditLog.deleteMany({
    where: {
      OR: [
        { entityId: { in: [...legacyIds.inventory, ...legacyIds.plants, ...legacyIds.rooms, ...legacyIds.users, ...legacyIds.perms] } },
      ],
    },
  });

  await prisma.destruction.deleteMany({ where: { OR: [{ plantId: { in: legacyIds.plants } }, { inventoryItemId: { in: legacyIds.inventory } }] } }).catch(() => {});
  await prisma.cure.deleteMany({ where: { harvestId: { in: [] } } }).catch(() => {});
  await prisma.harvest.deleteMany({ where: { plantId: { in: legacyIds.plants } } }).catch(() => {});
  await prisma.roomMove.deleteMany({ where: { OR: [{ plantId: { in: legacyIds.plants } }, { inventoryItemId: { in: legacyIds.inventory } }] } }).catch(() => {});
  await prisma.plant.deleteMany({ where: { id: { in: legacyIds.plants } } }).catch(() => {});
  await prisma.room.deleteMany({ where: { id: { in: legacyIds.rooms } } }).catch(() => {});
  await prisma.inventoryItem.deleteMany({ where: { id: { in: legacyIds.inventory } } }).catch(() => {});
  await prisma.userPermission.deleteMany({ where: { id: { in: legacyIds.perms } } }).catch(() => {});
  await prisma.user.deleteMany({ where: { id: { in: legacyIds.users } } }).catch(() => {});
  await prisma.location.deleteMany({ where: { id: { in: legacyIds.location } } }).catch(() => {});

  // --- Create new UUID-based location (keep UBI field for login) ---
  const parentLocation = await prisma.location.upsert({
    where: { ubi: 'TESTUBI123' }, // use ubi for uniqueness/upsert
    update: { updatedAt: new Date() },
    create: {
      id: locationId,
      name: 'Test Parent Location',
      ubi: 'TESTUBI123',
      licenseNumber: null,
      licenseType: 'licensee',
      enabledModules: ['cultivation', 'inventory', 'pos'],
    },
  });

  // Hash password for test user
  const passwordHash = await bcrypt.hash('TestPassword123!', 10);

  // Create role first to ensure it exists
  const role = await prisma.role.upsert({
    where: { name: 'licensee_admin' },
    update: {},
    create: { 
      name: 'licensee_admin',
      description: 'Licensee Administrator Role',
    }
  });

  // Create or upsert user by email (keeps email uniqueness)
  const user = await prisma.user.upsert({
    where: { email: 'testuser@example.com' },
    update: {
      name: 'Test User',
      updatedAt: new Date(),
      parentLocationId: parentLocation.id,
      isActive: true,
      roles: { 
        connect: [{ id: role.id }]
      },
    },
    create: {
      id: userId,
      name: 'Test User',
      email: 'testuser@example.com',
      passwordHash,
      parentLocationId: parentLocation.id,
      isActive: true,
      roles: { 
        connect: [{ id: role.id }]
      },
    },
  });

  // Upsert a permission record for the test user (scoped to the parent location)
  await prisma.userPermission.upsert({
    where: { id: permId },
    update: {
      userId: user.id,
      locationId: parentLocation.id,
      modules: ['cultivation', 'inventory'],
      updatedAt: new Date(),
    },
    create: {
      id: permId,
      userId: user.id,
      locationId: parentLocation.id,
      modules: ['cultivation', 'inventory'],
    },
  });

  // --- Upsert default InventoryType records (all units = "units") ---
  const defaultTypes = [
    { name: 'clone', unit: 'units', isSource: true },
    { name: 'seed', unit: 'units', isSource: true },
    { name: 'mother_plant', unit: 'units', isSource: true },
    { name: 'plant_tissue', unit: 'units', isSource: true }, // per your request plant_tissue also 'units'
  ];

  const typeMap: Record<string, string> = {};
  for (const t of defaultTypes) {
    const it = await prisma.inventoryType.upsert({
      where: { name: t.name },
      update: {
        unit: t.unit,
        isSource: t.isSource,
        updatedAt: new Date(),
      },
      create: {
        id: uuidv4(),
        name: t.name,
        description: `${t.name} (default)`,
        unit: t.unit,
        isSource: t.isSource,
        category: t.isSource ? 'Source' : 'General',
      },
    });
    typeMap[t.name] = it.id;
  }

  // Create inventory items (UUID ids) and link to InventoryType
  const sourceInventoryItems = [
    {
      id: invCloneId,
      inventoryTypeName: 'clone',
      quantity: 10,
      status: 'active',
      productName: 'Clone - Blue Dream',
      unit: 'units',
    },
    {
      id: invSeedId,
      inventoryTypeName: 'seed',
      quantity: 20,
      status: 'active',
      productName: 'Seed - Blue Dream',
      unit: 'units',
    },
    {
      id: invMotherId,
      inventoryTypeName: 'mother_plant',
      quantity: 5,
      status: 'active',
      productName: 'Mother Plant - Blue Dream',
      unit: 'units',
    },
    {
      id: invTissueId,
      inventoryTypeName: 'plant_tissue',
      quantity: 15,
      status: 'active',
      productName: 'Plant Tissue - Blue Dream',
      unit: 'units',
    },
  ];

for (const item of sourceInventoryItems) {
  const barcode = generate16DigitBarcode();
  await prisma.inventoryItem.upsert({
    where: { id: item.id },
    update: {
      quantity: item.quantity,
      status: item.status,
      productName: item.productName,
      unit: item.unit,
      updatedAt: new Date(),
      inventoryType: { connect: { id: typeMap[item.inventoryTypeName] } },
    },
    create: {
      id: item.id,
      inventoryTypeName: item.inventoryTypeName,
      inventoryType: { connect: { id: typeMap[item.inventoryTypeName] } },
      quantity: item.quantity,
      status: item.status,
      productName: item.productName,
      unit: item.unit,
      barcode,
      location: { connect: { id: parentLocation.id } },
    },
  });
}

  // Create a sample Room for the location (Vegetative)
 const room = await prisma.room.upsert({
  where: {
    locationId_name: {
      locationId: parentLocation.id,
      name: 'Vegetative',
    },
  },
  update: { updatedAt: new Date() },
  create: {
    id: roomId,
    location: { connect: { id: parentLocation.id } },
    name: 'Vegetative',
    roomType: 'cultivation',
    status: 'active',
  },
});

  // Create a sample plant that references the roomId and consumes one unit of the clone inventory
  const plantExists = await prisma.plant.findUnique({ where: { id: plantId } });
  if (!plantExists) {
    await prisma.$transaction(async (tx) => {
      const sourceInv = await tx.inventoryItem.findUnique({ where: { id: invCloneId } });
      let sourceInventoryIdForPlant: string | null = null;

      if (sourceInv && sourceInv.quantity && sourceInv.quantity >= 1) {
        await tx.inventoryItem.update({
          where: { id: invCloneId },
          data: { quantity: { decrement: 1 } },
        });
        sourceInventoryIdForPlant = sourceInv.id;
        await tx.auditLog.create({
          data: {
            userId: user.id,
            module: 'inventory',
            entityType: 'inventoryItem',
            entityId: sourceInv.id,
            actionType: 'consume',
            details: { consumeAmount: 1, note: 'Seeded plant from seed data' },
          },
        });
      }

      const barcode = generate16DigitBarcode();
      await tx.plant.create({
        data: {
          id: plantId,
          locationId: parentLocation.id,
          strain: 'Blue Dream',
          roomId: room.id,
          phase: 'vegetative',
          barcode,
          sourceInventoryId: sourceInventoryIdForPlant,
          status: 'active',
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          module: 'cultivation',
          entityType: 'plant',
          entityId: plantId,
          actionType: 'create',
          details: { strain: 'Blue Dream', roomId: room.id, phase: 'vegetative', sourceInventoryId: sourceInventoryIdForPlant },
        },
      });
    });
  }

  // Provide a useful output with the generated UUIDs so you can paste them into Postman
  const seeded = await prisma.inventoryItem.findMany({
    where: { locationId: parentLocation.id, id: { in: [invCloneId, invSeedId, invMotherId, invTissueId] } },
    select: { id: true, barcode: true, inventoryTypeId: true, inventoryTypeName: true, quantity: true },
  });

  console.log('Seed data created:', {
    parentLocationId: parentLocation.id,
    parentLocationUbi: parentLocation.ubi,
    userEmail: user.email,
    userId: user.id,
    permissionId: permId,
    roomId: room.id,
    plantId,
    seededInventory: seeded,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });