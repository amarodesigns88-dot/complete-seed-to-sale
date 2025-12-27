import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      location: {
        findMany: jest.fn(),
      },
      userPermission: {
        findMany: jest.fn(),
      },
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService) as jest.Mocked<PrismaService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user when credentials are valid', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        isActive: true,
        deletedAt: null,
        roles: [],
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeDefined();
      expect(result.id).toBe('user-1');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: expect.any(Object),
      });
    });

    it('should return null when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        isActive: true,
        deletedAt: null,
        roles: [],
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrong-password');

      expect(result).toBeNull();
    });

    it('should return null when user is inactive', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        isActive: false,
        deletedAt: null,
        roles: [],
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when user is deleted', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        isActive: true,
        deletedAt: new Date(),
        roles: [],
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token for valid user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      jwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.login(mockUser);

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('mock-jwt-token');
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: mockUser.email,
        sub: mockUser.id,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      });
    });
  });

  describe('loginStateUser', () => {
    it('should authenticate state user with valid credentials', async () => {
      const mockUser = {
        id: 'state-user-1',
        username: 'stateuser',
        email: 'state@example.com',
        passwordHash: 'hashed-password',
        isActive: true,
        deletedAt: null,
        roles: [{ role: { name: 'state_user' } }],
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('state-user-token');

      const result = await service.loginStateUser('stateuser', 'password');

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('state-user-token');
      expect(prisma.user.findUnique).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid state user credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.loginStateUser('invalid', 'password')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is not a state user', async () => {
      const mockUser = {
        id: 'regular-user-1',
        username: 'regularuser',
        email: 'regular@example.com',
        passwordHash: 'hashed-password',
        isActive: true,
        deletedAt: null,
        roles: [{ role: { name: 'licensee_user' } }],
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.loginStateUser('regularuser', 'password')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('loginAdmin', () => {
    it('should authenticate admin with valid credentials', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        passwordHash: 'hashed-password',
        isActive: true,
        deletedAt: null,
        roles: [{ role: { name: 'system_admin' } }],
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('admin-token');

      const result = await service.loginAdmin('admin@example.com', 'password');

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('admin-token');
    });

    it('should authenticate admin with selected license', async () => {
      const mockUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        passwordHash: 'hashed-password',
        isActive: true,
        deletedAt: null,
        roles: [{ role: { name: 'system_admin' } }],
      };

      const mockLocation = {
        id: 'location-1',
        ubi: 'TEST-UBI-123',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.location.findMany.mockResolvedValue([mockLocation] as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('admin-token-with-ubi');

      const result = await service.loginAdmin('admin@example.com', 'password', 'TEST-UBI-123');

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('selectedUbi', 'TEST-UBI-123');
    });

    it('should throw UnauthorizedException for non-admin user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        passwordHash: 'hashed-password',
        isActive: true,
        deletedAt: null,
        roles: [{ role: { name: 'licensee_user' } }],
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.loginAdmin('user@example.com', 'password')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions with user type and read-only status', async () => {
      const userId = 'user-1';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        roles: [
          { role: { name: 'system_admin' } },
          { role: { name: 'state_user' } },
        ],
      };

      const mockPermissions = [
        { permission: { name: 'read_plants', resource: 'plants', actionType: 'read' } },
        { permission: { name: 'write_plants', resource: 'plants', actionType: 'write' } },
      ];

      const mockLocations = [
        { ubi: 'UBI-001' },
        { ubi: 'UBI-002' },
      ];

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.userPermission.findMany.mockResolvedValue(mockPermissions as any);
      prisma.location.findMany.mockResolvedValue(mockLocations as any);

      const result = await service.getUserPermissions(userId);

      expect(result).toHaveProperty('userType');
      expect(result).toHaveProperty('isReadOnly');
      expect(result).toHaveProperty('permissions');
      expect(result).toHaveProperty('accessibleUbis');
      expect(result.userType).toBe('Admin');
      expect(result.isReadOnly).toBe(true);
      expect(result.permissions).toHaveLength(2);
      expect(result.accessibleUbis).toHaveLength(2);
    });

    it('should identify licensee user correctly', async () => {
      const userId = 'user-2';
      const mockUser = {
        id: userId,
        email: 'licensee@example.com',
        roles: [{ role: { name: 'licensee_user' } }],
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.userPermission.findMany.mockResolvedValue([]);
      prisma.location.findMany.mockResolvedValue([]);

      const result = await service.getUserPermissions(userId);

      expect(result.userType).toBe('Licensee');
      expect(result.isReadOnly).toBe(false);
    });

    it('should identify state user correctly', async () => {
      const userId = 'user-3';
      const mockUser = {
        id: userId,
        email: 'state@example.com',
        roles: [{ role: { name: 'state_user' } }],
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      prisma.userPermission.findMany.mockResolvedValue([]);
      prisma.location.findMany.mockResolvedValue([]);

      const result = await service.getUserPermissions(userId);

      expect(result.userType).toBe('State');
      expect(result.isReadOnly).toBe(true);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserPermissions('nonexistent')).rejects.toThrow(UnauthorizedException);
    });
  });
});
