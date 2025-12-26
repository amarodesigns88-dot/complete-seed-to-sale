import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsArray, IsEnum } from 'class-validator';

export class CreateStateUserDto {
  @ApiProperty({ description: 'Email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Password' })
  @IsString()
  password: string;

  @ApiProperty({ description: 'First name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Job title' })
  @IsOptional()
  @IsString()
  title?: string;
}

export class UpdateStateUserDto {
  @ApiPropertyOptional({ description: 'First name' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Job title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsOptional()
  isActive?: boolean;
}

export class StateUserPermissionsDto {
  @ApiProperty({ description: 'Permission codes', type: [String] })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @ApiPropertyOptional({ description: 'Accessible UBIs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accessibleUbis?: string[];
}

export class StateUserFilterDto {
  @ApiPropertyOptional({ description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Department filter' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ description: 'Active status filter' })
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Page number', minimum: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 100 })
  @IsOptional()
  perPage?: number;
}
