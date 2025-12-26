import { IsArray, IsNumber, IsString, IsNotEmpty, Min, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class SplitItemDto {
  @ApiProperty({ description: 'Weight for this split item in grams' })
  @IsNumber()
  @Min(0.01)
  weightGrams: number;

  @ApiProperty({ description: 'Room ID for this split item', required: false })
  @IsString()
  roomId?: string;
}

export class SplitInventoryDto {
  @ApiProperty({ description: 'Array of split items with weights', type: [SplitItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SplitItemDto)
  splits: SplitItemDto[];

  @ApiProperty({ description: 'Reason for split' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
