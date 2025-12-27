import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateLicenseeAccountDto,
  ActivateLicenseDto,
  SetInventoryWindowDto,
  AssignLicenseTypeDto,
  LicenseeFilterDto,
} from './dto/licensee-management.dto';

@Injectable()
export class StateLicenseeManagementService {
  constructor(private prisma: PrismaService) {}

  async createLicenseeAccount(dto: CreateLicenseeAccountDto, stateUserId: number) {
    // Check if license number already exists
    const existing = await this.prisma.location.findFirst({
      where: { licenseNumber: dto.licenseNumber },
    });

    if (existing) {
      throw new BadRequestException('License number already exists');
    }

    // Verify license type exists
    const licenseType = await this.prisma.licenseType.findUnique({
      where: { id: String(dto.licenseTypeId) },
    });

    if (!licenseType) {
      throw new NotFoundException('License type not found');
    }

    // Create location (licensee account)
    const location = await this.prisma.location.create({
      data: {
        name: dto.businessName,
        licenseNumber: dto.licenseNumber,
        licenseType: String(dto.licenseTypeId),
        address: dto.address,
        isActive: false, // Starts inactive until activated
      },
      include: {
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        module: "State-licensee-management",
        userId: String(stateUserId),
        actionType: 'CREATE_LICENSEE_ACCOUNT',
        entityType: 'Location',
        entityId: location.id,
        details: {
          businessName: dto.businessName,
          licenseNumber: dto.licenseNumber,
          ownerName: dto.ownerName,
          contactEmail: dto.contactEmail,
        },
      },
    });

    return {
      id: location.id,
      businessName: location.name,
      licenseNumber: location.licenseNumber,
      licenseType: licenseType.name,
      ownerName: dto.ownerName,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      isActive: location.isActive,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
    };
  }

  async activateDeactivateLicense(
    locationId: number,
    dto: ActivateLicenseDto,
    stateUserId: number,
  ) {
    const location = await this.prisma.location.findUnique({
      where: { id: String(locationId) },
    });

    if (!location) {
      throw new NotFoundException('Licensee account not found');
    }

    // Update license status
    const updated = await this.prisma.location.update({
      where: { id: String(locationId) },
      data: {
        isActive: dto.isActive,
      },
      include: {
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        module: "State-licensee-management",
        userId: String(stateUserId),
        action: dto.isActive ? 'ACTIVATE_LICENSE' : 'DEACTIVATE_LICENSE',
        actionType: dto.isActive ? 'ACTIVATE_LICENSE' : 'DEACTIVATE_LICENSE',
        entityType: 'Location',
        entityId: String(locationId),
        details: {
          businessName: location.name,
          licenseNumber: location.licenseNumber,
          reason: dto.reason,
        },
      },
    });

    return {
      id: updated.id,
      businessName: updated.name,
      licenseNumber: updated.licenseNumber,
      licenseType: updated.licenseType,
      isActive: updated.isActive,
      updatedAt: updated.updatedAt,
    };
  }

  async setInitialInventoryWindow(
    locationId: number,
    dto: SetInventoryWindowDto,
    stateUserId: number,
  ) {
    const location = await this.prisma.location.findUnique({
      where: { id: String(locationId) },
    });

    if (!location) {
      throw new NotFoundException('Licensee account not found');
    }

    // Validate dates
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Update location with inventory window
    const updated = await this.prisma.location.update({
      where: { id: String(locationId) },
      data: {
        inventoryWindowStart: startDate,
        inventoryWindowEnd: endDate,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        module: "State-licensee-management",
        userId: String(stateUserId),
        actionType: 'SET_INVENTORY_WINDOW',
        entityType: 'Location',
        entityId: String(locationId),
        details: {
          businessName: location.name,
          licenseNumber: location.licenseNumber,
          startDate: dto.startDate,
          endDate: dto.endDate,
          notes: dto.notes,
        },
      },
    });

    return {
      id: updated.id,
      businessName: updated.name,
      licenseNumber: updated.licenseNumber,
      inventoryWindowStart: updated.inventoryWindowStart,
      inventoryWindowEnd: updated.inventoryWindowEnd,
      updatedAt: updated.updatedAt,
    };
  }

  async assignLicenseType(
    locationId: number,
    dto: AssignLicenseTypeDto,
    stateUserId: number,
  ) {
    const location = await this.prisma.location.findUnique({
      where: { id: String(locationId) },
    });

    if (!location) {
      throw new NotFoundException('Licensee account not found');
    }

    // Verify new license type exists
    const newLicenseType = await this.prisma.licenseType.findUnique({
      where: { id: String(dto.licenseTypeId) },
    });

    if (!newLicenseType) {
      throw new NotFoundException('License type not found');
    }

    // Update license type
    const updated = await this.prisma.location.update({
      where: { id: String(locationId) },
      data: {
        licenseType: String(dto.licenseTypeId),
      },
      include: {
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        module: "State-licensee-management",
        userId: String(stateUserId),
        actionType: 'ASSIGN_LICENSE_TYPE',
        entityType: 'Location',
        entityId: String(locationId),
        details: {
          businessName: location.name,
          licenseNumber: location.licenseNumber,
          oldLicenseType: location.licenseType,
          newLicenseType: newLicenseType.name,
          effectiveDate: dto.effectiveDate,
        },
      },
    });

    return {
      id: updated.id,
      businessName: updated.name,
      licenseNumber: updated.licenseNumber,
      licenseType: updated.licenseType,
      updatedAt: updated.updatedAt,
    };
  }

  async getLicenseeAccount(locationId: number) {
    const location = await this.prisma.location.findUnique({
      where: { id: String(locationId) },
      include: {
      },
    });

    if (!location) {
      throw new NotFoundException('Licensee account not found');
    }

    return {
      id: location.id,
      businessName: location.name,
      licenseNumber: location.licenseNumber,
      licenseType: location.licenseType,
      isActive: location.isActive,
      address: location.address,
      city: null,
      state: null,
      zipCode: null,
      inventoryWindowStart: location.inventoryWindowStart,
      inventoryWindowEnd: location.inventoryWindowEnd,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
    };
  }

  async listLicenseeAccounts(filters: LicenseeFilterDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { licenseNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.licenseTypeId !== undefined) {
      where.licenseTypeId = filters.licenseTypeId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [licensees, total] = await Promise.all([
      this.prisma.location.findMany({
        where,
        include: {
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.location.count({ where }),
    ]);

    return {
      data: licensees.map((location) => ({
        id: location.id,
        businessName: location.name,
        licenseNumber: location.licenseNumber,
        licenseType: location.licenseType,
        isActive: location.isActive,
        inventoryWindowStart: location.inventoryWindowStart,
        inventoryWindowEnd: location.inventoryWindowEnd,
        createdAt: location.createdAt,
        updatedAt: location.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
