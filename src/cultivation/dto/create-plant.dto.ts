import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, IsUUID } from 'class-validator';

export class CreatePlantDto {
  @ApiProperty({
    description: 'Strain identifier or name. If you use UUIDs for strain, change validator to @IsUUID.',
    example: 'Blue Dream',
  })
  @IsString()
  strain: string;

  @ApiProperty({
    description: 'Room id (UUID) where the plant will be placed',
    example: 'a3f1c9e2-...'
  })
  @IsUUID()
  roomId: string;

  @ApiProperty({
    description: 'Plant phase (e.g., veg, flower, mother)',
    example: 'veg'
  })
  @IsString()
  phase: string;

  @ApiPropertyOptional({
    description: 'Source inventory id used to create this plant (optional)',
    example: 'b2f3c4d5-...'
  })
  @IsOptional()
  @IsString()
  sourceInventoryId?: string;

  @ApiPropertyOptional({
    description: 'Amount to consume from the source inventory item. Defaults to 1 when omitted.',
    example: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(0.0000001)
  consumeAmount?: number;
}