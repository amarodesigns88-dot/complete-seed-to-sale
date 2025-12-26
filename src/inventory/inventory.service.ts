import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MoveItemRoomDto } from './dto/move-item-room.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { SplitInventoryDto } from './dto/split-inventory.dto';
import { CombineInventoryDto } from './dto/combine-inventory.dto';
import { CreateLotDto } from './dto/create-lot.dto';
import { DestroyInventoryDto } from './dto/destroy-inventory.dto';
import { UndoOperationDto } from './dto/undo-operation.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  /**
   * Move inventory item to a different room
   */
  async moveItemToRoom(
    locationId: string,
    inventoryItemId: string,
    dto: MoveItemRoomDto,
  ) {
    // Validate inventory item exists and belongs to location
    const inventoryItem = await this.prisma.inventoryItem.findFirst({
      where: {
        id: inventoryItemId,
        locationId,
        deletedAt: null,
      },
      include: { room: true },
    });

    if (!inventoryItem) {
      throw new NotFoundException('Inventory item not found');
    }

    // Validate target room exists and belongs to location
    const targetRoom = await this.prisma.room.findFirst({
      where: {
        id: dto.targetRoomId,
        locationId,
        deletedAt: null,
      },
    });

    if (!targetRoom) {
      throw new NotFoundException('Target room not found');
    }

    // Update inventory item room
    const updated = await this.prisma.inventoryItem.update({
      where: { id: inventoryItemId },
      data: {
        roomId: dto.targetRoomId,
      },
      include: { room: true, inventoryType: true },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'InventoryItem',
        entityId: inventoryItemId,
        action: 'ROOM_MOVE',
        oldValue: JSON.stringify({ roomId: inventoryItem.roomId, roomName: inventoryItem.room?.name }),
        newValue: JSON.stringify({ roomId: targetRoom.id, roomName: targetRoom.name }),
        reason: dto.reason || 'Room movement',
      },
    });

    return updated;
  }

  /**
   * Adjust inventory quantity with red flag warnings
   */
  async adjustInventory(
    locationId: string,
    inventoryItemId: string,
    dto: AdjustInventoryDto,
  ) {
    // Validate inventory item
    const inventoryItem = await this.prisma.inventoryItem.findFirst({
      where: {
        id: inventoryItemId,
        locationId,
        deletedAt: null,
      },
    });

    if (!inventoryItem) {
      throw new NotFoundException('Inventory item not found');
    }

    const newQuantity = inventoryItem.quantityGrams + dto.adjustmentGrams;

    if (newQuantity < 0) {
      throw new BadRequestException('Adjustment would result in negative quantity');
    }

    // Calculate adjustment percentage
    const adjustmentPercent = Math.abs((dto.adjustmentGrams / inventoryItem.quantityGrams) * 100);
    const isRedFlag = adjustmentPercent > 10; // Red flag if adjustment > 10%

    // Create adjustment record
    const adjustment = await this.prisma.inventoryAdjustment.create({
      data: {
        inventoryItemId,
        adjustmentGrams: dto.adjustmentGrams,
        previousQuantityGrams: inventoryItem.quantityGrams,
        newQuantityGrams: newQuantity,
        reason: dto.reason,
        adjustmentType: dto.adjustmentType,
        isRedFlag,
      },
    });

    // Update inventory item
    const updated = await this.prisma.inventoryItem.update({
      where: { id: inventoryItemId },
      data: {
        quantityGrams: newQuantity,
      },
      include: { inventoryType: true, room: true },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'InventoryItem',
        entityId: inventoryItemId,
        action: 'QUANTITY_ADJUSTMENT',
        oldValue: JSON.stringify({ quantityGrams: inventoryItem.quantityGrams }),
        newValue: JSON.stringify({ quantityGrams: newQuantity }),
        reason: dto.reason,
      },
    });

    return {
      inventoryItem: updated,
      adjustment,
      warning: isRedFlag ? 'Large adjustment detected (>10%)' : null,
    };
  }

  /**
   * Split inventory item into multiple items
   */
  async splitInventory(
    locationId: string,
    inventoryItemId: string,
    dto: SplitInventoryDto,
  ) {
    // Validate inventory item
    const parentItem = await this.prisma.inventoryItem.findFirst({
      where: {
        id: inventoryItemId,
        locationId,
        deletedAt: null,
      },
      include: { inventoryType: true, strain: true },
    });

    if (!parentItem) {
      throw new NotFoundException('Inventory item not found');
    }

    // Validate total split weight
    const totalSplitWeight = dto.splits.reduce((sum, split) => sum + split.weightGrams, 0);
    if (totalSplitWeight > parentItem.quantityGrams) {
      throw new BadRequestException('Total split weight exceeds parent item weight');
    }

    // Generate sublot identifiers
    const baseSubLot = parentItem.sublotIdentifier || `${parentItem.barcode.substring(8)}`;

    // Create split items
    const splitItems = [];
    for (let i = 0; i < dto.splits.length; i++) {
      const split = dto.splits[i];
      const sublotId = `${baseSubLot}-${i + 1}`;

      // Generate new barcode for split item
      const barcode = `${Date.now()}${Math.random().toString().substring(2, 10)}`.padEnd(16, '0').substring(0, 16);

      const splitItem = await this.prisma.inventoryItem.create({
        data: {
          barcode,
          inventoryTypeId: parentItem.inventoryTypeId,
          strainId: parentItem.strainId,
          quantityGrams: split.weightGrams,
          roomId: split.roomId || parentItem.roomId,
          locationId,
          lotId: parentItem.lotId,
          sublotIdentifier: sublotId,
          usableWeightGrams: parentItem.usableWeightGrams 
            ? (split.weightGrams / parentItem.quantityGrams) * parentItem.usableWeightGrams 
            : null,
        },
      });

      splitItems.push(splitItem);
    }

    // Create split record
    const splitRecord = await this.prisma.inventorySplit.create({
      data: {
        parentInventoryItemId: inventoryItemId,
        reason: dto.reason,
      },
    });

    // Update parent item quantity
    const remainingQuantity = parentItem.quantityGrams - totalSplitWeight;
    await this.prisma.inventoryItem.update({
      where: { id: inventoryItemId },
      data: {
        quantityGrams: remainingQuantity,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'InventoryItem',
        entityId: inventoryItemId,
        action: 'SPLIT',
        oldValue: JSON.stringify({ quantityGrams: parentItem.quantityGrams }),
        newValue: JSON.stringify({ 
          remainingQuantity, 
          splitCount: dto.splits.length,
          splitIds: splitItems.map(item => item.id),
        }),
        reason: dto.reason,
      },
    });

    return {
      parentItem: await this.prisma.inventoryItem.findUnique({ where: { id: inventoryItemId } }),
      splitItems,
      splitRecord,
    };
  }

  /**
   * Combine multiple inventory items into one
   */
  async combineInventory(
    locationId: string,
    dto: CombineInventoryDto,
  ) {
    // Validate all inventory items exist and belong to location
    const items = await this.prisma.inventoryItem.findMany({
      where: {
        id: { in: dto.inventoryItemIds },
        locationId,
        deletedAt: null,
      },
      include: { inventoryType: true, room: true },
    });

    if (items.length !== dto.inventoryItemIds.length) {
      throw new NotFoundException('One or more inventory items not found');
    }

    // Validate all items are same type
    const firstTypeId = items[0].inventoryTypeId;
    if (!items.every(item => item.inventoryTypeId === firstTypeId)) {
      throw new BadRequestException('All items must be of the same inventory type');
    }

    // Validate all items are in same room (unless moving to new room)
    if (!dto.targetRoomId && !items.every(item => item.roomId === items[0].roomId)) {
      throw new BadRequestException('All items must be in the same room or specify a target room');
    }

    // Calculate total weight
    const totalWeight = items.reduce((sum, item) => sum + item.quantityGrams, 0);
    const totalUsableWeight = items.reduce((sum, item) => sum + (item.usableWeightGrams || 0), 0);

    let combinedItem;

    if (dto.targetInventoryItemId) {
      // Combine into existing item
      const targetItem = await this.prisma.inventoryItem.findFirst({
        where: {
          id: dto.targetInventoryItemId,
          locationId,
          deletedAt: null,
        },
      });

      if (!targetItem) {
        throw new NotFoundException('Target inventory item not found');
      }

      combinedItem = await this.prisma.inventoryItem.update({
        where: { id: dto.targetInventoryItemId },
        data: {
          quantityGrams: targetItem.quantityGrams + totalWeight,
          usableWeightGrams: targetItem.usableWeightGrams
            ? targetItem.usableWeightGrams + totalUsableWeight
            : totalUsableWeight > 0 ? totalUsableWeight : null,
        },
      });
    } else {
      // Create new combined item
      const barcode = `${Date.now()}${Math.random().toString().substring(2, 10)}`.padEnd(16, '0').substring(0, 16);
      const targetRoomId = dto.targetRoomId || items[0].roomId;

      combinedItem = await this.prisma.inventoryItem.create({
        data: {
          barcode,
          inventoryTypeId: firstTypeId,
          strainId: items[0].strainId,
          quantityGrams: totalWeight,
          usableWeightGrams: totalUsableWeight > 0 ? totalUsableWeight : null,
          roomId: targetRoomId,
          locationId,
          lotId: items[0].lotId,
        },
      });
    }

    // Create combination record
    const combinationRecord = await this.prisma.inventoryCombination.create({
      data: {
        targetInventoryItemId: combinedItem.id,
        reason: dto.reason,
      },
    });

    // Soft delete source items
    await this.prisma.inventoryItem.updateMany({
      where: {
        id: { in: dto.inventoryItemIds },
      },
      data: {
        deletedAt: new Date(),
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'InventoryItem',
        entityId: combinedItem.id,
        action: 'COMBINE',
        oldValue: JSON.stringify({ 
          sourceIds: dto.inventoryItemIds,
          sourceWeights: items.map(item => ({ id: item.id, weight: item.quantityGrams })),
        }),
        newValue: JSON.stringify({ 
          combinedId: combinedItem.id,
          totalWeight,
        }),
        reason: dto.reason,
      },
    });

    return {
      combinedItem,
      combinationRecord,
      sourceItemCount: items.length,
    };
  }

  /**
   * Create lot from wet/dry inventory items
   */
  async createLot(
    locationId: string,
    dto: CreateLotDto,
  ) {
    // Validate all inventory items
    const items = await this.prisma.inventoryItem.findMany({
      where: {
        id: { in: dto.inventoryItemIds },
        locationId,
        deletedAt: null,
      },
      include: { inventoryType: true },
    });

    if (items.length !== dto.inventoryItemIds.length) {
      throw new NotFoundException('One or more inventory items not found');
    }

    // Validate target room
    const targetRoom = await this.prisma.room.findFirst({
      where: {
        id: dto.targetRoomId,
        locationId,
        deletedAt: null,
      },
    });

    if (!targetRoom) {
      throw new NotFoundException('Target room not found');
    }

    // Calculate total weight
    const totalWeight = items.reduce((sum, item) => sum + item.quantityGrams, 0);

    // Find lot inventory type
    const lotTypeName = dto.lotType || 'Lot of Dry Flower';
    const lotInventoryType = await this.prisma.inventoryType.findFirst({
      where: { name: lotTypeName },
    });

    if (!lotInventoryType) {
      throw new NotFoundException(`Lot inventory type "${lotTypeName}" not found`);
    }

    // Create lot
    const lot = await this.prisma.lot.create({
      data: {
        batchNumber: dto.lotName,
        locationId,
      },
    });

    // Create lot inventory item
    const barcode = `${Date.now()}${Math.random().toString().substring(2, 10)}`.padEnd(16, '0').substring(0, 16);
    const lotItem = await this.prisma.inventoryItem.create({
      data: {
        barcode,
        inventoryTypeId: lotInventoryType.id,
        quantityGrams: totalWeight,
        roomId: dto.targetRoomId,
        locationId,
        lotId: lot.id,
      },
    });

    // Soft delete source items
    await this.prisma.inventoryItem.updateMany({
      where: {
        id: { in: dto.inventoryItemIds },
      },
      data: {
        deletedAt: new Date(),
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'Lot',
        entityId: lot.id,
        action: 'CREATE_LOT',
        oldValue: JSON.stringify({ 
          sourceIds: dto.inventoryItemIds,
          sourceWeights: items.map(item => ({ id: item.id, weight: item.quantityGrams })),
        }),
        newValue: JSON.stringify({ 
          lotId: lot.id,
          lotItemId: lotItem.id,
          totalWeight,
        }),
        reason: 'Lot creation from inventory items',
      },
    });

    return {
      lot,
      lotItem,
      sourceItemCount: items.length,
    };
  }

  /**
   * Destroy inventory item with waste logging
   */
  async destroyInventory(
    locationId: string,
    inventoryItemId: string,
    dto: DestroyInventoryDto,
  ) {
    // Validate inventory item
    const inventoryItem = await this.prisma.inventoryItem.findFirst({
      where: {
        id: inventoryItemId,
        locationId,
        deletedAt: null,
      },
      include: { inventoryType: true },
    });

    if (!inventoryItem) {
      throw new NotFoundException('Inventory item not found');
    }

    const amountToDestroy = dto.amountGrams || inventoryItem.quantityGrams;

    if (amountToDestroy > inventoryItem.quantityGrams) {
      throw new BadRequestException('Destruction amount exceeds available quantity');
    }

    // Find waste inventory type
    const wasteType = await this.prisma.inventoryType.findFirst({
      where: { name: 'Waste' },
    });

    if (!wasteType) {
      throw new NotFoundException('Waste inventory type not found');
    }

    // Create waste inventory item
    const wasteBarcode = `${Date.now()}${Math.random().toString().substring(2, 10)}`.padEnd(16, '0').substring(0, 16);
    const wasteItem = await this.prisma.inventoryItem.create({
      data: {
        barcode: wasteBarcode,
        inventoryTypeId: wasteType.id,
        quantityGrams: amountToDestroy,
        roomId: inventoryItem.roomId,
        locationId,
      },
    });

    // Update or delete original item
    if (amountToDestroy === inventoryItem.quantityGrams) {
      // Full destruction - soft delete
      await this.prisma.inventoryItem.update({
        where: { id: inventoryItemId },
        data: { deletedAt: new Date() },
      });
    } else {
      // Partial destruction - reduce quantity
      await this.prisma.inventoryItem.update({
        where: { id: inventoryItemId },
        data: {
          quantityGrams: inventoryItem.quantityGrams - amountToDestroy,
        },
      });
    }

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        entityType: 'InventoryItem',
        entityId: inventoryItemId,
        action: 'DESTROY',
        oldValue: JSON.stringify({ 
          quantityGrams: inventoryItem.quantityGrams,
        }),
        newValue: JSON.stringify({ 
          destroyedAmount: amountToDestroy,
          wasteItemId: wasteItem.id,
          method: dto.destructionMethod,
        }),
        reason: dto.reason,
      },
    });

    return {
      wasteItem,
      originalItem: await this.prisma.inventoryItem.findUnique({ where: { id: inventoryItemId } }),
      destroyedAmount: amountToDestroy,
    };
  }

  /**
   * Undo an inventory operation
   */
  async undoOperation(
    locationId: string,
    operationId: string,
    dto: UndoOperationDto,
  ) {
    // Find the audit log entry for this operation
    const auditLog = await this.prisma.auditLog.findUnique({
      where: { id: operationId },
    });

    if (!auditLog) {
      throw new NotFoundException('Operation not found');
    }

    // Check if operation is eligible for undo
    const undoableActions = ['ROOM_MOVE', 'QUANTITY_ADJUSTMENT', 'SPLIT', 'COMBINE'];
    if (!undoableActions.includes(auditLog.action)) {
      throw new BadRequestException(`Operation "${auditLog.action}" cannot be undone`);
    }

    // Parse old and new values
    const oldValue = JSON.parse(auditLog.oldValue || '{}');
    const newValue = JSON.parse(auditLog.newValue || '{}');

    // Perform undo based on action type
    let undoResult;

    switch (auditLog.action) {
      case 'ROOM_MOVE':
        // Revert room move
        await this.prisma.inventoryItem.update({
          where: { id: auditLog.entityId },
          data: { roomId: oldValue.roomId },
        });
        undoResult = { message: 'Room move reverted', roomId: oldValue.roomId };
        break;

      case 'QUANTITY_ADJUSTMENT':
        // Revert quantity adjustment
        await this.prisma.inventoryItem.update({
          where: { id: auditLog.entityId },
          data: { quantityGrams: oldValue.quantityGrams },
        });
        undoResult = { message: 'Quantity adjustment reverted', quantityGrams: oldValue.quantityGrams };
        break;

      default:
        throw new BadRequestException('Undo not implemented for this operation type');
    }

    // Create audit log for undo
    await this.prisma.auditLog.create({
      data: {
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        action: 'UNDO',
        oldValue: auditLog.newValue,
        newValue: auditLog.oldValue,
        reason: dto.reason,
      },
    });

    return undoResult;
  }

  /**
   * Get all inventory adjustments for a location
   */
  async getAdjustments(locationId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [adjustments, total] = await Promise.all([
      this.prisma.inventoryAdjustment.findMany({
        where: {
          inventoryItem: {
            locationId,
          },
        },
        include: {
          inventoryItem: {
            include: {
              inventoryType: true,
              room: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.inventoryAdjustment.count({
        where: {
          inventoryItem: {
            locationId,
          },
        },
      }),
    ]);

    return {
      adjustments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all inventory splits for a location
   */
  async getSplits(locationId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [splits, total] = await Promise.all([
      this.prisma.inventorySplit.findMany({
        where: {
          parentInventoryItem: {
            locationId,
          },
        },
        include: {
          parentInventoryItem: {
            include: {
              inventoryType: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.inventorySplit.count({
        where: {
          parentInventoryItem: {
            locationId,
          },
        },
      }),
    ]);

    return {
      splits,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all inventory combinations for a location
   */
  async getCombinations(locationId: string, page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [combinations, total] = await Promise.all([
      this.prisma.inventoryCombination.findMany({
        where: {
          targetInventoryItem: {
            locationId,
          },
        },
        include: {
          targetInventoryItem: {
            include: {
              inventoryType: true,
              room: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.inventoryCombination.count({
        where: {
          targetInventoryItem: {
            locationId,
          },
        },
      }),
    ]);

    return {
      combinations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
