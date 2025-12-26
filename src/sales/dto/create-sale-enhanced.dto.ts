import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsEnum,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SaleType {
  REGULAR = 'regular',
  PICKUP = 'pickup',
  DELIVERY = 'delivery',
}

export class EnhancedSaleItemDto {
  @ApiProperty({ description: 'Inventory item UUID' })
  @IsString()
  inventoryItemId: string;

  @ApiProperty({ description: 'Quantity to sell' })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ description: 'Base price per unit' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Custom pricing override' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  customPrice?: number;

  @ApiPropertyOptional({ description: 'Discount amount', default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Discount percentage (0-100)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discountPercentage?: number;

  @ApiPropertyOptional({ description: 'Product notes/customization' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class LoyaltyRedemptionDto {
  @ApiProperty({ description: 'Loyalty program ID' })
  @IsString()
  loyaltyProgramId: string;

  @ApiProperty({ description: 'Points to redeem' })
  @IsNumber()
  @Min(0)
  pointsToRedeem: number;

  @ApiProperty({ description: 'Discount amount from loyalty redemption' })
  @IsNumber()
  @Min(0)
  discountAmount: number;
}

export class DeliveryInfoDto {
  @ApiProperty({ description: 'Delivery address' })
  @IsString()
  address: string;

  @ApiPropertyOptional({ description: 'Delivery instructions' })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiPropertyOptional({ description: 'Delivery fee' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  deliveryFee?: number;

  @ApiPropertyOptional({ description: 'Scheduled delivery time' })
  @IsString()
  @IsOptional()
  scheduledTime?: string;
}

export class PickupInfoDto {
  @ApiProperty({ description: 'Pickup location/counter' })
  @IsString()
  pickupLocation: string;

  @ApiPropertyOptional({ description: 'Scheduled pickup time' })
  @IsString()
  @IsOptional()
  scheduledTime?: string;

  @ApiPropertyOptional({ description: 'Pickup instructions' })
  @IsString()
  @IsOptional()
  instructions?: string;
}

export class CreateEnhancedSaleDto {
  @ApiProperty({
    description: 'Type of sale',
    enum: SaleType,
    default: SaleType.REGULAR,
  })
  @IsEnum(SaleType)
  saleType: SaleType;

  @ApiPropertyOptional({ description: 'Customer UUID (optional)' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiProperty({ description: 'Items to sell', type: [EnhancedSaleItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnhancedSaleItemDto)
  items: EnhancedSaleItemDto[];

  @ApiPropertyOptional({
    description: 'Loyalty redemption details',
    type: LoyaltyRedemptionDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LoyaltyRedemptionDto)
  loyaltyRedemption?: LoyaltyRedemptionDto;

  @ApiPropertyOptional({
    description: 'Delivery information (required for delivery sales)',
    type: DeliveryInfoDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryInfoDto)
  deliveryInfo?: DeliveryInfoDto;

  @ApiPropertyOptional({
    description: 'Pickup information (required for pickup sales)',
    type: PickupInfoDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PickupInfoDto)
  pickupInfo?: PickupInfoDto;

  @ApiPropertyOptional({ description: 'Apply loyalty points earning' })
  @IsBoolean()
  @IsOptional()
  earnLoyaltyPoints?: boolean;

  @ApiPropertyOptional({ description: 'Additional sale notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Tax amount' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({ description: 'Additional fees' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  additionalFees?: number;
}
