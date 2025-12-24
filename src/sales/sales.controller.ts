import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { LocationModuleGuard } from '../auth/location.guard';
import { Roles } from '../auth/roles.decorator';
import { LocationModulePermissions } from '../auth/location.decorator';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CreateRefundDto } from './dto/create-refund.dto';
import { CreateCustomerDto } from './dto/create-customer.dto';

@ApiTags('Sales & POS')
@ApiBearerAuth()
@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard, LocationModuleGuard)
export class SalesController {
  constructor(private salesService: SalesService) {}

  // ===== Sales Endpoints =====

  @Post(':locationId/sales')
  @Roles('licensee_admin')
  @LocationModulePermissions(['pos', 'sales'])
  @ApiOperation({ summary: 'Create a new sale transaction' })
  @ApiParam({ name: 'locationId', description: 'Location UUID' })
  @ApiBody({ type: CreateSaleDto })
  @ApiResponse({ status: 201, description: 'Sale created successfully' })
  async createSale(
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @Body() dto: CreateSaleDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId ?? req.user?.id ?? null;
    return this.salesService.createSale(locationId, dto, userId);
  }

  @Get(':locationId/sales')
  @Roles('licensee_admin')
  @LocationModulePermissions(['pos', 'sales'])
  @ApiOperation({ summary: 'Get all sales for a location' })
  @ApiParam({ name: 'locationId', description: 'Location UUID' })
  @ApiResponse({ status: 200, description: 'List of sales returned' })
  async getSales(@Param('locationId', ParseUUIDPipe) locationId: string) {
    return this.salesService.getSales(locationId);
  }

  @Get(':locationId/sales/:saleId')
  @Roles('licensee_admin')
  @LocationModulePermissions(['pos', 'sales'])
  @ApiOperation({ summary: 'Get a specific sale by ID' })
  @ApiParam({ name: 'locationId', description: 'Location UUID' })
  @ApiParam({ name: 'saleId', description: 'Sale UUID' })
  @ApiResponse({ status: 200, description: 'Sale details returned' })
  async getSale(
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @Param('saleId', ParseUUIDPipe) saleId: string,
  ) {
    return this.salesService.getSaleById(saleId);
  }

  @Post(':locationId/sales/:saleId/void')
  @Roles('licensee_admin')
  @LocationModulePermissions(['pos', 'sales'])
  @ApiOperation({ summary: 'Void a sale and restore inventory' })
  @ApiParam({ name: 'locationId', description: 'Location UUID' })
  @ApiParam({ name: 'saleId', description: 'Sale UUID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string' },
      },
      required: ['reason'],
    },
  })
  @ApiResponse({ status: 200, description: 'Sale voided successfully' })
  async voidSale(
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @Param('saleId', ParseUUIDPipe) saleId: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ) {
    const userId = req.user?.userId ?? req.user?.id ?? null;
    return this.salesService.voidSale(saleId, body.reason, userId);
  }

  // ===== Refund Endpoints =====

  @Post(':locationId/refunds')
  @Roles('licensee_admin')
  @LocationModulePermissions(['pos', 'sales'])
  @ApiOperation({ summary: 'Create a refund for a sale' })
  @ApiParam({ name: 'locationId', description: 'Location UUID' })
  @ApiBody({ type: CreateRefundDto })
  @ApiResponse({ status: 201, description: 'Refund created successfully' })
  async createRefund(
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @Body() dto: CreateRefundDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId ?? req.user?.id ?? null;
    return this.salesService.createRefund(dto, userId);
  }

  // ===== Customer Endpoints =====

  @Post(':locationId/customers')
  @Roles('licensee_admin')
  @LocationModulePermissions(['pos', 'sales'])
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiParam({ name: 'locationId', description: 'Location UUID' })
  @ApiBody({ type: CreateCustomerDto })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  async createCustomer(
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.salesService.createCustomer(dto);
  }

  @Get(':locationId/customers')
  @Roles('licensee_admin')
  @LocationModulePermissions(['pos', 'sales'])
  @ApiOperation({ summary: 'Get all customers' })
  @ApiParam({ name: 'locationId', description: 'Location UUID' })
  @ApiResponse({ status: 200, description: 'List of customers returned' })
  async getCustomers(@Param('locationId', ParseUUIDPipe) locationId: string) {
    return this.salesService.getCustomers();
  }

  @Get(':locationId/customers/:customerId')
  @Roles('licensee_admin')
  @LocationModulePermissions(['pos', 'sales'])
  @ApiOperation({ summary: 'Get a specific customer by ID' })
  @ApiParam({ name: 'locationId', description: 'Location UUID' })
  @ApiParam({ name: 'customerId', description: 'Customer UUID' })
  @ApiResponse({ status: 200, description: 'Customer details returned' })
  async getCustomer(
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ) {
    return this.salesService.getCustomerById(customerId);
  }

  // ===== Inventory for POS =====

  @Get(':locationId/available-inventory')
  @Roles('licensee_admin')
  @LocationModulePermissions(['pos', 'sales'])
  @ApiOperation({ summary: 'Get available inventory for sale' })
  @ApiParam({ name: 'locationId', description: 'Location UUID' })
  @ApiResponse({ status: 200, description: 'Available inventory items returned' })
  async getAvailableInventory(@Param('locationId', ParseUUIDPipe) locationId: string) {
    return this.salesService.getAvailableInventory(locationId);
  }
}
