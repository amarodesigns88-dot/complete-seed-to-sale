import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DestructionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a destruction record and mark the plant as destroyed (status -> 'destroyed').
   */
  async destroyPlant(
    params: { plantId?: string; inventoryItemId?: string; reason: string; wasteWeight: number },
    userId?: string,
  ) {
    const { plantId, inventoryItemId, reason, wasteWeight } = params;

    return this.prisma.$transaction(async (tx) => {
      // Validate existence
      if (plantId) {
        const plant = await tx.plant.findUnique({ where: { id: plantId } });
        if (!plant) throw new NotFoundException('Plant not found');
      }
      if (inventoryItemId) {
        const inv = await tx.inventoryItem.findUnique({ where: { id: inventoryItemId } });
        if (!inv) throw new NotFoundException('Inventory item not found');
      }

      const destruction = await tx.destruction.create({
        data: {
          id: uuidv4(),
          plantId: plantId ?? null,
          inventoryItemId: inventoryItemId ?? null,
          destructionReason: reason,
          wasteWeight,
        },
      });

      // If plantId provided, mark plant as destroyed
      if (plantId) {
        await tx.plant.update({ where: { id: plantId }, data: { status: 'destroyed' } });
      }

      // Audit log
      if (userId) {
        await tx.auditLog.create({
          data: {
            id: uuidv4(),
            userId,
            module: 'cultivation',
            entityType: 'destruction',
            entityId: destruction.id,
            actionType: 'create',
            details: { plantId, inventoryItemId, reason, wasteWeight },
          },
        });
      }

      return destruction;
    });
  }
}