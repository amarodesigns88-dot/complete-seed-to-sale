import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  // Validate user credentials and optional UBI
  async validateUser(email: string, password: string, ubi?: string): Promise<any | null> {
    // Fetch user by email with roles and locations
    const user = await this.findUserByEmail(email);
    if (!user || user.deletedAt || !user.isActive) return null;

    // Verify password (hash compare)
    const passwordValid = await this.verifyPassword(password, user.passwordHash);
    if (!passwordValid) return null;

    // If user is licensee or lab user, UBI is required and must be valid
    if (this.isLicenseeOrLabUser(user)) {
      if (!ubi) return null;
      const validUbi = await this.validateUbiForUser(user, ubi);
      if (!validUbi) return null;
    }

    return user;
  }

  // Return allowed interfaces for the user based on roles
  getAllowedInterfaces(user: any): string[] {
    const roles = user.roles || [];

    const interfaces = new Set<string>();

    if (roles.includes('system_admin')) {
      interfaces.add('admin');
      interfaces.add('state');
      interfaces.add('licensee');
    } else if (roles.includes('state_user')) {
      interfaces.add('state');
      interfaces.add('licensee');
    } else if (roles.includes('licensee_user') || roles.includes('lab_user')) {
      interfaces.add('licensee');
    }

    return Array.from(interfaces);
  }

  // Find user by ID
  async findUserById(userId: string): Promise<any | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        locations: true,
        permissions: true,
      },
    });
    
    if (!user || user.deletedAt) return null;
    return user;
  }

  // Find user by email
  async findUserByEmail(email: string): Promise<any | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: true,
        locations: true,
        permissions: true,
      },
    });
    
    if (!user || user.deletedAt) return null;
    return user;
  }

  // Validate that the UBI belongs to the user (for licensee or state users)
  async validateUbiForUser(user: any, ubi: string): Promise<boolean> {
    // Check if user has access to the given UBI through their locations
    if (!user.locations || user.locations.length === 0) return false;
    
    return user.locations.some((location: any) => location.ubi === ubi);
  }

  // Check if user is licensee or lab user
  isLicenseeOrLabUser(user: any): boolean {
    const roles = user.roles || [];
    return roles.includes('licensee_user') || roles.includes('lab_user');
  }

  // Issue JWT token scoped to interface and UBI
  async issueToken(user: any, interfaceSelection: string, ubi?: string): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      interface: interfaceSelection,
      ubi: ubi || null,
    };

    return this.jwtService.signAsync(payload);
  }

  // Dummy password verification (replace with real hash compare)
  private async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  // Get user permissions based on roles and user type
  async getUserPermissions(userId: string): Promise<any> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const roleNames = user.roles?.map((r: any) => r.name) || [];
    const userType = this.determineUserType(roleNames);
    const isReadOnly = this.isReadOnlyUser(roleNames);
    
    // Get accessible UBIs
    const accessibleUbis = user.locations?.map((l: any) => l.ubi).filter(Boolean) || [];
    
    // Get accessible modules from user permissions
    const modules = new Set<string>();
    if (user.permissions && user.permissions.length > 0) {
      for (const perm of user.permissions) {
        const permModules = Array.isArray(perm.modules) ? perm.modules : JSON.parse(perm.modules || '[]');
        permModules.forEach((m: string) => modules.add(m));
      }
    }
    
    return {
      userId: user.id,
      userType,
      accessibleUbis,
      roles: roleNames,
      modules: Array.from(modules),
      isReadOnly,
    };
  }

  // Determine user type from roles
  private determineUserType(roles: string[]): 'Admin' | 'State' | 'Licensee' {
    if (roles.includes('system_admin')) return 'Admin';
    if (roles.includes('state_user')) return 'State';
    return 'Licensee';
  }

  // Check if user has read-only access (Admin and State users accessing licensee data)
  private isReadOnlyUser(roles: string[]): boolean {
    return roles.includes('system_admin') || roles.includes('state_user');
  }

  // Validate State User authentication
  async validateStateUser(email: string, password: string): Promise<any> {
    const user = await this.validateUser(email, password);
    if (!user) return null;
    
    const roleNames = user.roles?.map((r: any) => r.name) || [];
    if (!roleNames.includes('state_user')) {
      return null; // Not a state user
    }
    
    return user;
  }

  // Validate Admin authentication
  async validateAdmin(email: string, password: string, licenseNumber?: string): Promise<any> {
    const user = await this.validateUser(email, password);
    if (!user) return null;
    
    const roleNames = user.roles?.map((r: any) => r.name) || [];
    if (!roleNames.includes('system_admin')) {
      return null; // Not an admin
    }
    
    // If license number provided, validate access
    if (licenseNumber) {
      const location = await this.prisma.location.findUnique({
        where: { licenseNumber },
      });
      
      if (!location) {
        return null; // Invalid license number
      }
    }
    
    return user;
  }
}