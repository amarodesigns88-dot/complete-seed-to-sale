import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Step 1: Authenticate user credentials (and optional UBI).
   * Returns allowed interfaces for the user.
   */
  @Post('login')
  @ApiOperation({
    summary:
      'Authenticate user credentials and return allowed interfaces for selection',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Authentication successful, interfaces returned',
    schema: {
      example: {
        userId: 'uuid',
        email: 'user@example.com',
        allowedInterfaces: ['licensee', 'state', 'admin'],
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials or UBI' })
  async login(@Body() body: LoginDto) {
    const { email, password, ubi } = body;

    // Validate credentials and UBI if required
    const user = await this.authService.validateUser(email, password, ubi);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials or UBI');
    }

    // Determine allowed interfaces for this user
    const allowedInterfaces = this.authService.getAllowedInterfaces(user);

    return {
      userId: user.id,
      email: user.email,
      allowedInterfaces,
    };
  }

  /**
   * Step 2: User selects interface to access.
   * Returns JWT token scoped to selected interface and UBI.
   */
  @Post('select-interface')
  @ApiOperation({
    summary:
      'Select interface to access and receive JWT token scoped to interface and UBI',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string', format: 'uuid' },
        interfaceSelection: {
          type: 'string',
          enum: ['licensee', 'state', 'admin'],
        },
        ubi: { type: 'string', nullable: true },
      },
      required: ['userId', 'interfaceSelection'],
    },
  })
  @ApiOkResponse({
    type: AuthResponseDto,
    description: 'JWT token issued for selected interface',
  })
  @ApiBadRequestResponse({
    description:
      'Invalid interface selection or missing required parameters',
  })
  async selectInterface(@Body() body: { userId: string; interfaceSelection: string; ubi?: string }): Promise<AuthResponseDto> {
    const { userId, interfaceSelection, ubi } = body;

    if (!userId || !interfaceSelection) {
      throw new BadRequestException('userId and interfaceSelection are required');
    }

    // Fetch user by ID
    const user = await this.authService.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify user is allowed to access the selected interface
    const allowedInterfaces = this.authService.getAllowedInterfaces(user);
    if (!allowedInterfaces.includes(interfaceSelection)) {
      throw new UnauthorizedException('User not authorized for selected interface');
    }

    // If interface requires UBI, validate it
    if (['licensee', 'state'].includes(interfaceSelection)) {
      if (!ubi) {
        throw new BadRequestException('UBI is required for selected interface');
      }
      const isValidUbi = await this.authService.validateUbiForUser(user, ubi);
      if (!isValidUbi) {
        throw new UnauthorizedException('Invalid UBI for user');
      }
    }

    // Issue JWT token scoped to interface and UBI
    const token = await this.authService.issueToken(user, interfaceSelection, ubi);

    return { accessToken: token };
  }
}