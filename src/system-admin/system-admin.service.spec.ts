import { Test, TestingModule } from '@nestjs/testing';
import { SystemAdminService } from './system-admin.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SystemAdminService', () => {
  let service: SystemAdminService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemAdminService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
            auditLog: {
              findMany: jest.fn(),
              count: jest.fn(),
              create: jest.fn(),
            },
            $queryRaw: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SystemAdminService>(SystemAdminService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSystemConfig', () => {
    it('should return default system configuration', async () => {
      const result = await service.getSystemConfig();

      expect(result).toEqual({
        maintenanceMode: false,
        maxUsersPerLicense: 50,
        sessionTimeout: 3600,
        emailNotificationsEnabled: true,
        smsNotificationsEnabled: false,
        dataRetentionDays: 365,
        autoBackupEnabled: true,
        backupSchedule: '0 2 * * *',
      });
    });
  });

  describe('updateSystemConfig', () => {
    it('should update system configuration and create audit log', async () => {
      const updateDto = {
        maintenanceMode: true,
        maxUsersPerLicense: 100,
      };
      const adminUserId = 'admin-123';

      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.updateSystemConfig(updateDto, adminUserId);

      expect(result.maintenanceMode).toBe(true);
      expect(result.maxUsersPerLicense).toBe(100);
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: adminUserId,
          action: 'UPDATE_SYSTEM_CONFIG',
          entity: 'SystemConfig',
        }),
      });
    });

    it('should apply default values for missing fields', async () => {
      const updateDto = {
        maintenanceMode: true,
      };
      const adminUserId = 'admin-123';

      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.updateSystemConfig(updateDto, adminUserId);

      expect(result.maintenanceMode).toBe(true);
      expect(result.maxUsersPerLicense).toBe(50); // Default value
      expect(result.sessionTimeout).toBe(3600); // Default value
    });
  });

  describe('getAllUsers', () => {
    it('should return paginated list of users', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'user1@test.com',
          firstName: 'John',
          lastName: 'Doe',
          userType: 'LICENSEE',
          isActive: true,
          createdAt: new Date('2024-01-01'),
          lastLoginAt: new Date('2024-01-15'),
        },
      ];

      jest.spyOn(prisma.user, 'findMany').mockResolvedValue(mockUsers as any);
      jest.spyOn(prisma.user, 'count').mockResolvedValue(1);

      const result = await service.getAllUsers(1, 50);

      expect(result.data).toEqual(mockUsers);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 50,
        total: 1,
        totalPages: 1,
      });
    });

    it('should filter out deleted users', async () => {
      jest.spyOn(prisma.user, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.user, 'count').mockResolvedValue(0);

      await service.getAllUsers();

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
          },
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      jest.spyOn(prisma.user, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.user, 'count').mockResolvedValue(150);

      const result = await service.getAllUsers(2, 50);

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 50,
          take: 50,
        }),
      );
      expect(result.pagination.totalPages).toBe(3);
    });
  });

  describe('getAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      const mockLogs = [
        {
          id: '1',
          userId: 'user-123',
          action: 'CREATE',
          entity: 'User',
          entityId: 'entity-1',
          changes: '{}',
          ipAddress: '127.0.0.1',
          createdAt: new Date('2024-01-15'),
          user: {
            email: 'user@test.com',
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      ];

      jest.spyOn(prisma.auditLog, 'findMany').mockResolvedValue(mockLogs as any);
      jest.spyOn(prisma.auditLog, 'count').mockResolvedValue(1);

      const result = await service.getAuditLogs({ page: 1, limit: 50 });

      expect(result.data).toEqual(mockLogs);
      expect(result.pagination.total).toBe(1);
    });

    it('should filter by userId', async () => {
      const filterDto = {
        userId: 'user-123',
        page: 1,
        limit: 50,
      };

      jest.spyOn(prisma.auditLog, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.auditLog, 'count').mockResolvedValue(0);

      await service.getAuditLogs(filterDto);

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
          }),
        }),
      );
    });

    it('should filter by action', async () => {
      const filterDto = {
        action: 'CREATE',
        page: 1,
        limit: 50,
      };

      jest.spyOn(prisma.auditLog, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.auditLog, 'count').mockResolvedValue(0);

      await service.getAuditLogs(filterDto);

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: 'CREATE',
          }),
        }),
      );
    });

    it('should filter by date range', async () => {
      const filterDto = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        page: 1,
        limit: 50,
      };

      jest.spyOn(prisma.auditLog, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.auditLog, 'count').mockResolvedValue(0);

      await service.getAuditLogs(filterDto);

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        }),
      );
    });
  });

  describe('getSystemHealth', () => {
    it('should return system health status', async () => {
      jest.spyOn(prisma, '$queryRaw' as any).mockResolvedValue([{ result: 1 }]);

      const result = await service.getSystemHealth();

      expect(result.status).toBe('healthy');
      expect(result.database.connected).toBe(true);
      expect(result.database.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.cache.connected).toBe(true);
      expect(result.services).toHaveLength(3);
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return degraded status when database is disconnected', async () => {
      jest.spyOn(prisma, '$queryRaw' as any).mockRejectedValue(new Error('DB Error'));

      const result = await service.getSystemHealth();

      expect(result.status).toBe('degraded');
      expect(result.database.connected).toBe(false);
    });

    it('should measure database response time', async () => {
      jest.spyOn(prisma, '$queryRaw' as any).mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return [{ result: 1 }];
      });

      const result = await service.getSystemHealth();

      expect(result.database.responseTime).toBeGreaterThan(0);
    });
  });

  describe('triggerBackup', () => {
    it('should trigger backup and create audit log', async () => {
      const backupDto = {
        includeUploads: true,
        compression: true,
      };
      const adminUserId = 'admin-123';

      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.triggerBackup(backupDto, adminUserId);

      expect(result.message).toBe('Backup triggered successfully');
      expect(result.backupId).toContain('backup_');
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: adminUserId,
          action: 'TRIGGER_BACKUP',
          entity: 'System',
        }),
      });
    });

    it('should include backup configuration in audit log', async () => {
      const backupDto = {
        includeUploads: false,
        compression: true,
      };
      const adminUserId = 'admin-123';

      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      await service.triggerBackup(backupDto, adminUserId);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          changes: JSON.stringify(backupDto),
        }),
      });
    });
  });

  describe('getNotifications', () => {
    it('should return paginated notifications from audit logs', async () => {
      const mockLogs = [
        {
          id: '1',
          action: 'RED_FLAG_CREATED',
          entity: 'RedFlag',
          createdAt: new Date('2024-01-15'),
        },
      ];

      jest.spyOn(prisma.auditLog, 'findMany').mockResolvedValue(mockLogs as any);
      jest.spyOn(prisma.auditLog, 'count').mockResolvedValue(1);

      const result = await service.getNotifications({ page: 1, limit: 50 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe('RED_FLAG_CREATED');
      expect(result.data[0].message).toContain('RED_FLAG_CREATED');
      expect(result.pagination.total).toBe(1);
    });

    it('should filter notifications by type', async () => {
      const filterDto = {
        type: 'RED_FLAG',
        page: 1,
        limit: 50,
      };

      jest.spyOn(prisma.auditLog, 'findMany').mockResolvedValue([]);
      jest.spyOn(prisma.auditLog, 'count').mockResolvedValue(0);

      await service.getNotifications(filterDto);

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: { contains: 'RED_FLAG' },
          }),
        }),
      );
    });
  });

  describe('clearCache', () => {
    it('should clear cache and create audit log', async () => {
      const adminUserId = 'admin-123';

      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.clearCache(adminUserId);

      expect(result.message).toBe('Cache cleared successfully');
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: adminUserId,
          action: 'CLEAR_CACHE',
          entity: 'System',
          entityId: 'cache',
        }),
      });
    });
  });

  describe('getSystemMetrics', () => {
    it('should return system performance metrics', async () => {
      const mockActiveUsers = 25;
      jest.spyOn(prisma.user, 'count').mockResolvedValue(mockActiveUsers);

      const result = await service.getSystemMetrics();

      expect(result.activeUsers).toBe(25);
      expect(result.apiResponseTime).toBeDefined();
      expect(result.databaseQueryTime).toBeDefined();
      expect(result.cacheHitRate).toBeDefined();
      expect(result.requestsPerMinute).toBeDefined();
      expect(result.errorRate).toBeDefined();
      expect(result.memoryUsage).toBeDefined();
      expect(result.memoryUsage.used).toBeGreaterThan(0);
      expect(result.memoryUsage.total).toBeGreaterThan(0);
      expect(result.memoryUsage.percentage).toBeGreaterThanOrEqual(0);
      expect(result.cpuUsage).toBeDefined();
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should count active users from last hour', async () => {
      jest.spyOn(prisma.user, 'count').mockResolvedValue(10);

      await service.getSystemMetrics();

      expect(prisma.user.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            lastLoginAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
            deletedAt: null,
          }),
        }),
      );
    });
  });
});
