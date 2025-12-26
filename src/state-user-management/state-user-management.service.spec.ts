import { Test, TestingModule } from '@nestjs/testing';
import { StateUserManagementService } from './state-user-management.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('StateUserManagementService', () => {
  let service: StateUserManagementService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StateUserManagementService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<StateUserManagementService>(StateUserManagementService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createStateUser', () => {
    it('should create a new state user successfully', async () => {
      const createDto = {
        email: 'state.user@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'STATE_ADMIN',
        department: 'Compliance',
        title: 'Inspector',
      };

      const hashedPassword = await bcrypt.hash(createDto.password, 10);

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 1,
        email: createDto.email,
        firstName: createDto.firstName,
        lastName: createDto.lastName,
        role: createDto.role,
        userType: 'STATE',
        department: createDto.department,
        title: createDto.title,
        isActive: true,
        createdAt: new Date(),
      });

      const result = await service.createStateUser(createDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: createDto.email },
      });
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
      expect(result.email).toBe(createDto.email);
    });

    it('should throw BadRequestException if email already exists', async () => {
      const createDto = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'STATE_ADMIN',
        department: 'Compliance',
        title: 'Inspector',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 1,
        email: createDto.email,
      });

      await expect(service.createStateUser(createDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('listStateUsers', () => {
    it('should return paginated list of state users', async () => {
      const filterDto = {
        page: 1,
        limit: 10,
      };

      const mockUsers = [
        {
          id: 1,
          email: 'user1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'STATE_ADMIN',
          userType: 'STATE',
          department: 'Compliance',
          isActive: true,
        },
        {
          id: 2,
          email: 'user2@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'STATE_VIEWER',
          userType: 'STATE',
          department: 'Enforcement',
          isActive: true,
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.user.count.mockResolvedValue(2);

      const result = await service.listStateUsers(filterDto);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: { userType: 'STATE', deletedAt: null },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: expect.any(Object),
      });
    });

    it('should filter by search term', async () => {
      const filterDto = {
        page: 1,
        limit: 10,
        search: 'john',
      };

      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.listStateUsers(filterDto);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          userType: 'STATE',
          deletedAt: null,
          OR: [
            { firstName: { contains: 'john', mode: 'insensitive' } },
            { lastName: { contains: 'john', mode: 'insensitive' } },
            { email: { contains: 'john', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: expect.any(Object),
      });
    });

    it('should filter by department', async () => {
      const filterDto = {
        page: 1,
        limit: 10,
        department: 'Compliance',
      };

      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.listStateUsers(filterDto);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          userType: 'STATE',
          deletedAt: null,
          department: 'Compliance',
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: expect.any(Object),
      });
    });

    it('should filter by active status', async () => {
      const filterDto = {
        page: 1,
        limit: 10,
        isActive: false,
      };

      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.user.count.mockResolvedValue(0);

      await service.listStateUsers(filterDto);

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          userType: 'STATE',
          deletedAt: null,
          isActive: false,
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: expect.any(Object),
      });
    });
  });

  describe('getStateUser', () => {
    it('should return state user by id', async () => {
      const userId = 1;
      const mockUser = {
        id: userId,
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'STATE_ADMIN',
        userType: 'STATE',
        department: 'Compliance',
        isActive: true,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getStateUser(userId);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId, userType: 'STATE', deletedAt: null },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 999;

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.getStateUser(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStateUser', () => {
    it('should update state user successfully', async () => {
      const userId = 1;
      const updateDto = {
        firstName: 'Jane',
        department: 'Enforcement',
        isActive: true,
      };

      const existingUser = {
        id: userId,
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        userType: 'STATE',
      };

      const updatedUser = {
        ...existingUser,
        ...updateDto,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.updateStateUser(userId, updateDto);

      expect(result.firstName).toBe(updateDto.firstName);
      expect(result.department).toBe(updateDto.department);
      expect(mockPrismaService.user.update).toHaveBeenCalled();
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 999;
      const updateDto = { firstName: 'Jane' };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.updateStateUser(userId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteStateUser', () => {
    it('should soft delete state user successfully', async () => {
      const userId = 1;
      const existingUser = {
        id: userId,
        email: 'user@example.com',
        userType: 'STATE',
        deletedAt: null,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...existingUser,
        deletedAt: new Date(),
      });

      await service.deleteStateUser(userId);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { deletedAt: expect.any(Date) },
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 999;

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteStateUser(userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('setUserPermissions', () => {
    it('should set user permissions successfully', async () => {
      const userId = 1;
      const permissionsDto = {
        permissions: ['view_licensees', 'view_inventory'],
        accessibleUBIs: ['UBI001', 'UBI002'],
      };

      const existingUser = {
        id: userId,
        email: 'user@example.com',
        userType: 'STATE',
      };

      const updatedUser = {
        ...existingUser,
        permissions: permissionsDto.permissions,
        accessibleUBIs: permissionsDto.accessibleUBIs,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.setUserPermissions(userId, permissionsDto);

      expect(result.permissions).toEqual(permissionsDto.permissions);
      expect(result.accessibleUBIs).toEqual(permissionsDto.accessibleUBIs);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          permissions: permissionsDto.permissions,
          accessibleUBIs: permissionsDto.accessibleUBIs,
        },
        select: expect.any(Object),
      });
      expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 999;
      const permissionsDto = {
        permissions: ['view_licensees'],
        accessibleUBIs: ['UBI001'],
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.setUserPermissions(userId, permissionsDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });
});
