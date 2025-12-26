import {
  Controller,
  Get,
  Param,
  UseGuards,
  Post,
  Body,
  Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { LocationModuleGuard } from '../auth/location.guard';
import { Roles } from '../auth/roles.decorator';
import { LocationModulePermissions } from '../auth/location.decorator';
import { LicenseeService } from './licensee.service';
import { UpdateLicenseTypeDto, AddLicenseDto } from './dto/license.dto';

@ApiTags('licensee')
@Controller('licensee')
@UseGuards(JwtAuthGuard, RolesGuard, LocationModuleGuard)
export class LicenseeController {
  constructor(private readonly licenseeService: LicenseeService) {}

  @Get(':locationId/dashboard')
  @Roles('licensee_admin')
  @LocationModulePermissions(['cultivation', 'inventory'])
  @ApiOperation({ summary: 'Get licensee dashboard' })
  getDashboard(@Param('locationId') locationId: string) {
    return {
      message: `Protected dashboard data for location ${locationId} with role and location/module guard`,
    };
  }

  @Get('license-types')
  @ApiOperation({ summary: 'Get all available license types' })
  @ApiResponse({
    status: 200,
    description: 'Returns all license types in the system',
  })
  async getAllLicenseTypes() {
    return this.licenseeService.getAllLicenseTypes();
  }

  @Get('license-types/:licenseTypeId')
  @ApiOperation({ summary: 'Get a specific license type by ID' })
  @ApiResponse({ status: 200, description: 'Returns the license type' })
  @ApiResponse({ status: 404, description: 'License type not found' })
  async getLicenseTypeById(@Param('licenseTypeId') licenseTypeId: string) {
    return this.licenseeService.getLicenseTypeById(licenseTypeId);
  }

  @Get(':locationId/info')
  @Roles('licensee_admin', 'licensee_user')
  @ApiOperation({ summary: 'Get location info with license details' })
  @ApiResponse({
    status: 200,
    description: 'Returns location with license information',
  })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async getLocationInfo(@Param('locationId') locationId: string) {
    return this.licenseeService.getLocationWithLicenses(locationId);
  }

  @Put(':locationId/license-type')
  @Roles('licensee_admin')
  @ApiOperation({ summary: 'Update location license type' })
  @ApiResponse({
    status: 200,
    description: 'License type updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Location or license type not found' })
  async updateLicenseType(
    @Param('locationId') locationId: string,
    @Body() dto: UpdateLicenseTypeDto,
  ) {
    return this.licenseeService.updateLocationLicenseType(
      locationId,
      dto.licenseTypeId,
    );
  }

  @Get(':locationId/capabilities')
  @Roles('licensee_admin', 'licensee_user')
  @ApiOperation({ summary: 'Get license capabilities for location' })
  @ApiResponse({
    status: 200,
    description: 'Returns what the license allows the location to do',
  })
  async getLicenseCapabilities(@Param('locationId') locationId: string) {
    return this.licenseeService.getLicenseCapabilities(locationId);
  }

  @Post(':locationId/licenses')
  @Roles('licensee_admin')
  @ApiOperation({ summary: 'Add additional license to location (multi-license support)' })
  @ApiResponse({
    status: 201,
    description: 'Additional license added successfully',
  })
  @ApiResponse({ status: 404, description: 'Location or license type not found' })
  async addAdditionalLicense(
    @Param('locationId') locationId: string,
    @Body() dto: AddLicenseDto,
  ) {
    return this.licenseeService.addAdditionalLicense(
      locationId,
      dto.licenseTypeId,
      dto.licenseNumber,
    );
  }

  @Get(':locationId/licenses')
  @Roles('licensee_admin', 'licensee_user')
  @ApiOperation({ summary: 'List all licenses for location' })
  @ApiResponse({
    status: 200,
    description: 'Returns all licenses for the location',
  })
  async getLocationLicenses(@Param('locationId') locationId: string) {
    return this.licenseeService.getLocationLicenses(locationId);
  }
}