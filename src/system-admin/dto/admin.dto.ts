import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsDateString, IsEnum } from 'class-validator';

export class SystemConfigDto {
  @ApiProperty()
  @IsBoolean()
  maintenanceMode: boolean;

  @ApiProperty()
  @IsNumber()
  maxUsersPerLicense: number;

  @ApiProperty()
  @IsNumber()
  sessionTimeout: number;

  @ApiProperty()
  @IsBoolean()
  emailNotificationsEnabled: boolean;

  @ApiProperty()
  @IsBoolean()
  smsNotificationsEnabled: boolean;

  @ApiProperty()
  @IsNumber()
  dataRetentionDays: number;

  @ApiProperty()
  @IsBoolean()
  autoBackupEnabled: boolean;

  @ApiProperty()
  @IsString()
  backupSchedule: string;
}

export class UpdateSystemConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxUsersPerLicense?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sessionTimeout?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emailNotificationsEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  smsNotificationsEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  dataRetentionDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoBackupEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  backupSchedule?: string;
}

export class AuditLogFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class SystemHealthDto {
  @ApiProperty()
  status: string;

  @ApiProperty()
  database: {
    connected: boolean;
    responseTime: number;
  };

  @ApiProperty()
  cache: {
    connected: boolean;
    size: number;
  };

  @ApiProperty()
  services: {
    name: string;
    status: string;
  }[];

  @ApiProperty()
  uptime: number;

  @ApiProperty()
  timestamp: Date;
}

export class BackupRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  includeAuditLogs?: boolean;
}

export class NotificationFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  read?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class SystemMetricsDto {
  @ApiProperty()
  activeUsers: number;

  @ApiProperty()
  apiResponseTime: number;

  @ApiProperty()
  databaseQueryTime: number;

  @ApiProperty()
  cacheHitRate: number;

  @ApiProperty()
  requestsPerMinute: number;

  @ApiProperty()
  errorRate: number;

  @ApiProperty()
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };

  @ApiProperty()
  cpuUsage: number;

  @ApiProperty()
  timestamp: Date;
}
