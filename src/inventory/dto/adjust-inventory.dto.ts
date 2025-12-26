import { IsNumber, IsString, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdjustInventoryDto {
  @ApiProperty({ description: 'Adjustment amount in grams (positive or negative)' })
  @IsNumber()
  @IsNotEmpty()
  adjustmentGrams: number;

  @ApiProperty({ description: 'Reason for adjustment' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Adjustment type (e.g., CORRECTION, LOSS, GAIN)' })
  @IsString()
  @IsNotEmpty()
  adjustmentType: string;
}
