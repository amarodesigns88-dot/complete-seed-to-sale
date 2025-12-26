import { IsArray, IsUUID, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CombineInventoryDto {
  @ApiProperty({ description: 'Array of inventory item IDs to combine' })
  @IsArray()
  @IsUUID('4', { each: true })
  inventoryItemIds: string[];

  @ApiProperty({ description: 'Target inventory item ID (if combining into existing)', required: false })
  @IsUUID()
  @IsOptional()
  targetInventoryItemId?: string;

  @ApiProperty({ description: 'Target room ID for new combined item (if creating new)', required: false })
  @IsUUID()
  @IsOptional()
  targetRoomId?: string;

  @ApiProperty({ description: 'Reason for combination' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
