import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsDateString, IsEnum, IsArray } from 'class-validator';

export enum ReportFormat {
  CSV = 'CSV',
  PDF = 'PDF',
  JSON = 'JSON',
}

export enum ReportPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM',
}

export class BaseReportDto {
  @ApiProperty({ description: 'Start date for report', example: '2024-01-01' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date for report', example: '2024-12-31' })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Report format', enum: ReportFormat, default: ReportFormat.JSON })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat;

  @ApiPropertyOptional({ description: 'License type filter', example: 'RETAIL' })
  @IsOptional()
  @IsString()
  licenseType?: string;
}

export class ComplianceReportDto extends BaseReportDto {
  @ApiPropertyOptional({ description: 'Include violations only', default: false })
  @IsOptional()
  includeViolationsOnly?: boolean;

  @ApiPropertyOptional({ description: 'Specific licensee UBI filter' })
  @IsOptional()
  @IsString()
  licenseeUbi?: string;
}

export class MarketAnalyticsReportDto extends BaseReportDto {
  @ApiPropertyOptional({ description: 'Include forecasting', default: true })
  @IsOptional()
  includeForecast?: boolean;

  @ApiPropertyOptional({ description: 'Report period', enum: ReportPeriod, default: ReportPeriod.MONTHLY })
  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod;
}

export class LicenseePerformanceReportDto extends BaseReportDto {
  @ApiPropertyOptional({ description: 'Specific licensee UBI' })
  @IsOptional()
  @IsString()
  licenseeUbi?: string;

  @ApiPropertyOptional({ description: 'Include sales metrics', default: true })
  @IsOptional()
  includeSalesMetrics?: boolean;

  @ApiPropertyOptional({ description: 'Include compliance score', default: true })
  @IsOptional()
  includeComplianceScore?: boolean;
}

export class InventoryReportDto extends BaseReportDto {
  @ApiPropertyOptional({ description: 'Inventory type filter', example: 'FLOWER' })
  @IsOptional()
  @IsString()
  inventoryType?: string;

  @ApiPropertyOptional({ description: 'Region filter' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ description: 'Include expired items', default: false })
  @IsOptional()
  includeExpired?: boolean;
}

export class SalesAnalyticsReportDto extends BaseReportDto {
  @ApiPropertyOptional({ description: 'Group by product type', default: true })
  @IsOptional()
  groupByProduct?: boolean;

  @ApiPropertyOptional({ description: 'Include revenue trends', default: true })
  @IsOptional()
  includeRevenueTrends?: boolean;

  @ApiPropertyOptional({ description: 'Report period', enum: ReportPeriod, default: ReportPeriod.MONTHLY })
  @IsOptional()
  @IsEnum(ReportPeriod)
  period?: ReportPeriod;
}

export class TransferReportDto extends BaseReportDto {
  @ApiPropertyOptional({ description: 'Transfer status filter', example: 'COMPLETED' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Source licensee UBI' })
  @IsOptional()
  @IsString()
  sourceLicenseeUbi?: string;

  @ApiPropertyOptional({ description: 'Destination licensee UBI' })
  @IsOptional()
  @IsString()
  destinationLicenseeUbi?: string;
}

export class TestingComplianceReportDto extends BaseReportDto {
  @ApiPropertyOptional({ description: 'Include failed tests only', default: false })
  @IsOptional()
  includeFailedOnly?: boolean;

  @ApiPropertyOptional({ description: 'Test type filter', example: 'POTENCY' })
  @IsOptional()
  @IsString()
  testType?: string;

  @ApiPropertyOptional({ description: 'Lab UBI filter' })
  @IsOptional()
  @IsString()
  labUbi?: string;
}

export class CustomReportDto {
  @ApiProperty({ description: 'Report name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Start date', example: '2024-01-01' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date', example: '2024-12-31' })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Data sources to include', example: ['INVENTORY', 'SALES', 'TRANSFERS'] })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  dataSources: string[];

  @ApiPropertyOptional({ description: 'Custom filters as JSON' })
  @IsOptional()
  filters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Report format', enum: ReportFormat, default: ReportFormat.JSON })
  @IsOptional()
  @IsEnum(ReportFormat)
  format?: ReportFormat;
}

export class ReportResponseDto {
  @ApiProperty({ description: 'Report ID' })
  reportId: string;

  @ApiProperty({ description: 'Report type' })
  reportType: string;

  @ApiProperty({ description: 'Generated at timestamp' })
  generatedAt: Date;

  @ApiProperty({ description: 'Report data' })
  data: any;

  @ApiPropertyOptional({ description: 'Download URL for exported file' })
  downloadUrl?: string;

  @ApiProperty({ description: 'Total records' })
  totalRecords: number;

  @ApiPropertyOptional({ description: 'Summary statistics' })
  summary?: Record<string, any>;
}
