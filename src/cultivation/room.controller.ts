import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { CultivationService } from './cultivation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { LocationModuleGuard } from '../auth/location.guard';
import { Roles } from '../auth/roles.decorator';
import { LocationModulePermissions } from '../auth/location.decorator';
import { CreateRoomDto } from './dto/create-room.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

@ApiTags('Cultivation — Rooms')
@ApiBearerAuth()
@Controller('cultivation')
@UseGuards(JwtAuthGuard, RolesGuard, LocationModuleGuard)
export class RoomController {
  constructor(private cultivationService: CultivationService) {}

  @Post(':locationId/rooms')
  @Roles('licensee_admin')
  @LocationModulePermissions(['cultivation'])
  @ApiOperation({ summary: 'Create a new cultivation room for a location' })
  @ApiParam({
    name: 'locationId',
    required: true,
    description: 'UUID of the location (license) where the room will be created',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiBody({ type: CreateRoomDto })
  @ApiCreatedResponse({ description: 'Room created successfully', type: Object })
  @ApiBadRequestResponse({ description: 'Invalid input or missing room name' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Insufficient role or module permission' })
  async createRoom(
    @Param('locationId') locationId: string,
    @Body() dto: CreateRoomDto,
    @Req() req: any,
  ): Promise<any> {
    if (!dto?.name) {
      throw new BadRequestException('Room name is required');
    }

    // Use the authenticated user id (adjust property according to your auth payload)
    const userId = req?.user?.userId ?? req?.user?.id ?? 'system';
    return this.cultivationService.createRoom(locationId, dto.name, userId);
  }

  @Get(':locationId/rooms')
  @Roles('licensee_admin')
  @LocationModulePermissions(['cultivation'])
  @ApiOperation({ summary: 'List cultivation rooms for a location' })
  @ApiParam({
    name: 'locationId',
    required: true,
    description: 'UUID of the location to list rooms for',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiOkResponse({ description: 'List of rooms returned', type: [Object] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Insufficient role or module permission' })
  async listRooms(@Param('locationId') locationId: string): Promise<any> {
    return this.cultivationService.listRooms(locationId);
  }
}