import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DashboardFilterDto,
  MarketOverviewResponseDto,
  RedFlagDto,
  LicenseeStatisticsDto,
  InventorySummaryDto,
  SalesTrendDto,
} from './dto/dashboard.dto';

@Injectable()
export class StateDashboardService {
  constructor(private prisma: PrismaService) {}

  async getMarketOverview(filters: DashboardFilterDto): Promise<MarketOverviewResponseDto> {
    const { startDate, endDate, licenseType } = filters;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter['createdAt'] = {};
      if (startDate) dateFilter['createdAt']['gte'] = new Date(startDate);
      if (endDate) dateFilter['createdAt']['lte'] = new Date(endDate);
    }

    // Get total licensees
    const totalLicensees = await this.prisma.location.count({
      where: {
        deletedAt: null,
        ...(licenseType && {
          licenses: {
            some: {
              licenseType: {
                name: licenseType,
              },
            },
          },
        }),
      },
    });

    // Get total inventory
    const inventoryAgg = await this.prisma.inventoryItem.aggregate({
      _sum: {
        quantity: true,
      },
      where: {
        deletedAt: null,
        ...dateFilter,
      },
    });

    // Get total sales
    const salesAgg = await this.prisma.sale.aggregate({
      _sum: {
        totalAmount: true,
      },
      _count: true,
      where: {
        deletedAt: null,
        ...dateFilter,
      },
    });

    // Get transfer counts
    const totalTransfers = await this.prisma.transfer.count({
      where: {
        deletedAt: null,
        ...dateFilter,
      },
    });

    const pendingTransfers = await this.prisma.transfer.count({
      where: {
        deletedAt: null,
        status: 'PENDING',
        ...dateFilter,
      },
    });

    // Get red flags count
    const activeRedFlags = await this.prisma.auditLog.count({
      where: {
        actionType: 'RED_FLAG',
        details: {
          path: ['resolved'],
          equals: false,
        },
        ...dateFilter,
      },
    });

    return {
      totalLicensees,
      totalInventoryQuantity: inventoryAgg._sum.quantity || 0,
      totalSalesAmount: salesAgg._sum.totalAmount || 0,
      totalTransfers,
      pendingTransfers,
      activeRedFlags,
    };
  }

  async getRedFlags(filters: DashboardFilterDto): Promise<RedFlagDto[]> {
    const { startDate, endDate } = filters;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter['createdAt'] = {};
      if (startDate) dateFilter['createdAt']['gte'] = new Date(startDate);
      if (endDate) dateFilter['createdAt']['lte'] = new Date(endDate);
    }

    const redFlagLogs = await this.prisma.auditLog.findMany({
      where: {
        actionType: 'RED_FLAG',
        ...dateFilter,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    return redFlagLogs.map((log) => {
      const details = log.details as any;
      return {
        id: log.id,
        licenseeUBI: details?.licenseeUBI || 'N/A',
        licenseeName: details?.licenseeName || 'Unknown',
        type: details?.type || 'GENERAL',
        severity: details?.severity || 'MEDIUM',
        description: details?.description || 'No description',
        createdAt: log.createdAt,
        resolved: details?.resolved || false,
      };
    });
  }

  async getLicenseeStatistics(filters: DashboardFilterDto): Promise<LicenseeStatisticsDto[]> {
    const { licenseType } = filters;

    const licensees = await this.prisma.location.findMany({
      where: {
        deletedAt: null,
        ...(licenseType && {
          licenses: {
            some: {
              licenseType: {
                name: licenseType,
              },
            },
          },
        }),
      },
      include: {
        licenses: {
          include: {
            licenseType: true,
          },
        },
        inventory: {
          where: { deletedAt: null },
        },
        sales: {
          where: { deletedAt: null },
        },
        transfersFrom: {
          where: { deletedAt: null },
        },
      },
      take: 100,
    });

    return licensees.map((licensee) => {
      const inventoryQuantity = licensee.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
      const salesAmount = licensee.sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
      const transferCount = licensee.transfersFrom.length;

      // Get red flags count from audit logs (simplified)
      const redFlagCount = 0; // Would need separate query

      // Get last activity date
      const dates = [
        ...licensee.inventory.map((i) => i.createdAt),
        ...licensee.sales.map((s) => s.createdAt),
        ...(licensee.TransfersSent || []).map((t) => t.createdAt),
      ];
      const lastActivityDate = dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : licensee.createdAt;

      return {
        ubi: licensee.ubi,
        name: licensee.name,
        licenseType: licensee.licenseType || 'Unknown',
        inventoryQuantity,
        salesAmount,
        transferCount,
        redFlagCount,
        lastActivityDate,
      };
    });
  }

  async getInventorySummary(filters: DashboardFilterDto): Promise<InventorySummaryDto[]> {
    const inventoryByType = await this.prisma.inventoryItem.groupBy({
      by: ['inventoryTypeId'],
      _sum: {
        quantity: true,
      },
      _count: {
        locationId: true,
      },
      where: {
        deletedAt: null,
      },
    });

    return inventoryByType.map((item) => ({
      inventoryTypeId: item.inventoryTypeId,
      totalQuantity: item._sum?.quantity || 0,
      licenseeCount: item._count?.locationId || 0,
      avgQuantityPerLicensee: (item._count?.locationId || 0) > 0 ? ((item._sum?.quantity || 0) / (item._count?.locationId || 1)) : 0,
    }));
  }

  async getSalesTrends(filters: DashboardFilterDto): Promise<SalesTrendDto[]> {
    const { startDate, endDate } = filters;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter['createdAt'] = {};
      if (startDate) dateFilter['createdAt']['gte'] = new Date(startDate);
      if (endDate) dateFilter['createdAt']['lte'] = new Date(endDate);
    }

    // Get sales data
    const sales = await this.prisma.sale.findMany({
      where: {
        deletedAt: null,
        ...dateFilter,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date (simplified - group by day)
    const salesByDate = sales.reduce((acc, sale) => {
      const date = sale.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { totalAmount: 0, count: 0 };
      }
      acc[date].totalAmount += sale.totalAmount;
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, { totalAmount: number; count: number }>);

    return Object.entries(salesByDate).map(([period, data]) => ({
      period,
      totalAmount: data.totalAmount,
      transactionCount: data.count,
      avgTransactionValue: data.count > 0 ? data.totalAmount / data.count : 0,
    }));
  }
}
