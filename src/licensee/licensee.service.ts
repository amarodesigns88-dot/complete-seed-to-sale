import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LicenseeService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all license types available in the system
   */
  async getAllLicenseTypes() {
    return this.prisma.licenseType.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get a specific license type by ID
   */
  async getLicenseTypeById(licenseTypeId: string) {
    const licenseType = await this.prisma.licenseType.findFirst({
      where: {
        id: licenseTypeId,
        deletedAt: null,
      },
    });

    if (!licenseType) {
      throw new NotFoundException(`License type with ID ${licenseTypeId} not found`);
    }

    return licenseType;
  }

  /**
   * Get location details with license information
   */
  async getLocationWithLicenses(locationId: string) {
    const location = await this.prisma.location.findFirst({
      where: {
        id: locationId,
        deletedAt: null,
      },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${locationId} not found`);
    }

    // Parse license types if stored as JSON array in licenseType field
    // For now, licenseType is a string, so we'll return it as-is
    return {
      ...location,
      primaryLicenseType: location.licenseType,
    };
  }

  /**
   * Update location's license type
   */
  async updateLocationLicenseType(
    locationId: string,
    licenseTypeId: string,
  ) {
    // Verify location exists
    const location = await this.prisma.location.findFirst({
      where: {
        id: locationId,
        deletedAt: null,
      },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${locationId} not found`);
    }

    // Verify license type exists
    const licenseType = await this.prisma.licenseType.findFirst({
      where: {
        id: licenseTypeId,
        deletedAt: null,
      },
    });

    if (!licenseType) {
      throw new NotFoundException(`License type with ID ${licenseTypeId} not found`);
    }

    // Update location with the license type name
    const updatedLocation = await this.prisma.location.update({
      where: { id: locationId },
      data: {
        licenseType: licenseType.name,
        updatedAt: new Date(),
      },
    });

    // Log to audit
    await this.prisma.auditLog.create({
      data: {
        userId: 'system', // Should be from authenticated user context
        entityType: 'Location',
        entityId: locationId,
        action: 'UPDATE',
        oldValue: location.licenseType,
        newValue: licenseType.name,
        ipAddress: 'unknown',
        userAgent: 'system',
      },
    });

    return updatedLocation;
  }

  /**
   * Get license capabilities (what modules are enabled for license type)
   */
  async getLicenseCapabilities(locationId: string) {
    const location = await this.prisma.location.findFirst({
      where: {
        id: locationId,
        deletedAt: null,
      },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${locationId} not found`);
    }

    // Find the license type by name
    const licenseType = await this.prisma.licenseType.findFirst({
      where: {
        name: location.licenseType,
        deletedAt: null,
      },
    });

    if (!licenseType) {
      return {
        locationId,
        licenseType: location.licenseType,
        canTransfer: false,
        enabledModules: location.enabledModules,
        capabilities: {
          cultivation: false,
          manufacturing: false,
          retail: false,
          lab: false,
          transfer: false,
        },
      };
    }

    // Determine capabilities based on license type
    const capabilities = this.determineCapabilities(location.licenseType);

    return {
      locationId,
      licenseType: location.licenseType,
      licenseTypeDetails: licenseType,
      canTransfer: licenseType.canTransfer,
      enabledModules: location.enabledModules,
      capabilities,
    };
  }

  /**
   * Add additional license to location (multi-license support)
   * This is a placeholder for future enhancement when schema supports multiple licenses
   */
  async addAdditionalLicense(
    locationId: string,
    licenseTypeId: string,
    licenseNumber: string,
  ) {
    // Verify location exists
    const location = await this.prisma.location.findFirst({
      where: {
        id: locationId,
        deletedAt: null,
      },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${locationId} not found`);
    }

    // Verify license type exists
    const licenseType = await this.prisma.licenseType.findFirst({
      where: {
        id: licenseTypeId,
        deletedAt: null,
      },
    });

    if (!licenseType) {
      throw new NotFoundException(`License type with ID ${licenseTypeId} not found`);
    }

    // For now, we'll store additional license info in a note
    // In a full implementation, this would create a new LocationLicense junction table entry
    return {
      message: 'Multi-license support enabled',
      locationId,
      primaryLicense: location.licenseType,
      additionalLicense: {
        type: licenseType.name,
        number: licenseNumber,
        status: 'pending_approval',
      },
      note: 'Full multi-license support requires schema migration to add LocationLicense junction table',
    };
  }

  /**
   * List all licenses for a location (multi-license support)
   */
  async getLocationLicenses(locationId: string) {
    const location = await this.prisma.location.findFirst({
      where: {
        id: locationId,
        deletedAt: null,
      },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${locationId} not found`);
    }

    // Return primary license for now
    // In full implementation, would query LocationLicense junction table
    return {
      locationId,
      licenses: [
        {
          type: location.licenseType,
          number: location.licenseNumber,
          isPrimary: true,
          status: 'active',
        },
      ],
    };
  }

  /**
   * Helper method to determine capabilities based on license type
   */
  private determineCapabilities(licenseType: string) {
    const capabilities = {
      cultivation: false,
      manufacturing: false,
      retail: false,
      lab: false,
      transfer: false,
    };

    const type = licenseType.toLowerCase();

    if (type.includes('cultivat') || type.includes('grow')) {
      capabilities.cultivation = true;
      capabilities.transfer = true;
    }

    if (type.includes('manufactur') || type.includes('process')) {
      capabilities.manufacturing = true;
      capabilities.transfer = true;
    }

    if (type.includes('retail') || type.includes('dispensary')) {
      capabilities.retail = true;
    }

    if (type.includes('lab') || type.includes('test')) {
      capabilities.lab = true;
    }

    if (type.includes('transport') || type.includes('distributor')) {
      capabilities.transfer = true;
    }

    return capabilities;
  }
}
