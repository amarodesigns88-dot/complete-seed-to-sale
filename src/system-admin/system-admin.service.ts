import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SystemConfigDto,
  UpdateSystemConfigDto,
  AuditLogFilterDto,
  SystemHealthDto,
  BackupRequestDto,
  NotificationFilterDto,
  SystemMetricsDto,
} from './dto/admin.dto';

@Injectable()
export class SystemAdminService {
  constructor(private prisma: PrismaService) {}

  async getSystemConfig(): Promise<SystemConfigDto> {
    // In a real application, this would fetch from a configuration table
    return {
      maintenanceMode: false,
      maxUsersPerLicense: 50,
      sessionTimeout: 3600,
      emailNotificationsEnabled: true,
      smsNotificationsEnabled: false,
      dataRetentionDays: 365,
      autoBackupEnabled: true,
      backupSchedule: '0 2 * * *', // Daily at 2 AM
    };
  }

  async updateSystemConfig(
    updateDto: UpdateSystemConfigDto,
    adminUserId: string,
  ): Promise<SystemConfigDto> {
    // In a real application, this would update the configuration table
    // For now, we'll create an audit log entry
    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'UPDATE_SYSTEM_CONFIG',
        entity: 'SystemConfig',
        entityId: 'system',
        changes: JSON.stringify(updateDto),
        ipAddress: '0.0.0.0',
      },
    });

    return {
      maintenanceMode: updateDto.maintenanceMode ?? false,
      maxUsersPerLicense: updateDto.maxUsersPerLicense ?? 50,
      sessionTimeout: updateDto.sessionTimeout ?? 3600,
      emailNotificationsEnabled: updateDto.emailNotificationsEnabled ?? true,
      smsNotificationsEnabled: updateDto.smsNotificationsEnabled ?? false,
      dataRetentionDays: updateDto.dataRetentionDays ?? 365,
      autoBackupEnabled: updateDto.autoBackupEnabled ?? true,
      backupSchedule: updateDto.backupSchedule ?? '0 2 * * *',
    };
  }

  async getAllUsers(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        where: {
          deletedAt: null,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          userType: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
        },
      }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAuditLogs(filterDto: AuditLogFilterDto) {
    const { userId, action, entity, startDate, endDate, page = 1, limit = 50 } = filterDto;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (entity) {
      where.entity = entity;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSystemHealth(): Promise<SystemHealthDto> {
    const startTime = Date.now();
    
    // Check database connection
    let dbConnected = true;
    let dbResponseTime = 0;
    try {
      const dbStart = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - dbStart;
    } catch (error) {
      dbConnected = false;
    }

    // Check cache (if implemented)
    const cacheConnected = true; // Would check Redis or other cache
    const cacheSize = 0; // Would get actual cache size

    // Check services status
    const services = [
      { name: 'Database', status: dbConnected ? 'healthy' : 'unhealthy' },
      { name: 'Cache', status: cacheConnected ? 'healthy' : 'unhealthy' },
      { name: 'API', status: 'healthy' },
    ];

    const uptime = process.uptime();

    return {
      status: dbConnected && cacheConnected ? 'healthy' : 'degraded',
      database: {
        connected: dbConnected,
        responseTime: dbResponseTime,
      },
      cache: {
        connected: cacheConnected,
        size: cacheSize,
      },
      services,
      uptime,
      timestamp: new Date(),
    };
  }

  async triggerBackup(
    backupDto: BackupRequestDto,
    adminUserId: string,
  ): Promise<{ message: string; backupId: string }> {
    // In a real application, this would trigger an actual backup process
    const backupId = `backup_${Date.now()}`;

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'TRIGGER_BACKUP',
        entity: 'System',
        entityId: backupId,
        changes: JSON.stringify(backupDto),
        ipAddress: '0.0.0.0',
      },
    });

    return {
      message: 'Backup triggered successfully',
      backupId,
    };
  }

  async getNotifications(filterDto: NotificationFilterDto) {
    const { type, read, page = 1, limit = 50 } = filterDto;
    const skip = (page - 1) * limit;

    // In a real application, this would query a notifications table
    // For now, we'll return recent audit logs as notifications
    const where: any = {};

    if (type) {
      where.action = { contains: type };
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs.map(log => ({
        id: log.id,
        type: log.action,
        message: `${log.action} on ${log.entity}`,
        read: false,
        createdAt: log.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async clearCache(adminUserId: string): Promise<{ message: string }> {
    // In a real application, this would clear Redis or other cache
    
    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'CLEAR_CACHE',
        entity: 'System',
        entityId: 'cache',
        changes: JSON.stringify({ cleared: true }),
        ipAddress: '0.0.0.0',
      },
    });

    return {
      message: 'Cache cleared successfully',
    };
  }

  async getSystemMetrics(): Promise<SystemMetricsDto> {
    // Get active users count (logged in within last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const activeUsers = await this.prisma.user.count({
      where: {
        lastLoginAt: {
          gte: oneHourAgo,
        },
        deletedAt: null,
      },
    });

    // In a real application, these would be tracked metrics
    const memoryUsage = process.memoryUsage();
    const used = memoryUsage.heapUsed;
    const total = memoryUsage.heapTotal;

    return {
      activeUsers,
      apiResponseTime: 150, // Would track actual response times
      databaseQueryTime: 50, // Would track actual query times
      cacheHitRate: 0.85, // Would track actual cache hit rate
      requestsPerMinute: 100, // Would track actual requests
      errorRate: 0.01, // Would track actual error rate
      memoryUsage: {
        used: Math.round(used / 1024 / 1024), // Convert to MB
        total: Math.round(total / 1024 / 1024), // Convert to MB
        percentage: Math.round((used / total) * 100),
      },
      cpuUsage: 25, // Would track actual CPU usage
      timestamp: new Date(),
    };
  }
}
