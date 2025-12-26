import { Test, TestingModule } from '@nestjs/testing';
import { LabService } from './lab.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('LabService', () => {
  let service: LabService;
  let prisma: PrismaService;

  const mockPrismaService = {
    testResult: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    sample: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LabService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<LabService>(LabService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('enterResult', () => {
    it('should enter test result successfully', async () => {
      const resultDto = {
        sampleId: 'sample-123',
        testType: 'Potency',
        testStatus: 'Pass',
        testData: {
          thc: 18.5,
          cbd: 0.3,
        },
        notes: 'All tests passed',
      };

      const mockSample = {
        id: 'sample-123',
        status: 'Assigned',
      };

      const mockResult = {
        id: 'result-123',
        sampleId: 'sample-123',
        testType: 'Potency',
        testStatus: 'Pass',
        testData: resultDto.testData,
        createdAt: new Date(),
      };

      mockPrismaService.sample.findUnique.mockResolvedValue(mockSample);
      mockPrismaService.testResult.create.mockResolvedValue(mockResult);
      mockPrismaService.sample.update.mockResolvedValue({
        ...mockSample,
        status: 'Completed',
      });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.enterResult('loc-123', resultDto, 'user-123');

      expect(result).toEqual(mockResult);
      expect(mockPrismaService.sample.findUnique).toHaveBeenCalledWith({
        where: { id: 'sample-123' },
      });
      expect(mockPrismaService.testResult.create).toHaveBeenCalled();
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when sample not found', async () => {
      const resultDto = {
        sampleId: 'sample-999',
        testType: 'Potency',
        testStatus: 'Pass',
        testData: {},
      };

      mockPrismaService.sample.findUnique.mockResolvedValue(null);

      await expect(
        service.enterResult('loc-123', resultDto, 'user-123')
      ).rejects.toThrow(NotFoundException);
    });

    it('should update sample status to Failed when test fails', async () => {
      const resultDto = {
        sampleId: 'sample-123',
        testType: 'Microbial',
        testStatus: 'Fail',
        testData: {
          totalYeastMold: 15000,
        },
      };

      const mockSample = {
        id: 'sample-123',
        status: 'Assigned',
      };

      const mockResult = {
        id: 'result-123',
        sampleId: 'sample-123',
        testType: 'Microbial',
        testStatus: 'Fail',
      };

      mockPrismaService.sample.findUnique.mockResolvedValue(mockSample);
      mockPrismaService.testResult.create.mockResolvedValue(mockResult);
      mockPrismaService.sample.update.mockResolvedValue({
        ...mockSample,
        status: 'Failed',
      });
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.enterResult('loc-123', resultDto, 'user-123');

      expect(result).toEqual(mockResult);
      expect(mockPrismaService.sample.update).toHaveBeenCalledWith({
        where: { id: 'sample-123' },
        data: { status: 'Failed' },
      });
    });
  });

  describe('generateCOA', () => {
    it('should generate COA successfully when all tests pass', async () => {
      const coaDto = {
        sampleId: 'sample-123',
        certificationNumber: 'COA-2024-001',
      };

      const mockSample = {
        id: 'sample-123',
        status: 'Completed',
      };

      const mockTestResults = [
        {
          id: 'result-1',
          testType: 'Potency',
          testStatus: 'Pass',
        },
        {
          id: 'result-2',
          testType: 'Microbial',
          testStatus: 'Pass',
        },
      ];

      const mockUpdatedSample = {
        ...mockSample,
        coaGenerated: true,
        coaCertificationNumber: 'COA-2024-001',
        coaGeneratedAt: new Date(),
      };

      mockPrismaService.sample.findUnique.mockResolvedValue(mockSample);
      mockPrismaService.testResult.findMany.mockResolvedValue(mockTestResults);
      mockPrismaService.sample.update.mockResolvedValue(mockUpdatedSample);
      mockPrismaService.auditLog.create.mockResolvedValue({});

      const result = await service.generateCOA('loc-123', coaDto, 'user-123');

      expect(result).toEqual(mockUpdatedSample);
      expect(mockPrismaService.sample.update).toHaveBeenCalledWith({
        where: { id: 'sample-123' },
        data: {
          coaGenerated: true,
          coaCertificationNumber: 'COA-2024-001',
          coaGeneratedAt: expect.any(Date),
        },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when sample not found', async () => {
      const coaDto = {
        sampleId: 'sample-999',
        certificationNumber: 'COA-2024-001',
      };

      mockPrismaService.sample.findUnique.mockResolvedValue(null);

      await expect(
        service.generateCOA('loc-123', coaDto, 'user-123')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when tests are not complete', async () => {
      const coaDto = {
        sampleId: 'sample-123',
        certificationNumber: 'COA-2024-001',
      };

      const mockSample = {
        id: 'sample-123',
        status: 'Assigned',
      };

      mockPrismaService.sample.findUnique.mockResolvedValue(mockSample);

      await expect(
        service.generateCOA('loc-123', coaDto, 'user-123')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when any test failed', async () => {
      const coaDto = {
        sampleId: 'sample-123',
        certificationNumber: 'COA-2024-001',
      };

      const mockSample = {
        id: 'sample-123',
        status: 'Completed',
      };

      const mockTestResults = [
        {
          id: 'result-1',
          testType: 'Potency',
          testStatus: 'Pass',
        },
        {
          id: 'result-2',
          testType: 'Microbial',
          testStatus: 'Fail',
        },
      ];

      mockPrismaService.sample.findUnique.mockResolvedValue(mockSample);
      mockPrismaService.testResult.findMany.mockResolvedValue(mockTestResults);

      await expect(
        service.generateCOA('loc-123', coaDto, 'user-123')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTestResult', () => {
    it('should get test result details successfully', async () => {
      const mockResult = {
        id: 'result-123',
        sampleId: 'sample-123',
        testType: 'Potency',
        testStatus: 'Pass',
        testData: {
          thc: 18.5,
          cbd: 0.3,
        },
        createdAt: new Date(),
      };

      mockPrismaService.testResult.findUnique.mockResolvedValue(mockResult);

      const result = await service.getTestResult('loc-123', 'result-123');

      expect(result).toEqual(mockResult);
      expect(mockPrismaService.testResult.findUnique).toHaveBeenCalledWith({
        where: { id: 'result-123' },
        include: {
          sample: true,
        },
      });
    });

    it('should throw NotFoundException when test result not found', async () => {
      mockPrismaService.testResult.findUnique.mockResolvedValue(null);

      await expect(
        service.getTestResult('loc-123', 'result-999')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listTestResults', () => {
    it('should list test results with filters', async () => {
      const filters = {
        testType: 'Potency',
        testStatus: 'Pass',
        page: 1,
        perPage: 10,
      };

      const mockResults = [
        {
          id: 'result-1',
          testType: 'Potency',
          testStatus: 'Pass',
        },
        {
          id: 'result-2',
          testType: 'Potency',
          testStatus: 'Pass',
        },
      ];

      mockPrismaService.testResult.findMany.mockResolvedValue(mockResults);
      mockPrismaService.testResult.count.mockResolvedValue(2);

      const result = await service.listTestResults('loc-123', filters);

      expect(result.data).toEqual(mockResults);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.perPage).toBe(10);
      expect(mockPrismaService.testResult.findMany).toHaveBeenCalled();
    });
  });

  describe('getSampleCOA', () => {
    it('should get sample COA successfully', async () => {
      const mockSample = {
        id: 'sample-123',
        coaGenerated: true,
        coaCertificationNumber: 'COA-2024-001',
        coaGeneratedAt: new Date(),
        testResults: [
          {
            id: 'result-1',
            testType: 'Potency',
            testStatus: 'Pass',
          },
        ],
      };

      mockPrismaService.sample.findFirst.mockResolvedValue(mockSample);

      const result = await service.getSampleCOA('loc-123', 'sample-123');

      expect(result).toEqual(mockSample);
      expect(mockPrismaService.sample.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'sample-123',
          locationId: 'loc-123',
          coaGenerated: true,
        },
        include: {
          testResults: true,
          inventory: true,
        },
      });
    });

    it('should throw NotFoundException when COA not found', async () => {
      mockPrismaService.sample.findFirst.mockResolvedValue(null);

      await expect(
        service.getSampleCOA('loc-123', 'sample-999')
      ).rejects.toThrow(NotFoundException);
    });
  });
});
