import {
  Controller,
  Post,
  Get,
  Body,
  UnauthorizedException,
  BadRequestException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { StateUserLoginDto } from './dto/state-user-login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { UserPermissionsDto } from './dto/user-permissions.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Unified Login Endpoint
   * Authenticates user with email/password and returns JWT token with user info
   * No UBI required at login - access control is determined by user role
   */
  @Post('login')
  @ApiOperation({
    summary: 'Unified login for all user types (Admin, State, Licensee)',
    description: 'Authenticate with email and password. Returns JWT token with user type and accessible modules.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Authentication successful, token and user info returned',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid',
          email: 'user@example.com',
          name: 'User Name',
          userType: 'licensee',
          roles: ['licensee_admin'],
          modules: ['cultivation', 'inventory', 'pos'],
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Body() body: LoginDto) {
    const { email, password } = body;

    // Validate credentials
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.authService.updateLastLogin(user.id);

    // Issue JWT token
    const accessToken = await this.authService.issueToken(user);
    
    // Get user type and accessible modules
    const userType = this.authService.getUserType(user);
    const modules = this.authService.getAccessibleModules(user);
    const roleNames = user.roles?.map((r: any) => r.name) || [];

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType,
        roles: roleNames,
        modules,
      },
    };
  }

  /**
   * State User Login (Deprecated - use unified /auth/login instead)
   * Kept for backwards compatibility
   */
  @Post('login/state-user')
  @ApiOperation({
    summary: 'State user login (DEPRECATED - use /auth/login)',
    deprecated: true,
  })
  @ApiBody({ type: StateUserLoginDto })
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'State user authentication successful',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async stateUserLogin(@Body() body: StateUserLoginDto): Promise<AuthResponseDto> {
    const { email, password } = body;

    const user = await this.authService.validateStateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials or insufficient permissions');
    }

    // Issue token
    const token = await this.authService.issueToken(user);

    return { accessToken: token };
  }

  /**
   * Admin Login (Deprecated - use unified /auth/login instead)
   * Kept for backwards compatibility
   */
  @Post('login/admin')
  @ApiOperation({
    summary: 'Admin login (DEPRECATED - use /auth/login)',
    deprecated: true,
  })
  @ApiBody({ type: AdminLoginDto })
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'Admin authentication successful',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async adminLogin(@Body() body: AdminLoginDto): Promise<AuthResponseDto> {
    const { email, password } = body;

    const user = await this.authService.validateAdmin(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials or insufficient permissions');
    }

    // Issue token
    const token = await this.authService.issueToken(user);

    return { accessToken: token };
  }

  /**
   * Get User Permissions
   */
  @Get('permissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user permissions based on role and context',
  })
  @ApiOkResponse({
    type: UserPermissionsDto,
    description: 'User permissions retrieved successfully',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async getPermissions(@Request() req): Promise<UserPermissionsDto> {
    const userId = req.user?.sub || req.user?.id;
    
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    return this.authService.getUserPermissions(userId);
  }
}