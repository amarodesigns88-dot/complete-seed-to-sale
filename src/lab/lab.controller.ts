import { Controller, Post, Get, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LabService } from './lab.service';
import { EnterResultDto, GenerateCOADto, TestResultFilterDto } from './dto/lab.dto';

@ApiTags('Lab')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lab/:locationId')
export class LabController {
  constructor(private readonly labService: LabService) {}

  @Post('results')
  @ApiOperation({ summary: 'Enter test result' })
  @ApiResponse({ status: 201, description: 'Test result entered successfully' })
  async enterResult(
    @Param('locationId') locationId: string,
    @Body() dto: EnterResultDto,
    @Req() req: any,
  ) {
    return this.labService.enterResult(locationId, dto, req.user.userId);
  }

  @Post('coa/generate')
  @ApiOperation({ summary: 'Generate Certificate of Analysis' })
  @ApiResponse({ status: 201, description: 'COA generated successfully' })
  async generateCOA(
    @Param('locationId') locationId: string,
    @Body() dto: GenerateCOADto,
    @Req() req: any,
  ) {
    return this.labService.generateCOA(locationId, dto, req.user.userId);
  }

  @Get('results/:testResultId')
  @ApiOperation({ summary: 'Get test result details' })
  @ApiResponse({ status: 200, description: 'Test result details retrieved' })
  async getTestResult(
    @Param('locationId') locationId: string,
    @Param('testResultId') testResultId: string,
  ) {
    return this.labService.getTestResult(locationId, testResultId);
  }

  @Get('results')
  @ApiOperation({ summary: 'List all test results' })
  @ApiResponse({ status: 200, description: 'Test results list retrieved' })
  async listTestResults(
    @Param('locationId') locationId: string,
    @Query() filters: TestResultFilterDto,
  ) {
    return this.labService.listTestResults(locationId, filters);
  }

  @Get('coa/:sampleId')
  @ApiOperation({ summary: 'Get COA for sample' })
  @ApiResponse({ status: 200, description: 'COA retrieved successfully' })
  async getSampleCOA(
    @Param('locationId') locationId: string,
    @Param('sampleId') sampleId: string,
  ) {
    return this.labService.getSampleCOA(locationId, sampleId);
  }
}
