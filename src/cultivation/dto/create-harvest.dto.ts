import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHarvestDto {
  @ApiProperty({
    description: 'Type of harvest (e.g., "flower", "trim", "clone-harvest")',
    example: 'flower',
  })
  @IsString()
  harvestType: string;

  @ApiProperty({
    description: 'Wet weight of flower in grams',
    example: 1500.25,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  wetFlowerWeight: number;

  @ApiPropertyOptional({
    description: 'Wet weight of other material (trim, stems) in grams',
    example: 120.5,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  wetOtherMaterialWeight?: number;

  @ApiPropertyOptional({
    description: 'Wet weight of waste measured at harvest in grams',
    example: 5.0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  wetWasteWeight?: number;

  @ApiPropertyOptional({
    description: 'Optional batch identifier assigned to this harvest (for traceability)',
    example: 'BATCH-2025-12-001',
  })
  @IsOptional()
  @IsString()
  batchId?: string;

  @ApiPropertyOptional({
    description: 'Flag indicating this harvest is an additional collection for an existing batch',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isAdditionalCollection?: boolean;
}