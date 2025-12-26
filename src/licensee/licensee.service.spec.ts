import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LicenseeService } from './licensee.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LicenseeService - Sprints 3-4 Enhancements', () => {
  let service: LicenseeService;
  let prisma: any;

  beforeEach(async () => {
    const mockPrisma = {
      licenseType: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      location: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      locationLicense: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LicenseeService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LicenseeService>(LicenseeService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllLicenseTypes', () => {
    it('should retrieve all license types', async () => {
      const mockLicenseTypes = [
        {
          id: 'type-1',
          name: 'Producer',
          code: 'PROD',
          allowsCultivation: true,
        },
        {
          id: 'type-2',
          name: 'Processor',
          code: 'PROC',
          allowsProcessing: true,
        },
        {
          id: 'type-3',
          name: 'Retail',
          code: 'RETAIL',
          allowsRetail: true,
        },
      ];

      prisma.licenseType.findMany.mockResolvedValue(mockLicenseTypes);

      const result = await service.getAllLicenseTypes();

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Producer');
      expect(prisma.licenseType.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
      });
    });

    it('should return empty array if no license types exist', async () => {
      prisma.licenseType.findMany.mockResolvedValue([]);

      const result = await service.getAllLicenseTypes();

      expect(result).toEqual([]);
    });
  });

  describe('getLicenseType', () => {
    it('should retrieve a specific license type by ID', async () => {
      const mockLicenseType = {
        id: 'type-1',
        name: 'Producer',
        code: 'PROD',
        allowsCultivation: true,
        allowsProcessing: false,
        allowsRetail: false,
      };

      prisma.licenseType.findUnique.mockResolvedValue(mockLicenseType);

      const result = await service.getLicenseType('type-1');

      expect(result.name).toBe('Producer');
      expect(result.allowsCultivation).toBe(true);
    });

    it('should throw NotFoundException if license type not found', async () => {
      prisma.licenseType.findUnique.mockResolvedValue(null);

      await expect(service.getLicenseType('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getLocationInfo', () => {
    it('should retrieve location with license information', async () => {
      const mockLocation = {
        id: 'loc-123',
        name: 'Springfield Facility',
        licenseTypeId: 'type-1',
        licenseType: {
          id: 'type-1',
          name: 'Producer',
          code: 'PROD',
          allowsCultivation: true,
        },
        licenses: [
          {
            id: 'lic-1',
            licenseNumber: 'LIC-001',
            licenseType: {
              id: 'type-1',
              name: 'Producer',
            },
          },
        ],
      };

      prisma.location.findFirst.mockResolvedValue(mockLocation);

      const result = await service.getLocationInfo('loc-123');

      expect(result.name).toBe('Springfield Facility');
      expect(result.licenseType.name).toBe('Producer');
      expect(result.licenses).toHaveLength(1);
    });

    it('should throw NotFoundException if location not found', async () => {
      prisma.location.findFirst.mockResolvedValue(null);

      await expect(service.getLocationInfo('invalid-loc')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateLicenseType', () => {
    it('should update location license type', async () => {
      const mockLocation = {
        id: 'loc-123',
        licenseTypeId: 'type-1',
        deletedAt: null,
      };
      const mockLicenseType = {
        id: 'type-2',
        name: 'Processor',
        deletedAt: null,
      };
      const mockUpdated = {
        ...mockLocation,
        licenseTypeId: 'type-2',
        licenseType: mockLicenseType,
      };

      prisma.location.findFirst.mockResolvedValue(mockLocation);
      prisma.licenseType.findUnique.mockResolvedValue(mockLicenseType);
      prisma.location.update.mockResolvedValue(mockUpdated);
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.updateLicenseType('loc-123', {
        licenseTypeId: 'type-2',
        reason: 'License upgrade',
      });

      expect(result.licenseTypeId).toBe('type-2');
      expect(prisma.location.update).toHaveBeenCalledWith({
        where: { id: 'loc-123' },
        data: { licenseTypeId: 'type-2' },
        include: { licenseType: true },
      });
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityType: 'Location',
            entityId: 'loc-123',
            action: 'UPDATE_LICENSE_TYPE',
          }),
        }),
      );
    });

    it('should throw NotFoundException if location not found', async () => {
      prisma.location.findFirst.mockResolvedValue(null);

      await expect(
        service.updateLicenseType('invalid-loc', {
          licenseTypeId: 'type-1',
          reason: 'Test',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if license type not found', async () => {
      const mockLocation = {
        id: 'loc-123',
        licenseTypeId: 'type-1',
        deletedAt: null,
      };

      prisma.location.findFirst.mockResolvedValue(mockLocation);
      prisma.licenseType.findUnique.mockResolvedValue(null);

      await expect(
        service.updateLicenseType('loc-123', {
          licenseTypeId: 'invalid-type',
          reason: 'Test',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getLicenseCapabilities', () => {
    it('should return capabilities for Producer license', async () => {
      const mockLocation = {
        id: 'loc-123',
        licenseTypeId: 'type-1',
        licenseType: {
          id: 'type-1',
          name: 'Producer',
          code: 'PROD',
          allowsCultivation: true,
          allowsProcessing: false,
          allowsRetail: false,
          allowsTransfer: true,
          allowsTesting: false,
        },
      };

      prisma.location.findFirst.mockResolvedValue(mockLocation);

      const result = await service.getLicenseCapabilities('loc-123');

      expect(result.allowsCultivation).toBe(true);
      expect(result.allowsProcessing).toBe(false);
      expect(result.allowsRetail).toBe(false);
      expect(result.allowsTransfer).toBe(true);
      expect(result.modules).toContain('cultivation');
      expect(result.modules).not.toContain('retail');
    });

    it('should return capabilities for Retail license', async () => {
      const mockLocation = {
        id: 'loc-123',
        licenseType: {
          name: 'Retail',
          allowsCultivation: false,
          allowsProcessing: false,
          allowsRetail: true,
          allowsTransfer: true,
          allowsTesting: false,
        },
      };

      prisma.location.findFirst.mockResolvedValue(mockLocation);

      const result = await service.getLicenseCapabilities('loc-123');

      expect(result.allowsRetail).toBe(true);
      expect(result.modules).toContain('retail');
      expect(result.modules).not.toContain('cultivation');
    });

    it('should return capabilities for Integrated license (all permissions)', async () => {
      const mockLocation = {
        id: 'loc-123',
        licenseType: {
          name: 'Integrated',
          allowsCultivation: true,
          allowsProcessing: true,
          allowsRetail: true,
          allowsTransfer: true,
          allowsTesting: true,
        },
      };

      prisma.location.findFirst.mockResolvedValue(mockLocation);

      const result = await service.getLicenseCapabilities('loc-123');

      expect(result.allowsCultivation).toBe(true);
      expect(result.allowsProcessing).toBe(true);
      expect(result.allowsRetail).toBe(true);
      expect(result.modules).toContain('cultivation');
      expect(result.modules).toContain('processing');
      expect(result.modules).toContain('retail');
    });

    it('should throw NotFoundException if location not found', async () => {
      prisma.location.findFirst.mockResolvedValue(null);

      await expect(service.getLicenseCapabilities('invalid-loc')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addAdditionalLicense', () => {
    it('should add additional license to location', async () => {
      const mockLocation = {
        id: 'loc-123',
        licenseTypeId: 'type-1',
        deletedAt: null,
      };
      const mockLicenseType = {
        id: 'type-2',
        name: 'Processor',
        deletedAt: null,
      };
      const mockLicense = {
        id: 'lic-123',
        locationId: 'loc-123',
        licenseTypeId: 'type-2',
        licenseNumber: 'LIC-002',
        issueDate: new Date(),
        expirationDate: new Date('2026-12-31'),
      };

      prisma.location.findFirst.mockResolvedValue(mockLocation);
      prisma.licenseType.findUnique.mockResolvedValue(mockLicenseType);
      prisma.locationLicense.create.mockResolvedValue(mockLicense);
      prisma.auditLog.create.mockResolvedValue({});

      const result = await service.addAdditionalLicense('loc-123', {
        licenseTypeId: 'type-2',
        licenseNumber: 'LIC-002',
        issueDate: new Date(),
        expirationDate: new Date('2026-12-31'),
      });

      expect(result.licenseNumber).toBe('LIC-002');
      expect(prisma.locationLicense.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            locationId: 'loc-123',
            licenseTypeId: 'type-2',
            licenseNumber: 'LIC-002',
          }),
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if location not found', async () => {
      prisma.location.findFirst.mockResolvedValue(null);

      await expect(
        service.addAdditionalLicense('invalid-loc', {
          licenseTypeId: 'type-1',
          licenseNumber: 'LIC-001',
          issueDate: new Date(),
          expirationDate: new Date('2026-12-31'),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if license type not found', async () => {
      const mockLocation = {
        id: 'loc-123',
        deletedAt: null,
      };

      prisma.location.findFirst.mockResolvedValue(mockLocation);
      prisma.licenseType.findUnique.mockResolvedValue(null);

      await expect(
        service.addAdditionalLicense('loc-123', {
          licenseTypeId: 'invalid-type',
          licenseNumber: 'LIC-001',
          issueDate: new Date(),
          expirationDate: new Date('2026-12-31'),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if expiration date is in the past', async () => {
      const mockLocation = {
        id: 'loc-123',
        deletedAt: null,
      };
      const mockLicenseType = {
        id: 'type-1',
        deletedAt: null,
      };

      prisma.location.findFirst.mockResolvedValue(mockLocation);
      prisma.licenseType.findUnique.mockResolvedValue(mockLicenseType);

      await expect(
        service.addAdditionalLicense('loc-123', {
          licenseTypeId: 'type-1',
          licenseNumber: 'LIC-001',
          issueDate: new Date(),
          expirationDate: new Date('2020-01-01'), // Past date
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getLocationLicenses', () => {
    it('should retrieve all licenses for a location', async () => {
      const mockLicenses = [
        {
          id: 'lic-1',
          locationId: 'loc-123',
          licenseNumber: 'LIC-001',
          licenseType: {
            id: 'type-1',
            name: 'Producer',
            code: 'PROD',
          },
          status: 'active',
          expirationDate: new Date('2026-12-31'),
        },
        {
          id: 'lic-2',
          locationId: 'loc-123',
          licenseNumber: 'LIC-002',
          licenseType: {
            id: 'type-2',
            name: 'Processor',
            code: 'PROC',
          },
          status: 'active',
          expirationDate: new Date('2026-12-31'),
        },
      ];

      prisma.locationLicense.findMany.mockResolvedValue(mockLicenses);

      const result = await service.getLocationLicenses('loc-123');

      expect(result).toHaveLength(2);
      expect(result[0].licenseNumber).toBe('LIC-001');
      expect(result[1].licenseNumber).toBe('LIC-002');
      expect(prisma.locationLicense.findMany).toHaveBeenCalledWith({
        where: {
          locationId: 'loc-123',
          deletedAt: null,
        },
        include: { licenseType: true },
        orderBy: { issueDate: 'desc' },
      });
    });

    it('should return empty array if location has no additional licenses', async () => {
      prisma.locationLicense.findMany.mockResolvedValue([]);

      const result = await service.getLocationLicenses('loc-123');

      expect(result).toEqual([]);
    });
  });
});
