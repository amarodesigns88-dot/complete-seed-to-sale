import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { StateUserManagementService } from './state-user-management.service';
import {
  CreateStateUserDto,
  UpdateStateUserDto,
  StateUserFilterDto,
  StateUserPermissionsDto,
} from './dto/state-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('State User Management')
@Controller('state-user-management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class StateUserManagementController {
  constructor(private readonly stateUserService: StateUserManagementService) {}

  @Post('users')
  @Roles('STATE_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Create a new state user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'State user created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'User already exists' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async createStateUser(@Body() dto: CreateStateUserDto) {
    return this.stateUserService.createStateUser(dto);
  }

  @Get('users')
  @Roles('STATE_ADMIN', 'STATE_USER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'List state users with filtering and pagination' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of state users retrieved successfully' })
  async listStateUsers(@Query() filters: StateUserFilterDto) {
    return this.stateUserService.listStateUsers(filters);
  }

  @Get('users/:userId')
  @Roles('STATE_ADMIN', 'STATE_USER', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Get a specific state user by ID' })
  @ApiParam({ name: 'userId', description: 'State user ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'State user retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'State user not found' })
  async getStateUser(@Param('userId') userId: string) {
    return this.stateUserService.getStateUser(userId);
  }

  @Put('users/:userId')
  @Roles('STATE_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Update a state user' })
  @ApiParam({ name: 'userId', description: 'State user ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'State user updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'State user not found' })
  async updateStateUser(
    @Param('userId') userId: string,
    @Body() dto: UpdateStateUserDto,
  ) {
    return this.stateUserService.updateStateUser(userId, dto);
  }

  @Delete('users/:userId')
  @Roles('STATE_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Delete a state user (soft delete)' })
  @ApiParam({ name: 'userId', description: 'State user ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'State user deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'State user not found' })
  async deleteStateUser(@Param('userId') userId: string) {
    return this.stateUserService.deleteStateUser(userId);
  }

  @Post('users/:userId/permissions')
  @Roles('STATE_ADMIN', 'SYSTEM_ADMIN')
  @ApiOperation({ summary: 'Set permissions for a state user' })
  @ApiParam({ name: 'userId', description: 'State user ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Permissions set successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'State user not found' })
  async setStateUserPermissions(
    @Param('userId') userId: string,
    @Body() dto: StateUserPermissionsDto,
  ) {
    return this.stateUserService.setStateUserPermissions(userId, dto);
  }
}
