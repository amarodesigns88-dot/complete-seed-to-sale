import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsOptional, IsEnum } from 'class-validator';

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
}

export class CustomizeProductDto {
  @ApiProperty({ description: 'Inventory item ID to customize' })
  @IsString()
  inventoryItemId: string;

  @ApiPropertyOptional({ description: 'Custom price override' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  customPrice?: number;

  @ApiPropertyOptional({
    description: 'Discount type',
    enum: DiscountType,
  })
  @IsEnum(DiscountType)
  @IsOptional()
  discountType?: DiscountType;

  @ApiPropertyOptional({ description: 'Discount value (percentage 0-100 or fixed amount)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional({ description: 'Reason for price customization' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class BulkDiscountDto {
  @ApiProperty({ description: 'Array of inventory item IDs' })
  @IsString({ each: true })
  inventoryItemIds: string[];

  @ApiProperty({
    description: 'Discount type',
    enum: DiscountType,
  })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({ description: 'Discount value (percentage 0-100 or fixed amount)' })
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiPropertyOptional({ description: 'Reason for bulk discount' })
  @IsString()
  @IsOptional()
  reason?: string;
}
