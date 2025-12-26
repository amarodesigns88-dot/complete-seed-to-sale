import { Test, TestingModule } from '@nestjs/testing';
import { StateLicenseeManagementService } from './state-licensee-management.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateLicenseeAccountDto,
  ActivateLicenseDto,
  SetInventoryWindowDto,
  AssignLicenseTypeDto,
  LicenseeFilterDto,
} from './dto/licensee-management.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('StateLicenseeManagementService', () => {
  let service: StateLicenseeManagementService;
  let prisma: PrismaService;

  const mockPrismaService = {
    location: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StateLicenseeManagementService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<StateLicenseeManagementService>(
      StateLicenseeManagementService,
    );
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createLicenseeAccount', () => {
    it('should create a new licensee account', async () => {
      const dto: CreateLicenseeAccountDto = {
        licenseNumber: 'LIC-2024-001',
        businessName: 'Green Leaf Dispensary',
        businessType: 'Dispensary',
        licenseTypeId: 1,
        ownerName: 'John Doe',
        ownerEmail: 'john@greenleaf.com',
        phone: '555-1234',
        address: '123 Main St',
        city: 'Denver',
        state: 'CO',
        zipCode: '80202',
      };

      const mockLocation = {
        id: 1,
        ...dto,
        isActive: true,
        createdAt: new Date(),
      };

      mockPrismaService.location.findUnique.mockResolvedValue(null);
      mockPrismaService.location.create.mockResolvedValue(mockLocation);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.createLicenseeAccount(dto, 1);

      expect(result).toEqual(mockLocation);
      expect(mockPrismaService.location.findUnique).toHaveBeenCalledWith({
        where: { licenseNumber: dto.licenseNumber },
      });
      expect(mockPrismaService.location.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          licenseNumber: dto.licenseNumber,
          businessName: dto.businessName,
          isActive: true,
        }),
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if license number already exists', async () => {
      const dto: CreateLicenseeAccountDto = {
        licenseNumber: 'LIC-2024-001',
        businessName: 'Green Leaf Dispensary',
        businessType: 'Dispensary',
        licenseTypeId: 1,
        ownerName: 'John Doe',
        ownerEmail: 'john@greenleaf.com',
        phone: '555-1234',
        address: '123 Main St',
        city: 'Denver',
        state: 'CO',
        zipCode: '80202',
      };

      mockPrismaService.location.findUnique.mockResolvedValue({ id: 1 });

      await expect(service.createLicenseeAccount(dto, 1)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.location.create).not.toHaveBeenCalled();
    });
  });

  describe('activateLicense', () => {
    it('should activate a license', async () => {
      const locationId = 1;
      const dto: ActivateLicenseDto = {
        isActive: true,
        reason: 'License approved and verified',
      };

      const mockLocation = {
        id: 1,
        licenseNumber: 'LIC-2024-001',
        businessName: 'Green Leaf Dispensary',
        isActive: false,
      };

      const mockUpdatedLocation = {
        ...mockLocation,
        isActive: true,
      };

      mockPrismaService.location.findUnique.mockResolvedValue(mockLocation);
      mockPrismaService.location.update.mockResolvedValue(mockUpdatedLocation);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.activateLicense(locationId, dto, 1);

      expect(result).toEqual(mockUpdatedLocation);
      expect(mockPrismaService.location.update).toHaveBeenCalledWith({
        where: { id: locationId },
        data: { isActive: true },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'ACTIVATE_LICENSE',
          details: expect.stringContaining(dto.reason),
        }),
      });
    });

    it('should deactivate a license', async () => {
      const locationId = 1;
      const dto: ActivateLicenseDto = {
        isActive: false,
        reason: 'License suspended for violations',
      };

      const mockLocation = {
        id: 1,
        licenseNumber: 'LIC-2024-001',
        businessName: 'Green Leaf Dispensary',
        isActive: true,
      };

      const mockUpdatedLocation = {
        ...mockLocation,
        isActive: false,
      };

      mockPrismaService.location.findUnique.mockResolvedValue(mockLocation);
      mockPrismaService.location.update.mockResolvedValue(mockUpdatedLocation);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.activateLicense(locationId, dto, 1);

      expect(result).toEqual(mockUpdatedLocation);
      expect(mockPrismaService.location.update).toHaveBeenCalledWith({
        where: { id: locationId },
        data: { isActive: false },
      });
    });

    it('should throw NotFoundException if licensee not found', async () => {
      const locationId = 999;
      const dto: ActivateLicenseDto = {
        isActive: true,
        reason: 'Activate license',
      };

      mockPrismaService.location.findUnique.mockResolvedValue(null);

      await expect(service.activateLicense(locationId, dto, 1)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.location.update).not.toHaveBeenCalled();
    });
  });

  describe('setInitialInventoryWindow', () => {
    it('should set initial inventory window', async () => {
      const locationId = 1;
      const dto: SetInventoryWindowDto = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const mockLocation = {
        id: 1,
        licenseNumber: 'LIC-2024-001',
        businessName: 'Green Leaf Dispensary',
      };

      const mockUpdatedLocation = {
        ...mockLocation,
        initialInventoryStartDate: dto.startDate,
        initialInventoryEndDate: dto.endDate,
      };

      mockPrismaService.location.findUnique.mockResolvedValue(mockLocation);
      mockPrismaService.location.update.mockResolvedValue(mockUpdatedLocation);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.setInitialInventoryWindow(
        locationId,
        dto,
        1,
      );

      expect(result).toEqual(mockUpdatedLocation);
      expect(mockPrismaService.location.update).toHaveBeenCalledWith({
        where: { id: locationId },
        data: {
          initialInventoryStartDate: dto.startDate,
          initialInventoryEndDate: dto.endDate,
        },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if end date is before start date', async () => {
      const locationId = 1;
      const dto: SetInventoryWindowDto = {
        startDate: new Date('2024-01-31'),
        endDate: new Date('2024-01-01'),
      };

      const mockLocation = { id: 1 };
      mockPrismaService.location.findUnique.mockResolvedValue(mockLocation);

      await expect(
        service.setInitialInventoryWindow(locationId, dto, 1),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.location.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if licensee not found', async () => {
      const locationId = 999;
      const dto: SetInventoryWindowDto = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      mockPrismaService.location.findUnique.mockResolvedValue(null);

      await expect(
        service.setInitialInventoryWindow(locationId, dto, 1),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignLicenseType', () => {
    it('should assign license type to licensee', async () => {
      const locationId = 1;
      const dto: AssignLicenseTypeDto = {
        licenseTypeId: 2,
        effectiveDate: new Date('2024-02-01'),
      };

      const mockLocation = {
        id: 1,
        licenseNumber: 'LIC-2024-001',
        businessName: 'Green Leaf Dispensary',
        licenseTypeId: 1,
      };

      const mockUpdatedLocation = {
        ...mockLocation,
        licenseTypeId: 2,
      };

      mockPrismaService.location.findUnique.mockResolvedValue(mockLocation);
      mockPrismaService.location.update.mockResolvedValue(mockUpdatedLocation);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.assignLicenseType(locationId, dto, 1);

      expect(result).toEqual(mockUpdatedLocation);
      expect(mockPrismaService.location.update).toHaveBeenCalledWith({
        where: { id: locationId },
        data: { licenseTypeId: dto.licenseTypeId },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'ASSIGN_LICENSE_TYPE',
          details: expect.stringContaining(`from 1 to 2`),
        }),
      });
    });

    it('should throw NotFoundException if licensee not found', async () => {
      const locationId = 999;
      const dto: AssignLicenseTypeDto = {
        licenseTypeId: 2,
        effectiveDate: new Date('2024-02-01'),
      };

      mockPrismaService.location.findUnique.mockResolvedValue(null);

      await expect(service.assignLicenseType(locationId, dto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getLicenseeAccount', () => {
    it('should return licensee account details', async () => {
      const locationId = 1;

      const mockLocation = {
        id: 1,
        licenseNumber: 'LIC-2024-001',
        businessName: 'Green Leaf Dispensary',
        isActive: true,
        licenseType: {
          id: 1,
          name: 'Retail Dispensary',
        },
      };

      mockPrismaService.location.findUnique.mockResolvedValue(mockLocation);

      const result = await service.getLicenseeAccount(locationId);

      expect(result).toEqual(mockLocation);
      expect(mockPrismaService.location.findUnique).toHaveBeenCalledWith({
        where: { id: locationId },
        include: {
          licenseType: true,
        },
      });
    });

    it('should throw NotFoundException if licensee not found', async () => {
      const locationId = 999;

      mockPrismaService.location.findUnique.mockResolvedValue(null);

      await expect(service.getLicenseeAccount(locationId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listLicenseeAccounts', () => {
    it('should return list of licensee accounts', async () => {
      const filters: LicenseeFilterDto = {
        page: 1,
        limit: 10,
      };

      const mockLocations = [
        {
          id: 1,
          licenseNumber: 'LIC-2024-001',
          businessName: 'Green Leaf Dispensary',
          isActive: true,
        },
        {
          id: 2,
          licenseNumber: 'LIC-2024-002',
          businessName: 'Blue Sky Cannabis',
          isActive: true,
        },
      ];

      mockPrismaService.location.findMany.mockResolvedValue(mockLocations);
      mockPrismaService.location.count.mockResolvedValue(2);

      const result = await service.listLicenseeAccounts(filters);

      expect(result).toEqual({
        data: mockLocations,
        total: 2,
        page: 1,
        limit: 10,
      });
      expect(mockPrismaService.location.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          licenseType: true,
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by search term', async () => {
      const filters: LicenseeFilterDto = {
        search: 'Green Leaf',
        page: 1,
        limit: 10,
      };

      mockPrismaService.location.findMany.mockResolvedValue([]);
      mockPrismaService.location.count.mockResolvedValue(0);

      await service.listLicenseeAccounts(filters);

      expect(mockPrismaService.location.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { businessName: { contains: 'Green Leaf', mode: 'insensitive' } },
              { licenseNumber: { contains: 'Green Leaf', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('should filter by license type', async () => {
      const filters: LicenseeFilterDto = {
        licenseTypeId: 1,
        page: 1,
        limit: 10,
      };

      mockPrismaService.location.findMany.mockResolvedValue([]);
      mockPrismaService.location.count.mockResolvedValue(0);

      await service.listLicenseeAccounts(filters);

      expect(mockPrismaService.location.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            licenseTypeId: 1,
          },
        }),
      );
    });

    it('should filter by active status', async () => {
      const filters: LicenseeFilterDto = {
        isActive: true,
        page: 1,
        limit: 10,
      };

      mockPrismaService.location.findMany.mockResolvedValue([]);
      mockPrismaService.location.count.mockResolvedValue(0);

      await service.listLicenseeAccounts(filters);

      expect(mockPrismaService.location.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
          },
        }),
      );
    });

    it('should handle pagination', async () => {
      const filters: LicenseeFilterDto = {
        page: 2,
        limit: 5,
      };

      mockPrismaService.location.findMany.mockResolvedValue([]);
      mockPrismaService.location.count.mockResolvedValue(15);

      const result = await service.listLicenseeAccounts(filters);

      expect(result).toEqual({
        data: [],
        total: 15,
        page: 2,
        limit: 5,
      });
      expect(mockPrismaService.location.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page - 1) * limit = (2 - 1) * 5
          take: 5,
        }),
      );
    });
  });
});
