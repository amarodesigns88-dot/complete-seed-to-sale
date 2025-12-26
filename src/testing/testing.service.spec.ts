import { Test, TestingModule } from '@nestjs/testing';
import { TestingService } from './testing.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('TestingService', () => {
  let service: TestingService;
  let prisma: PrismaService;

  const mockPrismaService = {
    sample: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    inventory: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TestingService>(TestingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSample', () => {
    it('should generate sample from inventory successfully', async () => {
      const generateDto = {
        inventoryId: 'inv-123',
        sampleType: 'Compliance',
        sampleSize: 5.0,
        notes: 'Test sample',
      };

      const mockInventory = {
        id: 'inv-123',
        quantityGrams: 100.0,
      };

      const mockSample = {
        id: 'sample-123',
        inventoryId: 'inv-123',
        sampleType: 'Compliance',
        sampleSize: 5.0,
        status: 'Pending',
        createdAt: new Date(),
      };

      mockPrismaService.inventory.findUnique.mockResolvedValue(mockInventory);
      mockPrismaService.sample.create.mockResolvedValue(mockSample);
      mockPrismaService.inventory.update.mockResolvedValue({
        ...mockInventory,
        quantityGrams: 95.0,
      });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.generateSample('loc-123', generateDto, 'user-123');

      expect(result).toEqual(mockSample);
      expect(mockPrismaService.inventory.findUnique).toHaveBeenCalledWith({
        where: { id: 'inv-123' },
      });
      expect(mockPrismaService.inventory.update).toHaveBeenCalledWith({
        where: { id: 'inv-123' },
        data: { quantityGrams: 95.0 },
      });
      expect(mockPrismaService.sample.create).toHaveBeenCalled();
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when inventory not found', async () => {
      const generateDto = {
        inventoryId: 'inv-999',
        sampleType: 'Compliance',
        sampleSize: 5.0,
      };

      mockPrismaService.inventory.findUnique.mockResolvedValue(null);

      await expect(
        service.generateSample('loc-123', generateDto, 'user-123')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when insufficient inventory', async () => {
      const generateDto = {
        inventoryId: 'inv-123',
        sampleType: 'Compliance',
        sampleSize: 150.0,
      };

      const mockInventory = {
        id: 'inv-123',
        quantityGrams: 100.0,
      };

      mockPrismaService.inventory.findUnique.mockResolvedValue(mockInventory);

      await expect(
        service.generateSample('loc-123', generateDto, 'user-123')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('assignLab', () => {
    it('should assign sample to lab successfully', async () => {
      const assignDto = {
        sampleId: 'sample-123',
        labName: 'Test Lab Inc',
        labContact: 'lab@test.com',
        expectedCompletionDate: new Date('2024-12-31'),
      };

      const mockSample = {
        id: 'sample-123',
        status: 'Pending',
      };

      const mockUpdatedSample = {
        ...mockSample,
        status: 'Assigned',
        labName: 'Test Lab Inc',
        labContact: 'lab@test.com',
        expectedCompletionDate: assignDto.expectedCompletionDate,
      };

      mockPrismaService.sample.findUnique.mockResolvedValue(mockSample);
      mockPrismaService.sample.update.mockResolvedValue(mockUpdatedSample);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.assignLab('loc-123', assignDto, 'user-123');

      expect(result).toEqual(mockUpdatedSample);
      expect(mockPrismaService.sample.update).toHaveBeenCalledWith({
        where: { id: 'sample-123' },
        data: {
          status: 'Assigned',
          labName: 'Test Lab Inc',
          labContact: 'lab@test.com',
          expectedCompletionDate: assignDto.expectedCompletionDate,
        },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when sample not found', async () => {
      const assignDto = {
        sampleId: 'sample-999',
        labName: 'Test Lab Inc',
        labContact: 'lab@test.com',
        expectedCompletionDate: new Date('2024-12-31'),
      };

      mockPrismaService.sample.findUnique.mockResolvedValue(null);

      await expect(
        service.assignLab('loc-123', assignDto, 'user-123')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remediate', () => {
    it('should initiate remediation successfully', async () => {
      const remediateDto = {
        sampleId: 'sample-123',
        remediationType: 'Retesting',
        reason: 'Failed microbial test',
        notes: 'Need to retest',
      };

      const mockSample = {
        id: 'sample-123',
        status: 'Failed',
      };

      const mockUpdatedSample = {
        ...mockSample,
        status: 'Remediation',
        remediationType: 'Retesting',
        remediationReason: 'Failed microbial test',
      };

      mockPrismaService.sample.findUnique.mockResolvedValue(mockSample);
      mockPrismaService.sample.update.mockResolvedValue(mockUpdatedSample);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.remediate('loc-123', remediateDto, 'user-123');

      expect(result).toEqual(mockUpdatedSample);
      expect(mockPrismaService.sample.update).toHaveBeenCalledWith({
        where: { id: 'sample-123' },
        data: {
          status: 'Remediation',
          remediationType: 'Retesting',
          remediationReason: 'Failed microbial test',
        },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when sample not found', async () => {
      const remediateDto = {
        sampleId: 'sample-999',
        remediationType: 'Retesting',
        reason: 'Failed test',
      };

      mockPrismaService.sample.findUnique.mockResolvedValue(null);

      await expect(
        service.remediate('loc-123', remediateDto, 'user-123')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSample', () => {
    it('should get sample details successfully', async () => {
      const mockSample = {
        id: 'sample-123',
        inventoryId: 'inv-123',
        sampleType: 'Compliance',
        sampleSize: 5.0,
        status: 'Assigned',
        labName: 'Test Lab Inc',
        createdAt: new Date(),
      };

      mockPrismaService.sample.findUnique.mockResolvedValue(mockSample);

      const result = await service.getSample('loc-123', 'sample-123');

      expect(result).toEqual(mockSample);
      expect(mockPrismaService.sample.findUnique).toHaveBeenCalledWith({
        where: { id: 'sample-123' },
        include: {
          inventory: true,
          testResults: true,
        },
      });
    });

    it('should throw NotFoundException when sample not found', async () => {
      mockPrismaService.sample.findUnique.mockResolvedValue(null);

      await expect(
        service.getSample('loc-123', 'sample-999')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listSamples', () => {
    it('should list samples with pagination', async () => {
      const filters = {
        status: 'Assigned',
        page: 1,
        perPage: 10,
      };

      const mockSamples = [
        {
          id: 'sample-1',
          status: 'Assigned',
          sampleType: 'Compliance',
        },
        {
          id: 'sample-2',
          status: 'Assigned',
          sampleType: 'QA',
        },
      ];

      mockPrismaService.sample.findMany.mockResolvedValue(mockSamples);
      mockPrismaService.sample.count.mockResolvedValue(2);

      const result = await service.listSamples('loc-123', filters);

      expect(result.data).toEqual(mockSamples);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(10);
      expect(mockPrismaService.sample.findMany).toHaveBeenCalledWith({
        where: {
          locationId: 'loc-123',
          status: 'Assigned',
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should list samples without filters', async () => {
      const mockSamples = [
        {
          id: 'sample-1',
          status: 'Pending',
        },
      ];

      mockPrismaService.sample.findMany.mockResolvedValue(mockSamples);
      mockPrismaService.sample.count.mockResolvedValue(1);

      const result = await service.listSamples('loc-123', {});

      expect(result.data).toEqual(mockSamples);
      expect(result.total).toBe(1);
    });
  });
});
