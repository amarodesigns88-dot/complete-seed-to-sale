import { Test, TestingModule } from '@nestjs/testing';
import { LicenseeReportingService } from './licensee-reporting.service';
import { PrismaService } from '../prisma/prisma.service';
import { ExportFormat } from './dto/licensee-reporting.dto';

describe('LicenseeReportingService', () => {
  let service: LicenseeReportingService;
  let prisma: PrismaService;
  const mockUserId = 'user-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LicenseeReportingService,
        {
          provide: PrismaService,
          useValue: {
            sale: {
              findMany: jest.fn(),
            },
            inventory: {
              findMany: jest.fn(),
            },
            redFlag: {
              findMany: jest.fn(),
            },
            transfer: {
              findMany: jest.fn(),
            },
            testingSample: {
              findMany: jest.fn(),
            },
            auditLog: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<LicenseeReportingService>(LicenseeReportingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSalesReport', () => {
    it('should generate sales report with summary and category breakdown', async () => {
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        locationId: 'loc-123',
      };

      const mockSales = [
        {
          id: '1',
          totalAmount: 100,
          createdAt: new Date('2024-01-15'),
          saleItems: [
            {
              quantity: 2,
              totalPrice: 100,
              inventory: { type: 'FLOWER' },
            },
          ],
        },
        {
          id: '2',
          totalAmount: 200,
          createdAt: new Date('2024-01-20'),
          saleItems: [
            {
              quantity: 1,
              totalPrice: 200,
              inventory: { type: 'EDIBLE' },
            },
          ],
        },
      ];

      jest.spyOn(prisma.sale, 'findMany').mockResolvedValue(mockSales as any);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateSalesReport(dto, mockUserId);

      expect(result.reportType).toBe('SALES');
      expect(result.data.summary.totalRevenue).toBe(300);
      expect(result.data.summary.totalTransactions).toBe(2);
      expect(result.data.summary.averageTransaction).toBe(150);
      expect(result.data.categoryBreakdown).toBeDefined();
      expect(result.data.transactions).toHaveLength(2);
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should use default date range if not provided', async () => {
      const dto = { locationId: 'loc-123' };

      jest.spyOn(prisma.sale, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateSalesReport(dto, mockUserId);

      expect(result.data.summary.startDate).toBeInstanceOf(Date);
      expect(result.data.summary.endDate).toBeInstanceOf(Date);
    });

    it('should include download URL when format is specified', async () => {
      const dto = {
        locationId: 'loc-123',
        format: ExportFormat.CSV,
      };

      jest.spyOn(prisma.sale, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateSalesReport(dto, mockUserId);

      expect(result.downloadUrl).toBeDefined();
      expect(result.downloadUrl).toContain('/api/reports/download/');
    });
  });

  describe('generateInventoryReport', () => {
    it('should generate inventory report with type breakdown', async () => {
      const dto = {
        locationId: 'loc-123',
      };

      const mockInventory = [
        {
          id: '1',
          strain: 'Blue Dream',
          type: 'FLOWER',
          quantity: 100,
          costPerUnit: 10,
          room: { name: 'Room 1' },
          location: { businessName: 'Test Location' },
        },
        {
          id: '2',
          strain: 'OG Kush',
          type: 'FLOWER',
          quantity: 50,
          costPerUnit: 12,
          room: { name: 'Room 2' },
          location: { businessName: 'Test Location' },
        },
      ];

      jest.spyOn(prisma.inventory, 'findMany').mockResolvedValue(mockInventory as any);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateInventoryReport(dto, mockUserId);

      expect(result.reportType).toBe('INVENTORY');
      expect(result.data.summary.totalItems).toBe(2);
      expect(result.data.summary.totalQuantity).toBe(150);
      expect(result.data.summary.totalValue).toBe(1600); // (100*10 + 50*12)
      expect(result.data.typeBreakdown).toBeDefined();
      expect(result.data.items).toHaveLength(2);
    });

    it('should filter by low stock only', async () => {
      const dto = {
        locationId: 'loc-123',
        lowStockOnly: true,
      };

      jest.spyOn(prisma.inventory, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      await service.generateInventoryReport(dto, mockUserId);

      expect(prisma.inventoryItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            quantity: {
              lt: 10,
            },
          }),
        }),
      );
    });

    it('should identify low stock items', async () => {
      const dto = {
        locationId: 'loc-123',
      };

      const mockInventory = [
        {
          id: '1',
          strain: 'Low Stock',
          type: 'FLOWER',
          quantity: 5,
          costPerUnit: 10,
          room: { name: 'Room 1' },
        },
      ];

      jest.spyOn(prisma.inventory, 'findMany').mockResolvedValue(mockInventory as any);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateInventoryReport(dto, mockUserId);

      expect(result.data.summary.lowStockCount).toBe(1);
      expect(result.data.lowStockItems).toHaveLength(1);
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate compliance report with issue breakdown', async () => {
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        locationId: 'loc-123',
      };

      const mockRedFlags = [
        {
          id: '1',
          type: 'INVENTORY_DISCREPANCY',
          severity: 'HIGH',
          description: 'Quantity mismatch',
          createdAt: new Date('2024-01-15'),
          resolvedAt: new Date('2024-01-16'),
        },
        {
          id: '2',
          type: 'COMPLIANCE_VIOLATION',
          severity: 'MEDIUM',
          description: 'Missing documentation',
          createdAt: new Date('2024-01-20'),
          resolvedAt: null,
        },
      ];

      jest.spyOn(prisma.redFlag, 'findMany').mockResolvedValue(mockRedFlags as any);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateComplianceReport(dto, mockUserId);

      expect(result.reportType).toBe('COMPLIANCE');
      expect(result.data.summary.totalIssues).toBe(2);
      expect(result.data.summary.resolvedIssues).toBe(1);
      expect(result.data.summary.openIssues).toBe(1);
      expect(result.data.summary.complianceRate).toBe(50);
      expect(result.data.severityBreakdown).toBeDefined();
    });

    it('should exclude resolved issues when requested', async () => {
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        locationId: 'loc-123',
        includeResolved: false,
      };

      jest.spyOn(prisma.redFlag, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      await service.generateComplianceReport(dto, mockUserId);

      expect(prisma.redFlag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            resolvedAt: null,
          }),
        }),
      );
    });
  });

  describe('generateTransferReport', () => {
    it('should generate transfer report with status breakdown', async () => {
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        locationId: 'loc-123',
      };

      const mockTransfers = [
        {
          id: '1',
          manifestNumber: 'MAN-001',
          status: 'COMPLETED',
          fromLocationId: 'loc-123',
          toLocationId: 'loc-456',
          createdAt: new Date('2024-01-15'),
          fromLocation: { businessName: 'Location A' },
          toLocation: { businessName: 'Location B' },
          transferItems: [{}],
        },
        {
          id: '2',
          manifestNumber: 'MAN-002',
          status: 'PENDING',
          fromLocationId: 'loc-789',
          toLocationId: 'loc-123',
          createdAt: new Date('2024-01-20'),
          fromLocation: { businessName: 'Location C' },
          toLocation: { businessName: 'Location D' },
          transferItems: [{}],
        },
      ];

      jest.spyOn(prisma.transfer, 'findMany').mockResolvedValue(mockTransfers as any);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateTransferReport(dto, mockUserId);

      expect(result.reportType).toBe('TRANSFERS');
      expect(result.data.summary.totalTransfers).toBe(2);
      expect(result.data.summary.incomingTransfers).toBe(1);
      expect(result.data.summary.outgoingTransfers).toBe(1);
      expect(result.data.statusBreakdown).toBeDefined();
    });

    it('should filter by direction - incoming', async () => {
      const dto = {
        locationId: 'loc-123',
        direction: 'incoming' as const,
      };

      jest.spyOn(prisma.transfer, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      await service.generateTransferReport(dto, mockUserId);

      expect(prisma.transfer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            toLocationId: 'loc-123',
          }),
        }),
      );
    });

    it('should filter by direction - outgoing', async () => {
      const dto = {
        locationId: 'loc-123',
        direction: 'outgoing' as const,
      };

      jest.spyOn(prisma.transfer, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      await service.generateTransferReport(dto, mockUserId);

      expect(prisma.transfer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            fromLocationId: 'loc-123',
          }),
        }),
      );
    });
  });

  describe('generateTestingReport', () => {
    it('should generate testing report with pass/fail metrics', async () => {
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        locationId: 'loc-123',
      };

      const mockSamples = [
        {
          id: '1',
          sampleId: 'SAMPLE-001',
          status: 'PASSED',
          testDate: new Date('2024-01-15'),
          testResults: [{}],
          lab: { name: 'Lab A' },
        },
        {
          id: '2',
          sampleId: 'SAMPLE-002',
          status: 'FAILED',
          testDate: new Date('2024-01-20'),
          testResults: [{}],
          lab: { name: 'Lab B' },
        },
        {
          id: '3',
          sampleId: 'SAMPLE-003',
          status: 'PASSED',
          testDate: new Date('2024-01-25'),
          testResults: [{}],
          lab: { name: 'Lab A' },
        },
      ];

      jest.spyOn(prisma.testingSample, 'findMany').mockResolvedValue(mockSamples as any);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateTestingReport(dto, mockUserId);

      expect(result.reportType).toBe('TESTING');
      expect(result.data.summary.totalSamples).toBe(3);
      expect(result.data.summary.passedSamples).toBe(2);
      expect(result.data.summary.failedSamples).toBe(1);
      expect(result.data.summary.passRate).toBeCloseTo(66.67, 1);
      expect(result.data.samples).toHaveLength(3);
    });

    it('should filter by status', async () => {
      const dto = {
        locationId: 'loc-123',
        status: 'FAILED',
      };

      jest.spyOn(prisma.testingSample, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      await service.generateTestingReport(dto, mockUserId);

      expect(prisma.testingSample.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'FAILED',
          }),
        }),
      );
    });
  });

  describe('generateFinancialReport', () => {
    it('should generate financial report with revenue trends', async () => {
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        locationId: 'loc-123',
        granularity: 'daily' as const,
      };

      const mockSales = [
        {
          id: '1',
          totalAmount: 100,
          createdAt: new Date('2024-01-15'),
        },
        {
          id: '2',
          totalAmount: 200,
          createdAt: new Date('2024-01-15'),
        },
        {
          id: '3',
          totalAmount: 150,
          createdAt: new Date('2024-01-16'),
        },
      ];

      jest.spyOn(prisma.sale, 'findMany').mockResolvedValue(mockSales as any);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateFinancialReport(dto, mockUserId);

      expect(result.reportType).toBe('FINANCIAL');
      expect(result.data.summary.totalRevenue).toBe(450);
      expect(result.data.summary.totalTransactions).toBe(3);
      expect(result.data.summary.granularity).toBe('daily');
      expect(result.data.revenueByPeriod).toBeDefined();
    });

    it('should use default granularity if not provided', async () => {
      const dto = {
        locationId: 'loc-123',
      };

      jest.spyOn(prisma.sale, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateFinancialReport(dto, mockUserId);

      expect(result.data.summary.granularity).toBe('daily');
    });

    it('should handle weekly granularity', async () => {
      const dto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        locationId: 'loc-123',
        granularity: 'weekly' as const,
      };

      jest.spyOn(prisma.sale, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateFinancialReport(dto, mockUserId);

      expect(result.data.revenueByPeriod).toBeDefined();
    });
  });

  describe('generateCustomReport', () => {
    it('should route to sales report for SALES type', async () => {
      const dto = {
        reportType: 'SALES' as const,
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        locationIds: ['loc-123'],
      };

      jest.spyOn(prisma.sale, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateCustomReport(dto, mockUserId);

      expect(result.reportType).toBe('SALES');
    });

    it('should route to inventory report for INVENTORY type', async () => {
      const dto = {
        reportType: 'INVENTORY' as const,
        locationIds: ['loc-123'],
      };

      jest.spyOn(prisma.inventory, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.generateCustomReport(dto, mockUserId);

      expect(result.reportType).toBe('INVENTORY');
    });

    it('should throw error for invalid report type', async () => {
      const dto = {
        reportType: 'INVALID' as any,
        locationIds: ['loc-123'],
      };

      await expect(service.generateCustomReport(dto, mockUserId)).rejects.toThrow(
        'Invalid report type',
      );
    });
  });
});
