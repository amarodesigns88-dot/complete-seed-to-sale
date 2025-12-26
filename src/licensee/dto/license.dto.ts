import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLicenseTypeDto {
  @ApiProperty({
    description: 'License type ID from LicenseType table',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  licenseTypeId: string;
}

export class AddLicenseDto {
  @ApiProperty({
    description: 'License type ID from LicenseType table',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  licenseTypeId: string;

  @ApiProperty({
    description: 'License number for the additional license',
    example: 'LIC-2024-001',
  })
  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @ApiProperty({
    description: 'Optional notes about the license',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
