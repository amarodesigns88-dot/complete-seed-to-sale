import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { LocationModuleGuard } from '../auth/location.guard';
import { Roles } from '../auth/roles.decorator';
import { LocationModulePermissions } from '../auth/location.decorator';

@Controller('licensee')
@UseGuards(JwtAuthGuard, RolesGuard, LocationModuleGuard)
export class LicenseeController {
  
  @Get(':locationId/dashboard')
  @Roles('licensee_admin')
  @LocationModulePermissions(['cultivation', 'inventory'])
  getDashboard(@Param('locationId') locationId: string) {
    return {
      message: `Protected dashboard data for location ${locationId} with role and location/module guard`,
    };
  }
}