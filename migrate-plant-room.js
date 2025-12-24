const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting Plant -> RoomId migration...');
  const plants = await prisma.plant.findMany({
    where: {
      room: { isNot: null }  // fixed filter here
    },
    select: { id: true, room: true, locationId: true },
  });

  for (const p of plants) {
    const room = await prisma.room.findFirst({
      where: { locationId: p.locationId, name: p.room, deletedAt: null },
    });

    if (room) {
      await prisma.plant.update({
        where: { id: p.id },
        data: { roomId: room.id },
      });
      console.log(`Mapped plant ${p.id} room '${p.room}' -> roomId ${room.id}`);
    } else {
      console.warn(`No room found for plant ${p.id} room='${p.room}' location=${p.locationId}`);
    }
  }
  console.log('Plant migration finished.');
}

main()
  .catch((e) => { console.error('Migration error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });