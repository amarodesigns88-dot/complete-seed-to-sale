import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransferService } from './transfer.service';
import {
  CreateTransferDto,
  ReceiveTransferDto,
  RegisterDriverDto,
  RegisterVehicleDto,
  TransferFilterDto,
} from './dto/transfer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Transfer')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transfer/:locationId')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post('transfers')
  @ApiOperation({ summary: 'Create transfer manifest' })
  async createTransfer(
    @Param('locationId') locationId: string,
    @Body() createTransferDto: CreateTransferDto,
  ) {
    return this.transferService.createTransfer(locationId, createTransferDto);
  }

  @Get('transfers')
  @ApiOperation({ summary: 'List all transfers' })
  async getTransfers(
    @Param('locationId') locationId: string,
    @Query() filters: TransferFilterDto,
  ) {
    return this.transferService.getTransfers(locationId, filters);
  }

  @Get('transfers/pending')
  @ApiOperation({ summary: 'Get pending transfers' })
  async getPendingTransfers(@Param('locationId') locationId: string) {
    return this.transferService.getPendingTransfers(locationId);
  }

  @Get('transfers/overdue')
  @ApiOperation({ summary: 'Get overdue transfers' })
  async getOverdueTransfers(@Param('locationId') locationId: string) {
    return this.transferService.getOverdueTransfers(locationId);
  }

  @Get('transfers/:transferId')
  @ApiOperation({ summary: 'Get transfer details' })
  async getTransfer(
    @Param('locationId') locationId: string,
    @Param('transferId') transferId: string,
  ) {
    return this.transferService.getTransfer(locationId, transferId);
  }

  @Post('transfers/:transferId/receive')
  @ApiOperation({ summary: 'Receive incoming transfer' })
  async receiveTransfer(
    @Param('locationId') locationId: string,
    @Param('transferId') transferId: string,
    @Body() receiveTransferDto: ReceiveTransferDto,
  ) {
    return this.transferService.receiveTransfer(
      locationId,
      transferId,
      receiveTransferDto,
    );
  }

  @Post('drivers')
  @ApiOperation({ summary: 'Register driver' })
  async registerDriver(
    @Param('locationId') locationId: string,
    @Body() registerDriverDto: RegisterDriverDto,
  ) {
    return this.transferService.registerDriver(locationId, registerDriverDto);
  }

  @Get('drivers')
  @ApiOperation({ summary: 'Get drivers list' })
  async getDrivers(@Param('locationId') locationId: string) {
    return this.transferService.getDrivers(locationId);
  }

  @Post('vehicles')
  @ApiOperation({ summary: 'Register vehicle' })
  async registerVehicle(
    @Param('locationId') locationId: string,
    @Body() registerVehicleDto: RegisterVehicleDto,
  ) {
    return this.transferService.registerVehicle(locationId, registerVehicleDto);
  }

  @Get('vehicles')
  @ApiOperation({ summary: 'Get vehicles list' })
  async getVehicles(@Param('locationId') locationId: string) {
    return this.transferService.getVehicles(locationId);
  }
}
