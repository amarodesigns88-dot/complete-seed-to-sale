import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsArray,
  IsNumber,
} from 'class-validator';

export class CreateLicenseeAccountDto {
  @ApiProperty({ description: 'Business name' })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty({ description: 'License number' })
  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @ApiProperty({ description: 'License type ID' })
  @IsNumber()
  @IsNotEmpty()
  licenseTypeId: number;

  @ApiProperty({ description: 'Owner name' })
  @IsString()
  @IsNotEmpty()
  ownerName: string;

  @ApiProperty({ description: 'Contact email' })
  @IsString()
  @IsNotEmpty()
  contactEmail: string;

  @ApiProperty({ description: 'Contact phone' })
  @IsString()
  @IsNotEmpty()
  contactPhone: string;

  @ApiPropertyOptional({ description: 'Physical address' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'State' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ description: 'ZIP code' })
  @IsString()
  @IsOptional()
  zipCode?: string;
}

export class ActivateLicenseDto {
  @ApiProperty({ description: 'Whether to activate (true) or deactivate (false) the license' })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Reason for status change' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class SetInventoryWindowDto {
  @ApiProperty({ description: 'Start date of initial inventory window (ISO 8601)' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'End date of initial inventory window (ISO 8601)' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiPropertyOptional({ description: 'Notes about the inventory window' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class AssignLicenseTypeDto {
  @ApiProperty({ description: 'License type ID to assign' })
  @IsNumber()
  @IsNotEmpty()
  licenseTypeId: number;

  @ApiPropertyOptional({ description: 'Effective date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  effectiveDate?: string;
}

export class LicenseeFilterDto {
  @ApiPropertyOptional({ description: 'Search by business name or license number' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by license type ID' })
  @IsNumber()
  @IsOptional()
  licenseTypeId?: number;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Page number (default: 1)' })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page (default: 20)' })
  @IsNumber()
  @IsOptional()
  limit?: number;
}

export class LicenseeAccountResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  businessName: string;

  @ApiProperty()
  licenseNumber: string;

  @ApiProperty()
  licenseType: string;

  @ApiProperty()
  ownerName: string;

  @ApiProperty()
  contactEmail: string;

  @ApiProperty()
  contactPhone: string;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  inventoryWindowStart?: Date;

  @ApiPropertyOptional()
  inventoryWindowEnd?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
