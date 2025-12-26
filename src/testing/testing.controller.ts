import { Controller, Post, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TestingService } from './testing.service';
import { GenerateSampleDto, AssignLabDto, RemediateSampleDto, SampleFilterDto } from './dto/testing.dto';

@ApiTags('Testing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('testing/:locationId')
export class TestingController {
  constructor(private readonly testingService: TestingService) {}

  @Post('samples')
  @ApiOperation({ summary: 'Generate sample from inventory' })
  @ApiResponse({ status: 201, description: 'Sample generated successfully' })
  async generateSample(
    @Param('locationId') locationId: string,
    @Body() dto: GenerateSampleDto,
    @Req() req: any,
  ) {
    return this.testingService.generateSample(locationId, dto, req.user.userId);
  }

  @Post('samples/assign')
  @ApiOperation({ summary: 'Assign sample to lab' })
  @ApiResponse({ status: 200, description: 'Lab assigned successfully' })
  async assignLab(
    @Param('locationId') locationId: string,
    @Body() dto: AssignLabDto,
    @Req() req: any,
  ) {
    return this.testingService.assignLab(locationId, dto, req.user.userId);
  }

  @Post('samples/remediate')
  @ApiOperation({ summary: 'Remediate failed sample' })
  @ApiResponse({ status: 200, description: 'Remediation initiated successfully' })
  async remediate(
    @Param('locationId') locationId: string,
    @Body() dto: RemediateSampleDto,
    @Req() req: any,
  ) {
    return this.testingService.remediate(locationId, dto, req.user.userId);
  }

  @Get('samples/:sampleId')
  @ApiOperation({ summary: 'Get sample details' })
  @ApiResponse({ status: 200, description: 'Sample details retrieved' })
  async getSample(
    @Param('locationId') locationId: string,
    @Param('sampleId') sampleId: string,
  ) {
    return this.testingService.getSample(locationId, sampleId);
  }

  @Get('samples')
  @ApiOperation({ summary: 'List all samples' })
  @ApiResponse({ status: 200, description: 'Samples list retrieved' })
  async listSamples(
    @Param('locationId') locationId: string,
    @Query() filters: SampleFilterDto,
  ) {
    return this.testingService.listSamples(locationId, filters);
  }
}
