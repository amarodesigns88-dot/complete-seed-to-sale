import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConversionService } from './conversion.service';
import {
  WetToDryConversionDto,
  DryToExtractionConversionDto,
  ExtractionToFinishedConversionDto,
  ConversionFilterDto,
} from './dto/conversion.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('conversion')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversion')
export class ConversionController {
  constructor(private readonly conversionService: ConversionService) {}

  @Post(':locationId/convert/wet-to-dry')
  @ApiOperation({ summary: 'Convert wet inventory to dry inventory' })
  @ApiResponse({ status: 201, description: 'Conversion successful' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Source inventory or room not found' })
  async convertWetToDry(
    @Param('locationId') locationId: string,
    @Body() dto: WetToDryConversionDto,
    @Request() req,
  ) {
    return this.conversionService.convertWetToDry(locationId, dto, req.user.userId);
  }

  @Post(':locationId/convert/dry-to-extraction')
  @ApiOperation({ summary: 'Convert dry inventory to extraction product' })
  @ApiResponse({ status: 201, description: 'Conversion successful' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Source inventory or room not found' })
  async convertDryToExtraction(
    @Param('locationId') locationId: string,
    @Body() dto: DryToExtractionConversionDto,
    @Request() req,
  ) {
    return this.conversionService.convertDryToExtraction(locationId, dto, req.user.userId);
  }

  @Post(':locationId/convert/extraction-to-finished')
  @ApiOperation({ summary: 'Convert extraction to finished goods' })
  @ApiResponse({ status: 201, description: 'Conversion successful' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Source inventory or room not found' })
  async convertExtractionToFinished(
    @Param('locationId') locationId: string,
    @Body() dto: ExtractionToFinishedConversionDto,
    @Request() req,
  ) {
    return this.conversionService.convertExtractionToFinished(locationId, dto, req.user.userId);
  }

  @Get(':locationId/conversions/:conversionId')
  @ApiOperation({ summary: 'Get conversion details by ID' })
  @ApiResponse({ status: 200, description: 'Conversion found' })
  @ApiResponse({ status: 404, description: 'Conversion not found' })
  async getConversion(@Param('locationId') locationId: string, @Param('conversionId') conversionId: string) {
    return this.conversionService.getConversion(locationId, conversionId);
  }

  @Get(':locationId/conversions')
  @ApiOperation({ summary: 'List all conversions with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'List of conversions' })
  async listConversions(@Param('locationId') locationId: string, @Query() filters: ConversionFilterDto) {
    return this.conversionService.listConversions(locationId, filters);
  }
}
