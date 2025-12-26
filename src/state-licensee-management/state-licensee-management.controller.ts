import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StateLicenseeManagementService } from './state-licensee-management.service';
import {
  CreateLicenseeAccountDto,
  ActivateLicenseDto,
  SetInventoryWindowDto,
  AssignLicenseTypeDto,
  LicenseeFilterDto,
  LicenseeAccountResponseDto,
} from './dto/licensee-management.dto';

@ApiTags('State Licensee Account Management')
@Controller('state-licensee-management')
export class StateLicenseeManagementController {
  constructor(
    private readonly licenseeManagementService: StateLicenseeManagementService,
  ) {}

  @Post('licensees')
  @ApiOperation({ summary: 'Create a new licensee account' })
  @ApiResponse({
    status: 201,
    description: 'Licensee account created successfully',
    type: LicenseeAccountResponseDto,
  })
  async createLicenseeAccount(
    @Body() dto: CreateLicenseeAccountDto,
  ) {
    // In production, get stateUserId from JWT token
    const stateUserId = 1;
    return this.licenseeManagementService.createLicenseeAccount(dto, stateUserId);
  }

  @Put('licensees/:locationId/activate')
  @ApiOperation({ summary: 'Activate or deactivate a license' })
  @ApiResponse({
    status: 200,
    description: 'License status updated successfully',
  })
  async activateDeactivateLicense(
    @Param('locationId', ParseIntPipe) locationId: number,
    @Body() dto: ActivateLicenseDto,
  ) {
    // In production, get stateUserId from JWT token
    const stateUserId = 1;
    return this.licenseeManagementService.activateDeactivateLicense(
      locationId,
      dto,
      stateUserId,
    );
  }

  @Post('licensees/:locationId/inventory-window')
  @ApiOperation({ summary: 'Set initial inventory window for a licensee' })
  @ApiResponse({
    status: 200,
    description: 'Inventory window set successfully',
  })
  async setInitialInventoryWindow(
    @Param('locationId', ParseIntPipe) locationId: number,
    @Body() dto: SetInventoryWindowDto,
  ) {
    // In production, get stateUserId from JWT token
    const stateUserId = 1;
    return this.licenseeManagementService.setInitialInventoryWindow(
      locationId,
      dto,
      stateUserId,
    );
  }

  @Put('licensees/:locationId/license-type')
  @ApiOperation({ summary: 'Assign a license type to a licensee' })
  @ApiResponse({
    status: 200,
    description: 'License type assigned successfully',
  })
  async assignLicenseType(
    @Param('locationId', ParseIntPipe) locationId: number,
    @Body() dto: AssignLicenseTypeDto,
  ) {
    // In production, get stateUserId from JWT token
    const stateUserId = 1;
    return this.licenseeManagementService.assignLicenseType(
      locationId,
      dto,
      stateUserId,
    );
  }

  @Get('licensees/:locationId')
  @ApiOperation({ summary: 'Get licensee account details' })
  @ApiResponse({
    status: 200,
    description: 'Licensee account details retrieved successfully',
    type: LicenseeAccountResponseDto,
  })
  async getLicenseeAccount(
    @Param('locationId', ParseIntPipe) locationId: number,
  ) {
    return this.licenseeManagementService.getLicenseeAccount(locationId);
  }

  @Get('licensees')
  @ApiOperation({ summary: 'List all licensee accounts with filtering' })
  @ApiResponse({
    status: 200,
    description: 'Licensee accounts retrieved successfully',
  })
  async listLicenseeAccounts(@Query() filters: LicenseeFilterDto) {
    return this.licenseeManagementService.listLicenseeAccounts(filters);
  }
}
