import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService /*, inject your user repo/service here */) {}

  // Validate user credentials and optional UBI
  async validateUser(email: string, password: string, ubi?: string): Promise<any | null> {
    // TODO: Fetch user by email
    const user = await this.findUserByEmail(email);
    if (!user) return null;

    // TODO: Verify password (hash compare)
    const passwordValid = await this.verifyPassword(password, user.passwordHash);
    if (!passwordValid) return null;

    // If user is licensee or lab user, UBI is required and must be valid
    if (this.isLicenseeOrLabUser(user)) {
      if (!ubi) return null;
      const validUbi = await this.validateUbiForUser(user, ubi);
      if (!validUbi) return null;
    }

    // Additional checks (e.g., user active status) can be added here

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
    // TODO: Implement DB lookup by userId
    return null;
  }

  // Find user by email
  async findUserByEmail(email: string): Promise<any | null> {
    // TODO: Implement DB lookup by email
    return null;
  }

  // Validate that the UBI belongs to the user (for licensee or state users)
  async validateUbiForUser(user: any, ubi: string): Promise<boolean> {
    // TODO: Implement check that user has access to the given UBI
    return true;
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
    // TODO: Use bcrypt or similar
    return plain === hash;
  }
}