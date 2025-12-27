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

  // Validate user credentials (no UBI required at login)
  async validateUser(email: string, password: string): Promise<any | null> {
    // Fetch user by email with roles and locations
    const user = await this.findUserByEmail(email);
    if (!user || user.deletedAt || !user.isActive) return null;

    // Verify password (hash compare)
    const passwordValid = await this.verifyPassword(password, user.passwordHash);
    if (!passwordValid) return null;

    return user;
  }

  // Determine user type based on roles
  getUserType(user: any): 'admin' | 'state' | 'licensee' {
    const roleNames = user.roles?.map((r: any) => r.name) || [];
    
    // Check for admin roles
    if (roleNames.some((r: string) => r === 'admin' || r === 'system_admin')) {
      return 'admin';
    }
    
    // Check for state roles
    if (roleNames.some((r: string) => r.startsWith('state_'))) {
      return 'state';
    }
    
    // Default to licensee (includes licensee_admin, licensee_manager, licensee_grower, etc.)
    return 'licensee';
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

  // Issue JWT token with user info and type
  async issueToken(user: any): Promise<string> {
    const userType = this.getUserType(user);
    const roleNames = user.roles?.map((r: any) => r.name) || [];
    
    // Get user's location (for licensee users, they're scoped to their parentLocation)
    const locationId = user.parentLocationId || null;
    const location = locationId ? await this.prisma.location.findUnique({ where: { id: locationId } }) : null;
    
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      userType,
      roles: roleNames,
      locationId,
      ubi: location?.ubi || null,
    };

    return this.jwtService.signAsync(payload);
  }

  // Get accessible modules for user based on type
  getAccessibleModules(user: any): string[] {
    const userType = this.getUserType(user);
    
    // Admin users have access to all modules
    if (userType === 'admin') {
      return ['dashboard', 'cultivation', 'inventory', 'lab', 'pos', 'reporting', 'compliance', 'state-dashboard', 'state-reporting'];
    }
    
    // State users have access to state and licensee modules (with UBI context when needed)
    if (userType === 'state') {
      return ['state-dashboard', 'state-reporting', 'compliance', 'licensee-view'];
    }
    
    // Licensee users have access based on their location's enabled modules
    const enabledModules = user.parentLocation?.enabledModules || [];
    return Array.isArray(enabledModules) ? enabledModules : JSON.parse(enabledModules || '[]');
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
    const userType = this.getUserType(user);
    
    // Get accessible modules
    const modules = this.getAccessibleModules(user);
    
    // For licensee users, they are scoped to their parentLocation
    const locationId = user.parentLocationId;
    const location = locationId ? await this.prisma.location.findUnique({ where: { id: locationId } }) : null;
    
    return {
      userId: user.id,
      userType,
      locationId,
      ubi: location?.ubi || null,
      roles: roleNames,
      modules,
      canAccessAllLocations: userType === 'admin', // Admins can see all locations
      requiresUbiForLicenseeData: userType === 'state', // State users need UBI context for licensee data
    };
  }

  // Update user's last login timestamp
  async updateLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
  }

  // Determine user type from roles (kept for backwards compatibility)
  private determineUserType(roles: string[]): 'Admin' | 'State' | 'Licensee' {
    if (roles.some((r: string) => r === 'admin' || r === 'system_admin')) return 'Admin';
    if (roles.some((r: string) => r.startsWith('state_'))) return 'State';
    return 'Licensee';
  }

  // Check if user has read-only access
  private isReadOnlyUser(roles: string[]): boolean {
    // State users have read-only access to licensee data
    return roles.some((r: string) => r.startsWith('state_'));
  }

  // Validate State User authentication (deprecated - kept for backwards compatibility)
  async validateStateUser(email: string, password: string): Promise<any> {
    const user = await this.validateUser(email, password);
    if (!user) return null;
    
    const userType = this.getUserType(user);
    if (userType !== 'state') {
      return null; // Not a state user
    }
    
    return user;
  }

  // Validate Admin authentication (deprecated - kept for backwards compatibility)
  async validateAdmin(email: string, password: string, licenseNumber?: string): Promise<any> {
    const user = await this.validateUser(email, password);
    if (!user) return null;
    
    const userType = this.getUserType(user);
    if (userType !== 'admin') {
      return null; // Not an admin
    }
    
    return user;
  }
}