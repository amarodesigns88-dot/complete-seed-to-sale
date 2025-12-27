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
  console.log('🌱 Starting comprehensive seed data creation...\n');

  // Generate UUIDs for primary records
  const adminUserId = uuidv4();
  const stateAdminUserId = uuidv4();
  const stateAuditorUserId = uuidv4();
  const stateUserUserId = uuidv4();
  const licenseeAdminUserId = uuidv4();
  const licenseeManagerUserId = uuidv4();
  const licenseeGrowerUserId = uuidv4();
  const licenseeUserUserId = uuidv4();

  // Location IDs for different license types
  const cultivationLocationId = uuidv4();
  const processingLocationId = uuidv4();
  const dispensaryLocationId = uuidv4();
  const testingLocationId = uuidv4();

  // Other IDs
  const roomId = uuidv4();
  const plantId = uuidv4();
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

  // --- Create locations with different license types ---
  console.log('📍 Creating locations with various license types...');
  
  const cultivationLocation = await prisma.location.upsert({
    where: { ubi: 'CULT-UBI-001' },
    update: { updatedAt: new Date() },
    create: {
      id: cultivationLocationId,
      name: 'Green Valley Cultivation',
      ubi: 'CULT-UBI-001',
      licenseNumber: 'CULT-LIC-2024-001',
      licenseType: 'cultivation',
      enabledModules: ['cultivation', 'inventory', 'compliance', 'reporting'],
      isActive: true,
    },
  });

  const processingLocation = await prisma.location.upsert({
    where: { ubi: 'PROC-UBI-002' },
    update: { updatedAt: new Date() },
    create: {
      id: processingLocationId,
      name: 'Premium Processing Facility',
      ubi: 'PROC-UBI-002',
      licenseNumber: 'PROC-LIC-2024-002',
      licenseType: 'processing',
      enabledModules: ['processing', 'inventory', 'compliance', 'reporting'],
      isActive: true,
    },
  });

  const dispensaryLocation = await prisma.location.upsert({
    where: { ubi: 'DISP-UBI-003' },
    update: { updatedAt: new Date() },
    create: {
      id: dispensaryLocationId,
      name: 'Wellness Dispensary',
      ubi: 'DISP-UBI-003',
      licenseNumber: 'DISP-LIC-2024-003',
      licenseType: 'retail',
      enabledModules: ['pos', 'inventory', 'compliance', 'reporting'],
      isActive: true,
    },
  });

  const testingLocation = await prisma.location.upsert({
    where: { ubi: 'TEST-UBI-004' },
    update: { updatedAt: new Date() },
    create: {
      id: testingLocationId,
      name: 'QA Testing Laboratory',
      ubi: 'TEST-UBI-004',
      licenseNumber: 'TEST-LIC-2024-004',
      licenseType: 'testing',
      enabledModules: ['testing', 'compliance', 'reporting'],
      isActive: true,
    },
  });

  console.log('✅ Created 4 locations with different license types\n');

  // Hash password for all test users (same password for easy testing)
  const passwordHash = await bcrypt.hash('TestPassword123!', 10);

  // Create roles following the naming convention
  console.log('👥 Creating user roles...');
  const roles = [
    // Admin role
    { name: 'admin', description: 'System Administrator - Full access to everything' },
    
    // State roles
    { name: 'state_admin', description: 'State Administrator' },
    { name: 'state_auditor', description: 'State Auditor' },
    { name: 'state_user', description: 'State User - General access to state modules' },
    
    // Licensee roles
    { name: 'licensee_admin', description: 'Licensee Administrator' },
    { name: 'licensee_manager', description: 'Licensee Manager' },
    { name: 'licensee_grower', description: 'Licensee Grower' },
    { name: 'licensee_user', description: 'Licensee User - General access' },
  ];

  const createdRoles: Record<string, any> = {};
  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: { description: roleData.description },
      create: roleData,
    });
    createdRoles[roleData.name] = role;
  }
  console.log('✅ Created 8 user roles\n');

  // Create users for each role type
  console.log('👤 Creating test users for each role...');
  
  // 1. Admin User
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      name: 'System Administrator',
      updatedAt: new Date(),
      parentLocationId: null, // Admin has no specific location
      isActive: true,
      roles: { set: [{ id: createdRoles['admin'].id }] },
    },
    create: {
      id: adminUserId,
      name: 'System Administrator',
      email: 'admin@example.com',
      passwordHash,
      parentLocationId: null,
      isActive: true,
      roles: { connect: [{ id: createdRoles['admin'].id }] },
    },
  });

  // 2. State Admin User
  const stateAdminUser = await prisma.user.upsert({
    where: { email: 'state.admin@example.com' },
    update: {
      name: 'State Admin',
      updatedAt: new Date(),
      parentLocationId: null, // State users don't belong to a specific location
      isActive: true,
      roles: { set: [{ id: createdRoles['state_admin'].id }] },
    },
    create: {
      id: stateAdminUserId,
      name: 'State Admin',
      email: 'state.admin@example.com',
      passwordHash,
      parentLocationId: null,
      isActive: true,
      roles: { connect: [{ id: createdRoles['state_admin'].id }] },
    },
  });

  // 3. State Auditor User
  const stateAuditorUser = await prisma.user.upsert({
    where: { email: 'state.auditor@example.com' },
    update: {
      name: 'State Auditor',
      updatedAt: new Date(),
      parentLocationId: null,
      isActive: true,
      roles: { set: [{ id: createdRoles['state_auditor'].id }] },
    },
    create: {
      id: stateAuditorUserId,
      name: 'State Auditor',
      email: 'state.auditor@example.com',
      passwordHash,
      parentLocationId: null,
      isActive: true,
      roles: { connect: [{ id: createdRoles['state_auditor'].id }] },
    },
  });

  // 4. State User
  const stateUser = await prisma.user.upsert({
    where: { email: 'state.user@example.com' },
    update: {
      name: 'State User',
      updatedAt: new Date(),
      parentLocationId: null,
      isActive: true,
      roles: { set: [{ id: createdRoles['state_user'].id }] },
    },
    create: {
      id: stateUserUserId,
      name: 'State User',
      email: 'state.user@example.com',
      passwordHash,
      parentLocationId: null,
      isActive: true,
      roles: { connect: [{ id: createdRoles['state_user'].id }] },
    },
  });

  // 5. Licensee Admin User (assigned to cultivation location)
  const licenseeAdminUser = await prisma.user.upsert({
    where: { email: 'licensee.admin@example.com' },
    update: {
      name: 'Licensee Admin',
      updatedAt: new Date(),
      parentLocationId: cultivationLocation.id,
      isActive: true,
      roles: { set: [{ id: createdRoles['licensee_admin'].id }] },
    },
    create: {
      id: licenseeAdminUserId,
      name: 'Licensee Admin',
      email: 'licensee.admin@example.com',
      passwordHash,
      parentLocationId: cultivationLocation.id,
      isActive: true,
      roles: { connect: [{ id: createdRoles['licensee_admin'].id }] },
    },
  });

  // 6. Licensee Manager User (assigned to processing location)
  const licenseeManagerUser = await prisma.user.upsert({
    where: { email: 'licensee.manager@example.com' },
    update: {
      name: 'Licensee Manager',
      updatedAt: new Date(),
      parentLocationId: processingLocation.id,
      isActive: true,
      roles: { set: [{ id: createdRoles['licensee_manager'].id }] },
    },
    create: {
      id: licenseeManagerUserId,
      name: 'Licensee Manager',
      email: 'licensee.manager@example.com',
      passwordHash,
      parentLocationId: processingLocation.id,
      isActive: true,
      roles: { connect: [{ id: createdRoles['licensee_manager'].id }] },
    },
  });

  // 7. Licensee Grower User (assigned to cultivation location)
  const licenseeGrowerUser = await prisma.user.upsert({
    where: { email: 'licensee.grower@example.com' },
    update: {
      name: 'Licensee Grower',
      updatedAt: new Date(),
      parentLocationId: cultivationLocation.id,
      isActive: true,
      roles: { set: [{ id: createdRoles['licensee_grower'].id }] },
    },
    create: {
      id: licenseeGrowerUserId,
      name: 'Licensee Grower',
      email: 'licensee.grower@example.com',
      passwordHash,
      parentLocationId: cultivationLocation.id,
      isActive: true,
      roles: { connect: [{ id: createdRoles['licensee_grower'].id }] },
    },
  });

  // 8. Licensee User (assigned to dispensary location)
  const licenseeUser = await prisma.user.upsert({
    where: { email: 'licensee.user@example.com' },
    update: {
      name: 'Licensee User',
      updatedAt: new Date(),
      parentLocationId: dispensaryLocation.id,
      isActive: true,
      roles: { set: [{ id: createdRoles['licensee_user'].id }] },
    },
    create: {
      id: licenseeUserUserId,
      name: 'Licensee User',
      email: 'licensee.user@example.com',
      passwordHash,
      parentLocationId: dispensaryLocation.id,
      isActive: true,
      roles: { connect: [{ id: createdRoles['licensee_user'].id }] },
    },
  });

  console.log('✅ Created 8 test users (one for each role)\n');

  // Create permissions for licensee users
  console.log('🔐 Creating user permissions...');
  const permissionsToCreate = [
    { userId: licenseeAdminUser.id, locationId: cultivationLocation.id, modules: ['cultivation', 'inventory', 'compliance', 'reporting'] },
    { userId: licenseeManagerUser.id, locationId: processingLocation.id, modules: ['processing', 'inventory', 'compliance', 'reporting'] },
    { userId: licenseeGrowerUser.id, locationId: cultivationLocation.id, modules: ['cultivation', 'inventory'] },
    { userId: licenseeUser.id, locationId: dispensaryLocation.id, modules: ['pos', 'inventory'] },
  ];

  for (const perm of permissionsToCreate) {
    await prisma.userPermission.upsert({
      where: { id: uuidv4() },
      update: {
        userId: perm.userId,
        locationId: perm.locationId,
        modules: perm.modules,
        updatedAt: new Date(),
      },
      create: {
        id: uuidv4(),
        userId: perm.userId,
        locationId: perm.locationId,
        modules: perm.modules,
      },
    });
  }
  console.log('✅ Created permissions for licensee users\n');

  // --- Upsert default InventoryType records (all units = "units") ---
  console.log('📦 Creating inventory types...');
  const defaultTypes = [
    { name: 'clone', unit: 'units', isSource: true },
    { name: 'seed', unit: 'units', isSource: true },
    { name: 'mother_plant', unit: 'units', isSource: true },
    { name: 'plant_tissue', unit: 'units', isSource: true },
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
  console.log('✅ Created 4 inventory types\n');

  // Create inventory items (UUID ids) and link to InventoryType
  console.log('📊 Creating sample inventory items...');
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
      location: { connect: { id: cultivationLocation.id } },
    },
  });
}
console.log('✅ Created 4 inventory items\n');

  // Create a sample Room for the cultivation location (Vegetative)
  console.log('🏠 Creating sample room...');
 const room = await prisma.room.upsert({
  where: {
    locationId_name: {
      locationId: cultivationLocation.id,
      name: 'Vegetative',
    },
  },
  update: { updatedAt: new Date() },
  create: {
    id: roomId,
    location: { connect: { id: cultivationLocation.id } },
    name: 'Vegetative',
    roomType: 'cultivation',
    status: 'active',
  },
});
console.log('✅ Created vegetative room\n');

  // Create a sample plant that references the roomId and consumes one unit of the clone inventory
  console.log('🌿 Creating sample plant...');
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
            userId: licenseeAdminUser.id,
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
          locationId: cultivationLocation.id,
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
          userId: licenseeAdminUser.id,
          module: 'cultivation',
          entityType: 'plant',
          entityId: plantId,
          actionType: 'create',
          details: { strain: 'Blue Dream', roomId: room.id, phase: 'vegetative', sourceInventoryId: sourceInventoryIdForPlant },
        },
      });
    });
  }
  console.log('✅ Created Blue Dream plant\n');

  // Provide a useful output with the generated UUIDs
  const seeded = await prisma.inventoryItem.findMany({
    where: { locationId: cultivationLocation.id, id: { in: [invCloneId, invSeedId, invMotherId, invTissueId] } },
    select: { id: true, barcode: true, inventoryTypeId: true, inventoryTypeName: true, quantity: true },
  });

  console.log('\n' + '='.repeat(80));
  console.log('🎉 SEED DATA CREATION COMPLETE!');
  console.log('='.repeat(80) + '\n');

  console.log('📍 LOCATIONS CREATED:');
  console.log('  1. Cultivation: ' + cultivationLocation.name + ' (UBI: ' + cultivationLocation.ubi + ')');
  console.log('  2. Processing: ' + processingLocation.name + ' (UBI: ' + processingLocation.ubi + ')');
  console.log('  3. Dispensary: ' + dispensaryLocation.name + ' (UBI: ' + dispensaryLocation.ubi + ')');
  console.log('  4. Testing Lab: ' + testingLocation.name + ' (UBI: ' + testingLocation.ubi + ')');
  
  console.log('\n👥 TEST USERS CREATED (Password for all: TestPassword123!):');
  console.log('  1. Admin User:');
  console.log('     Email: admin@example.com');
  console.log('     Role: admin (Full system access)');
  console.log('');
  console.log('  2. State Admin:');
  console.log('     Email: state.admin@example.com');
  console.log('     Role: state_admin (State + Licensee module access)');
  console.log('');
  console.log('  3. State Auditor:');
  console.log('     Email: state.auditor@example.com');
  console.log('     Role: state_auditor (Compliance auditing)');
  console.log('');
  console.log('  4. State User:');
  console.log('     Email: state.user@example.com');
  console.log('     Role: state_user (General state access)');
  console.log('');
  console.log('  5. Licensee Admin:');
  console.log('     Email: licensee.admin@example.com');
  console.log('     Role: licensee_admin (Full location admin)');
  console.log('     Location: ' + cultivationLocation.name);
  console.log('');
  console.log('  6. Licensee Manager:');
  console.log('     Email: licensee.manager@example.com');
  console.log('     Role: licensee_manager (Location management)');
  console.log('     Location: ' + processingLocation.name);
  console.log('');
  console.log('  7. Licensee Grower:');
  console.log('     Email: licensee.grower@example.com');
  console.log('     Role: licensee_grower (Cultivation focus)');
  console.log('     Location: ' + cultivationLocation.name);
  console.log('');
  console.log('  8. Licensee User:');
  console.log('     Email: licensee.user@example.com');
  console.log('     Role: licensee_user (Basic access)');
  console.log('     Location: ' + dispensaryLocation.name);

  console.log('\n📦 INVENTORY ITEMS: ' + seeded.length + ' items created');
  console.log('🏠 ROOMS: 1 vegetative room created');
  console.log('🌿 PLANTS: 1 Blue Dream plant created');

  console.log('\n🚀 LOGIN AT: http://localhost:5173');
  console.log('📚 API DOCS: http://localhost:3000/api-docs');
  console.log('\n' + '='.repeat(80) + '\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });