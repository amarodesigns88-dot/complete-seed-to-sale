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
import { CreateEnhancedSaleDto } from './dto/create-sale-enhanced.dto';
import { CreateLoyaltyProgramDto, UpdateCustomerLoyaltyDto } from './dto/create-loyalty-program.dto';
import { CustomizeProductDto, BulkDiscountDto } from './dto/customize-product.dto';

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

  // ===== ENHANCED SALES/POS ENDPOINTS =====

  @Post(':locationId/sales/enhanced')
  @Roles('licensee_admin')
  @LocationModulePermissions(['pos', 'sales'])
  @ApiOperation({
    summary: 'Create an enhanced sale with sale type support (Regular, Pickup, Delivery)',
  })
  @ApiParam({ name: 'locationId', description: 'Location UUID' })
  @ApiBody({ type: CreateEnhancedSaleDto })
  @ApiResponse({
    status: 201,
    description: 'Enhanced sale created successfully with sale type support',
  })
  async createEnhancedSale(
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @Body() dto: CreateEnhancedSaleDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId ?? req.user?.id ?? null;
    return this.salesService.createEnhancedSale(locationId, dto, userId);
  }

  // ===== Loyalty Program Endpoints =====

  @Post(':locationId/loyalty-programs')
  @Roles('licensee_admin')
  @LocationModulePermissions(['pos', 'sales'])
  @ApiOperation({ summary: 'Create a loyalty program' })
  @ApiParam({ name: 'locationId', description: 'Location UUID' })
  @ApiBody({ type: CreateLoyaltyProgramDto })
  @ApiResponse({ status: 201, description: 'Loyalty program created successfully' })
  async createLoyaltyProgram(
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @Body() dto: CreateLoyaltyProgramDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId ?? req.user?.id ?? null;
    return this.salesService.createLoyaltyProgram(locationId, dto, userId);
  }

  @Get(':locationId/loyalty-programs')
  @Roles('licensee_admin')
  @LocationModulePermissions(['pos', 'sales'])
  @ApiOperation({ summary: 'Get all loyalty programs for a location' })
  @ApiParam({ name: 'locationId', description: 'Location UUID' })
  @ApiResponse({ status: 200, description: 'List of loyalty programs returned' })
  async getLoyaltyPrograms(@Param('locationId', ParseUUIDPipe) locationId: string) {
    return this.salesService.getLoyaltyPrograms(locationId);
  }

  @Post(':locationId/customers/:customerId/loyalty')
  @Roles('licensee_admin')
  @LocationModulePermissions(['pos', 'sales'])
  @ApiOperation({ summary: 'Update customer loyalty points' })
  @ApiParam({ name: 'locationId', description: 'Location UUID' })
  @ApiParam({ name: 'customerId', description: 'Customer UUID' })
  @ApiBody({ type: UpdateCustomerLoyaltyDto })
  @ApiResponse({ status: 200, description: 'Customer loyalty updated successfully' })
  async updateCustomerLoyalty(
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() dto: UpdateCustomerLoyaltyDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId ?? req.user?.id ?? null;
    return this.salesService.updateCustomerLoyalty(locationId, dto, userId);
  }

  @Get(':locationId/customers/:customerId/loyalty')
  @Roles('licensee_admin')
  @LocationModulePermissions(['pos', 'sales'])
  @ApiOperation({ summary: 'Get customer loyalty information' })
  @ApiParam({ name: 'locationId', description: 'Location UUID' })
  @ApiParam({ name: 'customerId', description: 'Customer UUID' })
  @ApiResponse({ status: 200, description: 'Customer loyalty information returned' })
  async getCustomerLoyalty(
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ) {
    return this.salesService.getCustomerLoyalty(customerId);
  }

  // ===== Product Customization Endpoints =====

  @Post(':locationId/products/customize')
  @Roles('licensee_admin')
  @LocationModulePermissions(['pos', 'sales'])
  @ApiOperation({ summary: 'Customize product pricing and discounts' })
  @ApiParam({ name: 'locationId', description: 'Location UUID' })
  @ApiBody({ type: CustomizeProductDto })
  @ApiResponse({ status: 200, description: 'Product customization applied successfully' })
  async customizeProduct(
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @Body() dto: CustomizeProductDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId ?? req.user?.id ?? null;
    return this.salesService.customizeProduct(locationId, dto, userId);
  }

  @Post(':locationId/products/bulk-discount')
  @Roles('licensee_admin')
  @LocationModulePermissions(['pos', 'sales'])
  @ApiOperation({ summary: 'Apply bulk discount to multiple products' })
  @ApiParam({ name: 'locationId', description: 'Location UUID' })
  @ApiBody({ type: BulkDiscountDto })
  @ApiResponse({ status: 200, description: 'Bulk discount applied successfully' })
  async applyBulkDiscount(
    @Param('locationId', ParseUUIDPipe) locationId: string,
    @Body() dto: BulkDiscountDto,
    @Req() req: any,
  ) {
    const userId = req.user?.userId ?? req.user?.id ?? null;
    return this.salesService.applyBulkDiscount(locationId, dto, userId);
  }
}
