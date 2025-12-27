import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UserService', () => {
  let service: UserService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      role: {
        findUnique: jest.fn(),
      },
      userRole: {
        create: jest.fn(),
        deleteMany: jest.fn(),
        findFirst: jest.fn(),
      },
      userPermission: {
        findMany: jest.fn(),
      },
      location: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('assignRole', () => {
    it('should successfully assign role to user', async () => {
      const userId = 'user-1';
      const roleId = 'role-1';

      const mockUser = {
        id: userId,
        email: 'test@example.com',
        deletedAt: null,
      };

      const mockRole = {
        id: roleId,
        name: 'licensee_user',
        deletedAt: null,
      };

      const mockUserRole = {
        id: 'user-role-1',
        userId,
        roleId,
        createdAt: new Date(),
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.role.findUnique.mockResolvedValue(mockRole as any);
      prisma.userRole.findFirst.mockResolvedValue(null);
      prisma.userRole.create.mockResolvedValue(mockUserRole as any);

      const result = await service.assignRole(userId, roleId, 'admin-1');

      expect(result).toHaveProperty('id');
      expect(result.userId).toBe(userId);
      expect(result.roleId).toBe(roleId);
      expect(prisma.userRole.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.assignRole('nonexistent', 'role-1', 'admin-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when role does not exist', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        deletedAt: null,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.role.findUnique.mockResolvedValue(null);

      await expect(service.assignRole('user-1', 'nonexistent-role', 'admin-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when role is already assigned', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        deletedAt: null,
      };

      const mockRole = {
        id: 'role-1',
        name: 'licensee_user',
        deletedAt: null,
      };

      const existingUserRole = {
        id: 'existing-user-role',
        userId: 'user-1',
        roleId: 'role-1',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.role.findUnique.mockResolvedValue(mockRole as any);
      prisma.userRole.findFirst.mockResolvedValue(existingUserRole as any);

      await expect(service.assignRole('user-1', 'role-1', 'admin-1')).rejects.toThrow(ConflictException);
    });
  });

  describe('removeRole', () => {
    it('should successfully remove role from user', async () => {
      const userId = 'user-1';
      const roleId = 'role-1';

      const mockUser = {
        id: userId,
        email: 'test@example.com',
        deletedAt: null,
      };

      const mockUserRole = {
        id: 'user-role-1',
        userId,
        roleId,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.userRole.findFirst.mockResolvedValue(mockUserRole as any);
      prisma.userRole.deleteMany.mockResolvedValue({ count: 1 });

      await service.removeRole(userId, roleId, 'admin-1');

      expect(prisma.userRole.deleteMany).toHaveBeenCalledWith({
        where: { userId, roleId },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.removeRole('nonexistent', 'role-1', 'admin-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when role assignment does not exist', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        deletedAt: null,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.userRole.findFirst.mockResolvedValue(null);

      await expect(service.removeRole('user-1', 'role-1', 'admin-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions', async () => {
      const userId = 'user-1';

      const mockUser = {
        id: userId,
        email: 'test@example.com',
        roles: [
          { role: { name: 'licensee_user' } },
        ],
        deletedAt: null,
      };

      const mockPermissions = [
        { permission: { name: 'read_plants', resource: 'plants', actionType: 'read' } },
        { permission: { name: 'write_inventory', resource: 'inventory', actionType: 'write' } },
      ];

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.userPermission.findMany.mockResolvedValue(mockPermissions as any);

      const result = await service.getUserPermissions(userId);

      expect(result).toHaveProperty('permissions');
      expect(result.permissions).toHaveLength(2);
      expect(result.permissions[0]).toHaveProperty('name', 'read_plants');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserPermissions('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('setAccessibleUbis', () => {
    it('should successfully set accessible UBIs for user', async () => {
      const userId = 'user-1';
      const ubis = ['UBI-001', 'UBI-002'];

      const mockUser = {
        id: userId,
        email: 'test@example.com',
        deletedAt: null,
      };

      const mockLocations = [
        { id: 'loc-1', ubi: 'UBI-001' },
        { id: 'loc-2', ubi: 'UBI-002' },
      ];

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.location.findMany.mockResolvedValue(mockLocations as any);
      prisma.location.updateMany.mockResolvedValue({ count: 2 });

      await service.setAccessibleUbis(userId, ubis, 'admin-1');

      expect(prisma.location.findMany).toHaveBeenCalledWith({
        where: { ubi: { in: ubis } },
      });
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.setAccessibleUbis('nonexistent', ['UBI-001'], 'admin-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when UBIs not found', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        deletedAt: null,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.location.findMany.mockResolvedValue([]);

      await expect(service.setAccessibleUbis('user-1', ['INVALID-UBI'], 'admin-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getUsersByType', () => {
    it('should return admin users when userType is Admin', async () => {
      const mockAdmins = [
        {
          id: 'admin-1',
          email: 'admin1@example.com',
          roles: [{ role: { name: 'system_admin' } }],
        },
        {
          id: 'admin-2',
          email: 'admin2@example.com',
          roles: [{ role: { name: 'system_admin' } }],
        },
      ];

      prisma.user.findMany.mockResolvedValue(mockAdmins as any);

      const result = await service.getUsersByType('Admin');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('admin-1');
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          roles: {
            some: {
              role: {
                name: 'system_admin',
              },
            },
          },
          deletedAt: null,
        },
        include: expect.any(Object),
      });
    });

    it('should return state users when userType is State', async () => {
      const mockStateUsers = [
        {
          id: 'state-1',
          email: 'state1@example.com',
          roles: [{ role: { name: 'state_user' } }],
        },
      ];

      prisma.user.findMany.mockResolvedValue(mockStateUsers as any);

      const result = await service.getUsersByType('State');

      expect(result).toHaveLength(1);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          roles: {
            some: {
              role: {
                name: 'state_user',
              },
            },
          },
          deletedAt: null,
        },
        include: expect.any(Object),
      });
    });

    it('should return licensee users when userType is Licensee', async () => {
      const mockLicenseeUsers = [
        {
          id: 'licensee-1',
          email: 'licensee1@example.com',
          roles: [{ role: { name: 'licensee_user' } }],
        },
        {
          id: 'lab-1',
          email: 'lab1@example.com',
          roles: [{ role: { name: 'lab_user' } }],
        },
      ];

      prisma.user.findMany.mockResolvedValue(mockLicenseeUsers as any);

      const result = await service.getUsersByType('Licensee');

      expect(result).toHaveLength(2);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          roles: {
            some: {
              role: {
                name: { in: ['licensee_user', 'lab_user'] },
              },
            },
          },
          deletedAt: null,
        },
        include: expect.any(Object),
      });
    });

    it('should throw BadRequestException for invalid user type', async () => {
      await expect(service.getUsersByType('InvalidType' as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        deletedAt: null,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.findById('user-1');

      expect(result).toHaveProperty('id', 'user-1');
      expect(result).toHaveProperty('email', 'test@example.com');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user is deleted', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        deletedAt: new Date(),
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      await expect(service.findById('user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
