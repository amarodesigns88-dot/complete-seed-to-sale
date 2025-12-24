const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting RoomMove from/to Room -> IDs migration...');
  const moves = await prisma.roomMove.findMany({
    select: { id: true, fromRoom: true, toRoom: true, plantId: true, inventoryItemId: true },
  });

  for (const m of moves) {
    // Determine locationId from plant or inventoryItem
    let locationId = null;
    if (m.plantId) {
      const plant = await prisma.plant.findUnique({ where: { id: m.plantId }, select: { locationId: true } });
      locationId = plant ? plant.locationId : null;
    }
    if (!locationId && m.inventoryItemId) {
      const inv = await prisma.inventoryItem.findUnique({ where: { id: m.inventoryItemId }, select: { locationId: true } });
      locationId = inv ? inv.locationId : null;
    }

    if (!locationId) {
      console.warn(`Cannot determine location for RoomMove ${m.id}; skipping`);
      continue;
    }

    const updates = {};
    if (m.fromRoom) {
      const fromRoom = await prisma.room.findFirst({
        where: { locationId, name: m.fromRoom, deletedAt: null },
      });
      if (fromRoom) updates.fromRoomId = fromRoom.id;
      else console.warn(`RoomMove ${m.id} fromRoom '${m.fromRoom}' not found in location ${locationId}`);
    }
    if (m.toRoom) {
      const toRoom = await prisma.room.findFirst({
        where: { locationId, name: m.toRoom, deletedAt: null },
      });
      if (toRoom) updates.toRoomId = toRoom.id;
      else console.warn(`RoomMove ${m.id} toRoom '${m.toRoom}' not found in location ${locationId}`);
    }

    if (Object.keys(updates).length) {
      await prisma.roomMove.update({ where: { id: m.id }, data: updates });
      console.log(`Updated RoomMove ${m.id} with ${JSON.stringify(updates)}`);
    }
  }
  console.log('RoomMove migration finished.');
}

main()
  .catch((e) => { console.error('Migration error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });