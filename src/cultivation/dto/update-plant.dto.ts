import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, IsUUID } from 'class-validator';

export class UpdatePlantDto {
  @ApiPropertyOptional({ description: 'Strain identifier or name' })
  @IsOptional()
  @IsString()
  strain?: string;

  @ApiPropertyOptional({ description: 'Room id (UUID) where the plant is located' })
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @ApiPropertyOptional({ description: 'Plant phase (e.g., veg, flower, mother)' })
  @IsOptional()
  @IsString()
  phase?: string;

  @ApiPropertyOptional({ description: 'Source inventory id used to create this plant' })
  @IsOptional()
  @IsString()
  sourceInventoryId?: string;

  @ApiPropertyOptional({ description: 'Amount to consume from the source inventory item' })
  @IsOptional()
  @IsNumber()
  @Min(0.0000001)
  consumeAmount?: number;
}