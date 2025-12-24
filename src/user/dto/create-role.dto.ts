import { IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ description: 'Role name', example: 'licensee_user' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Array of permissions assigned to the role',
    example: ['create_plant', 'view_sales'],
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}