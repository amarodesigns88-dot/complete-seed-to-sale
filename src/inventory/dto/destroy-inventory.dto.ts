import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DestroyInventoryDto {
  @ApiProperty({ description: 'Reason for destruction' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Method of destruction (e.g., INCINERATION, COMPOST, LANDFILL)' })
  @IsString()
  @IsNotEmpty()
  destructionMethod: string;

  @ApiProperty({ description: 'Amount to destroy in grams (if partial)', required: false })
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  amountGrams?: number;
}
