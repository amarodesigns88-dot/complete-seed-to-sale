import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Admin password',
    example: 'AdminPassword123!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    description: 'Optional license number for pre-selection (Admin can access specific licensee)',
    example: 'LIC-12345',
  })
  @IsOptional()
  @IsString()
  licenseNumber?: string;
}
