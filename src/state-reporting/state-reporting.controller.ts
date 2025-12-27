import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StateReportingService } from './state-reporting.service';
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
} from './dto/reporting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';


@ApiTags('State Reporting')
@ApiBearerAuth()
@Controller('state-reporting')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("STATE")
export class StateReportingController {
  constructor(private readonly stateReportingService: StateReportingService) {}

  @Post('compliance')
  @ApiOperation({ summary: 'Generate compliance report' })
  @ApiResponse({ status: 201, description: 'Compliance report generated successfully', type: ReportResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - invalid date range or parameters' })
  async generateComplianceReport(@Body() dto: ComplianceReportDto): Promise<ReportResponseDto> {
    return this.stateReportingService.generateComplianceReport(dto);
  }

  @Post('market-analytics')
  @ApiOperation({ summary: 'Generate market analytics report' })
  @ApiResponse({ status: 201, description: 'Market analytics report generated successfully', type: ReportResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - invalid date range or parameters' })
  async generateMarketAnalyticsReport(@Body() dto: MarketAnalyticsReportDto): Promise<ReportResponseDto> {
    return this.stateReportingService.generateMarketAnalyticsReport(dto);
  }

  @Post('licensee-performance')
  @ApiOperation({ summary: 'Generate licensee performance report' })
  @ApiResponse({ status: 201, description: 'Licensee performance report generated successfully', type: ReportResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - invalid date range or parameters' })
  async generateLicenseePerformanceReport(@Body() dto: LicenseePerformanceReportDto): Promise<ReportResponseDto> {
    return this.stateReportingService.generateLicenseePerformanceReport(dto);
  }

  @Post('inventory')
  @ApiOperation({ summary: 'Generate inventory report' })
  @ApiResponse({ status: 201, description: 'Inventory report generated successfully', type: ReportResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - invalid date range or parameters' })
  async generateInventoryReport(@Body() dto: InventoryReportDto): Promise<ReportResponseDto> {
    return this.stateReportingService.generateInventoryReport(dto);
  }

  @Post('sales-analytics')
  @ApiOperation({ summary: 'Generate sales analytics report' })
  @ApiResponse({ status: 201, description: 'Sales analytics report generated successfully', type: ReportResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - invalid date range or parameters' })
  async generateSalesAnalyticsReport(@Body() dto: SalesAnalyticsReportDto): Promise<ReportResponseDto> {
    return this.stateReportingService.generateSalesAnalyticsReport(dto);
  }

  @Post('transfers')
  @ApiOperation({ summary: 'Generate transfer tracking report' })
  @ApiResponse({ status: 201, description: 'Transfer report generated successfully', type: ReportResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - invalid date range or parameters' })
  async generateTransferReport(@Body() dto: TransferReportDto): Promise<ReportResponseDto> {
    return this.stateReportingService.generateTransferReport(dto);
  }

  @Post('testing-compliance')
  @ApiOperation({ summary: 'Generate testing compliance report' })
  @ApiResponse({ status: 201, description: 'Testing compliance report generated successfully', type: ReportResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - invalid date range or parameters' })
  async generateTestingComplianceReport(@Body() dto: TestingComplianceReportDto): Promise<ReportResponseDto> {
    return this.stateReportingService.generateTestingComplianceReport(dto);
  }

  @Post('custom')
  @ApiOperation({ summary: 'Generate custom report' })
  @ApiResponse({ status: 201, description: 'Custom report generated successfully', type: ReportResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - invalid date range or parameters' })
  async generateCustomReport(@Body() dto: CustomReportDto): Promise<ReportResponseDto> {
    return this.stateReportingService.generateCustomReport(dto);
  }
}
