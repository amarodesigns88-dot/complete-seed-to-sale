import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User as PrismaUser } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';

type ListFilters = {
  page?: number;
  perPage?: number;
  role?: string;
  locationId?: string;
  search?: string;
};

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  private userInclude(): Prisma.UserInclude {
    return {
      roles: true,
      locations: true,
    };
  }

  private toUserDto(user: PrismaUser & { roles?: any[]; locations?: any[] }): UserDto {
    return {
      id: user.id,
      email: user.email,
      name: (user.name ?? null) as string | null,
      roles: user.roles?.map((r) => r.name) ?? [],
      locationIds: user.locations?.map((l) => l.id) ?? [],
      status: user.deletedAt ? 'inactive' : (user.status ?? 'active'),
      createdAt: user.createdAt?.toISOString?.(),
      updatedAt: user.updatedAt?.toISOString?.(),
    } as UserDto;
  }

  async listUsers(filters: ListFilters) {
    const { page = 1, perPage = 25, role, locationId, search } = filters;
    const sanitizedPage = Math.max(1, Math.floor(page));
    const sanitizedPerPage = Math.min(200, Math.max(1, Math.floor(perPage)));

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.roles = { some: { name: role } };
    }

    if (locationId) {
      where.locations = { some: { id: locationId } };
    }

    const total = await this.prisma.user.count({ where });
    const users = await this.prisma.user.findMany({
      where,
      include: this.userInclude(),
      skip: (sanitizedPage - 1) * sanitizedPerPage,
      take: sanitizedPerPage,
      orderBy: { createdAt: 'desc' },
    });

    return {
      items: users.map((u) => this.toUserDto(u)),
      total,
      page: sanitizedPage,
      perPage: sanitizedPerPage,
    };
  }

  async getUserById(id: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: this.userInclude(),
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    return this.toUserDto(user);
  }

  async getProfile(userId: string): Promise<UserDto> {
    return this.getUserById(userId);
  }

  async createUser(dto: CreateUserDto): Promise<UserDto> {
    if (!dto.password) {
      throw new BadRequestException('Password is required');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Build create data. Prisma's generated type for UserCreateInput may require `name: string`.
    // Provide a safe fallback to empty string to satisfy generated types if necessary.
    const createData: Prisma.UserCreateInput = {
      id: dto.id ?? undefined,
      email: dto.email,
      name: dto.name ?? '',
      passwordHash,
      status: dto.status ?? undefined,
      isActive: typeof dto.isActive === 'boolean' ? dto.isActive : undefined,
      // parentLocation is a relation; use nested connect when provided
      ...(dto.parentLocationId ? { parentLocation: { connect: { id: dto.parentLocationId } } } : {}),
      // roles and locations as nested connects when provided
      roles: dto.roleIds && dto.roleIds.length > 0 ? { connect: dto.roleIds.map((id) => ({ id })) } : undefined,
      locations: dto.locationIds && dto.locationIds.length > 0 ? { connect: dto.locationIds.map((id) => ({ id })) } : undefined,
    };

    const user = await this.prisma.user.create({
      data: createData,
      include: this.userInclude(),
    });

    return this.toUserDto(user as any);
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<UserDto> {
    const data: Prisma.UserUpdateInput = {};

    if (typeof dto.email !== 'undefined') data.email = dto.email as any;
    if (typeof dto.name !== 'undefined') data.name = dto.name as any;
    if (typeof dto.status !== 'undefined') data.status = dto.status as any;
    if (typeof dto.isActive !== 'undefined') data.isActive = dto.isActive as any;

    if (dto.password) {
      const hash = await bcrypt.hash(dto.password, 10);
      data.passwordHash = hash;
    }

    // parentLocation is a relation; handle connect/disconnect via nested update
    if (typeof dto.parentLocationId !== 'undefined') {
      if (dto.parentLocationId === null) {
        data.parentLocation = { disconnect: true };
      } else {
        data.parentLocation = { connect: { id: dto.parentLocationId } };
      }
    }

    if (typeof dto.roleIds !== 'undefined') {
      // Replace roles (set). Prisma expects RoleWhereUniqueInput[] for set
      data.roles = dto.roleIds === null ? { set: [] } : { set: dto.roleIds.map((r) => ({ id: r })) } as any;
    }

    if (typeof dto.locationIds !== 'undefined') {
      data.locations = dto.locationIds === null ? { set: [] } : { set: dto.locationIds.map((l) => ({ id: l })) } as any;
    }

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data,
        include: this.userInclude(),
      });
      return this.toUserDto(user as any);
    } catch (err) {
      // Prisma throws if record not found
      throw new NotFoundException('User not found');
    }
  }

  async deleteUser(id: string): Promise<void> {
    // Soft delete
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async setUserRoles(userId: string, roleIds: string[]): Promise<UserDto> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { roles: { set: roleIds.map((id) => ({ id })) } },
      include: this.userInclude(),
    });
    return this.toUserDto(user as any);
  }

  async setUserLocations(userId: string, locationIds: string[]): Promise<UserDto> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { locations: { set: locationIds.map((id) => ({ id })) } },
      include: this.userInclude(),
    });
    return this.toUserDto(user as any);
  }

  async changePassword(
    userId: string,
    dto: { currentPassword: string; newPassword: string },
    currentUser: { id: string; roles?: string[] },
  ) {
    if (currentUser.id !== userId && !(currentUser.roles || []).includes('system_admin')) {
      throw new ForbiddenException('Insufficient permissions to change password for this user');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // If user is changing their own password, require current password match
    if (currentUser.id === userId) {
      const matched = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!matched) {
        throw new BadRequestException('Current password is incorrect');
      }
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
  }

  async adminResetPassword(userId: string, dto: { newPassword: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
  }

  // Add role to user
  async addRoleToUser(userId: string, roleId: string): Promise<UserDto> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          connect: { id: roleId },
        },
      },
      include: this.userInclude(),
    });
    return this.toUserDto(user as any);
  }

  // Remove role from user
  async removeRoleFromUser(userId: string, roleId: string): Promise<UserDto> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          disconnect: { id: roleId },
        },
      },
      include: this.userInclude(),
    });
    return this.toUserDto(user as any);
  }

  // Get user permissions
  async getUserPermissions(userId: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        permissions: {
          include: {
            user: false,
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    // Aggregate permissions from all user permissions
    const allModules = new Set<string>();
    for (const perm of user.permissions) {
      const modules = Array.isArray(perm.modules) ? perm.modules : JSON.parse(String(perm.modules || '[]'));
      modules.forEach((m: string) => allModules.add(m));
    }

    // Build permission map based on roles and modules
    const permissions: Record<string, boolean> = {
      canCreatePlants: allModules.has('cultivation'),
      canEditInventory: allModules.has('inventory'),
      canViewReports: allModules.has('reporting'),
      canManageUsers: user.roles.some((r) => r.name === 'system_admin'),
      canManageSales: allModules.has('sales'),
      canManageTransfers: allModules.has('transfers'),
    };

    return {
      userId: user.id,
      permissions,
      roles: user.roles.map((r) => r.name),
      modules: Array.from(allModules),
    };
  }

  // Set accessible UBIs for user
  async setAccessibleUbis(userId: string, ubis: string[]): Promise<UserDto> {
    // Find locations matching the UBIs
    const locations = await this.prisma.location.findMany({
      where: {
        ubi: { in: ubis },
        deletedAt: null,
      },
    });

    if (locations.length !== ubis.length) {
      throw new BadRequestException('One or more UBIs not found');
    }

    // Update user's locations
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        locations: {
          set: locations.map((l) => ({ id: l.id })),
        },
      },
      include: this.userInclude(),
    });

    return this.toUserDto(user as any);
  }

  // Get users by type
  async getUsersByType(userType: 'Admin' | 'State' | 'Licensee', filters: ListFilters = {}) {
    const { page = 1, perPage = 25 } = filters;
    const sanitizedPage = Math.max(1, Math.floor(page));
    const sanitizedPerPage = Math.min(200, Math.max(1, Math.floor(perPage)));

    // Map user type to role names
    let roleFilter: string | undefined;
    if (userType === 'Admin') {
      roleFilter = 'system_admin';
    } else if (userType === 'State') {
      roleFilter = 'state_user';
    } else {
      roleFilter = 'licensee_user';
    }

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      roles: { some: { name: roleFilter } },
    };

    const total = await this.prisma.user.count({ where });
    const users = await this.prisma.user.findMany({
      where,
      include: this.userInclude(),
      skip: (sanitizedPage - 1) * sanitizedPerPage,
      take: sanitizedPerPage,
      orderBy: { createdAt: 'desc' },
    });

    return {
      items: users.map((u) => this.toUserDto(u)),
      total,
      page: sanitizedPage,
      perPage: sanitizedPerPage,
    };
  }
}