import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SalesReportDto,
  InventoryReportDto,
  ComplianceReportDto,
  TransferReportDto,
  TestingReportDto,
  FinancialReportDto,
  CustomReportDto,
  ReportResponseDto,
  ExportFormat,
} from './dto/licensee-reporting.dto';

@Injectable()
export class LicenseeReportingService {
  constructor(private prisma: PrismaService) {}

  async generateSalesReport(
    dto: SalesReportDto,
    userId: string,
  ): Promise<ReportResponseDto> {
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dto.endDate ? new Date(dto.endDate) : new Date();

    // Query sales data
    const sales = await this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(dto.locationId && { locationId: dto.locationId }),
        deletedAt: null,
      },
      include: {
        saleItems: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    // Aggregate sales data
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalTransactions = sales.length;
    const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Category breakdown
    const categoryBreakdown = sales.reduce((acc, sale) => {
      sale.saleItems.forEach((item) => {
        const category = dto.category || item.inventoryItem?.inventoryTypeName || 'Other';
        if (!acc[category]) {
          acc[category] = { count: 0, revenue: 0 };
        }
        acc[category].count += item.quantity;
        acc[category].revenue += item.totalPrice;
      });
      return acc;
    }, {});

    const reportData = {
      summary: {
        totalRevenue,
        totalTransactions,
        averageTransaction,
        startDate,
        endDate,
      },
      categoryBreakdown,
      transactions: sales.map(sale => ({
        id: sale.id,
        date: sale.createdAt,
        total: sale.totalAmount,
        items: sale.saleItems.length,
      })),
    };

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        module: "Licensee-reporting",
        actionType: 'GENERATE_SALES_REPORT',
        entityType: 'Report',
        entityId: `SALES_${Date.now()}`,
        userId,
        details: { startDate: startDate.toISOString(), endDate: endDate.toISOString(), locationId: dto.locationId },
      },
    });

    return {
      reportId: `SALES_${Date.now()}`,
      reportType: 'SALES',
      generatedAt: new Date(),
      data: reportData,
      format: dto.format || ExportFormat.PDF,
      downloadUrl: dto.format ? `/api/reports/download/SALES_${Date.now()}` : undefined,
    };
  }

  async generateInventoryReport(
    dto: InventoryReportDto,
    userId: string,
  ): Promise<ReportResponseDto> {
    // Query inventory data
    const inventory = await this.prisma.inventoryItem.findMany({
      where: {
        ...(dto.locationId && { locationId: dto.locationId }),
        ...(dto.type && { type: dto.type }),
        ...(dto.roomId && { roomId: dto.roomId }),
        ...(dto.lowStockOnly && {
          quantity: {
            lt: 10, // Low stock threshold
          },
        }),
        deletedAt: null,
      },
      include: {
        room: true,
        location: true,
      },
    });

    // Aggregate inventory data
    const totalItems = inventory.length;
    const totalQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0);

    // Type breakdown
    const typeBreakdown = inventory.reduce((acc, item) => {
      const type = item.inventoryTypeName || 'Other';
      if (!acc[type]) {
        acc[type] = { count: 0, quantity: 0, value: 0 };
      }
      acc[type].count += 1;
      acc[type].quantity += item.quantity;
      acc[type].value += item.quantity * (item.price || 0);
      return acc;
    }, {});

    // Low stock items
    const lowStockItems = inventory.filter(item => item.quantity < 10);

    const reportData = {
      summary: {
        totalItems,
        totalQuantity,
        totalValue,
        lowStockCount: lowStockItems.length,
      },
      typeBreakdown,
      lowStockItems: lowStockItems.map(item => ({
        id: item.id,
        strain: item.strainId || 'N/A',
        type: item.inventoryTypeName || 'N/A',
        quantity: item.quantity,
        room: item.room?.name,
      })),
      items: inventory.map(item => ({
        id: item.id,
        strain: item.strainId || 'N/A',
        type: item.inventoryTypeName || 'N/A',
        quantity: item.quantity,
        value: item.quantity * (item.price || 0),
        room: item.room?.name,
      })),
    };

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        module: "Licensee-reporting",
        actionType: 'GENERATE_INVENTORY_REPORT',
        entityType: 'Report',
        entityId: `INV_${Date.now()}`,
        userId,
        details: { locationId: dto.locationId, type: dto.type },
      },
    });

    return {
      reportId: `INV_${Date.now()}`,
      reportType: 'INVENTORY',
      generatedAt: new Date(),
      data: reportData,
      format: dto.format || ExportFormat.PDF,
      downloadUrl: dto.format ? `/api/reports/download/INV_${Date.now()}` : undefined,
    };
  }

  async generateComplianceReport(
    dto: ComplianceReportDto,
    userId: string,
  ): Promise<ReportResponseDto> {
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dto.endDate ? new Date(dto.endDate) : new Date();

    // Query audit logs for compliance tracking (RedFlag model doesn't exist)
    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(dto.locationId && { locationId: dto.locationId }),
        action: { in: ['VOID', 'ADJUST', 'DELETE'] }, // Track potentially compliance-related actions
      },
      take: 100,
    });

    // Aggregate compliance data
    const totalIssues = auditLogs.length;
    const resolvedIssues = 0; // Would need proper tracking
    const openIssues = totalIssues - resolvedIssues;

    const reportData = {
      summary: {
        totalIssues,
        resolvedIssues,
        openIssues,
        complianceRate: totalIssues > 0 ? (resolvedIssues / totalIssues) * 100 : 100,
        startDate,
        endDate,
      },
      severityBreakdown: {},
      openIssues: [],
      resolvedIssues: [],
    };

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        module: "Licensee-reporting",
        actionType: 'GENERATE_COMPLIANCE_REPORT',
        entityType: 'Report',
        entityId: `COMP_${Date.now()}`,
        userId,
        details: { startDate: startDate.toISOString(), endDate: endDate.toISOString(), locationId: dto.locationId },
      },
    });

    return {
      reportId: `COMP_${Date.now()}`,
      reportType: 'COMPLIANCE',
      generatedAt: new Date(),
      data: reportData,
      format: dto.format || ExportFormat.PDF,
      downloadUrl: dto.format ? `/api/reports/download/COMP_${Date.now()}` : undefined,
    };
  }

  async generateTransferReport(
    dto: TransferReportDto,
    userId: string,
  ): Promise<ReportResponseDto> {
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dto.endDate ? new Date(dto.endDate) : new Date();

    // Query transfer data
    const transfers = await this.prisma.transfer.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(dto.locationId && {
          OR: [
            { senderLocationId: dto.locationId },
            { receiverLocationId: dto.locationId },
          ],
        }),
        ...(dto.direction === 'incoming' && { receiverLocationId: dto.locationId }),
        ...(dto.direction === 'outgoing' && { senderLocationId: dto.locationId }),
        deletedAt: null,
      },
      include: {
        senderLocation: true,
        receiverLocation: true,
        transferItems: {
          include: {
            inventoryItem: true,
          },
        },
      },
    });

    // Aggregate transfer data
    const totalTransfers = transfers.length;
    const incomingTransfers = transfers.filter(t => t.receiverLocationId === dto.locationId).length;
    const outgoingTransfers = transfers.filter(t => t.senderLocationId === dto.locationId).length;

    // Status breakdown
    const statusBreakdown = transfers.reduce((acc, transfer) => {
      const status = transfer.status || 'PENDING';
      if (!acc[status]) {
        acc[status] = 0;
      }
      acc[status] += 1;
      return acc;
    }, {});

    const reportData = {
      summary: {
        totalTransfers,
        incomingTransfers,
        outgoingTransfers,
        startDate,
        endDate,
      },
      statusBreakdown,
      transfers: transfers.map(transfer => ({
        id: transfer.id,
        manifestNumber: transfer.manifestNumber,
        from: transfer.senderLocation?.name || 'Unknown',
        to: transfer.receiverLocation?.name || 'Unknown',
        status: transfer.status,
        items: transfer.transferItems?.length || 0,
        createdAt: transfer.createdAt,
      })),
    };

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        module: "Licensee-reporting",
        actionType: 'GENERATE_TRANSFER_REPORT',
        entityType: 'Report',
        entityId: `TRANS_${Date.now()}`,
        userId,
        details: { startDate: startDate.toISOString(), endDate: endDate.toISOString(), locationId: dto.locationId },
      },
    });

    return {
      reportId: `TRANS_${Date.now()}`,
      reportType: 'TRANSFERS',
      generatedAt: new Date(),
      data: reportData,
      format: dto.format || ExportFormat.PDF,
      downloadUrl: dto.format ? `/api/reports/download/TRANS_${Date.now()}` : undefined,
    };
  }

  async generateTestingReport(
    dto: TestingReportDto,
    userId: string,
  ): Promise<ReportResponseDto> {
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dto.endDate ? new Date(dto.endDate) : new Date();

    // Query testing samples
    const samples = await this.prisma.sample.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(dto.locationId && { inventoryItem: { locationId: dto.locationId } }),
        ...(dto.status && { status: dto.status }),
        deletedAt: null,
      },
      include: {
        testResults: true,
        inventoryItem: { select: { locationId: true } },
      },
    });

    // Aggregate testing data
    const totalSamples = samples.length;
    const passedSamples = samples.filter(s => s.status === 'PASSED').length;
    const failedSamples = samples.filter(s => s.status === 'FAILED').length;
    const pendingSamples = samples.filter(s => s.status === 'PENDING' || s.status === 'IN_PROGRESS').length;

    // Pass rate
    const passRate = totalSamples > 0 ? (passedSamples / totalSamples) * 100 : 0;

    const reportData = {
      summary: {
        totalSamples,
        passedSamples,
        failedSamples,
        pendingSamples,
        passRate,
        startDate,
        endDate,
      },
      samples: samples.map(sample => ({
        id: sample.id,
        sampleId: sample.id, // Sample doesn't have separate sampleId
        status: sample.status,
        lab: sample.labName || 'N/A', // Use labName field
        testDate: sample.createdAt, // Use createdAt as test date
        results: sample.testResults?.length || 0,
      })),
    };

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        module: "Licensee-reporting",
        actionType: 'GENERATE_TESTING_REPORT',
        entityType: 'Report',
        entityId: `TEST_${Date.now()}`,
        userId,
        details: { startDate: startDate.toISOString(), endDate: endDate.toISOString(), locationId: dto.locationId },
      },
    });

    return {
      reportId: `TEST_${Date.now()}`,
      reportType: 'TESTING',
      generatedAt: new Date(),
      data: reportData,
      format: dto.format || ExportFormat.PDF,
      downloadUrl: dto.format ? `/api/reports/download/TEST_${Date.now()}` : undefined,
    };
  }

  async generateFinancialReport(
    dto: FinancialReportDto,
    userId: string,
  ): Promise<ReportResponseDto> {
    const startDate = dto.startDate ? new Date(dto.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = dto.endDate ? new Date(dto.endDate) : new Date();

    // Query sales for revenue
    const sales = await this.prisma.sale.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(dto.locationId && { locationId: dto.locationId }),
        deletedAt: null,
      },
    });

    // Calculate revenue
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const averageDailyRevenue = sales.length > 0 ? totalRevenue / Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    // Group by granularity (daily/weekly/monthly)
    const granularity = dto.granularity || 'daily';
    const revenueByPeriod = this.groupByPeriod(sales, granularity, startDate, endDate);

    const reportData = {
      summary: {
        totalRevenue,
        averageDailyRevenue,
        totalTransactions: sales.length,
        startDate,
        endDate,
        granularity,
      },
      revenueByPeriod,
      topProducts: [], // Could be enhanced with product analysis
    };

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        module: "Licensee-reporting",
        actionType: 'GENERATE_FINANCIAL_REPORT',
        entityType: 'Report',
        entityId: `FIN_${Date.now()}`,
        userId,
        details: { startDate: startDate.toISOString(), endDate: endDate.toISOString(), locationId: dto.locationId },
      },
    });

    return {
      reportId: `FIN_${Date.now()}`,
      reportType: 'FINANCIAL',
      generatedAt: new Date(),
      data: reportData,
      format: dto.format || ExportFormat.PDF,
      downloadUrl: dto.format ? `/api/reports/download/FIN_${Date.now()}` : undefined,
    };
  }

  async generateCustomReport(
    dto: CustomReportDto,
    userId: string,
  ): Promise<ReportResponseDto> {
    // Route to appropriate report type
    switch (dto.reportType) {
      case 'SALES':
        return this.generateSalesReport({
          startDate: dto.startDate,
          endDate: dto.endDate,
          locationId: dto.locationIds?.[0],
          format: dto.format,
        }, userId);
      case 'INVENTORY':
        return this.generateInventoryReport({
          locationId: dto.locationIds?.[0],
          format: dto.format,
        }, userId);
      case 'COMPLIANCE':
        return this.generateComplianceReport({
          startDate: dto.startDate,
          endDate: dto.endDate,
          locationId: dto.locationIds?.[0],
          format: dto.format,
        }, userId);
      case 'TRANSFERS':
        return this.generateTransferReport({
          startDate: dto.startDate,
          endDate: dto.endDate,
          locationId: dto.locationIds?.[0],
          format: dto.format,
        }, userId);
      case 'TESTING':
        return this.generateTestingReport({
          startDate: dto.startDate,
          endDate: dto.endDate,
          locationId: dto.locationIds?.[0],
          format: dto.format,
        }, userId);
      case 'FINANCIAL':
        return this.generateFinancialReport({
          startDate: dto.startDate,
          endDate: dto.endDate,
          locationId: dto.locationIds?.[0],
          format: dto.format,
        }, userId);
      default:
        throw new Error('Invalid report type');
    }
  }

  private groupByPeriod(sales: any[], granularity: string, startDate: Date, endDate: Date): Array<{ period: string; revenue: number; transactions: number }> {
    // Simple implementation - group sales by period
    const periods: Array<{ period: string; revenue: number; transactions: number }> = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const periodStart = new Date(currentDate);
      let periodEnd: Date;

      if (granularity === 'daily') {
        periodEnd = new Date(currentDate);
        periodEnd.setDate(periodEnd.getDate() + 1);
      } else if (granularity === 'weekly') {
        periodEnd = new Date(currentDate);
        periodEnd.setDate(periodEnd.getDate() + 7);
      } else { // monthly
        periodEnd = new Date(currentDate);
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }

      const periodSales = sales.filter(s =>
        s.createdAt >= periodStart && s.createdAt < periodEnd
      );

      const periodRevenue = periodSales.reduce((sum, s) => sum + s.totalAmount, 0);

      periods.push({
        period: periodStart.toISOString().split('T')[0],
        revenue: periodRevenue,
        transactions: periodSales.length,
      });

      currentDate = periodEnd;
    }

    return periods;
  }
}
