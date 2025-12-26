import { Test, TestingModule } from '@nestjs/testing';
import { StateDashboardService } from './state-dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardFilterDto } from './dto/dashboard.dto';

describe('StateDashboardService', () => {
  let service: StateDashboardService;
  let prisma: PrismaService;

  const mockPrismaService = {
    location: {
      count: jest.fn(),
    },
    inventory: {
      aggregate: jest.fn(),
    },
    sale: {
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    transfer: {
      count: jest.fn(),
    },
    redFlag: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StateDashboardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<StateDashboardService>(StateDashboardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMarketOverview', () => {
    it('should return market overview statistics', async () => {
      const filters: DashboardFilterDto = {};
      
      mockPrismaService.location.count.mockResolvedValue(50);
      mockPrismaService.inventory.aggregate.mockResolvedValue({
        _count: { id: 1000 },
        _sum: { quantity: 50000 },
      });
      mockPrismaService.sale.aggregate.mockResolvedValue({
        _count: { id: 200 },
        _sum: { totalAmount: 150000 },
      });
      mockPrismaService.transfer.count.mockResolvedValue(75);

      const result = await service.getMarketOverview(filters);

      expect(result).toEqual({
        totalLicensees: 50,
        totalInventoryItems: 1000,
        totalInventoryQuantity: 50000,
        totalSales: 200,
        totalSalesAmount: 150000,
        totalTransfers: 75,
      });
      expect(mockPrismaService.location.count).toHaveBeenCalled();
      expect(mockPrismaService.inventory.aggregate).toHaveBeenCalled();
      expect(mockPrismaService.sale.aggregate).toHaveBeenCalled();
      expect(mockPrismaService.transfer.count).toHaveBeenCalled();
    });

    it('should filter by date range', async () => {
      const filters: DashboardFilterDto = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      mockPrismaService.location.count.mockResolvedValue(50);
      mockPrismaService.inventory.aggregate.mockResolvedValue({
        _count: { id: 500 },
        _sum: { quantity: 25000 },
      });
      mockPrismaService.sale.aggregate.mockResolvedValue({
        _count: { id: 100 },
        _sum: { totalAmount: 75000 },
      });
      mockPrismaService.transfer.count.mockResolvedValue(30);

      await service.getMarketOverview(filters);

      expect(mockPrismaService.inventory.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: filters.startDate,
              lte: filters.endDate,
            },
          }),
        }),
      );
    });

    it('should filter by license type', async () => {
      const filters: DashboardFilterDto = {
        licenseTypeId: 1,
      };

      mockPrismaService.location.count.mockResolvedValue(10);
      mockPrismaService.inventory.aggregate.mockResolvedValue({
        _count: { id: 200 },
        _sum: { quantity: 10000 },
      });
      mockPrismaService.sale.aggregate.mockResolvedValue({
        _count: { id: 50 },
        _sum: { totalAmount: 25000 },
      });
      mockPrismaService.transfer.count.mockResolvedValue(15);

      await service.getMarketOverview(filters);

      expect(mockPrismaService.location.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            licenseTypeId: 1,
          }),
        }),
      );
    });
  });

  describe('getRedFlags', () => {
    it('should return list of red flags', async () => {
      const mockRedFlags = [
        {
          id: 1,
          type: 'INVENTORY_DISCREPANCY',
          severity: 'HIGH',
          description: 'Inventory mismatch detected',
          locationId: 1,
          isResolved: false,
          createdAt: new Date('2024-01-15'),
        },
        {
          id: 2,
          type: 'LATE_REPORTING',
          severity: 'MEDIUM',
          description: 'Late sales report',
          locationId: 2,
          isResolved: false,
          createdAt: new Date('2024-01-16'),
        },
      ];

      mockPrismaService.redFlag.findMany.mockResolvedValue(mockRedFlags);

      const filters: DashboardFilterDto = {};
      const result = await service.getRedFlags(filters);

      expect(result).toEqual(mockRedFlags);
      expect(mockPrismaService.redFlag.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          location: {
            select: {
              id: true,
              businessName: true,
              licenseNumber: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should filter red flags by date range', async () => {
      const filters: DashboardFilterDto = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      mockPrismaService.redFlag.findMany.mockResolvedValue([]);

      await service.getRedFlags(filters);

      expect(mockPrismaService.redFlag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: filters.startDate,
              lte: filters.endDate,
            },
          },
        }),
      );
    });
  });

  describe('getLicenseeStatistics', () => {
    it('should return licensee statistics', async () => {
      const filters: DashboardFilterDto = {};

      mockPrismaService.location.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(45) // active
        .mockResolvedValueOnce(5); // inactive

      const result = await service.getLicenseeStatistics(filters);

      expect(result).toEqual({
        totalLicensees: 50,
        activeLicensees: 45,
        inactiveLicensees: 5,
      });
      expect(mockPrismaService.location.count).toHaveBeenCalledTimes(3);
    });

    it('should filter licensee statistics by license type', async () => {
      const filters: DashboardFilterDto = {
        licenseTypeId: 1,
      };

      mockPrismaService.location.count
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(18)
        .mockResolvedValueOnce(2);

      await service.getLicenseeStatistics(filters);

      expect(mockPrismaService.location.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            licenseTypeId: 1,
          }),
        }),
      );
    });
  });

  describe('getInventorySummary', () => {
    it('should return inventory summary by type', async () => {
      const mockInventory = [
        {
          inventoryType: 'FLOWER',
          _count: { id: 100 },
          _sum: { quantity: 5000 },
        },
        {
          inventoryType: 'CONCENTRATE',
          _count: { id: 50 },
          _sum: { quantity: 2000 },
        },
      ];

      mockPrismaService.inventory.groupBy.mockResolvedValue(mockInventory);

      const filters: DashboardFilterDto = {};
      const result = await service.getInventorySummary(filters);

      expect(result).toEqual([
        {
          type: 'FLOWER',
          count: 100,
          totalQuantity: 5000,
        },
        {
          type: 'CONCENTRATE',
          count: 50,
          totalQuantity: 2000,
        },
      ]);
      expect(mockPrismaService.inventory.groupBy).toHaveBeenCalledWith({
        by: ['inventoryType'],
        where: {},
        _count: { id: true },
        _sum: { quantity: true },
      });
    });

    it('should filter inventory summary by date range', async () => {
      const filters: DashboardFilterDto = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      mockPrismaService.inventory.groupBy.mockResolvedValue([]);

      await service.getInventorySummary(filters);

      expect(mockPrismaService.inventory.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: filters.startDate,
              lte: filters.endDate,
            },
          },
        }),
      );
    });
  });

  describe('getSalesTrends', () => {
    it('should return sales trends grouped by day', async () => {
      const mockSales = [
        {
          date: new Date('2024-01-01'),
          _count: { id: 10 },
          _sum: { totalAmount: 5000 },
        },
        {
          date: new Date('2024-01-02'),
          _count: { id: 15 },
          _sum: { totalAmount: 7500 },
        },
      ];

      mockPrismaService.sale.groupBy.mockResolvedValue(mockSales);

      const filters: DashboardFilterDto = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };
      const result = await service.getSalesTrends(filters);

      expect(result).toEqual([
        {
          date: new Date('2024-01-01'),
          salesCount: 10,
          totalAmount: 5000,
        },
        {
          date: new Date('2024-01-02'),
          salesCount: 15,
          totalAmount: 7500,
        },
      ]);
      expect(mockPrismaService.sale.groupBy).toHaveBeenCalledWith({
        by: ['date'],
        where: {
          date: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        },
        _count: { id: true },
        _sum: { totalAmount: true },
        orderBy: { date: 'asc' },
      });
    });

    it('should filter sales trends by license type', async () => {
      const filters: DashboardFilterDto = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        licenseTypeId: 1,
      };

      mockPrismaService.sale.groupBy.mockResolvedValue([]);

      await service.getSalesTrends(filters);

      expect(mockPrismaService.sale.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            location: {
              licenseTypeId: 1,
            },
          }),
        }),
      );
    });
  });
});
