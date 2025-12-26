import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SystemAdminService } from './system-admin.service';
import {
  SystemConfigDto,
  UpdateSystemConfigDto,
  AuditLogFilterDto,
  SystemHealthDto,
  BackupRequestDto,
  NotificationFilterDto,
  SystemMetricsDto,
} from './dto/admin.dto';

@ApiTags('System Administration')
@ApiBearerAuth()
@Controller('system-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemAdminController {
  constructor(private readonly systemAdminService: SystemAdminService) {}

  @Get('config')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get system configuration' })
  @ApiResponse({ status: 200, description: 'System configuration retrieved', type: SystemConfigDto })
  async getConfig(): Promise<SystemConfigDto> {
    return this.systemAdminService.getSystemConfig();
  }

  @Put('config')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update system configuration' })
  @ApiResponse({ status: 200, description: 'System configuration updated', type: SystemConfigDto })
  async updateConfig(
    @Body() updateDto: UpdateSystemConfigDto,
    @Request() req,
  ): Promise<SystemConfigDto> {
    return this.systemAdminService.updateSystemConfig(updateDto, req.user.userId);
  }

  @Get('users')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all system users' })
  @ApiResponse({ status: 200, description: 'Users retrieved' })
  async getAllUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.systemAdminService.getAllUsers(page, limit);
  }

  @Get('audit-logs')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get audit logs with filtering' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved' })
  async getAuditLogs(@Query() filterDto: AuditLogFilterDto) {
    return this.systemAdminService.getAuditLogs(filterDto);
  }

  @Get('health')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'System health status', type: SystemHealthDto })
  async getHealth(): Promise<SystemHealthDto> {
    return this.systemAdminService.getSystemHealth();
  }

  @Post('backup')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Trigger database backup' })
  @ApiResponse({ status: 200, description: 'Backup triggered' })
  async triggerBackup(
    @Body() backupDto: BackupRequestDto,
    @Request() req,
  ): Promise<{ message: string; backupId: string }> {
    return this.systemAdminService.triggerBackup(backupDto, req.user.userId);
  }

  @Get('notifications')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get system notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved' })
  async getNotifications(@Query() filterDto: NotificationFilterDto) {
    return this.systemAdminService.getNotifications(filterDto);
  }

  @Delete('cache')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Clear system cache' })
  @ApiResponse({ status: 200, description: 'Cache cleared' })
  async clearCache(@Request() req): Promise<{ message: string }> {
    return this.systemAdminService.clearCache(req.user.userId);
  }

  @Get('metrics')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get system performance metrics' })
  @ApiResponse({ status: 200, description: 'System metrics retrieved', type: SystemMetricsDto })
  async getMetrics(): Promise<SystemMetricsDto> {
    return this.systemAdminService.getSystemMetrics();
  }
}
