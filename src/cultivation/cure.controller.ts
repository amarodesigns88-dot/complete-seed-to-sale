import { Controller, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { CureService } from './cure.service';
import { CreateCureDto } from './dto/create-cure.dto';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

// Optional: Uncomment and import your AuthGuard (JWT) if you want request user context / auth protection
// import { AuthGuard } from '../auth/auth.guard';

@ApiTags('Cultivation — Cure')
@Controller('cultivation/:ubi/plants/:plantId')
export class CureController {
  constructor(private readonly cureService: CureService) {}

  @Post('cure')
  // @UseGuards(AuthGuard) // <-- uncomment to enable JWT/auth guard
  @ApiOperation({ summary: 'Create a cure record for a plant (move from harvest -> cure workflow)' })
  @ApiParam({
    name: 'ubi',
    required: true,
    description: 'Location UBI (parent location identifier)',
    schema: { type: 'string' },
  })
  @ApiParam({
    name: 'plantId',
    required: true,
    description: 'UUID of the plant to cure',
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiBody({ type: CreateCureDto })
  @ApiCreatedResponse({ description: 'Cure record created successfully', type: Object })
  @ApiBadRequestResponse({ description: 'Invalid payload or constraint violation' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async curePlant(
    @Param('ubi') ubi: string,
    @Param('plantId') plantId: string,
    @Body() payload: CreateCureDto,
    @Req() req?: any,
  ): Promise<any> {
    // Prefer extracting userId from the authenticated request. Fallback to 'system' for automated runs.
    const userId = req?.user?.id ?? 'system';
    return this.cureService.curePlant(ubi, plantId, payload, userId);
  }
}