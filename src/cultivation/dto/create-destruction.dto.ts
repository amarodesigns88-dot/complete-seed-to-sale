import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsNotEmpty,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDestructionDto {
  @ApiPropertyOptional({
    description: 'UUID of the plant being destroyed (if destruction targets a plant)',
    format: 'uuid',
    example: 'a3f2c8ae-5f8d-4d6f-9b12-0123456789ab',
  })
  @IsOptional()
  @IsUUID()
  plantId?: string;

  @ApiPropertyOptional({
    description: 'UUID of the inventory item being destroyed (if destruction targets inventory)',
    format: 'uuid',
    example: 'b4d1e9bf-6f9e-41c0-8c34-abcdef012345',
  })
  @IsOptional()
  @IsUUID()
  inventoryItemId?: string;

  @ApiProperty({
    description: 'Reason for destruction (required)',
    example: 'Pest infestation - batch deemed unsafe',
  })
  @IsString()
  @IsNotEmpty()
  destructionReason: string;

  @ApiProperty({
    description: 'Amount of material destroyed in grams (numeric, >= 0)',
    example: 250.0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  wasteAmount: number;
}