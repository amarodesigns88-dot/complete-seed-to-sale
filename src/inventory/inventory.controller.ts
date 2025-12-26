import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { MoveItemRoomDto } from './dto/move-item-room.dto';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { SplitInventoryDto } from './dto/split-inventory.dto';
import { CombineInventoryDto } from './dto/combine-inventory.dto';
import { CreateLotDto } from './dto/create-lot.dto';
import { DestroyInventoryDto } from './dto/destroy-inventory.dto';
import { UndoOperationDto } from './dto/undo-operation.dto';

@ApiTags('inventory')
@Controller('inventory')
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post(':locationId/items/:itemId/move-room')
  @ApiOperation({ summary: 'Move inventory item to a different room' })
  @ApiResponse({ status: 200, description: 'Item moved successfully' })
  async moveItemToRoom(
    @Param('locationId') locationId: string,
    @Param('itemId') itemId: string,
    @Body() dto: MoveItemRoomDto,
  ) {
    return this.inventoryService.moveItemToRoom(locationId, itemId, dto);
  }

  @Post(':locationId/items/:itemId/adjust')
  @ApiOperation({ summary: 'Adjust inventory quantity with red flag warnings' })
  @ApiResponse({ status: 200, description: 'Inventory adjusted successfully' })
  async adjustInventory(
    @Param('locationId') locationId: string,
    @Param('itemId') itemId: string,
    @Body() dto: AdjustInventoryDto,
  ) {
    return this.inventoryService.adjustInventory(locationId, itemId, dto);
  }

  @Post(':locationId/items/:itemId/split')
  @ApiOperation({ summary: 'Split inventory item into multiple items' })
  @ApiResponse({ status: 201, description: 'Inventory split successfully' })
  async splitInventory(
    @Param('locationId') locationId: string,
    @Param('itemId') itemId: string,
    @Body() dto: SplitInventoryDto,
  ) {
    return this.inventoryService.splitInventory(locationId, itemId, dto);
  }

  @Post(':locationId/items/combine')
  @ApiOperation({ summary: 'Combine multiple inventory items into one' })
  @ApiResponse({ status: 201, description: 'Inventory items combined successfully' })
  async combineInventory(
    @Param('locationId') locationId: string,
    @Body() dto: CombineInventoryDto,
  ) {
    return this.inventoryService.combineInventory(locationId, dto);
  }

  @Post(':locationId/lots/create')
  @ApiOperation({ summary: 'Create lot from wet/dry inventory items' })
  @ApiResponse({ status: 201, description: 'Lot created successfully' })
  async createLot(
    @Param('locationId') locationId: string,
    @Body() dto: CreateLotDto,
  ) {
    return this.inventoryService.createLot(locationId, dto);
  }

  @Post(':locationId/items/:itemId/destroy')
  @ApiOperation({ summary: 'Destroy inventory item with waste logging' })
  @ApiResponse({ status: 200, description: 'Inventory destroyed successfully' })
  async destroyInventory(
    @Param('locationId') locationId: string,
    @Param('itemId') itemId: string,
    @Body() dto: DestroyInventoryDto,
  ) {
    return this.inventoryService.destroyInventory(locationId, itemId, dto);
  }

  @Post(':locationId/operations/:operationId/undo')
  @ApiOperation({ summary: 'Undo an inventory operation' })
  @ApiResponse({ status: 200, description: 'Operation undone successfully' })
  async undoOperation(
    @Param('locationId') locationId: string,
    @Param('operationId') operationId: string,
    @Body() dto: UndoOperationDto,
  ) {
    return this.inventoryService.undoOperation(locationId, operationId, dto);
  }

  @Get(':locationId/adjustments')
  @ApiOperation({ summary: 'List all inventory adjustments' })
  @ApiResponse({ status: 200, description: 'Adjustments retrieved successfully' })
  async getAdjustments(
    @Param('locationId') locationId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 50,
  ) {
    return this.inventoryService.getAdjustments(locationId, page, limit);
  }

  @Get(':locationId/splits')
  @ApiOperation({ summary: 'List all inventory splits' })
  @ApiResponse({ status: 200, description: 'Splits retrieved successfully' })
  async getSplits(
    @Param('locationId') locationId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 50,
  ) {
    return this.inventoryService.getSplits(locationId, page, limit);
  }

  @Get(':locationId/combinations')
  @ApiOperation({ summary: 'List all inventory combinations' })
  @ApiResponse({ status: 200, description: 'Combinations retrieved successfully' })
  async getCombinations(
    @Param('locationId') locationId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 50,
  ) {
    return this.inventoryService.getCombinations(locationId, page, limit);
  }
}
