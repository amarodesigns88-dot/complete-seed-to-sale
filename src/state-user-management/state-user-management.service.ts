import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  CreateStateUserDto,
  UpdateStateUserDto,
  StateUserFilterDto,
  StateUserPermissionsDto,
} from './dto/state-user.dto';

@Injectable()
export class StateUserManagementService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new state user
   */
  async createStateUser(dto: CreateStateUserDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create state user with userType = 'STATE'
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: `${dto.firstName} ${dto.lastName}`,
        
        status: 'active',
        metadata: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          department: dto.department,
          title: dto.title,
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        status: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        module: "State-user-management",
        actionType: 'CREATE_STATE_USER',
        entityType: 'User',
        entityId: user.id,
        changes: JSON.stringify({ created: dto }),
        userId: user.id,
      },
    });

    return user;
  }

  /**
   * List state users with filtering and pagination
   */
  async listStateUsers(filters: StateUserFilterDto) {
    const { search, department, isActive, page = 1, perPage = 25 } = filters;
    const sanitizedPage = Math.max(1, Math.floor(page));
    const sanitizedPerPage = Math.min(100, Math.max(1, Math.floor(perPage)));
    const skip = (sanitizedPage - 1) * sanitizedPerPage;

    const where: Prisma.UserWhereInput = {
      
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (department) {
      where.metadata = {
        path: ['department'],
        equals: department,
      };
    }

    if (isActive !== undefined) {
      where.status = isActive ? 'active' : 'inactive';
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: sanitizedPerPage,
        select: {
          id: true,
          email: true,
          name: true,
          userType: true,
          status: true,
          metadata: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page: sanitizedPage,
        perPage: sanitizedPerPage,
        total,
        totalPages: Math.ceil(total / sanitizedPerPage),
      },
    };
  }

  /**
   * Get a specific state user by ID
   */
  async getStateUser(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        status: true,
        metadata: true,
        permissions: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('State user not found');
    }

    return user;
  }

  /**
   * Update a state user
   */
  async updateStateUser(userId: string, dto: UpdateStateUserDto) {
    // Verify user exists and is a state user
    const existingUser = await this.prisma.user.findFirst({
      where: {
        id: userId,
        
        deletedAt: null,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('State user not found');
    }

    // Prepare update data
    const updateData: Prisma.UserUpdateInput = {};
    const metadata = (existingUser.metadata as any) || {};

    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      const firstName = dto.firstName ?? metadata.firstName ?? '';
      const lastName = dto.lastName ?? metadata.lastName ?? '';
      updateData.name = `${firstName} ${lastName}`.trim();
    }

    if (dto.firstName !== undefined) metadata.firstName = dto.firstName;
    if (dto.lastName !== undefined) metadata.lastName = dto.lastName;
    if (dto.phone !== undefined) metadata.phone = dto.phone;
    if (dto.department !== undefined) metadata.department = dto.department;
    if (dto.title !== undefined) metadata.title = dto.title;

    updateData.metadata = metadata;

    if (dto.isActive !== undefined) {
      updateData.status = dto.isActive ? 'active' : 'inactive';
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        userType: true,
        status: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        module: "State-user-management",
        actionType: 'UPDATE_STATE_USER',
        entityType: 'User',
        entityId: userId,
        changes: JSON.stringify({ updated: dto }),
        userId: userId,
      },
    });

    return user;
  }

  /**
   * Delete a state user (soft delete)
   */
  async deleteStateUser(userId: string) {
    // Verify user exists and is a state user
    const existingUser = await this.prisma.user.findFirst({
      where: {
        id: userId,
        
        deletedAt: null,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('State user not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        module: "State-user-management",
        actionType: 'DELETE_STATE_USER',
        entityType: 'User',
        entityId: userId,
        changes: JSON.stringify({ deleted: true }),
        userId: userId,
      },
    });

    return { message: 'State user deleted successfully' };
  }

  /**
   * Set permissions for a state user
   */
  async setStateUserPermissions(userId: string, dto: StateUserPermissionsDto) {
    // Verify user exists and is a state user
    const existingUser = await this.prisma.user.findFirst({
      where: {
        id: userId,
        
        deletedAt: null,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('State user not found');
    }

    // Update permissions
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        permissions: dto.permissions,
        accessibleUbis: dto.accessibleUbis || [],
      },
      select: {
        id: true,
        email: true,
        name: true,
        permissions: true,
        accessibleUbis: true,
      },
    });

    // Create audit log
    await this.prisma.auditLog.create({
      data: {
        module: "State-user-management",
        actionType: 'SET_STATE_USER_PERMISSIONS',
        entityType: 'User',
        entityId: userId,
        changes: JSON.stringify({ permissions: dto }),
        userId: userId,
      },
    });

    return user;
  }
}
