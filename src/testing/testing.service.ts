import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateSampleDto, AssignLabDto, RemediateSampleDto, SampleFilterDto } from './dto/testing.dto';

@Injectable()
export class TestingService {
  constructor(private prisma: PrismaService) {}

  async generateSample(locationId: string, dto: GenerateSampleDto, userId: string) {
    // Verify inventory item exists
    const inventoryItem = await this.prisma.inventoryItem.findFirst({
      where: {
        id: dto.inventoryItemId,
        locationId,
        deletedAt: null,
      },
    });

    if (!inventoryItem) {
      throw new NotFoundException('Inventory item not found');
    }

    // Verify sufficient quantity
    if (inventoryItem.quantity < dto.sampleSizeGrams) {
      throw new BadRequestException('Insufficient inventory quantity for sample');
    }

    // Create sample
    const sample = await this.prisma.sample.create({
      data: {
        inventoryItemId: dto.inventoryItemId,
        sampleType: dto.sampleType,
        sampleSizeGrams: dto.sampleSizeGrams,
        sampleBarcode: `SAMPLE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        quantity: dto.sampleSizeGrams,
        unit: 'grams',
        status: 'PENDING',
        notes: dto.notes,
      },
    });

    // Reduce inventory quantity
    await this.prisma.inventoryItem.update({
      where: { id: dto.inventoryItemId },
      data: {
        quantity: {
          decrement: dto.sampleSizeGrams,
        },
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        module: "Testing",
        userId,
        actionType: 'SAMPLE_GENERATED',
        entityType: 'Sample',
        entityId: sample.id,
        newValue: JSON.stringify(sample),
      },
    });

    return sample;
  }

  async assignLab(locationId: string, dto: AssignLabDto, userId: string) {
    // Verify sample exists
    const sample = await this.prisma.sample.findFirst({
      where: {
        id: dto.sampleId,
        deletedAt: null,
      },
      include: {
        inventoryItem: true,
      },
    });

    if (!sample) {
      throw new NotFoundException('Sample not found');
    }

    if (sample.inventoryItem.locationId !== locationId) {
      throw new BadRequestException('Sample does not belong to this location');
    }

    if (sample.status !== 'PENDING') {
      throw new BadRequestException('Sample already assigned or completed');
    }

    // Update sample with lab assignment
    const updatedSample = await this.prisma.sample.update({
      where: { id: dto.sampleId },
      data: {
        labName: dto.labName,
        labContactEmail: dto.labContactEmail,
        expectedCompletionDate: dto.expectedCompletionDate ? new Date(dto.expectedCompletionDate) : null,
        status: 'ASSIGNED',
        assignedAt: new Date(),
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        module: "Testing",
        userId,
        actionType: 'LAB_ASSIGNED',
        entityType: 'Sample',
        entityId: sample.id,
        oldValue: JSON.stringify(sample),
        newValue: JSON.stringify(updatedSample),
      },
    });

    return updatedSample;
  }

  async remediate(locationId: string, dto: RemediateSampleDto, userId: string) {
    // Verify sample exists
    const sample = await this.prisma.sample.findFirst({
      where: {
        id: dto.sampleId,
        deletedAt: null,
      },
      include: {
        inventoryItem: true,
      },
    });

    if (!sample) {
      throw new NotFoundException('Sample not found');
    }

    if (sample.inventoryItem.locationId !== locationId) {
      throw new BadRequestException('Sample does not belong to this location');
    }

    // Update sample with remediation
    const updatedSample = await this.prisma.sample.update({
      where: { id: dto.sampleId },
      data: {
        remediationType: dto.remediationType,
        remediationReason: dto.reason,
        remediationNotes: dto.notes,
        status: 'REMEDIATION',
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        module: "Testing",
        userId,
        actionType: 'SAMPLE_REMEDIATION',
        entityType: 'Sample',
        entityId: sample.id,
        oldValue: JSON.stringify(sample),
        newValue: JSON.stringify(updatedSample),
      },
    });

    return updatedSample;
  }

  async getSample(locationId: string, sampleId: string) {
    const sample = await this.prisma.sample.findFirst({
      where: {
        id: sampleId,
        deletedAt: null,
      },
      include: {
        inventoryItem: true,
        testResults: true,
      },
    });

    if (!sample) {
      throw new NotFoundException('Sample not found');
    }

    if (sample.inventoryItem.locationId !== locationId) {
      throw new BadRequestException('Sample does not belong to this location');
    }

    return sample;
  }

  async listSamples(locationId: string, filters: SampleFilterDto) {
    const { sampleType, status, page = 1, limit = 30 } = filters;

    const where: any = {
      deletedAt: null,
      inventoryItem: {
        locationId,
      },
    };

    if (sampleType) {
      where.sampleType = sampleType;
    }

    if (status) {
      where.status = status;
    }

    const [samples, total] = await Promise.all([
      this.prisma.sample.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          inventoryItem: {
            select: {
              id: true,
              barcode: true,
              strainId: true,
            },
          },
          testResults: {
            select: {
              id: true,
              result: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.sample.count({ where }),
    ]);

    return {
      data: samples,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
