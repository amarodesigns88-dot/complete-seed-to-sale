import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';

describe('InventoryService - Sprints 3-4 Enhancements', () => {
  let service: InventoryService;
  let prisma: any;

  beforeEach(async () => {
    const mockPrisma = {
      inventoryItem: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
      room: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      inventoryAdjustment: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      inventorySplit: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      inventoryCombination: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      lot: {
        create: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('moveItemToRoom', () => {
    it('should successfully move inventory item to another room', async () => {
      const locationId = 'loc-123';
      const itemId = 'item-123';
      const mockItem = {
        id: itemId,
        locationId,
        roomId: 'old-room',
        deletedAt: null,
        room: { id: 'old-room', name: 'Old Room' },
      };
      const mockTargetRoom = {
        id: 'new-room',
        name: 'New Room',
        locationId,
        deletedAt: null,
      };
      const mockUpdated = {
        ...mockItem,
        roomId: 'new-room',
        room: mockTargetRoom,
      };

      prisma.inventoryItem.findFirst.mockResolvedValue(mockItem);
      prisma.room.findFirst.mockResolvedValue(mockTargetRoom);
      prisma.inventoryItem.update.mockResolvedValue(mockUpdated);
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.moveItemToRoom(locationId, itemId, {
        targetRoomId: 'new-room',
        reason: 'Test move',
      });

      expect(result.roomId).toBe('new-room');
      expect(prisma.inventoryItem.update).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'ROOM_MOVE',
          }),
        }),
      );
    });

    it('should throw NotFoundException if inventory item not found', async () => {
      prisma.inventoryItem.findFirst.mockResolvedValue(null);

      await expect(
        service.moveItemToRoom('loc-123', 'item-123', { targetRoomId: 'new-room' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if target room not found', async () => {
      const mockItem = {
        id: 'item-123',
        locationId: 'loc-123',
        deletedAt: null,
        room: {},
      };

      prisma.inventoryItem.findFirst.mockResolvedValue(mockItem);
      prisma.room.findFirst.mockResolvedValue(null);

      await expect(
        service.moveItemToRoom('loc-123', 'item-123', { targetRoomId: 'invalid-room' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('adjustInventory', () => {
    it('should adjust inventory quantity successfully', async () => {
      const mockItem = {
        id: 'item-123',
        locationId: 'loc-123',
        quantityGrams: 1000,
        deletedAt: null,
      };
      const mockAdjustment = {
        id: 'adj-123',
        inventoryItemId: 'item-123',
        adjustmentGrams: 100,
      };

      prisma.inventoryItem.findFirst.mockResolvedValue(mockItem);
      prisma.inventoryItem.update.mockResolvedValue({
        ...mockItem,
        quantityGrams: 1100,
      });
      prisma.inventoryAdjustment.create.mockResolvedValue(mockAdjustment);
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.adjustInventory('loc-123', 'item-123', {
        adjustmentGrams: 100,
        reason: 'Test adjustment',
        adjustmentType: 'manual',
      });

      expect(result.redFlag).toBe(false);
      expect(prisma.inventoryAdjustment.create).toHaveBeenCalled();
    });

    it('should set red flag for adjustment > 10%', async () => {
      const mockItem = {
        id: 'item-123',
        locationId: 'loc-123',
        quantityGrams: 1000,
        deletedAt: null,
      };

      prisma.inventoryItem.findFirst.mockResolvedValue(mockItem);
      prisma.inventoryItem.update.mockResolvedValue({
        ...mockItem,
        quantityGrams: 1150,
      });
      prisma.inventoryAdjustment.create.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.adjustInventory('loc-123', 'item-123', {
        adjustmentGrams: 150,
        reason: 'Large adjustment',
        adjustmentType: 'manual',
      });

      expect(result.redFlag).toBe(true);
      expect(prisma.inventoryAdjustment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            redFlag: true,
          }),
        }),
      );
    });

    it('should throw BadRequestException if adjustment results in negative quantity', async () => {
      const mockItem = {
        id: 'item-123',
        locationId: 'loc-123',
        quantityGrams: 100,
        deletedAt: null,
      };

      prisma.inventoryItem.findFirst.mockResolvedValue(mockItem);

      await expect(
        service.adjustInventory('loc-123', 'item-123', {
          adjustmentGrams: -200,
          reason: 'Test',
          adjustmentType: 'manual',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('splitInventory', () => {
    it('should split inventory item into multiple units', async () => {
      const mockItem = {
        id: 'item-123',
        locationId: 'loc-123',
        quantityGrams: 1000,
        usableWeightGrams: 900,
        lotIdentifier: 'LOT-001',
        deletedAt: null,
      };

      prisma.inventoryItem.findFirst.mockResolvedValue(mockItem);
      prisma.inventoryItem.update.mockResolvedValue({ ...mockItem, quantityGrams: 0 });
      prisma.inventoryItem.create.mockResolvedValue({
        id: 'new-item-1',
        quantityGrams: 500,
      });
      prisma.inventorySplit.create.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.splitInventory('loc-123', 'item-123', {
        splits: [{ quantityGrams: 500 }, { quantityGrams: 500 }],
        reason: 'Split for distribution',
      });

      expect(result.splitItems).toHaveLength(2);
      expect(prisma.inventoryItem.create).toHaveBeenCalledTimes(2);
      expect(prisma.inventorySplit.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if split quantities exceed total', async () => {
      const mockItem = {
        id: 'item-123',
        locationId: 'loc-123',
        quantityGrams: 1000,
        deletedAt: null,
      };

      prisma.inventoryItem.findFirst.mockResolvedValue(mockItem);

      await expect(
        service.splitInventory('loc-123', 'item-123', {
          splits: [{ quantityGrams: 600 }, { quantityGrams: 600 }],
          reason: 'Invalid split',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should generate sublot identifiers for split items', async () => {
      const mockItem = {
        id: 'item-123',
        locationId: 'loc-123',
        quantityGrams: 1000,
        usableWeightGrams: null,
        lotIdentifier: 'LOT-001',
        deletedAt: null,
      };

      prisma.inventoryItem.findFirst.mockResolvedValue(mockItem);
      prisma.inventoryItem.update.mockResolvedValue(mockItem);
      prisma.inventoryItem.create.mockResolvedValue({ id: 'new-1' });
      prisma.inventorySplit.create.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      await service.splitInventory('loc-123', 'item-123', {
        splits: [{ quantityGrams: 500 }, { quantityGrams: 500 }],
        reason: 'Test',
      });

      expect(prisma.inventoryItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lotIdentifier: expect.stringContaining('LOT-001-'),
          }),
        }),
      );
    });
  });

  describe('combineInventory', () => {
    it('should combine multiple items into existing item', async () => {
      const mockSourceItems = [
        { id: 'item-1', locationId: 'loc-123', quantityGrams: 500, inventoryTypeId: 'type-1', deletedAt: null },
        { id: 'item-2', locationId: 'loc-123', quantityGrams: 300, inventoryTypeId: 'type-1', deletedAt: null },
      ];
      const mockTargetItem = {
        id: 'target-item',
        locationId: 'loc-123',
        quantityGrams: 1000,
        inventoryTypeId: 'type-1',
        deletedAt: null,
      };

      prisma.inventoryItem.findMany.mockResolvedValue(mockSourceItems);
      prisma.inventoryItem.findFirst.mockResolvedValue(mockTargetItem);
      prisma.inventoryItem.update.mockResolvedValue({
        ...mockTargetItem,
        quantityGrams: 1800,
      });
      prisma.inventoryItem.updateMany.mockResolvedValue({ count: 2 });
      prisma.inventoryCombination.create.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.combineInventory('loc-123', {
        sourceItemIds: ['item-1', 'item-2'],
        targetItemId: 'target-item',
        reason: 'Combine for processing',
      });

      expect(result.combinedItem.quantityGrams).toBe(1800);
      expect(prisma.inventoryItem.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should create new item when combining without target', async () => {
      const mockSourceItems = [
        { id: 'item-1', locationId: 'loc-123', quantityGrams: 500, inventoryTypeId: 'type-1', roomId: 'room-1', deletedAt: null },
        { id: 'item-2', locationId: 'loc-123', quantityGrams: 300, inventoryTypeId: 'type-1', roomId: 'room-1', deletedAt: null },
      ];

      prisma.inventoryItem.findMany.mockResolvedValue(mockSourceItems);
      prisma.inventoryItem.create.mockResolvedValue({
        id: 'new-combined',
        quantityGrams: 800,
      });
      prisma.inventoryItem.updateMany.mockResolvedValue({ count: 2 });
      prisma.inventoryCombination.create.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.combineInventory('loc-123', {
        sourceItemIds: ['item-1', 'item-2'],
        reason: 'Combine into new',
      });

      expect(result.combinedItem.id).toBe('new-combined');
      expect(prisma.inventoryItem.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if inventory types do not match', async () => {
      const mockSourceItems = [
        { id: 'item-1', locationId: 'loc-123', inventoryTypeId: 'type-1', deletedAt: null },
        { id: 'item-2', locationId: 'loc-123', inventoryTypeId: 'type-2', deletedAt: null },
      ];

      prisma.inventoryItem.findMany.mockResolvedValue(mockSourceItems);

      await expect(
        service.combineInventory('loc-123', {
          sourceItemIds: ['item-1', 'item-2'],
          reason: 'Test',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createLot', () => {
    it('should create lot from wet/dry inventory items', async () => {
      const mockSourceItems = [
        { id: 'item-1', locationId: 'loc-123', quantityGrams: 1000, deletedAt: null },
        { id: 'item-2', locationId: 'loc-123', quantityGrams: 1500, deletedAt: null },
      ];
      const mockLot = {
        id: 'lot-123',
        batchNumber: 'BATCH-001',
        totalWeightGrams: 2500,
      };

      prisma.inventoryItem.findMany.mockResolvedValue(mockSourceItems);
      prisma.lot.create.mockResolvedValue(mockLot);
      prisma.inventoryItem.updateMany.mockResolvedValue({ count: 2 });
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.createLot('loc-123', {
        sourceItemIds: ['item-1', 'item-2'],
        lotType: 'flower',
        batchNumber: 'BATCH-001',
      });

      expect(result.batchNumber).toBe('BATCH-001');
      expect(result.totalWeightGrams).toBe(2500);
      expect(prisma.lot.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if source items not found', async () => {
      prisma.inventoryItem.findMany.mockResolvedValue([]);

      await expect(
        service.createLot('loc-123', {
          sourceItemIds: ['item-1', 'item-2'],
          lotType: 'flower',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('destroyInventory', () => {
    it('should destroy inventory item and create waste', async () => {
      const mockItem = {
        id: 'item-123',
        locationId: 'loc-123',
        quantityGrams: 1000,
        roomId: 'room-123',
        inventoryTypeId: 'type-1',
        deletedAt: null,
      };
      const mockWasteItem = {
        id: 'waste-123',
        inventoryTypeId: 'waste',
        quantityGrams: 1000,
      };

      prisma.inventoryItem.findFirst.mockResolvedValue(mockItem);
      prisma.inventoryItem.update.mockResolvedValue({
        ...mockItem,
        quantityGrams: 0,
        status: 'destroyed',
      });
      prisma.inventoryItem.create.mockResolvedValue(mockWasteItem);
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.destroyInventory('loc-123', 'item-123', {
        quantityGrams: 1000,
        method: 'incineration',
        reason: 'Contaminated',
      });

      expect(result.wasteItem.inventoryTypeId).toBe('waste');
      expect(prisma.inventoryItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            inventoryTypeId: 'waste',
          }),
        }),
      );
    });

    it('should support partial destruction', async () => {
      const mockItem = {
        id: 'item-123',
        locationId: 'loc-123',
        quantityGrams: 1000,
        roomId: 'room-123',
        inventoryTypeId: 'type-1',
        deletedAt: null,
      };

      prisma.inventoryItem.findFirst.mockResolvedValue(mockItem);
      prisma.inventoryItem.update.mockResolvedValue({
        ...mockItem,
        quantityGrams: 400,
      });
      prisma.inventoryItem.create.mockResolvedValue({ id: 'waste-123' });
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.destroyInventory('loc-123', 'item-123', {
        quantityGrams: 600,
        method: 'compost',
        reason: 'Partial destruction',
      });

      expect(result.remainingQuantity).toBe(400);
      expect(result.wasteItem).toBeDefined();
    });

    it('should throw BadRequestException if destroy quantity exceeds available', async () => {
      const mockItem = {
        id: 'item-123',
        locationId: 'loc-123',
        quantityGrams: 1000,
        deletedAt: null,
      };

      prisma.inventoryItem.findFirst.mockResolvedValue(mockItem);

      await expect(
        service.destroyInventory('loc-123', 'item-123', {
          quantityGrams: 1500,
          method: 'incineration',
          reason: 'Test',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('undoOperation', () => {
    it('should undo a room move operation', async () => {
      const mockAuditLog = {
        id: 'audit-123',
        entityType: 'InventoryItem',
        entityId: 'item-123',
        action: 'ROOM_MOVE',
        oldValue: JSON.stringify({ roomId: 'old-room' }),
        newValue: JSON.stringify({ roomId: 'new-room' }),
      };
      const mockItem = {
        id: 'item-123',
        locationId: 'loc-123',
        roomId: 'new-room',
        deletedAt: null,
      };

      prisma.auditLog.findUnique.mockResolvedValue(mockAuditLog);
      prisma.inventoryItem.findFirst.mockResolvedValue(mockItem);
      prisma.inventoryItem.update.mockResolvedValue({
        ...mockItem,
        roomId: 'old-room',
      });
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.undoOperation('loc-123', 'audit-123', {
        reason: 'Test undo',
      });

      expect(result).toBeDefined();
      expect(prisma.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: 'item-123' },
        data: { roomId: 'old-room' },
      });
    });

    it('should undo an adjustment operation', async () => {
      const mockAuditLog = {
        id: 'audit-123',
        entityType: 'InventoryItem',
        entityId: 'item-123',
        action: 'ADJUST',
        oldValue: JSON.stringify({ quantityGrams: 1000 }),
        newValue: JSON.stringify({ quantityGrams: 1100 }),
      };
      const mockItem = {
        id: 'item-123',
        locationId: 'loc-123',
        quantityGrams: 1100,
        deletedAt: null,
      };

      prisma.auditLog.findUnique.mockResolvedValue(mockAuditLog);
      prisma.inventoryItem.findFirst.mockResolvedValue(mockItem);
      prisma.inventoryItem.update.mockResolvedValue({
        ...mockItem,
        quantityGrams: 1000,
      });
      prisma.auditLog.create.mockResolvedValue({});

      await service.undoOperation('loc-123', 'audit-123', {
        reason: 'Reverse adjustment',
      });

      expect(prisma.inventoryItem.update).toHaveBeenCalledWith({
        where: { id: 'item-123' },
        data: { quantityGrams: 1000 },
      });
    });

    it('should throw NotFoundException if audit log not found', async () => {
      prisma.auditLog.findUnique.mockResolvedValue(null);

      await expect(
        service.undoOperation('loc-123', 'invalid-id', { reason: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listAdjustments', () => {
    it('should list adjustments with pagination', async () => {
      const mockAdjustments = [
        { id: 'adj-1', adjustmentGrams: 100 },
        { id: 'adj-2', adjustmentGrams: -50 },
      ];

      prisma.inventoryAdjustment.findMany.mockResolvedValue(mockAdjustments);
      prisma.inventoryAdjustment.count.mockResolvedValue(2);

      const result = await service.listAdjustments('loc-123', { page: 1, limit: 10 });

      expect(result.data).toEqual(mockAdjustments);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });
  });

  describe('listSplits', () => {
    it('should list splits with pagination', async () => {
      const mockSplits = [
        { id: 'split-1', parentItemId: 'item-1' },
        { id: 'split-2', parentItemId: 'item-2' },
      ];

      prisma.inventorySplit.findMany.mockResolvedValue(mockSplits);
      prisma.inventorySplit.count.mockResolvedValue(2);

      const result = await service.listSplits('loc-123', { page: 1, limit: 10 });

      expect(result.data).toEqual(mockSplits);
      expect(result.total).toBe(2);
    });
  });

  describe('listCombinations', () => {
    it('should list combinations with pagination', async () => {
      const mockCombinations = [
        { id: 'comb-1', resultItemId: 'item-1' },
        { id: 'comb-2', resultItemId: 'item-2' },
      ];

      prisma.inventoryCombination.findMany.mockResolvedValue(mockCombinations);
      prisma.inventoryCombination.count.mockResolvedValue(2);

      const result = await service.listCombinations('loc-123', { page: 1, limit: 10 });

      expect(result.data).toEqual(mockCombinations);
      expect(result.total).toBe(2);
    });
  });
});
