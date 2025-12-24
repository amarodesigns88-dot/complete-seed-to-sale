import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CureService {
  constructor(private prisma: PrismaService) {}

  /**
   * Cure a plant (POST /cultivation/:ubi/plants/:plantId/cure).
   *
   * Behavior:
   * - Validates inputs and that plant belongs to the provided UBI
   * - Ensures dry weights do not exceed the most recent harvest wet weights
   * - Creates a Cure record
   * - Updates the plant to status/phase 'cured'
   * - Optionally creates InventoryItem records for cured materials (flower, other material)
   * - Creates a Destruction record for cure waste (wasteWeight)
   * - Writes auditLog entries for actions (cure, inventory, destruction)
   *
   * NOTE: This implementation is typed against the Prisma models you provided:
   * - InventoryItem expects inventoryTypeId and inventoryTypeName (we resolve InventoryType by name)
   * - Destruction uses destructionReason and wasteWeight
   *
   * Adjust inventory type names ('flower', 'other_material') to match your DB values if needed.
   */
  async curePlant(
    ubi: string,
    plantId: string,
    payload: { dryFlowerWeight: number; dryOtherMaterialWeight?: number; dryWasteWeight?: number },
    userId?: string,
    createInventory = true,
  ) {
    if (!plantId) {
      throw new BadRequestException('plantId is required to create a cure record');
    }

    // Normalize & validate numeric inputs
    const dryFlowerWeight = Number(payload?.dryFlowerWeight ?? 0);
    const dryOtherMaterialWeight = Number(payload?.dryOtherMaterialWeight ?? 0);
    const dryWasteWeight = Number(payload?.dryWasteWeight ?? 0);

    if (Number.isNaN(dryFlowerWeight) || dryFlowerWeight < 0) {
      throw new BadRequestException('dryFlowerWeight must be a non-negative number');
    }
    if (Number.isNaN(dryOtherMaterialWeight) || dryOtherMaterialWeight < 0) {
      throw new BadRequestException('dryOtherMaterialWeight must be a non-negative number');
    }
    if (Number.isNaN(dryWasteWeight) || dryWasteWeight < 0) {
      throw new BadRequestException('dryWasteWeight must be a non-negative number');
    }

    return this.prisma.$transaction(async (tx) => {
      // Ensure plant exists and belongs to the requested UBI
      const plant = await tx.plant.findUnique({
        where: { id: plantId },
        include: { location: true },
      });
      if (!plant) throw new NotFoundException('Plant not found');
      if (!plant.location || plant.location.ubi !== ubi) {
        throw new BadRequestException('Plant does not belong to the specified UBI');
      }

      // Find the most recent harvest for this plant (for weight validation)
      const harvest = await tx.harvest.findFirst({
        where: { plantId },
        orderBy: { createdAt: 'desc' },
      });
      if (!harvest) throw new BadRequestException('No harvest record found for this plant to validate cure weights against');

      // Validate dry vs wet weights
      if (dryFlowerWeight > (harvest.wetFlowerWeight ?? 0)) {
        throw new BadRequestException('dryFlowerWeight exceeds harvested wetFlowerWeight');
      }
      if (dryOtherMaterialWeight > (harvest.wetOtherMaterialWeight ?? 0)) {
        throw new BadRequestException('dryOtherMaterialWeight exceeds harvested wetOtherMaterialWeight');
      }
      if (dryWasteWeight > (harvest.wetWasteWeight ?? 0)) {
        throw new BadRequestException('dryWasteWeight exceeds harvested wetWasteWeight');
      }

      const dryTotal = dryFlowerWeight + dryOtherMaterialWeight + dryWasteWeight;
      const wetTotal =
        (harvest.wetFlowerWeight ?? 0) + (harvest.wetOtherMaterialWeight ?? 0) + (harvest.wetWasteWeight ?? 0);
      if (dryTotal > wetTotal) {
        throw new BadRequestException('Total dry weight exceeds total harvested wet weight');
      }

      // Create Cure record
      const cure = await tx.cure.create({
        data: {
          id: uuidv4(),
          plantId,
          harvestId: harvest.id,
          dryFlowerWeight,
          dryOtherMaterialWeight,
          dryWasteWeight,
        },
      });

      // Update plant status/phase
      await tx.plant.update({
        where: { id: plantId },
        data: { status: 'cured', phase: 'cured' },
      });

      const createdInventoryItems: Array<any> = [];

      if (createInventory) {
        // Resolve InventoryType entries by name (your InventoryType model has unique `name`)
        // Adjust these names if your DB uses different inventory type names
        const flowerType = dryFlowerWeight > 0
          ? await tx.inventoryType.findUnique({ where: { name: 'flower' } })
          : null;
        if (dryFlowerWeight > 0 && !flowerType) {
          throw new BadRequestException('InventoryType "flower" not found. Ensure inventory type exists in DB');
        }

        const otherType = dryOtherMaterialWeight > 0
          ? await tx.inventoryType.findUnique({ where: { name: 'other_material' } })
          : null;
        if (dryOtherMaterialWeight > 0 && !otherType) {
          throw new BadRequestException('InventoryType "other_material" not found. Ensure inventory type exists in DB');
        }

        // Determine location for created inventory (use plant.locationId if present)
        const locationId = plant.locationId ?? plant.location?.id;
        if (!locationId) {
          throw new BadRequestException('Unable to determine location for created inventory item');
        }

        // Create inventory item for flower
        if (dryFlowerWeight > 0 && flowerType) {
          const item = await tx.inventoryItem.create({
            data: {
              id: uuidv4(),
              locationId,
              inventoryTypeId: flowerType.id,
              inventoryTypeName: flowerType.name,
              productName: 'Cured Flower',
              quantity: dryFlowerWeight,
              unit: flowerType.unit,
              barcode: `BC-${uuidv4()}`,
              status: 'active',
              harvestedPlantId: plantId,
              harvestId: harvest.id,
            },
          });
          createdInventoryItems.push(item);

          if (userId) {
            await tx.auditLog.create({
              data: {
                id: uuidv4(),
                userId,
                module: 'inventory',
                entityType: 'inventory_item',
                entityId: item.id,
                actionType: 'create',
                details: { createdFrom: 'cure', cureId: cure.id, plantId, harvestId: harvest.id, quantity: dryFlowerWeight },
              },
            });
          }
        }

        // Create inventory item for other material (trim)
        if (dryOtherMaterialWeight > 0 && otherType) {
          const item = await tx.inventoryItem.create({
            data: {
              id: uuidv4(),
              locationId,
              inventoryTypeId: otherType.id,
              inventoryTypeName: otherType.name,
              productName: 'Cured Other Material',
              quantity: dryOtherMaterialWeight,
              unit: otherType.unit,
              barcode: `BC-${uuidv4()}`,
              status: 'active',
              harvestedPlantId: plantId,
              harvestId: harvest.id,
            },
          });
          createdInventoryItems.push(item);

          if (userId) {
            await tx.auditLog.create({
              data: {
                id: uuidv4(),
                userId,
                module: 'inventory',
                entityType: 'inventory_item',
                entityId: item.id,
                actionType: 'create',
                details: { createdFrom: 'cure', cureId: cure.id, plantId, harvestId: harvest.id, quantity: dryOtherMaterialWeight },
              },
            });
          }
        }

        // Record waste as a Destruction record (use your Destruction model fields: destructionReason, wasteWeight)
        if (dryWasteWeight > 0) {
          const destruction = await tx.destruction.create({
            data: {
              id: uuidv4(),
              plantId,
              destructionReason: 'Cure waste',
              wasteWeight: dryWasteWeight,
              status: 'active',
              createdAt: new Date(),
              // Note: model does not include roomId or locationId fields in the snippet you provided,
              // so we omit them. If you have those fields, add them here.
            },
          });

          if (userId) {
            await tx.auditLog.create({
              data: {
                id: uuidv4(),
                userId,
                module: 'cultivation',
                entityType: 'destruction',
                entityId: destruction.id,
                actionType: 'create',
                details: { reason: 'Cure waste', cureId: cure.id, plantId, harvestId: harvest.id, wasteWeight: dryWasteWeight },
              },
            });
          }
        }
      }

      // Audit log for Cure creation
      if (userId) {
        await tx.auditLog.create({
          data: {
            id: uuidv4(),
            userId,
            module: 'cultivation',
            entityType: 'cure',
            entityId: cure.id,
            actionType: 'create',
            details: { plantId, harvestId: harvest.id, dryFlowerWeight, dryOtherMaterialWeight, dryWasteWeight },
          },
        });
      }

      return { cure, inventoryItems: createdInventoryItems };
    });
  }
}