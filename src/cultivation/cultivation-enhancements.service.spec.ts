import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CultivationService } from './cultivation.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CultivationService - Sprints 3-4 Enhancements', () => {
  let service: CultivationService;
  let prisma: any;

  beforeEach(async () => {
    const mockPrisma = {
      plant: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      room: {
        findUnique: jest.fn(),
      },
      inventoryItem: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CultivationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CultivationService>(CultivationService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('convertToMotherPlant', () => {
    it('should successfully convert an active plant to mother plant', async () => {
      const locationId = 'loc-123';
      const plantId = 'plant-123';
      const mockPlant = {
        id: plantId,
        locationId,
        status: 'active',
        strain: 'Blue Dream',
        isMother: false,
      };

      const mockUpdated = {
        ...mockPlant,
        isMother: true,
        status: 'mother',
      };

      prisma.plant.findFirst.mockResolvedValue(mockPlant);
      prisma.plant.update.mockResolvedValue(mockUpdated);
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.convertToMotherPlant(locationId, plantId, 'Test notes', 'user-123');

      expect(result).toEqual(mockUpdated);
      expect(prisma.plant.update).toHaveBeenCalledWith({
        where: { id: plantId },
        data: { isMother: true, status: 'mother' },
        module: "Cultivation",
      });
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityType: 'plant',
            entityId: plantId,
            actionType: 'convert_to_mother',
          }),
        }),
      );
    });

    it('should throw BadRequestException if plant is not active', async () => {
      const locationId = 'loc-123';
      const plantId = 'plant-123';
      const mockPlant = {
        id: plantId,
        locationId,
        status: 'harvested',
        isMother: false,
      };

      prisma.plant.findFirst.mockResolvedValue(mockPlant);

      await expect(
        service.convertToMotherPlant(locationId, plantId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if plant does not exist', async () => {
      prisma.plant.findFirst.mockResolvedValue(null);

      await expect(
        service.convertToMotherPlant('loc-123', 'plant-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateClones', () => {
    it('should generate clones from mother plant', async () => {
      const locationId = 'loc-123';
      const motherPlantId = 'mother-123';
      const mockMotherPlant = {
        id: motherPlantId,
        locationId,
        status: 'mother',
        isMother: true,
        strain: 'Blue Dream',
        cloneOffspringCount: 5,
      };

      const mockRoom = {
        id: 'room-123',
        locationId,
        status: 'active',
        deletedAt: null,
      };

      const mockCloneInventory = {
        id: 'inv-123',
        locationId,
        inventoryTypeId: 'clone',
        quantity: 10,
      };

      prisma.plant.findFirst.mockResolvedValue(mockMotherPlant);
      prisma.room.findUnique.mockResolvedValue(mockRoom);
      prisma.inventoryItem.create.mockResolvedValue(mockCloneInventory);
      prisma.plant.update.mockResolvedValue({
        ...mockMotherPlant,
        cloneOffspringCount: 15,
      });
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.generateClones(
        locationId,
        motherPlantId,
        { quantity: 10, roomId: 'room-123', notes: 'Test clones' },
        'user-123',
      );

      expect(result.cloneInventory).toEqual(mockCloneInventory);
      expect(prisma.inventoryItem.create).toHaveBeenCalled();
      expect(prisma.plant.update).toHaveBeenCalledWith({
        where: { id: motherPlantId },
        data: { cloneOffspringCount: { increment: 10 } },
        module: "Cultivation",
      });
    });

    it('should throw BadRequestException if plant is not a mother plant', async () => {
      const mockPlant = {
        id: 'plant-123',
        locationId: 'loc-123',
        status: 'active',
        isMother: false,
      };

      prisma.plant.findFirst.mockResolvedValue(mockPlant);

      await expect(
        service.generateClones('loc-123', 'plant-123', {
          quantity: 10,
          roomId: 'room-123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if room is invalid', async () => {
      const mockMotherPlant = {
        id: 'mother-123',
        locationId: 'loc-123',
        status: 'mother',
        isMother: true,
      };

      prisma.plant.findFirst.mockResolvedValue(mockMotherPlant);
      prisma.room.findUnique.mockResolvedValue(null);

      await expect(
        service.generateClones('loc-123', 'mother-123', {
          quantity: 10,
          roomId: 'invalid-room',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('generateSeeds', () => {
    it('should generate seeds from mother plant', async () => {
      const locationId = 'loc-123';
      const motherPlantId = 'mother-123';
      const mockMotherPlant = {
        id: motherPlantId,
        locationId,
        status: 'mother',
        isMother: true,
        strain: 'Blue Dream',
        seedOffspringCount: 20,
      };

      const mockRoom = {
        id: 'room-123',
        locationId,
        status: 'active',
        deletedAt: null,
      };

      const mockSeedInventory = {
        id: 'inv-seed-123',
        locationId,
        inventoryTypeId: 'seed',
        quantity: 50,
      };

      prisma.plant.findFirst.mockResolvedValue(mockMotherPlant);
      prisma.room.findUnique.mockResolvedValue(mockRoom);
      prisma.inventoryItem.create.mockResolvedValue(mockSeedInventory);
      prisma.plant.update.mockResolvedValue({
        ...mockMotherPlant,
        seedOffspringCount: 70,
      });
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.generateSeeds(
        locationId,
        motherPlantId,
        { quantity: 50, roomId: 'room-123' },
        'user-123',
      );

      expect(result.seedInventory).toEqual(mockSeedInventory);
      expect(prisma.plant.update).toHaveBeenCalledWith({
        where: { id: motherPlantId },
        data: { seedOffspringCount: { increment: 50 } },
        module: "Cultivation",
      });
    });

    it('should throw BadRequestException if plant is not a mother plant', async () => {
      const mockPlant = {
        id: 'plant-123',
        locationId: 'loc-123',
        status: 'active',
        isMother: false,
      };

      prisma.plant.findFirst.mockResolvedValue(mockPlant);

      await expect(
        service.generateSeeds('loc-123', 'plant-123', {
          quantity: 50,
          roomId: 'room-123',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('undoOperation', () => {
    it('should undo a room move operation', async () => {
      const mockAuditLog = {
        id: 'audit-123',
        entityType: 'plant',
        entityId: 'plant-123',
        actionType: 'move_room',
        oldValue: JSON.stringify({ roomId: 'old-room' }),
        newValue: JSON.stringify({ roomId: 'new-room' }),
      };

      const mockPlant = {
        id: 'plant-123',
        locationId: 'loc-123',
        roomId: 'new-room',
      };

      prisma.auditLog.findUnique.mockResolvedValue(mockAuditLog);
      prisma.plant.findFirst.mockResolvedValue(mockPlant);
      prisma.plant.update.mockResolvedValue({
        ...mockPlant,
        roomId: 'old-room',
      });
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.undoOperation('loc-123', 'audit-123', 'Test undo', 'user-123');

      expect(result).toBeDefined();
      expect(prisma.plant.update).toHaveBeenCalledWith({
        where: { id: 'plant-123' },
        data: { roomId: 'old-room' },
        module: "Cultivation",
      });
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actionType: 'undo_operation',
          }),
        }),
      );
    });

    it('should throw NotFoundException if audit log does not exist', async () => {
      prisma.auditLog.findUnique.mockResolvedValue(null);

      await expect(
        service.undoOperation('loc-123', 'invalid-audit-id', 'Test undo'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for unsupported operation type', async () => {
      const mockAuditLog = {
        id: 'audit-123',
        entityType: 'plant',
        entityId: 'plant-123',
        actionType: 'unsupported_action',
      };

      prisma.auditLog.findUnique.mockResolvedValue(mockAuditLog);
      prisma.plant.findFirst.mockResolvedValue({ id: 'plant-123', locationId: 'loc-123' });

      await expect(
        service.undoOperation('loc-123', 'audit-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
