import { IsEmail, IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'User email', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: 'Optional UBI (location) to scope login', example: 'UBI-123' })
  @IsOptional()
  @IsString()
  ubi?: string;

  @ApiPropertyOptional({
    description: 'Optional interface selection for multi-interface users',
    example: 'licensee',
    enum: ['licensee', 'state', 'admin'],
  })
  @IsOptional()
  @IsIn(['licensee', 'state', 'admin'])
  interfaceSelection?: 'licensee' | 'state' | 'admin';
}