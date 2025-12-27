// src/cultivation/cultivation.service.spec.ts
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CultivationService } from './cultivation.service';
import { PrismaService } from '../prisma/prisma.service';

type MockFn = jest.Mock<any, any>;
const makeMock = (name = ''): MockFn => jest.fn();

describe('CultivationService (unit)', () => {
  let service: CultivationService;
  let prisma: Partial<Record<string, any>>;

  beforeEach(() => {
    // Create a lightweight mock of prisma with the methods used by the service.
    prisma = {
      // inventoryItem methods used by service
      inventoryItem: {
        findFirst: makeMock(),
        findUnique: makeMock(),
        updateMany: makeMock(),
        update: makeMock(),
        create: makeMock(),
        count: makeMock(),
      },
      // plant
      plant: {
        findMany: makeMock(),
        findUnique: makeMock(),
        findFirst: makeMock(),
        update: makeMock(),
        create: makeMock(),
      },
      // room
      room: {
        findUnique: makeMock(),
        findFirst: makeMock(),
        findMany: makeMock(),
      },
      // harvest
      harvest: {
        create: makeMock(),
        findUnique: makeMock(),
        findFirst: makeMock(),
        update: makeMock(),
      },
      // cure
      cure: {
        create: makeMock(),
        findFirst: makeMock(),
      },
      // destruction
      destruction: {
        create: makeMock(),
      },
      // audit log
      auditLog: {
        create: makeMock(),
      },
      // roomMove
      roomMove: {
        create: makeMock(),
      },
      // transaction
      $transaction: makeMock(),
    };

    service = new CultivationService(prisma as unknown as PrismaService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createPlant', () => {
    it('creates a plant and consumes inventory (happy path)', async () => {
      const locationId = 'loc-1';
      const roomId = 'room-1';
      const chosenSrcId = 'src-1';
      const userId = 'user-1';

      // hasSourceInventory uses inventoryItem.count
      (prisma.inventoryItem.count as MockFn).mockResolvedValueOnce(1);

      // validate room
      (prisma.room.findUnique as MockFn).mockResolvedValueOnce({
        id: roomId,
        locationId,
        status: 'active',
        deletedAt: null,
      });

      // inventory auto-pick fallback uses findFirst (service may call findFirst)
      (prisma.inventoryItem.findFirst as MockFn).mockResolvedValueOnce({
        id: chosenSrcId,
        locationId,
        quantity: 10,
        status: 'active',
      });

      // Mock $transaction to receive a tx object with required methods
      (prisma.$transaction as MockFn).mockImplementation(async (cb: any) => {
        const tx: any = {
          inventoryItem: {
            updateMany: makeMock().mockResolvedValue({ count: 1 }),
          },
          plant: {
            create: makeMock().mockResolvedValue({
              id: 'plant-1',
              locationId,
              strain: 'OG Kush',
              roomId,
              phase: 'veg',
              barcode: '0123',
            }),
          },
          auditLog: {
            create: makeMock().mockResolvedValue({}),
          },
        };
        return cb(tx);
      });

      const created = await service.createPlant({
        locationId,
        strain: 'OG Kush',
        roomId,
        phase: 'veg',
        sourceInventoryId: null,
        userId,
        consumeAmount: 1,
      });

      expect(created).toBeDefined();
      expect(created.id).toBe('plant-1');
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('throws if inventory updateMany count is 0 (concurrent depletion)', async () => {
      const locationId = 'loc-1';
      const roomId = 'room-1';

      // hasSourceInventory positive
      (prisma.inventoryItem.count as MockFn).mockResolvedValueOnce(1);

      (prisma.room.findUnique as MockFn).mockResolvedValueOnce({
        id: roomId,
        locationId,
        status: 'active',
        deletedAt: null,
      });

      (prisma.inventoryItem.findFirst as MockFn).mockResolvedValueOnce({
        id: 'src-1',
        locationId,
        quantity: 1,
        status: 'active',
      });

      (prisma.$transaction as MockFn).mockImplementation(async (cb: any) => {
        const tx: any = {
          inventoryItem: {
            updateMany: makeMock().mockResolvedValue({ count: 0 }), // simulate concurrent depletion
          },
        };
        return cb(tx);
      });

      await expect(
        service.createPlant({
          locationId,
          strain: 'Blue Dream',
          roomId,
          phase: 'veg',
          userId: 'u',
          consumeAmount: 1,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('softDeletePlant', () => {
    it('sets deletedAt and writes an audit log', async () => {
      const locationId = 'loc-1';
      const plantId = 'plant-1';

      (prisma.plant.findFirst as MockFn).mockResolvedValueOnce({
        id: plantId,
        locationId,
        deletedAt: null,
      });

      const deletedAtDate = new Date();
      (prisma.plant.update as MockFn).mockResolvedValueOnce({
        id: plantId,
        deletedAt: deletedAtDate,
        status: 'deleted',
      });

      (prisma.auditLog.create as MockFn).mockResolvedValue({});

      const result = await service.softDeletePlant(locationId, plantId, 'user-1');

      expect(prisma.plant.findFirst).toHaveBeenCalledWith({ where: { id: plantId, locationId, deletedAt: null } });
      expect(prisma.plant.update).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityId: plantId,
            actionType: 'delete',
            details: expect.objectContaining({
              deletedAt: deletedAtDate.toISOString(),
            }),
          }),
        }),
      );
      expect(result).toBeDefined();
      expect(result.deletedAt).toBe(deletedAtDate);
    });

    it('throws NotFoundException if plant missing or already deleted', async () => {
      (prisma.plant.findFirst as MockFn).mockResolvedValueOnce(null);
      await expect(service.softDeletePlant('loc-x', 'plant-xyz')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createCure', () => {
    it('throws BadRequestException if dryFlowerWeight > wetFlowerWeight', async () => {
      // Mock $transaction to return a tx where harvest exists with wetFlowerWeight 100
      (prisma.$transaction as MockFn).mockImplementation(async (cb: any) => {
        const tx: any = {
          harvest: {
            findUnique: makeMock().mockResolvedValue({
              id: 'harvest-1',
              plantId: 'plant-1',
              wetFlowerWeight: 100,
              batchId: 'batch-1',
            }),
          },
          plant: {
            findUnique: makeMock().mockResolvedValue({
              id: 'plant-1',
              locationId: 'loc-1',
            }),
          },
        };
        return cb(tx);
      });

      await expect(service.createCure('harvest-1', { dryFlowerWeight: 200 })).rejects.toThrow(BadRequestException);
    });

    it('creates cure and inventory items (happy path)', async () => {
      const harvest = {
        id: 'harvest-1',
        plantId: 'plant-1',
        wetFlowerWeight: 100,
        batchId: 'batch-42',
      };

      const plant = {
        id: 'plant-1',
        locationId: 'loc-1',
      };

      (prisma.$transaction as MockFn).mockImplementation(async (cb: any) => {
        const tx: any = {
          harvest: {
            findUnique: makeMock().mockResolvedValue(harvest),
          },
          plant: {
            findUnique: makeMock().mockResolvedValue(plant),
          },
          cure: {
            create: makeMock().mockResolvedValue({
              id: 'cure-1',
              harvestId: harvest.id,
              plantId: plant.id,
              dryFlowerWeight: 20,
            }),
          },
          inventoryItem: {
            create: makeMock().mockResolvedValueOnce({ id: 'inv-1' }).mockResolvedValueOnce({ id: 'inv-2' }),
          },
          auditLog: {
            create: makeMock().mockResolvedValue({}),
          },
        };
        return cb(tx);
      });

      const res = await service.createCure('harvest-1', { dryFlowerWeight: 20, dryOtherMaterialWeight: 5 });

      expect(res).toBeDefined();
      expect(res.cure).toBeDefined();
      expect(Array.isArray(res.inventoryItems)).toBe(true);
      expect(res.inventoryItems.length).toBeGreaterThanOrEqual(1);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('throws NotFoundException when harvest not found', async () => {
      (prisma.$transaction as MockFn).mockImplementation(async (cb: any) => {
        const tx: any = {
          harvest: {
            findUnique: makeMock().mockResolvedValue(null),
          },
        };
        return cb(tx);
      });

      await expect(service.createCure('missing-harvest', { dryFlowerWeight: 1 })).rejects.toThrow(NotFoundException);
    });
  });

  // Additional tests: createDestruction, createRoomMove, updatePlant
  describe('createDestruction', () => {
    it('creates destruction for inventory item and decrements quantity', async () => {
      const params = {
        inventoryItemId: 'inv-1',
        destructionReason: 'Expired',
        wasteAmount: 5,
        userId: 'user-1',
      };

      // $transaction path (inventory branch)
      (prisma.$transaction as MockFn).mockImplementation(async (cb: any) => {
        const tx: any = {
          inventoryItem: {
            findUnique: makeMock().mockResolvedValue({
              id: params.inventoryItemId,
              quantity: 10,
            }),
            update: makeMock().mockResolvedValue({
              id: params.inventoryItemId,
              quantity: 5,
            }),
          },
          auditLog: {
            create: makeMock().mockResolvedValue({}),
          },
          destruction: {
            create: makeMock().mockResolvedValue({
              id: 'destruct-1',
              inventoryItemId: params.inventoryItemId,
              destructionReason: params.destructionReason,
              wasteWeight: params.wasteAmount,
            }),
          },
        };
        return cb(tx);
      });

      const result = await service.createDestruction(params);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBe('destruct-1');
    });

    it('creates destruction for plant and updates plant and harvest', async () => {
      const params = {
        plantId: 'plant-1',
        destructionReason: 'Disease',
        wasteAmount: 3,
        userId: 'user-1',
      };

      (prisma.$transaction as MockFn).mockImplementation(async (cb: any) => {
        const tx: any = {
          inventoryItem: {
            findUnique: makeMock().mockResolvedValue(null),
          },
          plant: {
            findUnique: makeMock().mockResolvedValue({
              id: params.plantId,
              status: 'active',
            }),
            update: makeMock().mockResolvedValue({
              id: params.plantId,
              status: 'destroyed',
            }),
          },
          harvest: {
            findFirst: makeMock().mockResolvedValue({
              id: 'harvest-1',
              plantId: params.plantId,
              wetFlowerWeight: 10,
            }),
            update: makeMock().mockResolvedValue({
              id: 'harvest-1',
              wetFlowerWeight: 7,
            }),
          },
          cure: {
            findFirst: makeMock().mockResolvedValue(null),
          },
          auditLog: {
            create: makeMock().mockResolvedValue({}),
          },
          destruction: {
            create: makeMock().mockResolvedValue({
              id: 'destruct-2',
              plantId: params.plantId,
              destructionReason: params.destructionReason,
              wasteWeight: params.wasteAmount,
            }),
          },
        };
        return cb(tx);
      });

      const result = await service.createDestruction(params);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBe('destruct-2');
    });

    it('throws if neither plantId nor inventoryItemId provided', async () => {
      await expect(
        service.createDestruction({
          destructionReason: 'Reason',
          wasteAmount: 1,
          userId: 'user-1',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws if wasteAmount is invalid', async () => {
      await expect(
        service.createDestruction({
          plantId: 'plant-1',
          destructionReason: 'Reason',
          wasteAmount: 0,
          userId: 'user-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createRoomMove', () => {
    it('creates a room move for a plant and updates plant roomId', async () => {
      const plantId = 'plant-1';
      const locationId = 'loc-1';
      const fromRoomId = 'room-1';
      const toRoomId = 'room-2';
      const userId = 'user-1';

      (prisma.plant.findUnique as MockFn).mockResolvedValueOnce({
        id: plantId,
        roomId: fromRoomId,
        locationId,
      });

      // IMPORTANT: service calls room.findUnique for the target room first (toRoom), then for the fromRoom.
      (prisma.room.findUnique as MockFn)
        .mockResolvedValueOnce({ id: toRoomId, locationId, status: 'active', deletedAt: null }) // toRoom
        .mockResolvedValueOnce({ id: fromRoomId, locationId, status: 'active', deletedAt: null }); // fromRoom

      (prisma.roomMove.create as MockFn).mockResolvedValue({
        id: 'move-1',
        plantId,
        fromRoomId,
        toRoomId,
      });

      // Mock update to resolve with the new roomId
      (prisma.plant.update as MockFn).mockImplementation(({ data }) => {
        // Return the updated plant with the roomId from the update data
        return Promise.resolve({
          id: plantId,
          roomId: data.roomId,
        });
      });

      (prisma.auditLog.create as MockFn).mockResolvedValue({});

      const result = await service.createRoomMove(plantId, null, { fromRoomId, toRoomId }, userId);

      expect(prisma.roomMove.create).toHaveBeenCalled();
      expect(prisma.plant.update).toHaveBeenCalledWith({
        where: { id: plantId },
        data: { roomId: toRoomId },
        module: "Cultivation",
      });
      expect(prisma.auditLog.create).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.id).toBe('move-1');
    });

    it('throws if toRoomId is missing', async () => {
      await expect(service.createRoomMove('plant-1', null, { fromRoomId: 'r1' } as any, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws if plant and inventoryItem both missing', async () => {
      await expect(service.createRoomMove(undefined, undefined, { toRoomId: 'r2' }, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('updatePlant', () => {
    it('updates plant with valid data and logs audit', async () => {
      const locationId = 'loc-1';
      const plantId = 'plant-1';
      const userId = 'user-1';

      (prisma.plant.findFirst as MockFn).mockResolvedValueOnce({
        id: plantId,
        locationId,
        deletedAt: null,
      });

      (prisma.room.findUnique as MockFn).mockResolvedValueOnce({
        id: 'room-2',
        locationId,
        status: 'active',
        deletedAt: null,
      });

      (prisma.inventoryItem.findUnique as MockFn).mockResolvedValueOnce({
        id: 'src-1',
        locationId,
      });

      (prisma.plant.update as MockFn).mockResolvedValueOnce({
        id: plantId,
        strain: 'New Strain',
        roomId: 'room-2',
        phase: 'flowering',
      });

      (prisma.auditLog.create as MockFn).mockResolvedValue({});

      const updateData = {
        strain: 'New Strain',
        roomId: 'room-2',
        phase: 'flowering',
        sourceInventoryId: 'src-1',
      };

      const result = await service.updatePlant(locationId, plantId, updateData, userId);

      expect(prisma.plant.findFirst).toHaveBeenCalledWith({ where: { id: plantId, locationId, deletedAt: null } });
      expect(prisma.room.findUnique).toHaveBeenCalledWith({ where: { id: 'room-2' } });
      expect(prisma.inventoryItem.findUnique).toHaveBeenCalledWith({ where: { id: 'src-1' } });
      expect(prisma.plant.update).toHaveBeenCalledWith({ where: { id: plantId }, data: updateData });
      expect(prisma.auditLog.create).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.strain).toBe('New Strain');
    });

    it('throws if plant not found', async () => {
      (prisma.plant.findFirst as MockFn).mockResolvedValueOnce(null);
      await expect(service.updatePlant('loc-1', 'plant-xyz', {}, 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('throws if new room invalid', async () => {
      (prisma.plant.findFirst as MockFn).mockResolvedValueOnce({
        id: 'plant-1',
        locationId: 'loc-1',
        deletedAt: null,
      });
      (prisma.room.findUnique as MockFn).mockResolvedValueOnce(null);

      await expect(
        service.updatePlant('loc-1', 'plant-1', { roomId: 'bad-room' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws if sourceInventoryId invalid', async () => {
      (prisma.plant.findFirst as MockFn).mockResolvedValueOnce({
        id: 'plant-1',
        locationId: 'loc-1',
        deletedAt: null,
      });
      (prisma.room.findUnique as MockFn).mockResolvedValueOnce({
        id: 'room-1',
        locationId: 'loc-1',
        status: 'active',
        deletedAt: null,
      });
      (prisma.inventoryItem.findUnique as MockFn).mockResolvedValueOnce(null);

      await expect(
        service.updatePlant('loc-1', 'plant-1', { sourceInventoryId: 'bad-src' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});