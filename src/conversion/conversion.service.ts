import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  WetToDryConversionDto,
  DryToExtractionConversionDto,
  ExtractionToFinishedConversionDto,
  ConversionFilterDto,
  ConversionType,
} from './dto/conversion.dto';

@Injectable()
export class ConversionService {
  constructor(private prisma: PrismaService) {}

  async convertWetToDry(locationId: string, dto: WetToDryConversionDto, userId: string) {
    // Validate source inventory exists and has sufficient quantity
    const sourceInventory = await this.prisma.inventoryItem.findUnique({
      where: { id: dto.sourceInventoryId },
      include: { inventoryType: true },
    });

    if (!sourceInventory || sourceInventory.locationId !== locationId) {
      throw new NotFoundException('Source inventory not found');
    }

    if (sourceInventory.weightGrams < dto.inputWeightGrams) {
      throw new BadRequestException('Insufficient source inventory quantity');
    }

    // Validate inventory type is wet
    if (!sourceInventory.inventoryType.category.includes('Wet')) {
      throw new BadRequestException('Source inventory must be a wet type');
    }

    // Validate output inventory type exists and is dry
    const outputInventoryType = await this.prisma.inventoryType.findUnique({
      where: { id: dto.outputInventoryTypeId },
    });

    if (!outputInventoryType) {
      throw new NotFoundException('Output inventory type not found');
    }

    if (!outputInventoryType.category.includes('Dry')) {
      throw new BadRequestException('Output inventory type must be a dry type');
    }

    // Validate room exists
    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId },
    });

    if (!room || room.locationId !== locationId) {
      throw new NotFoundException('Room not found');
    }

    // Calculate material loss
    const materialLossGrams = dto.inputWeightGrams - dto.outputWeightGrams;
    const lossPercentage = (materialLossGrams / dto.inputWeightGrams) * 100;

    // Create conversion record and update inventory
    const result = await this.prisma.$transaction(async (tx) => {
      // Create conversion record (using Inventory table with special metadata)
      const conversion = await tx.inventory.create({
        data: {
          locationId,
          inventoryTypeId: dto.outputInventoryTypeId,
          strainId: dto.strainId,
          roomId: dto.roomId,
          weightGrams: dto.outputWeightGrams,
          usableWeight: dto.outputWeightGrams, // For dry, usable = total
          batchNumber: dto.batchNumber,
          barcode: this.generateBarcode(),
        },
      });

      // Update source inventory (consume input weight)
      await tx.inventory.update({
        where: { id: dto.sourceInventoryId },
        data: {
          weightGrams: sourceInventory.weightGrams - dto.inputWeightGrams,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          locationId,
          actionType: 'CONVERSION',
          entityType: 'Inventory',
          entityId: conversion.id,
          details: JSON.stringify({
            conversionType: ConversionType.WET_TO_DRY,
            sourceInventoryId: dto.sourceInventoryId,
            inputWeightGrams: dto.inputWeightGrams,
            outputWeightGrams: dto.outputWeightGrams,
            materialLossGrams,
            lossPercentage: lossPercentage.toFixed(2),
            notes: dto.notes,
          }),
        },
      });

      return {
        conversion,
        materialLossGrams,
        lossPercentage: Number(lossPercentage.toFixed(2)),
      };
    });

    return result;
  }

  async convertDryToExtraction(locationId: string, dto: DryToExtractionConversionDto, userId: string) {
    // Validate source inventory exists and has sufficient quantity
    const sourceInventory = await this.prisma.inventoryItem.findUnique({
      where: { id: dto.sourceInventoryId },
      include: { inventoryType: true },
    });

    if (!sourceInventory || sourceInventory.locationId !== locationId) {
      throw new NotFoundException('Source inventory not found');
    }

    if (sourceInventory.weightGrams < dto.inputWeightGrams) {
      throw new BadRequestException('Insufficient source inventory quantity');
    }

    // Validate inventory type is dry
    if (!sourceInventory.inventoryType.category.includes('Dry')) {
      throw new BadRequestException('Source inventory must be a dry type');
    }

    // Validate output inventory type exists and is extraction
    const outputInventoryType = await this.prisma.inventoryType.findUnique({
      where: { id: dto.outputInventoryTypeId },
    });

    if (!outputInventoryType) {
      throw new NotFoundException('Output inventory type not found');
    }

    if (!outputInventoryType.category.includes('Extraction')) {
      throw new BadRequestException('Output inventory type must be an extraction type');
    }

    // Validate room exists
    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId },
    });

    if (!room || room.locationId !== locationId) {
      throw new NotFoundException('Room not found');
    }

    // Calculate material loss
    const materialLossGrams = dto.inputWeightGrams - dto.outputWeightGrams;
    const lossPercentage = (materialLossGrams / dto.inputWeightGrams) * 100;

    // Create conversion record and update inventory
    const result = await this.prisma.$transaction(async (tx) => {
      // Create conversion record
      const conversion = await tx.inventory.create({
        data: {
          locationId,
          inventoryTypeId: dto.outputInventoryTypeId,
          strainId: dto.strainId,
          roomId: dto.roomId,
          weightGrams: dto.outputWeightGrams,
          usableWeight: dto.outputWeightGrams, // For extraction, usable = total
          batchNumber: dto.batchNumber,
          barcode: this.generateBarcode(),
        },
      });

      // Update source inventory (consume input weight)
      await tx.inventory.update({
        where: { id: dto.sourceInventoryId },
        data: {
          weightGrams: sourceInventory.weightGrams - dto.inputWeightGrams,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          locationId,
          actionType: 'CONVERSION',
          entityType: 'Inventory',
          entityId: conversion.id,
          details: JSON.stringify({
            conversionType: ConversionType.DRY_TO_EXTRACTION,
            sourceInventoryId: dto.sourceInventoryId,
            inputWeightGrams: dto.inputWeightGrams,
            outputWeightGrams: dto.outputWeightGrams,
            materialLossGrams,
            lossPercentage: lossPercentage.toFixed(2),
            extractionMethod: dto.extractionMethod,
            notes: dto.notes,
          }),
        },
      });

      return {
        conversion,
        materialLossGrams,
        lossPercentage: Number(lossPercentage.toFixed(2)),
      };
    });

    return result;
  }

  async convertExtractionToFinished(locationId: string, dto: ExtractionToFinishedConversionDto, userId: string) {
    // Validate source inventory exists and has sufficient quantity
    const sourceInventory = await this.prisma.inventoryItem.findUnique({
      where: { id: dto.sourceInventoryId },
      include: { inventoryType: true },
    });

    if (!sourceInventory || sourceInventory.locationId !== locationId) {
      throw new NotFoundException('Source inventory not found');
    }

    if (sourceInventory.weightGrams < dto.inputWeightGrams) {
      throw new BadRequestException('Insufficient source inventory quantity');
    }

    // Validate inventory type is extraction
    if (!sourceInventory.inventoryType.category.includes('Extraction')) {
      throw new BadRequestException('Source inventory must be an extraction type');
    }

    // Validate output inventory type exists and is finished goods
    const outputInventoryType = await this.prisma.inventoryType.findUnique({
      where: { id: dto.outputInventoryTypeId },
    });

    if (!outputInventoryType) {
      throw new NotFoundException('Output inventory type not found');
    }

    if (!outputInventoryType.category.includes('Finished')) {
      throw new BadRequestException('Output inventory type must be a finished goods type');
    }

    // Validate usable weight is not greater than output weight
    if (dto.usableWeight > dto.outputWeightGrams) {
      throw new BadRequestException('Usable weight cannot exceed output weight');
    }

    // Validate room exists
    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId },
    });

    if (!room || room.locationId !== locationId) {
      throw new NotFoundException('Room not found');
    }

    // Calculate material loss
    const materialLossGrams = dto.inputWeightGrams - dto.outputWeightGrams;
    const lossPercentage = (materialLossGrams / dto.inputWeightGrams) * 100;

    // Create conversion record and update inventory
    const result = await this.prisma.$transaction(async (tx) => {
      // Create conversion record with usable weight
      const conversion = await tx.inventory.create({
        data: {
          locationId,
          inventoryTypeId: dto.outputInventoryTypeId,
          strainId: dto.strainId,
          roomId: dto.roomId,
          weightGrams: dto.outputWeightGrams,
          usableWeight: dto.usableWeight, // Track usable weight for finished goods
          quantity: dto.unitsProduced,
          batchNumber: dto.batchNumber,
          barcode: this.generateBarcode(),
        },
      });

      // Update source inventory (consume input weight)
      await tx.inventory.update({
        where: { id: dto.sourceInventoryId },
        data: {
          weightGrams: sourceInventory.weightGrams - dto.inputWeightGrams,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          locationId,
          actionType: 'CONVERSION',
          entityType: 'Inventory',
          entityId: conversion.id,
          details: JSON.stringify({
            conversionType: ConversionType.EXTRACTION_TO_FINISHED,
            sourceInventoryId: dto.sourceInventoryId,
            inputWeightGrams: dto.inputWeightGrams,
            outputWeightGrams: dto.outputWeightGrams,
            usableWeight: dto.usableWeight,
            unitsProduced: dto.unitsProduced,
            materialLossGrams,
            lossPercentage: lossPercentage.toFixed(2),
            productSku: dto.productSku,
            notes: dto.notes,
          }),
        },
      });

      return {
        conversion,
        materialLossGrams,
        lossPercentage: Number(lossPercentage.toFixed(2)),
      };
    });

    return result;
  }

  async getConversion(locationId: string, conversionId: string) {
    const conversion = await this.prisma.inventoryItem.findUnique({
      where: { id: conversionId },
      include: {
        inventoryType: true,
        strain: true,
        room: true,
      },
    });

    if (!conversion || conversion.locationId !== locationId) {
      throw new NotFoundException('Conversion not found');
    }

    // Get audit log to retrieve conversion details
    const auditLog = await this.prisma.auditLog.findFirst({
      where: {
        entityId: conversionId,
        actionType: 'CONVERSION',
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      ...conversion,
      conversionDetails: auditLog ? JSON.parse(auditLog.details) : null,
    };
  }

  async listConversions(locationId: string, filters: ConversionFilterDto) {
    const { page = 1, perPage = 20, conversionType, strainId, roomId, startDate, endDate } = filters;
    const skip = (page - 1) * perPage;

    // Build where clause
    const where: any = {
      locationId,
    };

    if (strainId) where.strainId = strainId;
    if (roomId) where.roomId = roomId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Get conversion inventory items (those with CONVERSION audit logs)
    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        locationId,
        actionType: 'CONVERSION',
        ...(startDate || endDate
          ? {
              createdAt: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
    });

    // Filter by conversion type if specified
    let filteredLogs = auditLogs;
    if (conversionType) {
      filteredLogs = auditLogs.filter((log) => {
        const details = JSON.parse(log.details);
        return details.conversionType === conversionType;
      });
    }

    // Get inventory items for these conversions
    const conversionIds = filteredLogs.map((log) => log.entityId);
    const conversions = await this.prisma.inventoryItem.findMany({
      where: {
        id: { in: conversionIds },
        ...where,
      },
      include: {
        inventoryType: true,
        strain: true,
        room: true,
      },
    });

    // Merge conversion details from audit logs
    const conversionsWithDetails = conversions.map((conversion) => {
      const auditLog = filteredLogs.find((log) => log.entityId === conversion.id);
      return {
        ...conversion,
        conversionDetails: auditLog ? JSON.parse(auditLog.details) : null,
      };
    });

    const total = await this.prisma.auditLog.count({
      where: {
        locationId,
        actionType: 'CONVERSION',
      },
    });

    return {
      data: conversionsWithDetails,
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  private generateBarcode(): string {
    // Generate a 16-digit barcode
    return Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
  }
}
