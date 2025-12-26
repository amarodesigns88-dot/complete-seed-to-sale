import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class DashboardFilterDto {
  @ApiProperty({ required: false, description: 'Start date for filtering (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'End date for filtering (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, description: 'License type filter' })
  @IsOptional()
  @IsString()
  licenseType?: string;
}

export class MarketOverviewResponseDto {
  @ApiProperty({ description: 'Total number of active licensees' })
  totalLicensees: number;

  @ApiProperty({ description: 'Total inventory quantity across all licensees' })
  totalInventoryQuantity: number;

  @ApiProperty({ description: 'Total sales amount' })
  totalSalesAmount: number;

  @ApiProperty({ description: 'Total number of transfers' })
  totalTransfers: number;

  @ApiProperty({ description: 'Number of pending transfers' })
  pendingTransfers: number;

  @ApiProperty({ description: 'Number of active red flags' })
  activeRedFlags: number;
}

export class RedFlagDto {
  @ApiProperty({ description: 'Red flag ID' })
  id: string;

  @ApiProperty({ description: 'Licensee UBI' })
  licenseeUBI: string;

  @ApiProperty({ description: 'Licensee name' })
  licenseeName: string;

  @ApiProperty({ description: 'Red flag type' })
  type: string;

  @ApiProperty({ description: 'Red flag severity' })
  severity: string;

  @ApiProperty({ description: 'Red flag description' })
  description: string;

  @ApiProperty({ description: 'Created at timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Resolution status' })
  resolved: boolean;
}

export class LicenseeStatisticsDto {
  @ApiProperty({ description: 'Licensee UBI' })
  ubi: string;

  @ApiProperty({ description: 'Licensee name' })
  name: string;

  @ApiProperty({ description: 'License type' })
  licenseType: string;

  @ApiProperty({ description: 'Total inventory quantity' })
  inventoryQuantity: number;

  @ApiProperty({ description: 'Total sales amount' })
  salesAmount: number;

  @ApiProperty({ description: 'Number of transfers' })
  transferCount: number;

  @ApiProperty({ description: 'Number of red flags' })
  redFlagCount: number;

  @ApiProperty({ description: 'Last activity date' })
  lastActivityDate: Date;
}

export class InventorySummaryDto {
  @ApiProperty({ description: 'Inventory type' })
  type: string;

  @ApiProperty({ description: 'Total quantity' })
  totalQuantity: number;

  @ApiProperty({ description: 'Number of licensees with this type' })
  licenseeCount: number;

  @ApiProperty({ description: 'Average quantity per licensee' })
  avgQuantityPerLicensee: number;
}

export class SalesTrendDto {
  @ApiProperty({ description: 'Date period' })
  period: string;

  @ApiProperty({ description: 'Total sales amount' })
  totalAmount: number;

  @ApiProperty({ description: 'Number of transactions' })
  transactionCount: number;

  @ApiProperty({ description: 'Average transaction value' })
  avgTransactionValue: number;
}
