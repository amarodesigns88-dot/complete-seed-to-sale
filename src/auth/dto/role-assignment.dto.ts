import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class RoleAssignmentDto {
  @ApiProperty({
    description: 'Array of role IDs to assign to the user',
    example: ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'],
    isArray: true,
  })
  @IsArray()
  @IsUUID('all', { each: true })
  roleIds: string[];
}