import {
  Controller,
  UseGuards,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../auth/get-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RoleAssignmentDto } from './dto/role-assignment.dto';
import { LocationAssignmentDto } from './dto/location-assignment.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserDto } from './dto/user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiOkResponse({ type: UserDto })
  async getProfile(@GetUser() user: UserDto): Promise<UserDto> {
    // returns enriched profile (roles, locationIds)
    return this.userService.getProfile(user.id);
  }

  @UseGuards(RolesGuard)
  @Roles('system_admin', 'state_user')
  @Get()
  @ApiOperation({ summary: 'List users' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'perPage', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'locationId', required: false })
  @ApiQuery({ name: 'search', required: false })
  async listUsers(
    @Query('page') page = '1',
    @Query('perPage') perPage = '25',
    @Query('role') role?: string,
    @Query('locationId') locationId?: string,
    @Query('search') search?: string,
  ) {
    const p = Math.max(1, parseInt(page as string, 10) || 1);
    const pp = Math.min(200, Math.max(1, parseInt(perPage as string, 10) || 25));

    return this.userService.listUsers({ page: p, perPage: pp, role, locationId, search });
  }

  @UseGuards(RolesGuard)
  @Roles('system_admin', 'state_user')
  @Get(':id')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiOkResponse({ type: UserDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.getUserById(id);
  }

  @UseGuards(RolesGuard)
  @Roles('system_admin')
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiCreatedResponse({ type: UserDto })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @UseGuards(RolesGuard)
  @Roles('system_admin')
  @Put(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiOkResponse({ type: UserDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  async updateUser(@Param('id', ParseUUIDPipe) id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @UseGuards(RolesGuard)
  @Roles('system_admin')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete (deactivate) a user' })
  @ApiNoContentResponse()
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    await this.userService.deleteUser(id);
  }

  @UseGuards(RolesGuard)
  @Roles('system_admin')
  @Put(':id/roles')
  @ApiOperation({ summary: "Replace the user's assigned roles" })
  @ApiOkResponse({ type: UserDto })
  async setUserRoles(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RoleAssignmentDto) {
    return this.userService.setUserRoles(id, dto.roleIds);
  }

  @UseGuards(RolesGuard)
  @Roles('system_admin')
  @Put(':id/locations')
  @ApiOperation({ summary: "Replace the user's assigned locations" })
  @ApiOkResponse({ type: UserDto })
  async setUserLocations(@Param('id', ParseUUIDPipe) id: string, @Body() dto: LocationAssignmentDto) {
    return this.userService.setUserLocations(id, dto.locationIds);
  }

  @UseGuards(RolesGuard)
  @Roles('system_admin', 'state_user', 'licensee_admin')
  @Post(':id/change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Change password (user or allowed admin)' })
  @ApiNoContentResponse()
  async changePassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangePasswordDto,
    @GetUser() currentUser: UserDto,
  ) {
    await this.userService.changePassword(id, { currentPassword: dto.currentPassword, newPassword: dto.newPassword }, currentUser);
  }

  @UseGuards(RolesGuard)
  @Roles('system_admin')
  @Post(':id/reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Admin reset password' })
  @ApiNoContentResponse()
  async adminResetPassword(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ResetPasswordDto) {
    await this.userService.adminResetPassword(id, dto);
  }
}