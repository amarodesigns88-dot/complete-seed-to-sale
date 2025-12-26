import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StateDashboardService } from './state-dashboard.service';
import {
  DashboardFilterDto,
  MarketOverviewResponseDto,
  RedFlagDto,
  LicenseeStatisticsDto,
  InventorySummaryDto,
  SalesTrendDto,
} from './dto/dashboard.dto';

@ApiTags('State Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('state-dashboard')
export class StateDashboardController {
  constructor(private readonly stateDashboardService: StateDashboardService) {}

  @Get('market-overview')
  @ApiOperation({ summary: 'Get market overview statistics' })
  @ApiResponse({
    status: 200,
    description: 'Market overview retrieved successfully',
    type: MarketOverviewResponseDto,
  })
  async getMarketOverview(@Query() filters: DashboardFilterDto): Promise<MarketOverviewResponseDto> {
    return this.stateDashboardService.getMarketOverview(filters);
  }

  @Get('red-flags')
  @ApiOperation({ summary: 'Get list of red flags' })
  @ApiResponse({
    status: 200,
    description: 'Red flags retrieved successfully',
    type: [RedFlagDto],
  })
  async getRedFlags(@Query() filters: DashboardFilterDto): Promise<RedFlagDto[]> {
    return this.stateDashboardService.getRedFlags(filters);
  }

  @Get('licensee-statistics')
  @ApiOperation({ summary: 'Get licensee statistics' })
  @ApiResponse({
    status: 200,
    description: 'Licensee statistics retrieved successfully',
    type: [LicenseeStatisticsDto],
  })
  async getLicenseeStatistics(@Query() filters: DashboardFilterDto): Promise<LicenseeStatisticsDto[]> {
    return this.stateDashboardService.getLicenseeStatistics(filters);
  }

  @Get('inventory-summary')
  @ApiOperation({ summary: 'Get inventory summary by type' })
  @ApiResponse({
    status: 200,
    description: 'Inventory summary retrieved successfully',
    type: [InventorySummaryDto],
  })
  async getInventorySummary(@Query() filters: DashboardFilterDto): Promise<InventorySummaryDto[]> {
    return this.stateDashboardService.getInventorySummary(filters);
  }

  @Get('sales-trends')
  @ApiOperation({ summary: 'Get sales trends over time' })
  @ApiResponse({
    status: 200,
    description: 'Sales trends retrieved successfully',
    type: [SalesTrendDto],
  })
  async getSalesTrends(@Query() filters: DashboardFilterDto): Promise<SalesTrendDto[]> {
    return this.stateDashboardService.getSalesTrends(filters);
  }
}
