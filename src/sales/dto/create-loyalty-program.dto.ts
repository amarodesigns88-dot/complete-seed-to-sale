import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsBoolean, IsOptional } from 'class-validator';

export class CreateLoyaltyProgramDto {
  @ApiProperty({ description: 'Program name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Description of the program' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Points earned per dollar spent' })
  @IsNumber()
  @Min(0)
  pointsPerDollar: number;

  @ApiProperty({ description: 'Dollar value per point (redemption rate)' })
  @IsNumber()
  @Min(0)
  dollarValuePerPoint: number;

  @ApiPropertyOptional({ description: 'Minimum points required for redemption' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minimumPointsForRedemption?: number;

  @ApiPropertyOptional({ description: 'Is program active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateCustomerLoyaltyDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  customerId: string;

  @ApiProperty({ description: 'Loyalty program ID' })
  @IsString()
  loyaltyProgramId: string;

  @ApiProperty({ description: 'Points to add/subtract' })
  @IsNumber()
  pointsDelta: number;

  @ApiPropertyOptional({ description: 'Reason for points adjustment' })
  @IsString()
  @IsOptional()
  reason?: string;
}
