import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LicenseeReportingService } from './licensee-reporting.service';
import {
  SalesReportDto,
  InventoryReportDto,
  ComplianceReportDto,
  TransferReportDto,
  TestingReportDto,
  FinancialReportDto,
  CustomReportDto,
  ReportResponseDto,
} from './dto/licensee-reporting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Licensee Reporting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('licensee-reporting')
export class LicenseeReportingController {
  constructor(
    private readonly licenseeReportingService: LicenseeReportingService,
  ) {}

  @Post('sales')
  @Roles('LICENSEE')
  @ApiOperation({ summary: 'Generate sales report for licensee' })
  async generateSalesReport(
    @Body() dto: SalesReportDto,
    @CurrentUser() user: any,
  ): Promise<ReportResponseDto> {
    return this.licenseeReportingService.generateSalesReport(dto, user.id);
  }

  @Post('inventory')
  @Roles('LICENSEE')
  @ApiOperation({ summary: 'Generate inventory report for licensee' })
  async generateInventoryReport(
    @Body() dto: InventoryReportDto,
    @CurrentUser() user: any,
  ): Promise<ReportResponseDto> {
    return this.licenseeReportingService.generateInventoryReport(dto, user.id);
  }

  @Post('compliance')
  @Roles('LICENSEE')
  @ApiOperation({ summary: 'Generate compliance report for licensee' })
  async generateComplianceReport(
    @Body() dto: ComplianceReportDto,
    @CurrentUser() user: any,
  ): Promise<ReportResponseDto> {
    return this.licenseeReportingService.generateComplianceReport(dto, user.id);
  }

  @Post('transfers')
  @Roles('LICENSEE')
  @ApiOperation({ summary: 'Generate transfer report for licensee' })
  async generateTransferReport(
    @Body() dto: TransferReportDto,
    @CurrentUser() user: any,
  ): Promise<ReportResponseDto> {
    return this.licenseeReportingService.generateTransferReport(dto, user.id);
  }

  @Post('testing')
  @Roles('LICENSEE')
  @ApiOperation({ summary: 'Generate testing report for licensee' })
  async generateTestingReport(
    @Body() dto: TestingReportDto,
    @CurrentUser() user: any,
  ): Promise<ReportResponseDto> {
    return this.licenseeReportingService.generateTestingReport(dto, user.id);
  }

  @Post('financial')
  @Roles('LICENSEE')
  @ApiOperation({ summary: 'Generate financial report for licensee' })
  async generateFinancialReport(
    @Body() dto: FinancialReportDto,
    @CurrentUser() user: any,
  ): Promise<ReportResponseDto> {
    return this.licenseeReportingService.generateFinancialReport(dto, user.id);
  }

  @Post('custom')
  @Roles('LICENSEE')
  @ApiOperation({ summary: 'Generate custom report for licensee' })
  async generateCustomReport(
    @Body() dto: CustomReportDto,
    @CurrentUser() user: any,
  ): Promise<ReportResponseDto> {
    return this.licenseeReportingService.generateCustomReport(dto, user.id);
  }
}
