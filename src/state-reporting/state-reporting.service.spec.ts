import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StateReportingService } from './state-reporting.service';
import { PrismaService } from '../prisma/prisma.service';

describe('StateReportingService', () => {
  let service: StateReportingService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StateReportingService,
        {
          provide: PrismaService,
          useValue: {
            auditLog: {
              findMany: jest.fn(),
              count: jest.fn(),
              create: jest.fn(),
            },
            location: {
              count: jest.fn(),
            },
            inventory: {
              aggregate: jest.fn(),
              findMany: jest.fn(),
            },
            sale: {
              aggregate: jest.fn(),
              findMany: jest.fn(),
            },
            transfer: {
              findMany: jest.fn(),
              aggregate: jest.fn(),
            },
            testResult: {
              findMany: jest.fn(),
              aggregate: jest.fn(),
              count: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<StateReportingService>(StateReportingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateComplianceReport', () => {
    it('should generate compliance report successfully', async () => {
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        includeViolationsOnly: false,
      };

      jest.spyOn(prisma.auditLog, 'findMany').mockResolvedValue([
        {
          id: '1',
          action: 'RED_FLAG_CREATED',
          createdAt: new Date('2024-01-15'),
          user: { email: 'user@test.com', firstName: 'John', lastName: 'Doe' },
        } as any,
      ]);
      jest.spyOn(prisma.auditLog, 'count').mockResolvedValue(100);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateComplianceReport(dto);

      expect(result.reportType).toBe('COMPLIANCE');
      expect(result.data.metrics.totalOperations).toBe(100);
      expect(result.data.metrics.violations).toBe(1);
      expect(result.data.metrics.complianceRate).toContain('%');
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'GENERATE_COMPLIANCE_REPORT',
          }),
        }),
      );
    });

    it('should throw BadRequestException for invalid date range', async () => {
      const dto = {
        startDate: '2024-02-01',
        endDate: '2024-01-01',
      };

      await expect(service.generateComplianceReport(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should filter by licensee UBI when provided', async () => {
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        licenseeUbi: 'UBI123',
      };

      jest.spyOn(prisma.auditLog, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.auditLog, 'count').mockResolvedValue(0);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateComplianceReport(dto);

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            locationId: 'UBI123',
          }),
        }),
      );
    });
  });

  describe('generateMarketAnalyticsReport', () => {
    it('should generate market analytics report successfully', async () => {
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      jest.spyOn(prisma.location, 'count').mockResolvedValue(50);
      jest.spyOn(prisma.inventory, 'aggregate').mockResolvedValue({
        _sum: { quantity: 1000 },
        _count: { id: 200 },
      } as any);
      jest.spyOn(prisma.sale, 'aggregate').mockResolvedValue({
        _sum: { totalAmount: 50000 },
        _count: { id: 150 },
      } as any);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateMarketAnalyticsReport(dto);

      expect(result.reportType).toBe('MARKET_ANALYTICS');
      expect(result.data.metrics.totalLicensees).toBe(50);
      expect(result.data.metrics.totalInventoryQuantity).toBe(1000);
      expect(result.data.metrics.totalRevenue).toBe(50000);
    });

    it('should include forecast when requested', async () => {
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        includeForecast: true,
      };

      jest.spyOn(prisma.location, 'count').mockResolvedValue(50);
      jest.spyOn(prisma.inventory, 'aggregate').mockResolvedValue({
        _sum: { quantity: 1000 },
        _count: { id: 200 },
      } as any);
      jest.spyOn(prisma.sale, 'aggregate').mockResolvedValue({
        _sum: { totalAmount: 50000 },
        _count: { id: 150 },
      } as any);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateMarketAnalyticsReport(dto);

      expect(result.data.trends).toBeDefined();
    });
  });

  describe('generateLicenseePerformanceReport', () => {
    it('should generate licensee performance report with sales metrics', async () => {
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        licenseeUbi: 'UBI123',
        includeSalesMetrics: true,
        includeComplianceScore: false,
      };

      jest.spyOn(prisma.sale, 'aggregate').mockResolvedValue({
        _sum: { totalAmount: 25000 },
        _count: { id: 75 },
        _avg: { totalAmount: 333.33 },
      } as any);
      jest.spyOn(prisma.inventory, 'aggregate').mockResolvedValue({
        _count: { id: 100 },
        _sum: { quantity: 500 },
      } as any);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateLicenseePerformanceReport(dto);

      expect(result.reportType).toBe('LICENSEE_PERFORMANCE');
      expect(result.data.performance.sales).toBeDefined();
      expect(result.data.performance.sales._sum.totalAmount).toBe(25000);
    });

    it('should include compliance score when requested', async () => {
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        licenseeUbi: 'UBI123',
        includeSalesMetrics: false,
        includeComplianceScore: true,
      };

      jest.spyOn(prisma.inventory, 'aggregate').mockResolvedValue({
        _count: { id: 100 },
        _sum: { quantity: 500 },
      } as any);
      jest.spyOn(prisma.auditLog, 'count').mockResolvedValue(3);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateLicenseePerformanceReport(dto);

      expect(result.data.performance.compliance).toBeDefined();
      expect(result.data.performance.compliance.violations).toBe(3);
    });
  });

  describe('generateInventoryReport', () => {
    it('should generate inventory report successfully', async () => {
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const mockInventory = [
        {
          id: '1',
          type: 'FLOWER',
          quantity: 100,
          createdAt: new Date('2024-01-15'),
          location: { ubi: 'UBI123', businessName: 'Test Location', licenseType: 'PRODUCER' },
          room: { name: 'Room 1', roomType: 'GROW' },
        },
      ];

      jest.spyOn(prisma.inventory, 'findMany').mockResolvedValue(mockInventory as any);
      jest.spyOn(prisma.inventory, 'aggregate').mockResolvedValue({
        _sum: { quantity: 100 },
        _count: { id: 1 },
      } as any);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateInventoryReport(dto);

      expect(result.reportType).toBe('INVENTORY');
      expect(result.data.inventory).toHaveLength(1);
      expect(result.summary.totalItems).toBe(1);
      expect(result.summary.totalQuantity).toBe(100);
    });

    it('should filter by inventory type', async () => {
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        inventoryType: 'FLOWER',
      };

      jest.spyOn(prisma.inventory, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.inventory, 'aggregate').mockResolvedValue({
        _sum: { quantity: 0 },
        _count: { id: 0 },
      } as any);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      await service.generateInventoryReport(dto);

      expect(prisma.inventory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'FLOWER',
          }),
        }),
      );
    });
  });

  describe('generateSalesAnalyticsReport', () => {
    it('should generate sales analytics report successfully', async () => {
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const mockSales = [
        {
          id: '1',
          totalAmount: 100,
          tax: 10,
          createdAt: new Date('2024-01-15'),
          location: { ubi: 'UBI123', businessName: 'Test Location' },
          saleItems: [],
        },
      ];

      jest.spyOn(prisma.sale, 'findMany').mockResolvedValue(mockSales as any);
      jest.spyOn(prisma.sale, 'aggregate').mockResolvedValue({
        _sum: { totalAmount: 100, tax: 10 },
        _count: { id: 1 },
        _avg: { totalAmount: 100 },
      } as any);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateSalesAnalyticsReport(dto);

      expect(result.reportType).toBe('SALES_ANALYTICS');
      expect(result.summary.totalSales).toBe(1);
      expect(result.summary.totalRevenue).toBe(100);
      expect(result.summary.averageOrderValue).toBe(100);
    });

    it('should include revenue trends when requested', async () => {
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        includeRevenueTrends: true,
      };

      jest.spyOn(prisma.sale, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.sale, 'aggregate').mockResolvedValue({
        _sum: { totalAmount: 0, tax: 0 },
        _count: { id: 0 },
        _avg: { totalAmount: 0 },
      } as any);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateSalesAnalyticsReport(dto);

      expect(result.data.trends).toBeDefined();
    });
  });

  describe('generateTransferReport', () => {
    it('should generate transfer report successfully', async () => {
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const mockTransfers = [
        {
          id: '1',
          status: 'COMPLETED',
          createdAt: new Date('2024-01-15'),
          fromLocation: { ubi: 'UBI123', businessName: 'Source' },
          toLocation: { ubi: 'UBI456', businessName: 'Destination' },
          transferItems: [],
        },
      ];

      jest.spyOn(prisma.transfer, 'findMany').mockResolvedValue(mockTransfers as any);
      jest.spyOn(prisma.transfer, 'aggregate').mockResolvedValue({
        _count: { id: 1 },
      } as any);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateTransferReport(dto);

      expect(result.reportType).toBe('TRANSFER');
      expect(result.data.transfers).toHaveLength(1);
      expect(result.summary.totalTransfers).toBe(1);
    });

    it('should filter by source licensee UBI', async () => {
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        sourceLicenseeUbi: 'UBI123',
      };

      jest.spyOn(prisma.transfer, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.transfer, 'aggregate').mockResolvedValue({
        _count: { id: 0 },
      } as any);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      await service.generateTransferReport(dto);

      expect(prisma.transfer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fromLocationId: 'UBI123',
          }),
        }),
      );
    });
  });

  describe('generateTestingComplianceReport', () => {
    it('should generate testing compliance report successfully', async () => {
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const mockTestResults = [
        {
          id: '1',
          result: 'PASS',
          testType: 'POTENCY',
          createdAt: new Date('2024-01-15'),
          sample: { inventory: { strain: 'Test Strain', type: 'FLOWER' } },
        },
      ];

      jest.spyOn(prisma.testResult, 'findMany').mockResolvedValue(mockTestResults as any);
      jest.spyOn(prisma.testResult, 'aggregate').mockResolvedValue({
        _count: { id: 10 },
      } as any);
      jest.spyOn(prisma.testResult, 'count').mockResolvedValue(2);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateTestingComplianceReport(dto);

      expect(result.reportType).toBe('TESTING_COMPLIANCE');
      expect(result.summary.totalTests).toBe(10);
      expect(result.summary.failedTests).toBe(2);
      expect(result.summary.passRate).toContain('%');
    });

    it('should filter by failed tests only', async () => {
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        includeFailedOnly: true,
      };

      jest.spyOn(prisma.testResult, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.testResult, 'aggregate').mockResolvedValue({
        _count: { id: 0 },
      } as any);
      jest.spyOn(prisma.testResult, 'count').mockResolvedValue(0);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      await service.generateTestingComplianceReport(dto);

      expect(prisma.testResult.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            result: 'FAIL',
          }),
        }),
      );
    });
  });

  describe('generateCustomReport', () => {
    it('should generate custom report with multiple data sources', async () => {
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        name: 'Custom Monthly Report',
        dataSources: ['INVENTORY', 'SALES'],
        filters: {},
      };

      jest.spyOn(prisma.inventory, 'count').mockResolvedValue(100);
      jest.spyOn(prisma.sale, 'count').mockResolvedValue(50);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateCustomReport(dto);

      expect(result.reportType).toBe('CUSTOM');
      expect(result.data.dataSources.inventory).toBe(100);
      expect(result.data.dataSources.sales).toBe(50);
      expect(result.totalRecords).toBe(150);
    });

    it('should handle custom filters', async () => {
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        name: 'Filtered Custom Report',
        dataSources: ['TRANSFERS'],
        filters: { status: 'COMPLETED' },
      };

      jest.spyOn(prisma.transfer, 'count').mockResolvedValue(25);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateCustomReport(dto);

      expect(result.data.dataSources.transfers).toBe(25);
    });
  });
});
