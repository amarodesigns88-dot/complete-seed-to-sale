import { IsEmail, IsString, IsArray, IsOptional, IsUUID, MinLength, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'User email', example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'User full name', example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'New password. Provide only to change password via update (admin flow). Use change-password endpoint for user-initiated changes.',
    minLength: 8,
    writeOnly: true,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({
    description: 'Array of role IDs to replace the user roles. To clear all roles pass an empty array.',
    isArray: true,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  roleIds?: string[];

  @ApiPropertyOptional({
    description: 'Array of location IDs to replace the user locations. To clear pass an empty array.',
    isArray: true,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  locationIds?: string[];

  @ApiPropertyOptional({ description: 'Optional parent location id (UUID)', example: '44444444-4444-4444-4444-444444444444' })
  @IsOptional()
  @IsUUID()
  parentLocationId?: string;

  @ApiPropertyOptional({ description: 'Optional account status', example: 'active' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Optional toggle to activate/deactivate account', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}