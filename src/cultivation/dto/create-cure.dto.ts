import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCureDto {
  @ApiProperty({
    description: 'Dry weight of flower in grams',
    example: 120.5,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  dryFlowerWeight: number;

  @ApiProperty({
    description: 'Dry weight of other material (trim, stems, etc.) in grams',
    example: 10.0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  dryOtherMaterialWeight: number;

  @ApiProperty({
    description: 'Dry weight of waste in grams recorded during curing',
    example: 2.5,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  dryWasteWeight: number;
}