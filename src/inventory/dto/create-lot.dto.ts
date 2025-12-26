import { IsArray, IsUUID, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLotDto {
  @ApiProperty({ description: 'Array of inventory item IDs to create lot from' })
  @IsArray()
  @IsUUID('4', { each: true })
  inventoryItemIds: string[];

  @ApiProperty({ description: 'Lot name or identifier' })
  @IsString()
  @IsNotEmpty()
  lotName: string;

  @ApiProperty({ description: 'Target room ID for the lot' })
  @IsUUID()
  @IsNotEmpty()
  targetRoomId: string;

  @ApiProperty({ description: 'Lot type (WET_FLOWER, DRY_FLOWER, TRIM)', required: false })
  @IsString()
  @IsOptional()
  lotType?: string;
}
