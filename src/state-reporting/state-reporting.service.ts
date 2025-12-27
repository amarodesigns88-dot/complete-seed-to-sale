import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ComplianceReportDto,
  MarketAnalyticsReportDto,
  LicenseePerformanceReportDto,
  InventoryReportDto,
  SalesAnalyticsReportDto,
  TransferReportDto,
  TestingComplianceReportDto,
  CustomReportDto,
  ReportResponseDto,
  ReportFormat,
} from './dto/reporting.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StateReportingService {
  constructor(private prisma: PrismaService) {}

  async generateComplianceReport(dto: ComplianceReportDto): Promise<ReportResponseDto> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    // Validate date range
    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Query compliance data
    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      
    };

    if (dto.licenseeUbi) {
      where.locationId = dto.licenseeUbi;
    }

    if (dto.licenseType) {
      where.location = {
        licenseType: dto.licenseType,
      };
    }

    // Get red flags (compliance violations)
    const redFlags = await this.prisma.auditLog.findMany({
      where: {
        ...where,
        action: {
          contains: 'RED_FLAG',
        },
      },
      include: {
        user: {
          select: {
            email: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get compliance metrics
    const totalOperations = await this.prisma.auditLog.count({ where });
    const violations = redFlags.length;
    const complianceRate = totalOperations > 0 ? ((totalOperations - violations) / totalOperations) * 100 : 100;

    const reportData = {
      period: {
        start: dto.startDate,
        end: dto.endDate,
      },
      violations: dto.includeViolationsOnly ? redFlags : [],
      metrics: {
        totalOperations,
        violations,
        complianceRate: complianceRate.toFixed(2) + '%',
      },
      filters: {
        licenseType: dto.licenseType,
        licenseeUbi: dto.licenseeUbi,
      },
    };

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        module: "State-reporting",
        actionType: 'GENERATE_COMPLIANCE_REPORT',
        entityType: 'REPORT',
        entityId: '',
        metadata: { reportType: 'COMPLIANCE', dateRange: `${dto.startDate} to ${dto.endDate}` },
      },
    });

    return {
      reportId: uuidv4(),
      reportType: 'COMPLIANCE',
      generatedAt: new Date(),
      data: reportData,
      totalRecords: violations,
      summary: {
        complianceRate,
        totalViolations: violations,
      },
    };
  }

  async generateMarketAnalyticsReport(dto: MarketAnalyticsReportDto): Promise<ReportResponseDto> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Get market data
    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      
    };

    if (dto.licenseType) {
      where.location = {
        licenseType: dto.licenseType,
      };
    }

    // Get licensee count
    const totalLicensees = await this.prisma.location.count({
      where: {
        
        ...(dto.licenseType && { licenseType: dto.licenseType }),
      },
    });

    // Get inventory metrics
    const totalInventory = await this.prisma.inventoryItem.aggregate({
      where,
      _sum: {
        quantity: true,
      },
      _count: {
        id: true,
      },
    });

    // Get sales metrics
    const salesData = await this.prisma.sale.aggregate({
      where,
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    });

    const reportData = {
      period: {
        start: dto.startDate,
        end: dto.endDate,
      },
      metrics: {
        totalLicensees,
        totalInventoryItems: totalInventory._count.id || 0,
        totalInventoryQuantity: totalInventory._sum.quantity || 0,
        totalSales: salesData._count.id || 0,
        totalRevenue: salesData._sum.totalAmount || 0,
      },
      trends: dto.includeForecast ? { forecast: 'Trend analysis placeholder' } : undefined,
    };

    await this.prisma.auditLog.create({
      data: {
        module: "State-reporting",
        actionType: 'GENERATE_MARKET_ANALYTICS_REPORT',
        entityType: 'REPORT',
        entityId: '',
        metadata: { reportType: 'MARKET_ANALYTICS', dateRange: `${dto.startDate} to ${dto.endDate}` },
      },
    });

    return {
      reportId: uuidv4(),
      reportType: 'MARKET_ANALYTICS',
      generatedAt: new Date(),
      data: reportData,
      totalRecords: totalLicensees,
      summary: reportData.metrics,
    };
  }

  async generateLicenseePerformanceReport(dto: LicenseePerformanceReportDto): Promise<ReportResponseDto> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      
    };

    if (dto.licenseeUbi) {
      where.locationId = dto.licenseeUbi;
    }

    // Get licensee performance metrics
    const salesMetrics = dto.includeSalesMetrics
      ? await this.prisma.sale.aggregate({
          where,
          _sum: { totalAmount: true },
          _count: { id: true },
          _avg: { totalAmount: true },
        })
      : null;

    const inventoryMetrics = await this.prisma.inventoryItem.aggregate({
      where,
      _count: { id: true },
      _sum: { quantity: true },
    });

    const complianceScore = dto.includeComplianceScore
      ? {
          violations: await this.prisma.auditLog.count({
            where: {
              ...where,
              action: { contains: 'RED_FLAG' },
            },
          }),
        }
      : null;

    const reportData = {
      period: {
        start: dto.startDate,
        end: dto.endDate,
      },
      licenseeUbi: dto.licenseeUbi,
      performance: {
        sales: salesMetrics,
        inventory: inventoryMetrics,
        compliance: complianceScore,
      },
    };

    await this.prisma.auditLog.create({
      data: {
        module: "State-reporting",
        actionType: 'GENERATE_LICENSEE_PERFORMANCE_REPORT',
        entityType: 'REPORT',
        entityId: dto.licenseeUbi || '',
        metadata: { reportType: 'LICENSEE_PERFORMANCE', dateRange: `${dto.startDate} to ${dto.endDate}` },
      },
    });

    return {
      reportId: uuidv4(),
      reportType: 'LICENSEE_PERFORMANCE',
      generatedAt: new Date(),
      data: reportData,
      totalRecords: 1,
      summary: reportData.performance,
    };
  }

  async generateInventoryReport(dto: InventoryReportDto): Promise<ReportResponseDto> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      
    };

    if (dto.inventoryType) {
      where.type = dto.inventoryType;
    }

    if (dto.licenseType) {
      where.location = {
        licenseType: dto.licenseType,
      };
    }

    const inventory = await this.prisma.inventoryItem.findMany({
      where,
      include: {
        location: {
          select: {
            ubi: true,
            licenseType: true,
          },
        },
        room: {
          select: {
            name: true,
            roomType: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const summary = await this.prisma.inventoryItem.aggregate({
      where,
      _sum: { quantity: true },
      _count: { id: true },
    });

    const reportData = {
      period: {
        start: dto.startDate,
        end: dto.endDate,
      },
      inventory,
      filters: {
        type: dto.inventoryType,
        licenseType: dto.licenseType,
        region: dto.region,
      },
    };

    await this.prisma.auditLog.create({
      data: {
        module: "State-reporting",
        actionType: 'GENERATE_INVENTORY_REPORT',
        entityType: 'REPORT',
        entityId: '',
        metadata: { reportType: 'INVENTORY', dateRange: `${dto.startDate} to ${dto.endDate}` },
      },
    });

    return {
      reportId: uuidv4(),
      reportType: 'INVENTORY',
      generatedAt: new Date(),
      data: reportData,
      totalRecords: summary._count.id || 0,
      summary: {
        totalItems: summary._count.id || 0,
        totalQuantity: summary._sum.quantity || 0,
      },
    };
  }

  async generateSalesAnalyticsReport(dto: SalesAnalyticsReportDto): Promise<ReportResponseDto> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      
    };

    if (dto.licenseType) {
      where.location = {
        licenseType: dto.licenseType,
      };
    }

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        location: {
          select: {
            ubi: true,
          },
        },
        saleItems: {
          include: {
            inventoryItem: {
              select: {
                strainId: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const summary = await this.prisma.sale.aggregate({
      where,
      _sum: { totalAmount: true, tax: true },
      _count: { id: true },
      _avg: { totalAmount: true },
    });

    const reportData = {
      period: {
        start: dto.startDate,
        end: dto.endDate,
      },
      sales: dto.groupByProduct ? sales : sales.map(s => ({ id: s.id, totalAmount: s.totalAmount, createdAt: s.createdAt })),
      trends: dto.includeRevenueTrends ? { revenueGrowth: 'Trend data placeholder' } : undefined,
    };

    await this.prisma.auditLog.create({
      data: {
        module: "State-reporting",
        actionType: 'GENERATE_SALES_ANALYTICS_REPORT',
        entityType: 'REPORT',
        entityId: '',
        metadata: { reportType: 'SALES_ANALYTICS', dateRange: `${dto.startDate} to ${dto.endDate}` },
      },
    });

    return {
      reportId: uuidv4(),
      reportType: 'SALES_ANALYTICS',
      generatedAt: new Date(),
      data: reportData,
      totalRecords: summary._count.id || 0,
      summary: {
        totalSales: summary._count.id || 0,
        totalRevenue: summary._sum.totalAmount || 0,
        averageOrderValue: summary._avg.totalAmount || 0,
        totalTax: summary._sum.tax || 0,
      },
    };
  }

  async generateTransferReport(dto: TransferReportDto): Promise<ReportResponseDto> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      
    };

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.sourceLicenseeUbi) {
      where.fromLocationId = dto.sourceLicenseeUbi;
    }

    if (dto.destinationLicenseeUbi) {
      where.toLocationId = dto.destinationLicenseeUbi;
    }

    const transfers = await this.prisma.transfer.findMany({
      where,
      include: {
        senderLocation: {
          select: {
            ubi: true,
          },
        },
        toLocation: {
          select: {
            ubi: true,
          },
        },
        transferItems: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const summary = await this.prisma.transfer.aggregate({
      where,
      _count: { id: true },
    });

    const reportData = {
      period: {
        start: dto.startDate,
        end: dto.endDate,
      },
      transfers,
      filters: {
        status: dto.status,
        source: dto.sourceLicenseeUbi,
        destination: dto.destinationLicenseeUbi,
      },
    };

    await this.prisma.auditLog.create({
      data: {
        module: "State-reporting",
        actionType: 'GENERATE_TRANSFER_REPORT',
        entityType: 'REPORT',
        entityId: '',
        metadata: { reportType: 'TRANSFER', dateRange: `${dto.startDate} to ${dto.endDate}` },
      },
    });

    return {
      reportId: uuidv4(),
      reportType: 'TRANSFER',
      generatedAt: new Date(),
      data: reportData,
      totalRecords: summary._count.id || 0,
      summary: {
        totalTransfers: summary._count.id || 0,
      },
    };
  }

  async generateTestingComplianceReport(dto: TestingComplianceReportDto): Promise<ReportResponseDto> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const where: any = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      
    };

    if (dto.testType) {
      where.testType = dto.testType;
    }

    if (dto.labUbi) {
      where.labId = dto.labUbi;
    }

    if (dto.includeFailedOnly) {
      where.result = 'FAIL';
    }

    const testResults = await this.prisma.testResult.findMany({
      where,
      include: {
        sample: {
          include: {
            inventoryItem: {
              select: {
                strainId: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const summary = await this.prisma.testResult.aggregate({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        
      },
      _count: { id: true },
    });

    const failedCount = await this.prisma.testResult.count({
      where: {
        ...where,
        result: 'FAIL',
      },
    });

    const reportData = {
      period: {
        start: dto.startDate,
        end: dto.endDate,
      },
      testResults,
      filters: {
        testType: dto.testType,
        labUbi: dto.labUbi,
        failedOnly: dto.includeFailedOnly,
      },
    };

    await this.prisma.auditLog.create({
      data: {
        module: "State-reporting",
        actionType: 'GENERATE_TESTING_COMPLIANCE_REPORT',
        entityType: 'REPORT',
        entityId: '',
        metadata: { reportType: 'TESTING_COMPLIANCE', dateRange: `${dto.startDate} to ${dto.endDate}` },
      },
    });

    return {
      reportId: uuidv4(),
      reportType: 'TESTING_COMPLIANCE',
      generatedAt: new Date(),
      data: reportData,
      totalRecords: testResults.length,
      summary: {
        totalTests: summary._count.id || 0,
        failedTests: failedCount,
        passRate: summary._count.id > 0 ? (((summary._count.id - failedCount) / summary._count.id) * 100).toFixed(2) + '%' : '100%',
      },
    };
  }

  async generateCustomReport(dto: CustomReportDto): Promise<ReportResponseDto> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    const reportData: any = {
      period: {
        start: dto.startDate,
        end: dto.endDate,
      },
      name: dto.name,
      dataSources: {},
    };

    // Aggregate data from requested sources
    for (const source of dto.dataSources) {
      const where: any = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        
        ...dto.filters,
      };

      switch (source.toUpperCase()) {
        case 'INVENTORY':
          reportData.dataSources.inventory = await this.prisma.inventoryItem.count({ where });
          break;
        case 'SALES':
          reportData.dataSources.sales = await this.prisma.sale.count({ where });
          break;
        case 'TRANSFERS':
          reportData.dataSources.transfers = await this.prisma.transfer.count({ where });
          break;
        case 'TESTING':
          reportData.dataSources.testing = await this.prisma.testResult.count({ where });
          break;
        default:
          break;
      }
    }

    await this.prisma.auditLog.create({
      data: {
        module: "State-reporting",
        actionType: 'GENERATE_CUSTOM_REPORT',
        entityType: 'REPORT',
        entityId: '',
        metadata: { reportType: 'CUSTOM', name: dto.name, dataSources: dto.dataSources, dateRange: `${dto.startDate} to ${dto.endDate}` },
      },
    });

    return {
      reportId: uuidv4(),
      reportType: 'CUSTOM',
      generatedAt: new Date(),
      data: reportData,
      totalRecords: Object.values(reportData.dataSources).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0),
      summary: reportData.dataSources,
    };
  }
}
