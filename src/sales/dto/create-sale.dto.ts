import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SaleItemDto {
  @ApiProperty({ description: 'Inventory item UUID' })
  @IsString()
  inventoryItemId: string;

  @ApiProperty({ description: 'Quantity to sell' })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ description: 'Price per unit' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Discount amount', default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discountAmount?: number;
}

export class CreateSaleDto {
  @ApiPropertyOptional({ description: 'Customer UUID (optional)' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ description: 'Items to sell', type: [SaleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];
}
