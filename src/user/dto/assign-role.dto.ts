import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({
    description: 'Role ID to assign to the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  @IsString()
  roleId: string;
}
