import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsEnum, IsArray } from 'class-validator';

export enum ReportType {
  SALES = 'SALES',
  INVENTORY = 'INVENTORY',
  COMPLIANCE = 'COMPLIANCE',
  TRANSFERS = 'TRANSFERS',
  TESTING = 'TESTING',
  FINANCIAL = 'FINANCIAL',
}

export enum ExportFormat {
  CSV = 'CSV',
  PDF = 'PDF',
  EXCEL = 'EXCEL',
}

export class SalesReportDto {
  @ApiProperty({ description: 'Start date for report', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date for report', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Location ID', required: false })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiProperty({ description: 'Product category filter', required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ enum: ExportFormat, required: false })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;
}

export class InventoryReportDto {
  @ApiProperty({ description: 'Location ID', required: false })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiProperty({ description: 'Inventory type filter', required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ description: 'Room filter', required: false })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiProperty({ description: 'Include low stock items only', required: false })
  @IsOptional()
  lowStockOnly?: boolean;

  @ApiProperty({ enum: ExportFormat, required: false })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;
}

export class ComplianceReportDto {
  @ApiProperty({ description: 'Start date for report', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date for report', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Location ID', required: false })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiProperty({ description: 'Include resolved issues', required: false })
  @IsOptional()
  includeResolved?: boolean;

  @ApiProperty({ enum: ExportFormat, required: false })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;
}

export class TransferReportDto {
  @ApiProperty({ description: 'Start date for report', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date for report', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Location ID', required: false })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiProperty({ description: 'Transfer direction (incoming/outgoing)', required: false })
  @IsOptional()
  @IsString()
  direction?: string;

  @ApiProperty({ enum: ExportFormat, required: false })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;
}

export class TestingReportDto {
  @ApiProperty({ description: 'Start date for report', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date for report', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Location ID', required: false })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiProperty({ description: 'Test status filter', required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ enum: ExportFormat, required: false })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;
}

export class FinancialReportDto {
  @ApiProperty({ description: 'Start date for report', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date for report', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Location ID', required: false })
  @IsOptional()
  @IsString()
  locationId?: string;

  @ApiProperty({ description: 'Report granularity (daily/weekly/monthly)', required: false })
  @IsOptional()
  @IsString()
  granularity?: string;

  @ApiProperty({ enum: ExportFormat, required: false })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;
}

export class CustomReportDto {
  @ApiProperty({ enum: ReportType })
  @IsEnum(ReportType)
  reportType: ReportType;

  @ApiProperty({ description: 'Start date for report', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date for report', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Location IDs', type: [String], required: false })
  @IsOptional()
  @IsArray()
  locationIds?: string[];

  @ApiProperty({ description: 'Custom filters', required: false })
  @IsOptional()
  filters?: Record<string, any>;

  @ApiProperty({ enum: ExportFormat, required: false })
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat;
}

export class ReportResponseDto {
  @ApiProperty()
  reportId: string;

  @ApiProperty()
  reportType: string;

  @ApiProperty()
  generatedAt: Date;

  @ApiProperty()
  data: any;

  @ApiProperty({ required: false })
  downloadUrl?: string;

  @ApiProperty()
  format: string;
}
